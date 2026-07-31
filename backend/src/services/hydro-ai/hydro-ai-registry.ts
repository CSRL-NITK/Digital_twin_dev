export interface HydroAiRegistryData {
  liveSummary: string;
  nodeDiagnoses: Record<string, string>;
  lastSqlQuery: string;
  lastSqlResults: any[];
  historicalBaseline: {
    averages: Record<string, number>;
    anomaliesCount: number;
    lastUpdated: string;
  };
  simulationForecast: {
    predictions: Record<string, any>;
    reasoning: string;
    dosingRecommendation: string;
    lastUpdated: string;
  } | null;
}

class HydroAiRegistry {
  private data: HydroAiRegistryData = {
    liveSummary: 'No live telemetry scanned yet.',
    nodeDiagnoses: {},
    lastSqlQuery: '',
    lastSqlResults: [],
    historicalBaseline: {
      averages: {},
      anomaliesCount: 0,
      lastUpdated: new Date().toISOString(),
    },
    simulationForecast: null,
  };

  public getRegistryData(): HydroAiRegistryData {
    return this.data;
  }

  public setLiveSummary(summary: string) {
    this.data.liveSummary = summary;
  }

  public setNodeDiagnosis(nodeSlug: string, diagnosis: string) {
    this.data.nodeDiagnoses[nodeSlug.toUpperCase()] = diagnosis;
  }

  public setLastQuery(sql: string, results: any[]) {
    this.data.lastSqlQuery = sql;
    this.data.lastSqlResults = results;
  }

  public setHistoricalBaseline(averages: Record<string, number>, anomaliesCount: number) {
    this.data.historicalBaseline = {
      averages,
      anomaliesCount,
      lastUpdated: new Date().toISOString(),
    };
  }

  public setSimulationForecast(predictions: Record<string, any>, reasoning: string, dosingRecommendation: string) {
    this.data.simulationForecast = {
      predictions,
      reasoning,
      dosingRecommendation,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const hydroAiRegistry = new HydroAiRegistry();
