import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

export interface AlertRule {
  sensor: string;
  condition: (value: number) => 'Critical' | 'Warning' | 'Healthy';
}

const alertRules: AlertRule[] = [
  {
    sensor: 'water_level',
    condition: (value: number) => {
      if (value < 15) return 'Critical';
      if (value < 30) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'ph',
    condition: (value: number) => {
      if (value < 6.5 || value > 8.5) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'tds',
    condition: (value: number) => {
      if (value > 700) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'temperature',
    condition: (value: number) => {
      if (value > 35) return 'Warning';
      return 'Healthy';
    }
  }
];

class AlertEngine {
  private io: Server | null = null;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public evaluateSensor(sensorType: string, value: number): 'Critical' | 'Warning' | 'Healthy' | 'Offline' {
    if (value === -999) return 'Offline';
    
    const rule = alertRules.find(r => r.sensor === sensorType);
    if (!rule) return 'Healthy';
    
    return rule.condition(value);
  }

  public async triggerAlert(nodeId: number, nodeSlug: string, severity: string, message: string) {
    if (severity === 'Healthy' || severity === 'Offline') return;

    try {
      // 1. Store DB with node relation
      const alert = await prisma.alert.create({
        data: {
          nodeId,
          alertType: severity === 'Critical' ? 'System Critical' : 'Sensor Warning',
          severity,
          message
        },
        include: {
          node: {
            select: {
              id: true,
              nodeName: true,
              nodeType: true,
              topologyId: true,
              topology: { select: { id: true, name: true } }
            }
          }
        }
      });

      const fullAlert = {
        ...alert,
        nodeName: alert.node?.nodeName || nodeSlug,
        nodeType: alert.node?.nodeType,
        topologyId: alert.node?.topologyId,
        topologyName: alert.node?.topology?.name || 'System Network'
      };

      // 2. Emit Socket
      if (this.io) {
        this.io.emit('alert:new', fullAlert);
      }
      
      console.log(`AlertEngine: Triggered ${severity} alert for ${nodeSlug}`);
    } catch (error) {
      console.error('AlertEngine: Failed to trigger alert:', error);
    }
  }
}

export const alertEngine = new AlertEngine();
