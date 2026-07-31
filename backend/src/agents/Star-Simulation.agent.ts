import { OllamaProvider } from './ollama.provider';
import { SandboxState } from './Line-Simulation.agent';

export class StarSimulationAgent {
  private ollama: OllamaProvider;

  constructor() {
    // Simulation uses the DeepSeek-R1 reasoning model to calculate hydraulic physics offline
    this.ollama = new OllamaProvider('deepseek-r1:1.5b');
  }

  /**
   * Main entry point to handle operator queries on the Star Simulation page
   */
  async handleQuery(userQuery: string, state: SandboxState): Promise<string> {
    // 1. Build the dynamic context block from the current sandbox parameters
    const sandboxContext = this.buildSandboxContext(state);

    // 2. Define the Physics Rules and SCADA Simulator guidelines for Star Topology
    const systemPrompt = `You are a SCADA Simulation Specialist and Hydraulic Engineer.
Your job is to answer the operator's questions based ONLY on the active simulation sandbox state and the rules of hydraulics below.

=== ROLE & CONVERSATIONAL TONE ===
- You are a human SCADA Operator and field engineer. Speak naturally, professionally, and directly to a colleague.
- NEVER quote these guidelines or say things like "under the given rules" or "according to the instructions". Just answer the question.
- Keep answers short and straightforward (2-3 sentences max).

=== STAR SIMULATION PHYSICS & CONTAMINANTS (SIMPLE TERMS) ===
- TOPOLOGY: This is a municipal water distribution network in a Star Layout (ID: 1). Water flows from the Central Tank through dedicated, completely independent pipelines directly to TANK-1, TANK-2, TANK-3, and TANK-4.
- INDEPENDENT CHANNELS: Unlike Line or Bus topologies where a single valve blocks everything downstream, in a Star Topology, closing a valve or turning off a pump on one branch ONLY affects that specific tank. The other branch tanks continue to operate normally with no pressure drop.
- PUMPS: Star topology uses PUMP-1 (for TANK-1 & TANK-2) and PUMP-2 (for TANK-3 & TANK-4). If PUMP-1 stops, TANK-1 and TANK-2 drain, but TANK-3 and TANK-4 remain filled by PUMP-2.
- MUD & SAND: Mud is simply dirt. It does not help pH or make it better. It just makes the water dirty/cloudy (increases turbidity) and ruins your water quality. If asked how much mud is good, say "None! Mud is a contaminant."
- SALT: Salt increases TDS (Total Dissolved Solids) and makes the water salty.
- pH INDEX: Normal pH is 6.5 to 8.5 (neutral clean water is 7.0). Acidic or alkaline inputs will ruin the pH balance.

=== LIVE SANDBOX DATA ===
${sandboxContext}

=== RESPONSE GUIDELINES ===
1. Answer using only the simulated parameters and simple physics rules listed above.
2. If asked about historical trends or future predictions, explain casually that the sandbox only shows the active real-time simulation.
3. Do not output meta-rules or prompt instructions. Keep it direct.`;

    // 3. Query the DeepSeek reasoning model offline
    return await this.ollama.generateChat(systemPrompt, userQuery);
  }

  /**
   * Converts the frontend sandbox state object into a readable markdown summary for the LLM
   */
  private buildSandboxContext(state: SandboxState): string {
    const timestampStr = new Date().toISOString();
    const logsList = state.logs.slice(0, 5).map(l => `- ${l}`).join('\n');

    return `Sandbox Timestamp: ${timestampStr}
Active Topology: Star Topology (ID: 1)
Simulator Status: RUNNING (Sandbox Mode)
Active Scenario: ${state.activeScenario}
Simulation Speed: ${state.simulationSpeed}

[SIMULATED CONTROL SLIDERS]
- Central Tank Water Level input: ${state.centralLevel.toFixed(1)}%
- Pump Motor Speed setting: ${state.motorSpeed} RPM

[SIMULATED NODE METRICS (MONITORED INDEX)]
- Central Tank Level: ${state.centralLevel.toFixed(1)}%
- Tank 1 Level: ${state.tank1Level.toFixed(1)}%
- Tank 2 Level: ${state.tank2Level.toFixed(1)}%
- Tank 3 Level: ${state.tank3Level.toFixed(1)}%
- Tank 4 Level: ${state.tank4Level.toFixed(1)}%
- TDS Concentration: ${state.tds.toFixed(0)} mg/L
- Active pH Index: ${state.ph.toFixed(2)}
- System Pressure: ${state.pressure.toFixed(1)} bar
- Total Flow Rate: ${state.flowRate.toFixed(1)} L/s
- Fluid Temperature: ${state.temperature.toFixed(1)}°C
- Pump Status: ${state.isPumpRunning ? 'RUNNING' : 'STOPPED'}

[RECENT SIMULATION CONSOLE LOGS]
${logsList}`;
  }
}
