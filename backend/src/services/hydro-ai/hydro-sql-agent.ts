import { prisma } from '../../lib/prisma';
import { hydroAiRegistry } from './hydro-ai-registry';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const CODER_MODEL = 'qwen2.5-coder:1.5b';

export class HydroSqlAgent {
  /**
   * Safe SQL Sandbox check to prevent destructive queries.
   */
  private static validateQuerySafety(sql: string): void {
    const sqlUpper = sql.toUpperCase().trim();

    if (!sqlUpper.startsWith('SELECT')) {
      throw new Error('Query validation failed: Only SELECT statements are permitted.');
    }

    const forbiddenKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
      'REPLACE', 'GRANT', 'REVOKE', 'RENAME', 'DATABASE', 'SCHEMA', 'EXTENSION'
    ];

    for (const keyword of forbiddenKeywords) {
      // Use regex check to match full words only, avoiding subsets (e.g. "created_at" matching "create")
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(sqlUpper)) {
        throw new Error(`Security breach: Query contains forbidden database keyword "${keyword}".`);
      }
    }
  }

  /**
   * Programmatic self-healing SQL query repair to patch missing table joins (robustness helper).
   */
  private static repairSqlQuery(sql: string): string {
    let repaired = sql.trim();
    
    // Fix missing JOIN nodes clause when nodes table or alias "n" or topology_id is referenced
    if (
      (repaired.includes('n.topology_id') || repaired.includes('nodes.topology_id') || repaired.includes('topology_id')) &&
      !/join\s+nodes/i.test(repaired) &&
      !/from\s+nodes/i.test(repaired)
    ) {
      if (/join\s+sensors\s+s\b/i.test(repaired)) {
        repaired = repaired.replace(/join\s+sensors\s+s\b[^\n]*/i, (match) => `${match} JOIN nodes n ON s.node_id = n.id`);
      } else if (/join\s+sensors\b/i.test(repaired)) {
        repaired = repaired.replace(/join\s+sensors\b[^\n]*/i, (match) => `${match} JOIN nodes n ON sensors.node_id = n.id`);
      }
    }

    // Fix missing JOIN sensors clause when sensor_readings is joined but sensor_type is queried
    if (
      repaired.includes('sensor_readings') && 
      (repaired.includes('sensor_type') || repaired.includes('sensor_name') || repaired.includes('node_id') || repaired.includes('topology_id')) &&
      !/join\s+sensors/i.test(repaired) &&
      !/from\s+sensors/i.test(repaired)
    ) {
      if (/from\s+sensor_readings\s+sr\b/i.test(repaired)) {
        repaired = repaired.replace(/from\s+sensor_readings\s+sr\b/i, (match) => `${match} JOIN sensors s ON sr.sensor_id = s.id`);
      } else if (/from\s+sensor_readings\b/i.test(repaired)) {
        repaired = repaired.replace(/from\s+sensor_readings\b/i, (match) => `${match} JOIN sensors s ON sensor_readings.sensor_id = s.id`);
      }
    }

    return repaired;
  }

  /**
   * Dynamic Historical Baseline Builder (In-Context Training).
   * Queries average readings and alert frequencies for the past 48 hours.
   */
  public static async buildHistoricalBaseline(): Promise<Record<string, number>> {
    try {
      const topology = await prisma.topology.findFirst({
        where: { name: 'Hydroponic Topology' }
      });

      if (!topology) return {};

      // Get standard averages for last 48 hours grouped by sensor type
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const readings = await prisma.$queryRaw<any[]>`
        SELECT s.sensor_type, AVG(sr.value) as avg_value
        FROM sensor_readings sr
        JOIN sensors s ON sr.sensor_id = s.id
        JOIN nodes n ON s.node_id = n.id
        WHERE n.topology_id = ${topology.id} AND sr.created_at >= ${fortyEightHoursAgo}
        GROUP BY s.sensor_type
      `;

      const averages: Record<string, number> = {};
      for (const row of readings) {
        averages[row.sensor_type] = parseFloat(parseFloat(row.avg_value).toFixed(2));
      }

      // Count anomalies (Warning/Critical alerts) in last 48 hours
      const alertCount = await prisma.alert.count({
        where: {
          node: { topologyId: topology.id },
          createdAt: { gte: fortyEightHoursAgo },
          severity: { in: ['Warning', 'Critical'] }
        }
      });

      // Cache inside the AI State Registry
      hydroAiRegistry.setHistoricalBaseline(averages, alertCount);

      return averages;
    } catch (err) {
      console.error('[HydroSqlAgent] Error building historical baseline:', err);
      return {};
    }
  }

  /**
   * Generates a PostgreSQL query using qwen2.5-coder:1.5b, validates it, and runs it.
   */
  public static async queryHistory(userPrompt: string): Promise<{ sql: string; data: any[]; explanation: string }> {
    try {
      // 1. Build or retrieve the latest Historical Baseline
      const baseline = await this.buildHistoricalBaseline();

      // 2. Fetch the target Hydroponics Topology id
      const topology = await prisma.topology.findFirst({
        where: { name: 'Hydroponic Topology' }
      });
      const topoId = topology ? topology.id : 1;

      // System Schema definition context matching snake_case database tables
      const schemaDescription = `
You are a PostgreSQL database administrator. Translate user requests into a single read-only SQL query.

### Database Schema Details:
- Table "topologies": columns (id, name, description)
- Table "nodes": columns (id, topology_id, node_name, node_type, status, created_at)
  - WARNING: There is NO column named "node_id" in the "nodes" table! Its primary key is "id".
  - Hydroponic Node Names: 'Central Reservoir', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Pump P1'
- Table "sensors": columns (id, node_id, sensor_name, sensor_type, status, last_seen, created_at)
  - WARNING: There is NO column named "sensor_id" or "value" in the "sensors" table! You cannot select "sensors.value"! Its primary key is "id".
  - Sensor Types: 'ph', 'tds', 'turbidity', 'water_temp', 'air_temp', 'light_intensity'
- Table "sensor_readings": columns (id, sensor_id, value, created_at)
  - WARNING: The actual numeric telemetry data readings (like pH, TDS, water temp values) are stored in this "sensor_readings" table under the "value" column. They are NOT in the "sensors" table. You MUST JOIN "sensor_readings" with "sensors" to get the values!
  - WARNING: The "sensor_readings" table does NOT contain "node_id" or "topology_id"! To filter sensor readings by node or topology, you MUST join "sensor_readings" with "sensors" first ("JOIN sensors ON sensor_readings.sensor_id = sensors.id") and then query "sensors.node_id".
- Table "alerts": columns (id, node_id, alert_type, severity, message, is_read, created_at)

### Query Rules & Joins:
- To join nodes and sensors: "JOIN nodes ON sensors.node_id = nodes.id" (Never write "sensors.node_id = nodes.node_id"!)
- To join sensors and readings: "JOIN sensor_readings ON sensor_readings.sensor_id = sensors.id" (Never write "sensor_readings.sensor_id = sensors.sensor_id"!)
- WARNING: If you reference any columns or aliases from the "nodes" table (such as "n.topology_id", "nodes.topology_id", or filtering by the topology ID = ${topoId}), you MUST explicitly include the join clause: "JOIN nodes n ON s.node_id = n.id" in your query! Never reference "n" or "nodes" without declaring the join!
- The "topology_id" column is in the "nodes" table. You can join topologies on "nodes.topology_id = topologies.id".

### Correct SQL Examples (Few-Shot):
Example 1: To get the average pH value over the past 24 hours:
\`\`\`sql
SELECT AVG(sr.value) AS avg_value
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
JOIN nodes n ON s.node_id = n.id
WHERE s.sensor_type = 'ph' AND n.topology_id = ${topoId} AND sr.created_at >= NOW() - INTERVAL '24 hours';
\`\`\`

Example 2: To get the count of critical alerts:
\`\`\`sql
SELECT COUNT(*)
FROM alerts a
JOIN nodes n ON a.node_id = n.id
WHERE n.topology_id = ${topoId} AND a.severity = 'CRITICAL';
\`\`\`

### Historical Baseline Profile (Sensed system context):
${JSON.stringify(baseline, null, 2)}
This represents the normal range of sensor metrics in this specific topology over the past 48 hours.

### Safety Rules:
- Return ONLY raw SQL inside a markdown code block (e.g. \`\`\`sql\nSELECT ...\n\`\`\`). No explanations.
- The query MUST filter by topology_id = ${topoId} or only join nodes where topology_id = ${topoId}.
- Cast BigInt or averages correctly if needed.
- Limit query results to 100 rows maximum.
`;

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CODER_MODEL,
          prompt: `${schemaDescription}\n\nUser Question: "${userPrompt}"\nSQL:`,
          stream: false,
          options: {
            temperature: 0.0,
            num_predict: 200,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json() as { response: string };
      let sql = data.response.trim();

      // Extract SQL from code blocks if LLM wraps it
      const match = sql.match(/```sql([\s\S]*?)```/i);
      if (match) {
        sql = match[1].trim();
      } else {
        sql = sql.replace(/```/g, '').trim();
      }

      // 3. Repair & Security Sanitize
      sql = this.repairSqlQuery(sql);
      console.log('[SQLAgent] Repaired SQL query:', sql);
      this.validateQuerySafety(sql);

      // 4. Run read-only query safely using Prisma
      const resultData = await prisma.$queryRawUnsafe<any[]>(sql);

      // 5. Serialize BigInts (Prisma returns BigInts as values when running raw query on sensor_readings)
      const serializedData = JSON.parse(JSON.stringify(resultData, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      // 6. Update AI State Registry
      hydroAiRegistry.setLastQuery(sql, serializedData);

      // 7. Explanatory short tag
      const explanation = `Successfully retrieved data points using qwen2.5-coder:1.5b.`;

      return { sql, data: serializedData, explanation };
    } catch (err: any) {
      console.error('[HydroSqlAgent] Error generating/executing SQL query:', err);
      return {
        sql: '',
        data: [],
        explanation: `Analysis failed: ${err.message}`
      };
    }
  }

  /**
   * Diagnoses Grafana connection/query logs.
   */
  public static async analyzeHistoryLogs(logsSnippet: string): Promise<string> {
    try {
      const prompt = `
You are a Database and Grafana Log Troubleshooter. Analyze this log snippet:
"""
${logsSnippet}
"""

Diagnose:
1. What is the root cause (e.g. Postgres credentials, database lock, schema column mismatch, or No Data)?
2. Give one clear solution step.
Keep it under 3 bullet points, concise and direct.
`;

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CODER_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 120,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json() as { response: string };
      return data.response.trim();
    } catch (err: any) {
      console.error('[HydroSqlAgent] Error analyzing logs:', err);
      return 'Failed to reach local log analyzer.';
    }
  }
}
