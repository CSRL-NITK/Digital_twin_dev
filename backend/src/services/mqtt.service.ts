import mqtt from 'mqtt';
import { Server } from 'socket.io';
import { twinEngine } from './twin.service';

export function initMqttService(io: Server) {
  // Connect to the embedded Aedes broker
  const client = mqtt.connect('mqtt://127.0.0.1:1883', { clientId: 'backend_ingestion_service' });

    client.on('connect', () => {
      console.log('MQTT Service: Connected to broker at 127.0.0.1:1883');
      
      // Subscribe to all topics under water/star/
      client.subscribe('water/star/#', (err) => {
        if (err) {
          console.error('MQTT Service: Subscribe error:', err);
        } else {
          console.log('MQTT Service: Subscribed to water/star/#');
        }
      });
    });

    client.on('error', (err) => {
      console.error('MQTT Service: Connection error:', err);
    });

    // Pipeline: mqtt -> parse -> validate -> digital twin -> database -> socket.io
    client.on('message', async (topic, message) => {
      try {
        // 1. Parse
        const payload = JSON.parse(message.toString());
        
        const parts = topic.split('/');
        if (parts.length !== 3) return;
        const nodeSlug = parts[2];

        // 2. Validate
        if (!payload.status && payload.waterLevel === undefined) {
          return; // Invalid payload structure
        }

        // 3. Digital Twin Engine update
        twinEngine.updateTwin(nodeSlug, payload);

      } catch (error) {
        console.error('MQTT Service: Error processing message pipeline:', error);
      }
    });
}
