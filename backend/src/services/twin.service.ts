import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { alertEngine } from './alert.service';

export interface TwinState {
  [nodeId: string]: {
    waterLevel?: number;
    ph?: number;
    tds?: number;
    temperature?: number;
    status?: string;
    lastUpdated?: Date;
    dbNodeId?: number;
    dbSensors?: any[];
  }
}

// Simulated Redis client for stateless Digital Twin cache
class MockRedis {
  private store: Record<string, string> = {};
  async get(key: string): Promise<string | null> { return this.store[key] || null; }
  async set(key: string, value: string): Promise<void> { this.store[key] = value; }
}

class DigitalTwinEngine {
  private redis = new MockRedis();

  private io: Server | null = null;
  private dbMappingInitialized = false;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  // Initialize DB mapping once so we don't query DB constantly
  public async initDbMapping() {
    if (this.dbMappingInitialized) return;
    
    const nodes = await prisma.node.findMany({ include: { sensors: true } });
    
    const nodeNameMap: Record<string, string> = {
      'CENTRAL': 'Central Tank',
      'T1': 'T1',
      'T2': 'T2',
      'T3': 'T3',
      'T4': 'T4',
      'PUMP': 'Pump P1'
    };

    const state = await this.getTwinState();
    
    for (const [slug, mappedName] of Object.entries(nodeNameMap)) {
      const dbNode = nodes.find(n => n.nodeName.toLowerCase() === mappedName.toLowerCase());
      if (dbNode) {
        if (!state[slug]) state[slug] = {};
        state[slug].dbNodeId = dbNode.id;
        state[slug].status = dbNode.status;
        state[slug].dbSensors = dbNode.sensors;
      }
    }
    
    // Also map any newly added dynamic nodes from DB
    for (const dbNode of nodes) {
      const slug = dbNode.id.toString();
      if (!state[slug]) {
        state[slug] = {
          dbNodeId: dbNode.id,
          status: dbNode.status,
          dbSensors: dbNode.sensors,
          waterLevel: 65,
          ph: 7.1,
          tds: 210,
          temperature: 24
        };
      } else {
        state[slug].dbNodeId = dbNode.id;
        state[slug].status = dbNode.status;
        state[slug].dbSensors = dbNode.sensors;
      }
    }

    await this.saveState(state);
    this.dbMappingInitialized = true;
    console.log('Digital Twin Engine: DB mapping initialized in Redis cache');
  }

  public async reloadDbMapping() {
    this.dbMappingInitialized = false;
    await this.initDbMapping();
  }

  public async getTwinState(): Promise<TwinState> {
    const raw = await this.redis.get('twin_state');
    return raw ? JSON.parse(raw) : { T1: {}, T2: {}, T3: {}, T4: {}, CENTRAL: {}, PUMP: {} };
  }

  private async saveState(state: TwinState) {
    await this.redis.set('twin_state', JSON.stringify(state));
  }

  public async updateTwin(nodeSlug: string | number, payload: any) {
    const state = await this.getTwinState();
    const slug = String(nodeSlug).toUpperCase();
    if (!state[slug]) {
      state[slug] = {};
    }

    const nodeState = state[slug];

    if (slug === 'T1' || slug === 'T2') {
      console.log(`[DEBUG] updateTwin ${slug}: dbNodeId=${nodeState.dbNodeId}, hasDbSensors=${!!nodeState.dbSensors}, payload.waterLevel=${payload.waterLevel}`);
    }

    // Evaluate health rules based on payload
    let worstStatus = 'Healthy';
    let pHS = 'Online', tdsS = 'Online', tempS = 'Online', wlS = 'Online';

    if (payload.waterLevel !== undefined) {
      nodeState.waterLevel = payload.waterLevel;
      nodeState.ph = payload.ph;
      nodeState.tds = payload.tds;
      nodeState.temperature = payload.temperature;

      wlS = alertEngine.evaluateSensor('water_level', payload.waterLevel);
      pHS = alertEngine.evaluateSensor('ph', payload.ph);
      tdsS = alertEngine.evaluateSensor('tds', payload.tds);
      tempS = alertEngine.evaluateSensor('temperature', payload.temperature);

      const statuses = [wlS, pHS, tdsS, tempS];
      if (statuses.includes('Critical')) worstStatus = 'Critical';
      else if (statuses.includes('Warning')) worstStatus = 'Warning';
      else if (statuses.includes('Offline')) worstStatus = 'Offline';
    } else if (payload.status) {
      // Pump or status-only device
      worstStatus = payload.status === 'healthy' ? 'Healthy' : (payload.status === 'offline' ? 'Offline' : 'Warning');
    }

    nodeState.lastUpdated = new Date();

    // Persist to cache
    await this.saveState(state);

    // Fire off async database insertion (don't await so webhook returns instantly)
    this.savePacketToDatabase(slug, nodeState, payload, worstStatus);

    // Broadcast instantly via WebSocket for zero latency UI
    if (this.io && nodeState.dbNodeId) {
      if (payload.waterLevel !== undefined && nodeState.dbSensors) {
        // Mock the savedReadings format for UI
        const sensors = [
          { name: 'water_level', value: payload.waterLevel, status: wlS },
          { name: 'ph', value: payload.ph, status: pHS },
          { name: 'tds', value: payload.tds, status: tdsS },
          { name: 'temperature', value: payload.temperature, status: tempS }
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
        alertEngine.triggerAlert(state.dbNodeId, slug, currentStatus, `Node ${slug} transitioned to ${currentStatus} due to sensor anomalies.`);
      }

      // Insert sensor readings for every packet
      if (payload.waterLevel !== undefined && state.dbSensors) {
        const sensorValues = {
          'water_level': payload.waterLevel,
          'ph': payload.ph,
          'tds': payload.tds,
          'temperature': payload.temperature
        };

        const readingsToInsert = [];
        const sensorUpdates = [];
        
        for (const [sType, sValue] of Object.entries(sensorValues)) {
          const dbSensor = state.dbSensors.find((s: any) => s.sensorType === sType);
          if (dbSensor && sValue !== undefined) {
            
            // Evaluate status using alertEngine
            const sStatus = alertEngine.evaluateSensor(sType, sValue);

            // Queue sensor lastSeen and status update
            sensorUpdates.push(
              prisma.sensor.update({
                where: { id: dbSensor.id },
                data: { status: sStatus, lastSeen: state.lastUpdated }
              })
            );

            readingsToInsert.push({
              sensorId: dbSensor.id,
              value: sValue,
              createdAt: state.lastUpdated
            });
          }
        }

        if (sensorUpdates.length > 0) {
          await prisma.$transaction(sensorUpdates);
        }

        if (readingsToInsert.length > 0) {
          await prisma.sensorReading.createMany({
            data: readingsToInsert
          });
        }
      }
    } catch (err) {
      console.error(`TwinEngine: Failed to save packet to DB for ${slug}:`, err);
    }
  }
}

export const twinEngine = new DigitalTwinEngine();
