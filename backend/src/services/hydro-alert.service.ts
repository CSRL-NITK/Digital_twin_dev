import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

export interface AlertRule {
  sensor: string;
  condition: (value: number) => 'Critical' | 'Warning' | 'Healthy';
}

const alertRules: AlertRule[] = [
  {
    sensor: 'ph',
    condition: (value: number) => {
      if (value < 5.5 || value > 7.5) return 'Critical';
      if (value < 6.0 || value > 7.0) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'tds',
    condition: (value: number) => {
      if (value < 600 || value > 1400) return 'Critical';
      if (value < 800 || value > 1200) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'turbidity',
    condition: (value: number) => {
      if (value > 50) return 'Critical';
      if (value > 30) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'water_temp',
    condition: (value: number) => {
      if (value < 16 || value > 28) return 'Critical';
      if (value < 20 || value > 24) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'air_temp',
    condition: (value: number) => {
      if (value < 15 || value > 35) return 'Critical';
      if (value < 22 || value > 28) return 'Warning';
      return 'Healthy';
    }
  },
  {
    sensor: 'light_intensity',
    condition: (value: number) => {
      if (value < 100) return 'Critical';
      if (value < 200 || value > 700) return 'Warning';
      return 'Healthy';
    }
  }
];

class HydroAlertEngine {
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
      // 1. Store DB (nodeId is Int here)
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
      
      console.log(`HydroAlertEngine: Triggered ${severity} alert for ${nodeSlug}`);
    } catch (error) {
      console.error('HydroAlertEngine: Failed to trigger alert:', error);
    }
  }
}

export const hydroAlertEngine = new HydroAlertEngine();
