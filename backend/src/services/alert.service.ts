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

  public async triggerAlert(nodeId: string, nodeSlug: string, severity: string, message: string) {
    if (severity === 'Healthy' || severity === 'Offline') return;

    try {
      // 1. Store DB
      const alert = await prisma.alert.create({
        data: {
          nodeId,
          alertType: severity === 'Critical' ? 'System Critical' : 'Sensor Warning',
          severity,
          message
        }
      });

      // 2. Emit Socket
      if (this.io) {
        this.io.emit('alert:new', {
          ...alert,
          nodeName: nodeSlug
        });
      }
      
      console.log(`AlertEngine: Triggered ${severity} alert for ${nodeSlug}`);
    } catch (error) {
      console.error('AlertEngine: Failed to trigger alert:', error);
    }
  }
}

export const alertEngine = new AlertEngine();
