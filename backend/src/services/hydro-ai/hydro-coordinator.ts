import { HydroLiveAgent } from './hydro-live-agent';
import { HydroSqlAgent } from './hydro-sql-agent';
import { HydroSimAgent, SimForecastResult } from './hydro-sim-agent';
import { hydroAiRegistry, HydroAiRegistryData } from './hydro-ai-registry';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const SUPERVISOR_MODEL = 'qwen2.5:3b';

export class HydroAiCoordinator {
  /**
   * Delegates live telemetry monitoring and updates the Shared AI State Registry.
   */
  public static async getLiveStatus(): Promise<string> {
    const summary = await HydroLiveAgent.getLiveStatusSummary();
    hydroAiRegistry.setLiveSummary(summary);
    return summary;
  }

  /**
   * Delegates node diagnostics and caches the result.
   */
  public static async checkNode(nodeSlug: string): Promise<string> {
    const diagnosis = await HydroLiveAgent.diagnoseNode(nodeSlug);
    hydroAiRegistry.setNodeDiagnosis(nodeSlug, diagnosis);
    return diagnosis;
  }

  /**
   * Delegates historical SQL analysis.
   */
  public static async queryHistory(userPrompt: string): Promise<{ sql: string; data: any[]; explanation: string }> {
    return await HydroSqlAgent.queryHistory(userPrompt);
  }

  /**
   * Delegates troubleshooting log analysis.
   */
  public static async analyzeHistoryLogs(logsSnippet: string): Promise<string> {
    return await HydroSqlAgent.analyzeHistoryLogs(logsSnippet);
  }

  /**
   * Delegates simulation forecasting queries.
   */
  public static async runSimulation(targetScenario: string): Promise<SimForecastResult> {
    return await HydroSimAgent.runSimulationForecast(targetScenario);
  }

  /**
   * Returns the entire Shared AI State Registry cache.
   */
  public static getRegistry(): HydroAiRegistryData {
    return hydroAiRegistry.getRegistryData();
  }

