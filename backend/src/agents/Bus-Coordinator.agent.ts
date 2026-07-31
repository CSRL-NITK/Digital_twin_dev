import { OllamaProvider } from './ollama.provider';
import { BusLiveAgent } from './Bus-Live.agent';
import { BusDashboardAgent } from './Bus-Dashboard.agent';
import { BusSimulationAgent } from './Bus-Simulation.agent';
import { SandboxState } from './Line-Simulation.agent';
import { prisma } from '../lib/prisma';

export class BusCoordinatorAgent {
  private ollama: OllamaProvider;
  private liveAgent: BusLiveAgent;
  private dashboardAgent: BusDashboardAgent;
  private simulationAgent: BusSimulationAgent;
  private topologyId: number = 6; // Fixed for Bus Topology

  constructor() {
    // The Bus Topology Coordinator uses the qwen2.5:3b model as its dispatcher brain
    this.ollama = new OllamaProvider('qwen2.5:3b');
    this.liveAgent = new BusLiveAgent();
    this.dashboardAgent = new BusDashboardAgent();
    this.simulationAgent = new BusSimulationAgent();
  }

  /**
   * Main entry point for the coordinator. It uses the qwen2.5:3b model to
   * analyze user intent, route it to the correct sub-agent, and return the answer.
   */
  async handleQuery(userQuery: string, sandboxState?: SandboxState): Promise<string> {
    // 1. Define instructions for intent classification
    const classifierSystemPrompt = `You are the Bus Topology Routing Assistant. 
Your only job is to classify which sub-agent must handle the user's query.
Reply with exactly one of these tags:
- [LIVE] if the query is about a specific single node/tank (e.g. TANK - 1, TANK - 2, Central Tank), single sensor readings (current pH, current level, etc.), or active warnings.
- [DASHBOARD] if the query is about global system averages (e.g. average pH across all tanks, overall flow, average pressure), overall system health scores, or water quality index.
- [SIMULATION] if the query is about sandbox adjustments, pump speed overrides (RPM), active simulation scenarios, or what-if physics outcomes.

IMPORTANT: Questions asking about a specific tank name (like "TANK - 1" or "TANK-1") must ALWAYS go to [LIVE]. Only global metrics or averages go to [DASHBOARD].

Your response MUST contain ONLY the tag, e.g., "[LIVE]" or "[DASHBOARD]" or "[SIMULATION]". Do not output any other text or reasoning.`;

    try {
      // 2. Query Qwen 3B to decide the route
      const routeResponse = await this.ollama.generateChat(classifierSystemPrompt, `Route this user query: "${userQuery}"`);
      const route = routeResponse.trim().toUpperCase();

      console.log(`[Bus Coordinator] Routing query "${userQuery}" -> Target: ${route}`);

      // 3. Delegate execution based on the LLM's classification
      if (route.includes('[SIMULATION]')) {
        const activeState = sandboxState || await this.buildDefaultSandboxState();
        return await this.simulationAgent.handleQuery(userQuery, activeState);
      } else if (route.includes('[DASHBOARD]')) {
        return await this.dashboardAgent.handleQuery(userQuery);
      } else {
        // Fallback / default is the Live Agent
        return await this.liveAgent.handleQuery(userQuery);
      }
    } catch (error: any) {
      console.error('[Bus Coordinator Error]:', error.message);
      // Fallback to Live Agent directly in case of Ollama/routing failures
      return await this.liveAgent.handleQuery(userQuery);
    }
  }

  /**
   * Helper to construct a default simulation state using live database telemetry
   * if the user is asking what-if questions outside of the active simulation sandbox page.
   */
  private async buildDefaultSandboxState(): Promise<SandboxState> {
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

    let centralLevel = 50, tank1Level = 0, tank2Level = 0, tank3Level = 0, tank4Level = 0;
    let tds = 200, ph = 7.0, temp = 22.0, pressure = 0.0, flowRate = 0.0;
    let isPumpRunning = false;
    let motorSpeed = 0;

    for (const node of nodes) {
      const nodeTypeLower = node.nodeType.toLowerCase();
      const attrs = (node.attributes as any) || {};
      
      if (nodeTypeLower === 'pump' && attrs.pumpOn === true) {
        isPumpRunning = true;
        motorSpeed = 1450;
      }

      for (const sensor of node.sensors) {
        const latestReading = sensor.readings[0];
        if (latestReading) {
          const val = latestReading.value;
          if (sensor.sensorType === 'water_level') {
            if (node.nodeName.includes('Central')) centralLevel = val;
            else if (node.nodeName.includes('TANK-1') || node.nodeName.includes('TANK - 1')) tank1Level = val;
            else if (node.nodeName.includes('TANK-2') || node.nodeName.includes('TANK - 2')) tank2Level = val;
            else if (node.nodeName.includes('TANK-3') || node.nodeName.includes('TANK - 3')) tank3Level = val;
            else if (node.nodeName.includes('TANK-4') || node.nodeName.includes('TANK - 4')) tank4Level = val;
          } else if (sensor.sensorType === 'ph') {
            ph = val;
          } else if (sensor.sensorType === 'tds') {
            tds = val;
          } else if (sensor.sensorType === 'temperature') {
            temp = val;
          } else if (sensor.sensorType === 'pressure') {
            pressure = val;
          } else if (sensor.sensorType === 'flow_rate') {
            flowRate = val;
          }
        }
      }
    }

    return {
      centralLevel,
      tank1Level,
      tank2Level,
      tank3Level,
      tank4Level,
      activeScenario: 'Normal Operation',
      simulationSpeed: '1x (Real-time)',
      motorSpeed,
      pressure,
      flowRate,
      ph,
      tds,
      temperature: temp,
      isPumpRunning,
      logs: ['System initialized Bus coordinator baseline state.']
    };
  }
}
