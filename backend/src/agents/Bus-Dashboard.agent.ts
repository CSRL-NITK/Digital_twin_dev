import { prisma } from '../lib/prisma';
import { OllamaProvider } from './ollama.provider';

export class BusDashboardAgent {
  private ollama: OllamaProvider;
  private topologyId: number = 6; // Fixed for Bus Topology

  constructor() {
    // Dashboard uses the larger qwen2.5:3b model for better math analysis
    this.ollama = new OllamaProvider('qwen2.5:3b');
  }

  /**
   * Main entry point to handle operator queries on the Dashboard page
   */
  async handleQuery(userQuery: string): Promise<string> {
    // 1. Gather dashboard parameters and telemetry averages from PostgreSQL
    const dashboardContext = await this.buildDashboardContext();

    // 2. Define the SCADA Manager system instructions
    const systemPrompt = `You are a human SCADA Operations Manager presiding over the Water Distribution Testbed.
Speak naturally, professionally, and directly to a colleague. NEVER quote these guidelines or say "according to the instructions".

=== SYSTEM NORMAL BOUNDS ===
Use these metrics to evaluate if system-wide averages are optimal:
- Average Water Level: 40.0% to 80.0% (Optimal)
- Average pH Index: 6.5 to 8.5 (Optimal)
- Average Temp: 15.0°C to 28.0°C (Optimal)
- Average TDS: 100 to 300 ppm (Optimal)
- Average Pressure: 1.0 to 3.5 bar (Optimal)
- Average Flow Rate: 0.5 to 2.5 L/s (Optimal)
- Water Quality Score: >80% (Optimal)
- System Health Score: >80% (Optimal)

=== LIVE DASHBOARD CONTEXT ===
${dashboardContext}

=== RESPONSE GUIDELINES ===
1. Answer the query based ONLY on the dashboard context provided above.
2. If asked about historical graphs or future predictions, state casually that detailed charts are visible on the dashboard.
3. If a value is missing or N/A, say: "Information not available."
4. Never invent or hallucinate data metrics. Keep answers to 2-3 sentences maximum.`;

    // 3. Query the Qwen model offline
    return await this.ollama.generateChat(systemPrompt, userQuery);
  }

  /**
   * Queries PostgreSQL via Prisma, computes mathematical averages and scores,
   * and formats it into a clean dashboard status report.
   */
  private async buildDashboardContext(): Promise<string> {
    const timestampStr = new Date().toISOString();

    // Fetch all nodes with sensors & latest readings for this topology
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

    // Fetch active unread alerts count
    const activeAlertsCount = await prisma.alert.count({
      where: {
        node: { topologyId: this.topologyId },
        isRead: false
      }
    });

    // Fetch active alerts details for contextual report
    const activeAlerts = await prisma.alert.findMany({
      where: {
        node: { topologyId: this.topologyId },
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Mathematical Accumulators
    let totalPh = 0, phCount = 0;
    let totalTds = 0, tdsCount = 0;
    let totalTemp = 0, tempCount = 0;
    let totalLevel = 0, levelCount = 0;
    let totalFlow = 0, flowCount = 0;
    let totalPressure = 0, pressureCount = 0;

    let activePumps = 0;
    let healthyNodesCount = 0;
    let totalCoreNodes = 0;

    for (const node of nodes) {
      // Filter out auxiliary MQTT sensor nodes for overall counts and calculations
      const nodeTypeLower = node.nodeType.toLowerCase();
      if (nodeTypeLower !== 'tank' && nodeTypeLower !== 'central_tank' && nodeTypeLower !== 'pump') {
        continue;
      }

      totalCoreNodes++;
      if (node.status.toLowerCase() === 'healthy') {
        healthyNodesCount++;
      }

      const attrs = (node.attributes as any) || {};
      if (nodeTypeLower === 'pump' && attrs.pumpOn === true) {
        activePumps++;
      }

      for (const sensor of node.sensors) {
        const latestReading = sensor.readings[0];
        if (latestReading) {
          const val = latestReading.value;
          if (sensor.sensorType === 'water_level') {
            totalLevel += val;
            levelCount++;
          } else if (sensor.sensorType === 'ph') {
            totalPh += val;
            phCount++;
          } else if (sensor.sensorType === 'tds') {
            totalTds += val;
            tdsCount++;
          } else if (sensor.sensorType === 'temperature') {
            totalTemp += val;
            tempCount++;
          } else if (sensor.sensorType === 'flow_rate') {
            totalFlow += val;
            flowCount++;
          } else if (sensor.sensorType === 'pressure') {
            totalPressure += val;
            pressureCount++;
          }
        }
      }
    }

    // Compute Averages
    const avgPh = phCount > 0 ? (totalPh / phCount) : 7.0;
    const avgTds = tdsCount > 0 ? (totalTds / tdsCount) : 200.0;
    const avgTemp = tempCount > 0 ? (totalTemp / tempCount) : 22.0;
    const avgLevel = levelCount > 0 ? (totalLevel / levelCount) : 50.0;
    const avgFlow = flowCount > 0 ? (totalFlow / flowCount) : 0.0;
    const avgPressure = pressureCount > 0 ? (totalPressure / pressureCount) : 0.0;

    // Calculate System Health Score based on healthy/unhealthy nodes ratio
    const systemHealthScore = totalCoreNodes > 0 ? (healthyNodesCount / totalCoreNodes) * 100 : 100.0;

    // Calculate Water Quality Index based on pH and TDS deviation
    // Ideal: pH = 7.0, TDS = 200 ppm
    const phDeviation = Math.abs(avgPh - 7.0) / 7.0;
    const tdsDeviation = Math.abs(avgTds - 200.0) / 200.0;
    const waterQualityScore = Math.max(0, Math.min(100, 100 - (phDeviation * 50 + tdsDeviation * 50)));

    // Format Active Alerts List
    let alertsText = '';
    if (activeAlerts.length === 0) {
      alertsText = 'No active alerts registered.';
    } else {
      activeAlerts.forEach((alert) => {
        const nodeName = nodes.find(n => n.id === alert.nodeId)?.nodeName || `Node ID ${alert.nodeId}`;
        alertsText += `- [${alert.severity.toUpperCase()}] at ${nodeName}: ${alert.message}\n`;
      });
    }

    return `Telemetry Timestamp: ${timestampStr}
Topology: Bus Topology (ID: 6)

[DASHBOARD METRICS]
- Average pH: ${avgPh.toFixed(2)}
- Average TDS: ${avgTds.toFixed(1)} ppm
- Average Temperature: ${avgTemp.toFixed(1)}°C
- Average Water Level: ${avgLevel.toFixed(1)}%
- Average Pressure: ${avgPressure.toFixed(2)} bar
- Average Flow Rate: ${avgFlow.toFixed(2)} L/s
- Active Pumps: ${activePumps}
- Active Alerts Count: ${activeAlertsCount}
- System Health Score: ${systemHealthScore.toFixed(1)}%
- Water Quality Score: ${waterQualityScore.toFixed(1)}%

[ACTIVE ALERTS SUB-REPORT]
${alertsText}`;
  }
}