  /**
   * Unified entry-point representing the Tier 2 Coordinator (qwen2.5:3b).
   * Runs an agentic tool-calling loop, executing edge sub-agents and synthesizing outputs.
   */
  public static async handleCoordinatorRequest(userQuery: string): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are the Hydroponics Coordinator Supervisor, an intelligent master horticulturist overseeing a hydroponic lettuce digital twin system.
Your task is to answer user queries accurately. If more system data or telemetry metrics are needed, execute the appropriate tool. If you can answer directly (e.g. general questions, safety advice, common sense, or casual/silly queries), answer DIRECTLY without invoking any tool!

AVAILABLE TOOLS:
- getLiveStatus(): Scans current sensor values (pH, TDS, water/air temp, light, turbidity) and checks for active anomalies. Use this when the user asks about the current status, live metrics, or active system alerts.
- queryHistory(question): Queries historical database logs. Use this when the user asks for logs, past trends, database stats, or averages over time. Pass the user's question as the argument.
- runSimulation(scenario): Simulates biochemical/physics forecasts (predicting pH drift, heat wave effects, root rot risk, dosing calculations). Use this when the user asks "what if" scenarios, crop growth models, or chemical dosing calculations.

SPECIAL DIRECT RESPONSE RULES (NO TOOLS NEEDED):
1. DO NOT call tools for general knowledge, greetings, safety questions, or casual/silly queries (e.g., "Can I drink this water?", "Hello", "Who are you?", "What is hydroponics?"). Answer these DIRECTLY in plain text!
2. Hydroponic Water Safety: If asked whether the hydroponic system water is drinkable or safe for human consumption, reply immediately with a clear warning: "No! Do not drink hydroponic reservoir water. It contains concentrated mineral fertilizers (Potassium Nitrate, Calcium Nitrate, Phosphoric Acid) formulated specifically for plant roots, not human consumption."
3. If a tool call IS needed, reply ONLY with a raw JSON block and NOTHING else:
{"call": "toolName", "arguments": { "argumentName": "value" }}

FINAL ANSWER FORMAT:
When answering directly or after receiving tool output, speak as a helpful, expert Master Hydroponics Coordinator. Keep answers clear, direct, and professional.`
        },
        {
          role: 'user',
          content: userQuery
        }
      ];

      // Step 1: Call supervisor model to determine intent/tool calls
      let response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: SUPERVISOR_MODEL,
          messages,
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      if (!response.ok) {
        throw new Error(`Supervisor connection failed: ${response.status}`);
      }

      let data = await response.json() as { message: { content: string } };
      let replyContent = data.message.content.trim();

      // Check if the reply is a structured tool call
      let toolCall: { call: string; arguments?: Record<string, any> } | null = null;
      try {
        // Strip markdown code block wrappers if model wrapped the JSON
        let cleanJson = replyContent;
        const jsonMatch = replyContent.match(/```(?:json)?([\s\S]*?)```/i);
        if (jsonMatch) {
          cleanJson = jsonMatch[1].trim();
        } else {
          cleanJson = cleanJson.replace(/```/g, '').trim();
        }

        if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
          toolCall = JSON.parse(cleanJson);
        }
      } catch {
        toolCall = null;
      }

      // Step 2: If tool call detected, run the sub-agent and query supervisor again
      if (toolCall && toolCall.call) {
        console.log(`[HydroCoordinator] Supervisor calling edge tool: ${toolCall.call}`);
        let toolResult = '';

        if (toolCall.call === 'getLiveStatus') {
          toolResult = await this.getLiveStatus();
        } else if (toolCall.call === 'queryHistory') {
          const q = toolCall.arguments?.question || userQuery;
          const result = await this.queryHistory(q);
          toolResult = `SQL Query Executed:\n${result.sql}\n\nData result:\n${JSON.stringify(result.data)}\n\nExplanation: ${result.explanation}`;
        } else if (toolCall.call === 'runSimulation') {
          const s = toolCall.arguments?.scenario || userQuery;
          const result = await this.runSimulation(s);
          toolResult = `Simulation Forecast Output:\nThinking Process: ${result.thinking}\n\nFinal Prediction: ${result.recommendation}`;
        } else {
          toolResult = `Tool ${toolCall.call} not found.`;
        }

        // Push the intermediate tool execution history
        messages.push({ role: 'assistant', content: replyContent });
        messages.push({ role: 'user', content: `Tool Result Output:\n${toolResult}` });

        // Query supervisor model a second time for final response synthesis
        response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: SUPERVISOR_MODEL,
            messages,
            stream: false,
            options: { temperature: 0.2 }
          })
        });

        if (!response.ok) {
          throw new Error(`Supervisor final synthesis connection failed: ${response.status}`);
        }

        data = await response.json() as { message: { content: string } };
        replyContent = data.message.content.trim();
      }

      return replyContent;
    } catch (err: any) {
      console.error('[HydroCoordinator] Error in supervisor agent loop:', err);
      // Fallback keyword routing in case qwen2.5:3b is missing or throws error
      return this.handleFallbackRouting(userQuery);
    }
  }

  /**
   * Robust fallback router in case local Ollama is offline or model fails.
   */
  private static async handleFallbackRouting(userQuery: string): Promise<string> {
    const queryLower = userQuery.toLowerCase();

    if (queryLower.includes('drink') || queryLower.includes('potable') || queryLower.includes('ingest')) {
      return "No! Do not drink hydroponic reservoir water. It contains concentrated mineral fertilizers (Potassium Nitrate, Calcium Nitrate, Phosphoric Acid) formulated specifically for plant roots, not human consumption.";
    }

    if (
      queryLower.includes('simulat') || 
      queryLower.includes('sim') || 
      queryLower.includes('predict') || 
      queryLower.includes('forecast') || 
      queryLower.includes('dosing') ||
      queryLower.includes('growth') ||
      queryLower.includes('decay') ||
      queryLower.includes('bloom') ||
      queryLower.includes('rot')
    ) {
      const forecast = await this.runSimulation(userQuery);
      return `[Hydroponics Coordinator Fallback] Simulation Reasoning Log:\n<think>\n${forecast.thinking}\n</think>\n\nPrediction & Corrective Dosing Action:\n${forecast.recommendation}`;
    }

    if (
      queryLower.includes('history') || 
      queryLower.includes('average') || 
      queryLower.includes('mean') || 
      queryLower.includes('sql') || 
      queryLower.includes('database') ||
      queryLower.includes('readings')
    ) {
      const result = await this.queryHistory(userQuery);
      if (result.sql) {
        return `[Hydroponics Coordinator Fallback] SQL Query Executed:\n\`\`\`sql\n${result.sql}\n\`\`\`\n\nExplanation: ${result.explanation}\nData Points: ${result.data.length}`;
      }
      return `[Hydroponics Coordinator Fallback] Database query failed: ${result.explanation}`;
    }

    const liveAlert = await this.getLiveStatus();
    return `[Hydroponics Coordinator Fallback] Live Telemetry Analysis:\n${liveAlert}`;
  }
}
