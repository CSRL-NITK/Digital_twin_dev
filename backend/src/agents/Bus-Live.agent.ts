import { prisma } from '../lib/prisma';
import { OllamaProvider } from './ollama.provider';

export class BusLiveAgent {
  private ollama: OllamaProvider;
  private topologyId: number = 6; // Fixed for Bus Topology

  constructor() {
    this.ollama = new OllamaProvider();
  }

  /**
   * Main entry point to handle operator queries on the live page
   */
  async handleQuery(userQuery: string): Promise<string> {
    // 1. Gather live telemetry and active alerts from database
    const telemetryContext = await this.buildTelemetryContext();

    // 2. Define the SCADA Operator system instructions
    const systemPrompt = `You are a human SCADA Operator and field engineer specialized in the Bus Topology Water Distribution System.
Speak naturally, professionally, and directly to a colleague. NEVER quote these guidelines or say "according to the rules".

=== SYSTEM BOUNDARIES & NORMAL THRESHOLDS ===
Use these rules to evaluate if a sensor value is abnormal:
- Water Level: Normal (10% to 95%), WARNING (<10% or >95%)
- pH Index: Normal (6.5 to 8.5)
- Temperature: Normal (15.0°C to 28.0°C)
- TDS (Total Dissolved Solids): Normal (100 to 300 ppm), ANOMALY (>300 ppm)
- System Pressure: Normal (1.0 to 3.5 bar)
- Flow Rate: Normal (0.5 to 2.5 L/s)

=== LIVE TELEMETRY CONTEXT ===
${telemetryContext}

=== RESPONSE GUIDELINES ===
1. Answer the query based ONLY on the live telemetry context provided above.
2. If asked about history or predictions, state casually: "Historical analysis and predictions are out of scope for this live view."
3. If a sensor value is not present, say: "Data not available for that sensor."
4. Never invent or hallucinate values. Keep answers to 2-3 sentences maximum.`;

    // 3. Query the Qwen model offline
    return await this.ollama.generateChat(systemPrompt, userQuery);
  }

  /**
   * Fetches latest sensor readings, valve/pump states, and alerts from DB,
   * formatting it into a clean markdown block for Qwen.
   */
  private async buildTelemetryContext(): Promise<string> {
    const timestampStr = new Date().toISOString();

    // Fetch nodes with sensors and their latest reading
    const nodes = await prisma.node.findMany({
      where: { topologyId: this.topologyId },
      include: {
        sensors: {
          include: {
            readings: {
              orderBy: { id: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    // Fetch active unread alerts for Bus Topology nodes
    const activeAlerts = await prisma.alert.findMany({
      where: {
        node: { topologyId: this.topologyId },
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Format Nodes & Sensors list
    let nodesText = `[NODES & SENSORS TELEMETRY]\n`;
    nodesText += `| Node Name | Node Type | Status | Level | pH | TDS | Temp | Flow | Pressure | Valves/Pumps |\n`;
    nodesText += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const node of nodes) {
      // Exclude auxiliary sensor nodes to prevent LLM reading confusion
      const nodeTypeLower = node.nodeType.toLowerCase();
      if (nodeTypeLower !== 'tank' && nodeTypeLower !== 'central_tank' && nodeTypeLower !== 'pump') {
        continue;
      }

      const attrs = (node.attributes as any) || {};
      
      // Extract latest sensor readings
      let level = 'N/A';
      let ph = 'N/A';
      let tds = 'N/A';
      let temp = 'N/A';
      let flow = 'N/A';
      let pressure = 'N/A';

      for (const sensor of node.sensors) {
        const latestReading = sensor.readings[0];
        if (latestReading) {
          const val = latestReading.value;
          if (sensor.sensorType === 'water_level') level = `${val.toFixed(1)}%`;
          else if (sensor.sensorType === 'ph') ph = val.toFixed(2);
          else if (sensor.sensorType === 'tds') tds = `${val.toFixed(0)} ppm`;
          else if (sensor.sensorType === 'temperature') temp = `${val.toFixed(1)}°C`;
          else if (sensor.sensorType === 'flow_rate') flow = `${val.toFixed(1)} L/s`;
          else if (sensor.sensorType === 'pressure') pressure = `${val.toFixed(1)} bar`;
        }
      }

      // Actuators
      const actuators: string[] = [];
      if (attrs.inletValveOn !== undefined) actuators.push(`Inlet Valve: ${attrs.inletValveOn ? 'OPEN' : 'CLOSED'}`);
      if (attrs.outletValveOn !== undefined) actuators.push(`Outlet Valve: ${attrs.outletValveOn ? 'OPEN' : 'CLOSED'}`);
      if (attrs.pumpOn !== undefined) actuators.push(`Pump: ${attrs.pumpOn ? 'ON' : 'OFF'}`);
      
      const actuatorStr = actuators.length > 0 ? actuators.join(', ') : 'None';

      nodesText += `| ${node.nodeName} | ${node.nodeType} | ${node.status} | ${level} | ${ph} | ${tds} | ${temp} | ${flow} | ${pressure} | ${actuatorStr} |\n`;
    }

    // Format Active Alerts
    let alertsText = `\n[ACTIVE ALERTS]\n`;
    if (activeAlerts.length === 0) {
      alertsText += `No active warnings or critical alerts registered.\n`;
    } else {
      activeAlerts.forEach((alert, index) => {
        const nodeName = nodes.find(n => n.id === alert.nodeId)?.nodeName || `Node ID ${alert.nodeId}`;
        alertsText += `${index + 1}. [${alert.severity.toUpperCase()}] at ${nodeName}: ${alert.message} (Triggered at: ${alert.createdAt.toISOString()})\n`;
      });
    }

    return `Telemetry Timestamp: ${timestampStr}
Topology ID: ${this.topologyId} (Bus Topology)

${nodesText}
${alertsText}`;
  }
}
