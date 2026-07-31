import { hydroTwinEngine } from '../hydro-twin.service';
import { hydroAiRegistry } from './hydro-ai-registry';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const SIM_MODEL = 'deepseek-r1:1.5b';

export interface SimForecastResult {
  thinking: string;
  recommendation: string;
}

export class HydroSimAgent {
  /**
   * Generates step-by-step physical and chemical forecasts based on a target scenario
   * using the local reasoning model deepseek-r1:1.5b.
   */
  public static async runSimulationForecast(targetScenario: string): Promise<SimForecastResult> {
    try {
      const fullState = hydroTwinEngine.getTwinState();
      
      // Build a snapshot of the current state metrics
      const hydroNodes = ['T1', 'T2', 'T3', 'T4', 'CENTRAL', 'PUMP'];
      const currentStats: Record<string, any> = {};

      for (const node of hydroNodes) {
        if (fullState[node]) {
          const { ph, tds, turbidity, water_temp, air_temp, light_intensity, status } = fullState[node];
          if (status) {
            currentStats[node] = { ph, tds, turbidity, water_temp, air_temp, light_intensity, status };
          }
        }
      }

      const prompt = `
You are a Senior Hydroponic Plant Physiologist and Nutrients Chemist. Your role is to calculate exact corrective actions and forecast plant health outcomes based on simulated changes.

### Current System Metrics Snapshot:
${JSON.stringify(currentStats, null, 2)}

### Simulation Scenario to Analyze:
"${targetScenario}"

### Crop Rules (Butterhead Lettuce):
1. Acid/Base Titration: To lower pH by 0.1 in a 50L reservoir, dose 0.5 mL of Phosphoric Acid (pH Down). To raise pH by 0.1, dose 0.5 mL of KOH (pH Up).
2. Nutrients (TDS): If TDS is low, dose Stock Nutrients (10mL raises TDS by ~15 ppm). If TDS is high, add RO fresh water (1 Liter dilutes TDS by ~15 ppm).
3. Transpiration: High air temp (>28°C) + grow lights active causes plants to transpire water faster than they take in nutrients, resulting in concentration spikes (rising TDS).
4. Suffocation & Rot: Water temp >24°C reduces Dissolved Oxygen (DO), causing root cell suffocation and launching Pythium (root rot) decays.

### Output Guidelines:
- You MUST think step-by-step. Keep your thinking process inside <think>...</think> tags.
- In your final response (outside the <think> tags), provide a professional summary:
  1. Biological/Chemical explanation of the scenario.
  2. Projected pH, TDS, and Health changes after 24 hours.
  3. Actionable Dosing Instructions (e.g. "Dose X mL of pH Up/Down" or "Add Y Liters of RO water").
- Do not use markdown headers in the final summary. Keep it brief.
`;

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: SIM_MODEL,
          prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json() as { response: string };
      const fullText = data.response.trim();

      // Separate reasoning from final recommendations
      const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/i);
      const thinking = thinkMatch ? thinkMatch[1].trim() : 'AI completed reasoning internally.';
      
      const recommendation = fullText.replace(/<think>[\s\S]*?<\/think>/i, '').trim();

      // Extract numeric predictions from text (mock extract or general mock layout)
      const predictions = {
        forecastedScenario: targetScenario,
        timestamp: new Date().toISOString()
      };

      // Cache inside the Shared AI State Registry
      hydroAiRegistry.setSimulationForecast(predictions, thinking, recommendation);

      return { thinking, recommendation };
    } catch (err: any) {
      console.error('[HydroSimAgent] Error running simulation forecast:', err);
      return {
        thinking: 'Log: Model connection failed.',
        recommendation: `Simulation forecast offline: ${err.message}`
      };
    }
  }
}
