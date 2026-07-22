export interface NutrientSolution {
  // Macronutrients (ppm)
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;

  // Micronutrients (ppm)
  iron: number;
  manganese: number;
  zinc: number;
  boron: number;
  copper: number;
  molybdenum: number;
  chlorine: number;

  // Dry Salt Fertilizers (g/100L)
  calciumNitrate: number;
  potassiumNitrate: number;
  monoammoniumPhosphate: number;
  epsomSalts: number;
  ironChelate: number;
  traceMicronutrientBlend: number;

  // Liquid Additives & Biologicals (mL/100L)
  phosphoricAcid: number;
  nitricAcid: number;
  potassiumHydroxide: number;
  bacillusAmyloliquefaciens: number;
  hypochlorousAcid: number;
}

export interface ReservoirStats {
  volume: number;          // Current water volume in Liters (e.g., 0 to 120 L)
  maxVolume: number;       // Max capacity in Liters (e.g., 120 L)
  ec: number;              // mS/cm
  tds: number;             // ppm
  pH: number;              // 0-14
  nutrientPercentage: number; // 0-100% of standard concentration
  waterConsumptionToday: number; // Liters
  predictedRefillDays: number; // Days until empty
  predictedNutrientRefillDays: number; // Days until nutrients depleted
}

export interface LettuceMetrics {
  age: number;               // Days
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Ready for Harvest";
  height: number;            // cm
  leafCount: number;         // count
  leafAreaIndex: number;     // ratio
  rootLength: number;        // cm
  freshBiomass: number;      // grams
  dryBiomass: number;        // grams
  estimatedHarvestWeight: number; // grams
  health: number;            // 0-100
  growthRate: number;        // % per day
  photosynthesisRate: number;// µmol CO2/m²/s
  waterConsumption: number;  // Liters/day
  nutrientConsumption: number;// mg/day
}

export interface LettuceEnvironmentalStats {
  ledIntensity: number;      // PPFD (0 to 400)
  photoperiod: number;       // hours ON (0 to 24)
  pumpSpeed: number;         // % (0 to 100)
  flowRate: number;          // L/min (0 to 5)
  waterTemp: number;         // °C (0 to 40)
  airTemp: number;           // °C (0 to 45)
  humidity: number;          // % (0 to 100)
  targetPH: number;          // Target dosing pH
  targetEC: number;          // Target dosing EC (mS/cm)
  nutrientDoseAmount: number; // mL per dose
}

export interface DiseaseRisk {
  name: string;
  probability: number;       // 0-100%
  severity: "None" | "Low" | "Medium" | "High";
  recommendation: string;
}

export interface TelemetryPoint {
  time: number;              // timestamp or age-second marker
  pH: number;
  ec: number;
  waterTemp: number;
  airTemp: number;
  humidity: number;
  ledIntensity: number;
  plantHeight: number;
  leafAreaIndex: number;
  freshBiomass: number;
  growthRate: number;
  waterConsumption: number;
  nutrientConsumption: number;
}

export interface DiagnosticReport {
  status: string;
  healthScore: number;
  insights: string[];
  recommendations: string[];
  twinThoughts: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "twin";
  text: string;
  timestamp: string;
}
