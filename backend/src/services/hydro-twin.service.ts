import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { hydroAlertEngine } from './hydro-alert.service';

export interface HydroTwinState {
  [nodeId: string]: {
    ph?: number;
    tds?: number;
    turbidity?: number;
    water_temp?: number;
    air_temp?: number;
    light_intensity?: number;
    status?: string;
    lastUpdated?: Date;
    dbNodeId?: number;
    dbSensors?: any[];
  }
}

class HydroDigitalTwinEngine {
  private state: HydroTwinState = {
    T1: {},
    T2: {},
    T3: {},
    T4: {},
    CENTRAL: {},
    PUMP: {}
  };

  private io: Server | null = null;
  private dbMappingInitialized = false;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  // Initialize DB mapping specifically for Hydroponic System nodes
  public async initDbMapping() {
    if (this.dbMappingInitialized) return;
    
    // Find the Hydroponic Topology
    const topology = await prisma.topology.findFirst({
      where: { name: 'Hydroponic Topology' }
    });

    if (!topology) {
      console.log('HydroDigitalTwinEngine: Hydroponic Topology not found. Skipping mapping.');
      return;
    }

    // Find nodes belonging only to this hydroponics topology
    const nodes = await prisma.node.findMany({
      where: { topologyId: topology.id },
      include: { sensors: true }
    });
    
    const nodeNameMap: Record<string, string> = {
      'CENTRAL': 'Central Reservoir',
      'T1': 'Tier 1',
      'T2': 'Tier 2',
      'T3': 'Tier 3',
      'T4': 'Tier 4',
      'PUMP': 'Pump P1'
    };

    for (const [slug, mappedName] of Object.entries(nodeNameMap)) {
      const dbNode = nodes.find(n => n.nodeName.toLowerCase() === mappedName.toLowerCase());
      if (dbNode) {
        this.state[slug].dbNodeId = dbNode.id;
        this.state[slug].status = dbNode.status;
        this.state[slug].dbSensors = dbNode.sensors;
      }
    }
    
    this.dbMappingInitialized = true;
    console.log('HydroDigitalTwinEngine: DB mapping initialized successfully.');
  }

  public getTwinState() {
    return this.state;
  }

  public updateTwin(nodeSlug: string, payload: any) {
    const slug = nodeSlug.toUpperCase();
    if (!this.state[slug]) {
      this.state[slug] = {};
    }

    const nodeState = this.state[slug];

    if (slug === 'T1' || slug === 'T2') {
      console.log(`[DEBUG] Hydro updateTwin ${slug}: dbNodeId=${nodeState.dbNodeId}, hasDbSensors=${!!nodeState.dbSensors}, payload.ph=${payload.ph}`);
    }

    // Evaluate health rules based on payload
    let worstStatus = 'Healthy';
    const statuses: string[] = [];

    // Helper map of all possible sensor fields
    const telemetryFields = ['ph', 'tds', 'turbidity', 'water_temp', 'air_temp', 'light_intensity'] as const;
    const hasTelemetry = telemetryFields.some(field => payload[field] !== undefined);

    if (hasTelemetry) {
      for (const field of telemetryFields) {
        if (payload[field] !== undefined) {
          nodeState[field] = payload[field];
          statuses.push(hydroAlertEngine.evaluateSensor(field, payload[field]));
        }
      }

      if (statuses.includes('Critical')) worstStatus = 'Critical';
      else if (statuses.includes('Warning')) worstStatus = 'Warning';
      else if (statuses.includes('Offline')) worstStatus = 'Offline';
    } else if (payload.status) {
      // Pump or status-only device
      worstStatus = payload.status === 'healthy' ? 'Healthy' : (payload.status === 'offline' ? 'Offline' : 'Warning');
    }

    nodeState.status = worstStatus;
    nodeState.lastUpdated = new Date();

    // Fire off async database insertion
    this.savePacketToDatabase(slug, nodeState, payload, worstStatus);

    // Broadcast instantly via WebSocket for zero latency UI
    if (this.io && nodeState.dbNodeId) {
      if (hasTelemetry && nodeState.dbSensors) {
        // Build the active sensors list present in the payload
        const formattedSensors = [];
        for (const field of telemetryFields) {
          if (payload[field] !== undefined) {
            const dbS = nodeState.dbSensors.find(x => x.sensorType === field);
            formattedSensors.push({
              sensorType: field,
              value: payload[field],
              status: hydroAlertEngine.evaluateSensor(field, payload[field]),
              sensorId: dbS?.id,
              lastSeen: nodeState.lastUpdated
            });
          }
        }

        this.io.emit('sensor_update', {
          nodeId: nodeState.dbNodeId,
          status: worstStatus,
          sensors: formattedSensors
        });
      } else if (payload.status) {
        this.io.emit('node:status_update', { id: nodeState.dbNodeId, status: worstStatus });
      }
    }
  }

  // Save every MQTT packet asynchronously
  private async savePacketToDatabase(slug: string, state: any, payload: any, currentStatus: string) {
    if (!this.dbMappingInitialized || !state.dbNodeId) return;

    try {
      const isStatusChanged = state.status !== currentStatus || !state.status;
      state.status = currentStatus;

      // Update node status if it changed
      if (isStatusChanged) {
        await prisma.node.update({
          where: { id: state.dbNodeId },
          data: { status: currentStatus }
        });

        // Insert Alert only when needed (status transition)
        hydroAlertEngine.triggerAlert(state.dbNodeId, slug, currentStatus, `System status transitioned to ${currentStatus} due to anomalies.`);
      }

      // Check if telemetry fields are present
      const telemetryFields = ['ph', 'tds', 'turbidity', 'water_temp', 'air_temp', 'light_intensity'] as const;
      const hasTelemetry = telemetryFields.some(field => payload[field] !== undefined);

      // Insert sensor readings for every packet
      if (hasTelemetry && state.dbSensors) {
        const readingsToInsert = [];
        const sensorUpdates = [];
        
        for (const field of telemetryFields) {
          const sValue = payload[field];
          if (sValue !== undefined) {
            const dbSensor = state.dbSensors.find((s: any) => s.sensorType === field);
            if (dbSensor) {
              const sStatus = hydroAlertEngine.evaluateSensor(field, sValue);

              sensorUpdates.push(
                prisma.sensor.update({
                  where: { id: dbSensor.id },
                  data: {
                    status: sStatus,
                    lastSeen: new Date()
                  }
                })
              );

              readingsToInsert.push({
                sensorId: dbSensor.id,
                value: Number(sValue),
                createdAt: new Date()
              });
            }
          }
        }

        if (sensorUpdates.length > 0) {
          await Promise.all(sensorUpdates);
        }

        if (readingsToInsert.length > 0) {
          await prisma.sensorReading.createMany({
            data: readingsToInsert
          });
        }
      }
    } catch (error) {
      console.error(`HydroDigitalTwinEngine: Failed to save packet for ${slug} to database:`, error);
    }
  }
}

export const hydroTwinEngine = new HydroDigitalTwinEngine();
