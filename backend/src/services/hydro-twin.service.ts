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
    let pHS = 'Online', tdsS = 'Online', turbS = 'Online', wtempS = 'Online', atempS = 'Online', lightS = 'Online';

    if (payload.ph !== undefined) {
      nodeState.ph = payload.ph;
      nodeState.tds = payload.tds;
      nodeState.turbidity = payload.turbidity;
      nodeState.water_temp = payload.water_temp;
      nodeState.air_temp = payload.air_temp;
      nodeState.light_intensity = payload.light_intensity;

      pHS = hydroAlertEngine.evaluateSensor('ph', payload.ph);
      tdsS = hydroAlertEngine.evaluateSensor('tds', payload.tds);
      turbS = hydroAlertEngine.evaluateSensor('turbidity', payload.turbidity);
      wtempS = hydroAlertEngine.evaluateSensor('water_temp', payload.water_temp);
      atempS = hydroAlertEngine.evaluateSensor('air_temp', payload.air_temp);
      lightS = hydroAlertEngine.evaluateSensor('light_intensity', payload.light_intensity);

      const statuses = [pHS, tdsS, turbS, wtempS, atempS, lightS];
      if (statuses.includes('Critical')) worstStatus = 'Critical';
      else if (statuses.includes('Warning')) worstStatus = 'Warning';
      else if (statuses.includes('Offline')) worstStatus = 'Offline';
    } else if (payload.status) {
      // Pump or status-only device
      worstStatus = payload.status === 'healthy' ? 'Healthy' : (payload.status === 'offline' ? 'Offline' : 'Warning');
    }

    nodeState.lastUpdated = new Date();

    // Fire off async database insertion
    this.savePacketToDatabase(slug, nodeState, payload, worstStatus);

    // Broadcast instantly via WebSocket for zero latency UI
    if (this.io && nodeState.dbNodeId) {
      if (payload.ph !== undefined && nodeState.dbSensors) {
        // Mock the savedReadings format for UI
        const sensors = [
          { name: 'ph', value: payload.ph, status: pHS },
          { name: 'tds', value: payload.tds, status: tdsS },
          { name: 'turbidity', value: payload.turbidity, status: turbS },
          { name: 'water_temp', value: payload.water_temp, status: wtempS },
          { name: 'air_temp', value: payload.air_temp, status: atempS },
          { name: 'light_intensity', value: payload.light_intensity, status: lightS }
        ];

        const formattedSensors = sensors.map(s => {
          const dbS = nodeState.dbSensors?.find(x => x.sensorType === s.name);
          return {
            sensorType: s.name,
            value: s.value,
            status: s.status,
            sensorId: dbS?.id,
            lastSeen: nodeState.lastUpdated
          };
        });

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
        hydroAlertEngine.triggerAlert(state.dbNodeId, slug, currentStatus, `Hydroponic Node ${slug} transitioned to ${currentStatus} due to anomalies.`);
      }

      // Insert sensor readings for every packet
      if (payload.ph !== undefined && state.dbSensors) {
        const sensorValues = {
          'ph': payload.ph,
          'tds': payload.tds,
          'turbidity': payload.turbidity,
          'water_temp': payload.water_temp,
          'air_temp': payload.air_temp,
          'light_intensity': payload.light_intensity
        };

        const readingsToInsert = [];
        const sensorUpdates = [];
        
        for (const [sType, sValue] of Object.entries(sensorValues)) {
          const dbSensor = state.dbSensors.find((s: any) => s.sensorType === sType);
          if (dbSensor && sValue !== undefined) {
            const sStatus = hydroAlertEngine.evaluateSensor(sType, sValue);

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
