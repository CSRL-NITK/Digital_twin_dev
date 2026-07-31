import { hydroTwinEngine } from '../hydro-twin.service';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const LIVE_MODEL = 'qwen2.5:1.5b';

export class HydroLiveAgent {
  /**
   * Evaluates active hydroponics telemetry and runs the offline model
   * to generate a short, friendly status alert summary.
   */
  public static async getLiveStatusSummary(): Promise<string> {
    try {
      const fullState = hydroTwinEngine.getTwinState();
      
      // Extract only the Hydroponic-relevant state nodes
      const hydroNodes = ['T1', 'T2', 'T3', 'T4', 'CENTRAL', 'PUMP'];
      const activeState: Record<string, any> = {};

      for (const node of hydroNodes) {
        if (fullState[node]) {
          const { ph, tds, turbidity, water_temp, air_temp, light_intensity, status } = fullState[node];
          if (status) {
            activeState[node] = { ph, tds, turbidity, water_temp, air_temp, light_intensity, status };
          }
        }
      }

      if (Object.keys(activeState).length === 0) {
        return 'No live sensor readings available yet. Please start the Python generator simulator.';
      }

      const prompt = `
You are the Hydroponic Alert Guard. Your task is to process real-time telemetry logs and instantly spot anomalies or status changes.

### Active Telemetry Log Snapshot:
${JSON.stringify(activeState, null, 2)}

### Alert Thresholds:
- Device/Pump Status: If the 'Pump' status is "offline" or any node has a status of "offline"/"Critical", trigger immediately.
- pH: Under 5.8 or Over 6.8 is Critical. Under 6.0 or Over 6.6 is Warning.
- TDS: Under 600 ppm or Over 800 ppm is Critical. Under 650 ppm or Over 750 ppm is Warning.
- Water Temp: Over 25°C is Critical (Risk of root rot).
- Air Temp: Under 20°C or Over 28°C is Warning. Under 18°C or Over 30°C is Critical.
- Light Intensity: On T1-T4, Under 300 lux or Over 400 lux is Warning (indicating grow light failure or overpower). On Central Reservoir, Over 15 lux is Warning (reservoir cover left open).
- Turbidity: Over 20 NTU is Warning.

### Output Constraints:
- Focus strictly on deviations from these limits.
- Output a single-sentence status summary under 20 words.
- Format: Start with [HEALTHY], [WARNING], or [CRITICAL].
- Example: "[CRITICAL] Water pump P1 is offline! Circulation has stopped."
`;

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LIVE_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 50,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json() as { response: string };

      // Calculate live system averages
      let phSum = 0;
      let tdsSum = 0;
      let count = 0;
      const readingsList: string[] = [];

      for (const [nodeName, nodeVal] of Object.entries(activeState)) {
        readingsList.push(`${nodeName}: pH=${nodeVal.ph}, TDS=${nodeVal.tds}ppm, WaterTemp=${nodeVal.water_temp}°C, AirTemp=${nodeVal.air_temp}°C, Light=${nodeVal.light_intensity}lux`);
        if (typeof nodeVal.ph === 'number' && !isNaN(nodeVal.ph)) {
          phSum += nodeVal.ph;
          tdsSum += (nodeVal.tds || 0);
          count++;
        }
      }

      const avgPh = count > 0 ? (phSum / count).toFixed(2) : 'N/A';
      const avgTds = count > 0 ? Math.round(tdsSum / count) : 'N/A';
      const alertSummary = data.response.trim();

      return `Live Sensor Telemetry:
${readingsList.join('\n')}
System Live Averages: Average pH = ${avgPh}, Average TDS = ${avgTds} ppm

Alert Summary:
${alertSummary}`;
    } catch (error: any) {
      console.error('[HydroLiveAgent] Error generating live status summary:', error);
      return 'Live AI diagnosis currently offline (Check if Ollama is running and has qwen2.5:1.5b pulled).';
    }
  }

  /**
   * Generates a detailed diagnostic report for a single node.
   */
  public static async diagnoseNode(nodeSlug: string): Promise<string> {
    try {
      const slug = nodeSlug.toUpperCase();
      const fullState = hydroTwinEngine.getTwinState();
      const nodeState = fullState[slug];

      if (!nodeState || !nodeState.status) {
        return `No live reading found for node ${nodeSlug}.`;
      }

      const prompt = `
You are a Hydroponic Plant Doctor. Diagnose the current state of ${slug}:
${JSON.stringify(nodeState, null, 2)}

Provide a bulleted diagnosis containing:
- Current Health Status Assessment
- Key concern (if any sensor value is outside optimal limits: pH: 6.0-6.5, TDS: 650-750 ppm, water temp: 21-23°C, turbidity: 5-20 NTU)
- Fast corrective suggestion
Keep it brief and professional. Max 3 bullet points. Do not include markdown headers.
`;

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LIVE_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 120,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json() as { response: string };
      return data.response.trim();
    } catch (error: any) {
      console.error(`[HydroLiveAgent] Error diagnosing node ${nodeSlug}:`, error);
      return 'Failed to run node diagnosis. Ensure Ollama is running locally.';
    }
  }
}
