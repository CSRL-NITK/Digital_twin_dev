/**
 * Unattended System Decay (70 Days) Mathematical Simulation Engine
 * 
 * Simulates an unmonitored 50-Liter hydroponic system from Day 0 to Day 70
 * based on chemical, biological, and hardware dynamics.
 */

export interface DecaySimulationState {
  t: number;                           // Current day (0 to 70)
  phaseName: string;                  // Phase Name
  waterVol: number;                   // Water Volume (L)
  evapRate: number;                   // Evaporation / Transpiration Rate (L/day)
  pH: number;                         // Reservoir pH
  ec: number;                         // Solute EC (mS/cm)
  tds: number;                        // Total Dissolved Solids (ppm)
  doVal: number;                      // Dissolved Oxygen (mg/L)
  waterTemp: number;                  // Water Temp (°C)
  airTemp: number;                    // Ambient Air Temp (°C)
  humidity: number;                   // Ambient Humidity (%)
  
  // Macronutrients (ppm)
  n: number;                          // Nitrogen (ppm)
  p: number;                          // Phosphorus (ppm)
  k: number;                          // Potassium (ppm)
  ca: number;                         // Calcium (ppm)
  mg: number;                         // Magnesium (ppm)
  s: number;                          // Sulfur (ppm)
  
  // Micronutrients (ppm)
  fe: number;                         // Iron (ppm)
  mn: number;                         // Manganese (ppm)
  feAvailability: number;             // Available Iron (ppm after lockout calculation)
  mnAvailability: number;             // Available Manganese (ppm)
  feLockoutAlert: boolean;            // Rule 1: Micronutrient Lockout Trigger
  
  // Mathematical Engine Derivatives
  concentrationFactor: number;        // Rule 2: Concentration Factor (Baseline / Current Volume)
  rootHealthIndex: number;            // Rule 3: Root Health Index (1.0 -> 0.0)
  pythiumRootRot: boolean;            // Rule 3: Pythium Root Rot Trigger (rootHealthIndex < 0.4)
  pumpFailureAlert: boolean;          // Rule 4: Hardware Failure Trigger (waterVol <= 14.0 L)
  pumpFlow: number;                   // Flow Rate (L/min)
  pumpSpeed: number;                  // Recirculation Pump Speed (%)
  
  // Plant Biology
  health: number;                     // Plant Health (0 to 100%)
  plantEffect: string;                // Plant Effect & Visual Morphology Description
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Ready for Harvest" | "Decaying";
  height: number;                     // cm
  leafCount: number;                  // count
  rootLength: number;                 // cm
  freshBiomass: number;               // grams
}

export function getUnattendedDecayState(age: number): DecaySimulationState {
  // Clamp day between 0 and 70
  const t = Math.max(0, Math.min(70, age));

  let waterVol = 50.0;
  let evapRate = 0.3;
  let pH = 6.00;
  let ec = 1.40;
  let tds = 900;
  let doVal = 8.0;
  let waterTemp = 19.0;
  let phaseName = "Germination";

  // Base Nutrients (ppm)
  let n = 150;
  let p = 31;
  let k = 210;
  let ca = 90;
  let mg = 24;
  let s = 32;
  let fe = 1.0;
  let mn = 0.25;

  let plantEffect = "Radicle emergence; Cotyledon sprouting. Health: 100%.";
  let health = 100;
  let pumpFlow = 1.5;
  let pumpSpeed = 100;

  // Plant biometrics
  let height = 0.5;
  let leafCount = 2;
  let rootLength = 1.2;
  let freshBiomass = 0.1;
  let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Ready for Harvest" | "Decaying" = "Germination";

  if (t <= 5) {
    // Day 0–5: Germination
    const r = t / 5;
    phaseName = "Germination";
    waterVol = 50.0 - r * (50.0 - 48.5); // 50.0 -> 48.5 L
    evapRate = 0.3;
    pH = 6.00 + r * (6.02 - 6.00); // 6.00 -> 6.02
    ec = 1.40 + r * (1.42 - 1.40); // 1.40 -> 1.42
    tds = 900 + r * (910 - 900); // 900 -> 910
    doVal = 8.0 - r * (8.0 - 7.2); // 8.0 -> 7.2
    waterTemp = 19.0 + r * (21.0 - 19.0); // 19.0 -> 21.0
    n = 150; p = 31; k = 210; ca = 90;
    health = 100;
    plantEffect = "Radicle emergence; Cotyledon sprouting. Health: 100%.";
    stage = "Germination";
    height = 0.5 + r * (3.2 - 0.5);
    leafCount = Math.round(2 + r * (6 - 2));
    rootLength = 1.2 + r * (4.1 - 1.2);
    freshBiomass = 0.1 + r * (2.8 - 0.1);
  } else if (t <= 14) {
    // Day 6–14: Seedling Etiolation
    const r = (t - 5) / (14 - 5);
    phaseName = "Seedling Etiolation";
    waterVol = 48.5 - r * (48.5 - 45.8); // 48.5 -> 45.8 L
    evapRate = 0.3;
    pH = 6.02 + r * (6.08 - 6.02); // 6.02 -> 6.08
    ec = 1.42 + r * (1.54 - 1.42); // 1.42 -> 1.54
    tds = 910 + r * (985 - 910); // 910 -> 985
    doVal = 7.2 - r * (7.2 - 6.2); // 7.2 -> 6.2
    waterTemp = 21.0 + r * (23.5 - 21.0); // 21.0 -> 23.5
    n = 150 - r * (150 - 145); p = 31 - r * (31 - 30); k = 210 - r * (210 - 205); ca = 90 - r * (90 - 88);
    health = 100 - r * 8; // 100 -> 92%
    plantEffect = "Severe phototropism & legginess (stretching toward fixed light). Thin stems.";
    stage = "Seedling";
    height = 3.2 + r * (14.5 - 3.2); // stretched height (etiolation)
    leafCount = Math.round(6 + r * (16 - 6));
    rootLength = 4.1 + r * (10.5 - 4.1);
    freshBiomass = 2.8 + r * (18.0 - 2.8);
  } else if (t <= 22) {
    // Day 15–22: Rapid Vegetative & Alkaline Drift
    const r = (t - 14) / (22 - 14);
    phaseName = "Rapid Vegetative & Alkaline Drift";
    waterVol = 45.8 - r * (45.8 - 37.8); // 45.8 -> 37.8 L
    evapRate = 1.0;
    pH = 6.08 + r * (7.20 - 6.08); // 6.08 -> 7.20
    ec = 1.54 + r * (1.80 - 1.54); // 1.54 -> 1.80
    tds = 985 + r * (1150 - 985); // 985 -> 1150
    doVal = 6.2 - r * (6.2 - 5.0); // 6.2 -> 5.0
    waterTemp = 23.5 + r * (24.0 - 23.5); // 23.5 -> 24.0
    n = 145 - r * (145 - 110); p = 30 - r * (30 - 22); k = 205 - r * (205 - 160); ca = 88 - r * (88 - 75);
    health = 92 - r * 17; // 92 -> 75%
    plantEffect = "Early Iron Lockout starts. Interveinal chlorosis (leaves yellowing between dark green veins).";
    stage = "Vegetative";
    height = 14.5 + r * (22.0 - 14.5);
    leafCount = Math.round(16 + r * (24 - 16));
    rootLength = 10.5 + r * (15.0 - 10.5);
    freshBiomass = 18.0 + r * (65.0 - 18.0);
  } else if (t <= 30) {
    // Day 23–30: Critical Lockout & Salt Spike
    const r = (t - 22) / (30 - 22);
    phaseName = "Critical Lockout & Salt Spike";
    waterVol = 37.8 - r * (37.8 - 29.8); // 37.8 -> 29.8 L
    evapRate = 1.0;
    pH = 7.20 + r * (7.80 - 7.20); // 7.20 -> 7.80
    ec = 1.80 + r * (2.02 - 1.80); // 1.80 -> 2.02
    tds = 1150 + r * (1290 - 1150); // 1150 -> 1290
    doVal = 5.0 - r * (5.0 - 4.1); // 5.0 -> 4.1
    waterTemp = 24.0;
    n = 110 - r * (110 - 95); p = 22 - r * (22 - 19); k = 160 - r * (160 - 145); ca = 75 - r * (75 - 60);
    health = 75 - r * 25; // 75 -> 50%
    plantEffect = "Tip Burn (marginal leaf necrosis from high TDS salt stress). Roots turn dull tan color.";
    stage = "Vegetative";
    height = 22.0 + r * (24.0 - 22.0);
    leafCount = Math.round(24 + r * (28 - 24));
    rootLength = 15.0 + r * (18.0 - 15.0);
    freshBiomass = 65.0 + r * (95.0 - 65.0);
  } else if (t <= 40) {
    // Day 31–40: Anoxia & Pythium Outbreak
    const r = (t - 30) / (40 - 30);
    phaseName = "Anoxia & Pythium Outbreak";
    waterVol = 29.8 - r * (29.8 - 24.8); // 29.8 -> 24.8 L
    evapRate = 0.5;
    pH = 7.80 + r * (8.20 - 7.80); // 7.80 -> 8.20
    ec = 2.02 + r * (2.30 - 2.02); // 2.02 -> 2.30
    tds = 1290 + r * (1470 - 1290); // 1290 -> 1470
    doVal = 4.1 - r * (4.1 - 3.2); // 4.1 -> 3.2
    waterTemp = 24.0 + r * (24.5 - 24.0); // 24.0 -> 24.5
    n = 95 - r * (95 - 90); p = 19 - r * (19 - 18); k = 145 - r * (145 - 140); ca = 60 - r * (60 - 45);
    health = 50 - r * 30; // 50 -> 20%
    plantEffect = "Hypoxic root suffocation. Pythium root rot outbreak: roots brown, slimy, disintegrating. Wilting canopy.";
    stage = "Mature";
    height = 24.0 - r * (24.0 - 20.0); // wilting height collapse
    leafCount = Math.round(28 - r * 6);
    rootLength = 18.0 - r * 5.0; // root disintegration
    freshBiomass = 95.0 - r * 30.0;
  } else if (t <= 50) {
    // Day 41–50: Pump Failure & Channel Desiccation
    const r = (t - 40) / (50 - 40);
    phaseName = "Pump Failure & Channel Desiccation";
    waterVol = 24.8 - r * (24.8 - 13.5); // 24.8 -> 13.5 L (<14 L around Day 48)
    evapRate = 0.5 - r * (0.5 - 0.1);
    pH = 8.20 + r * (8.40 - 8.20); // 8.20 -> 8.40
    ec = 2.30 + r * (2.50 - 2.30); // 2.30 -> 2.50
    tds = 1470 + r * (1600 - 1470); // 1470 -> 1600
    doVal = 3.2 - r * (3.2 - 1.8); // 3.2 -> 1.8
    waterTemp = 24.5 + r * (25.0 - 24.5); // 24.5 -> 25.0
    n = Math.max(20, 90 - r * 30); p = Math.max(5, 18 - r * 8); k = Math.max(50, 140 - r * 50); ca = Math.max(10, 45 - r * 25);
    health = Math.max(0, 20 - r * 20); // 20 -> 0%

    if (waterVol <= 14.0) {
      pumpFlow = 0.0;
      pumpSpeed = 0;
    }
    plantEffect = "Reservoir level drops below submersible pump line. Flow drops to 0 L/min. Top PVC channels dry out. Canopy collapses.";
    stage = "Decaying";
    height = Math.max(5.0, 20.0 - r * 12.0);
    leafCount = Math.max(4, Math.round(22 - r * 14));
    rootLength = Math.max(3.0, 13.0 - r * 8.0);
    freshBiomass = Math.max(10.0, 65.0 - r * 45.0);
  } else {
    // Day 51–70: Liquefaction & System Decay
    const r = (t - 50) / (70 - 50);
    phaseName = "Liquefaction & System Decay";
    waterVol = Math.max(2.0, 13.5 - r * 11.5); // 13.5 -> 2.0 L stagnant
    evapRate = 0.05;
    pH = 8.40 - r * (8.40 - 6.80); // 8.40 -> 6.80 (organic rot acids)
    ec = 2.50 + r * 1.50; // 2.50 -> 4.00 (toxic salt spike)
    tds = Math.round(ec * 640); // 1600 -> 2560 ppm
    doVal = Math.max(0.2, 1.8 - r * 1.6); // 1.8 -> 0.2 mg/L
    waterTemp = 25.0 - r * (25.0 - 23.0); // 25.0 -> 23.0 (ambient)
    health = 0;
    pumpFlow = 0.0;
    pumpSpeed = 0;
    n = Math.max(10, 60 - r * 40); p = Math.max(5, 10 - r * 5); k = Math.max(20, 90 - r * 60); ca = Math.max(5, 20 - r * 15);
    plantEffect = "Dead plants turn black/slimy. Mold and bacteria consume remaining tissue. Growth potential drops to 0%.";
    stage = "Decaying";
    height = Math.max(2.0, 8.0 - r * 6.0);
    leafCount = Math.max(2, Math.round(8 - r * 6));
    rootLength = Math.max(1.0, 5.0 - r * 4.0);
    freshBiomass = Math.max(1.0, 20.0 - r * 19.0);
  }

  // --- LOGIC & MATHEMATICAL RULES ENGINE EVALUATION ---

  // Rule 1: pH-Dependent Micronutrient Availability
  // If pH > 7.2, set Fe_Availability = Fe_ppm * Max(0, 1.0 - (pH - 7.2) * 0.7)
  let feAvailability = fe;
  let mnAvailability = mn;
  let feLockoutAlert = false;
  if (pH > 7.2) {
    feAvailability = parseFloat((fe * Math.max(0, 1.0 - (pH - 7.2) * 0.7)).toFixed(3));
    mnAvailability = parseFloat((mn * Math.max(0, 1.0 - (pH - 7.2) * 0.7)).toFixed(3));
    feLockoutAlert = true;
  }

  // Rule 2: Transpiration vs Concentration Shift
  // Compute Concentration_Factor = Baseline_Volume / Current_Volume (50.0 / Current_Volume)
  const concentrationFactor = parseFloat((50.0 / Math.max(1.0, waterVol)).toFixed(2));
  // Scale non-absorbed salts so TDS increases dynamically as water level drops
  const dynamicTDS = Math.round(tds * Math.min(2.5, Math.max(1.0, concentrationFactor * 0.75)));
  const dynamicEC = parseFloat((dynamicTDS / 640).toFixed(2));

  // Rule 3: Dissolved Oxygen (DO) & Root Health Index
  // If DO < 4.0 mg/L, degrade Root_Health_Index by -0.05 per day
  let rootHealthIndex = 1.0;
  if (t > 30) {
    const daysLowDO = t - 30;
    rootHealthIndex = Math.max(0.0, parseFloat((1.0 - daysLowDO * 0.05).toFixed(2)));
  }
  const pythiumRootRot = rootHealthIndex < 0.4;

  // Rule 4: Hardware Failure Trigger
  // If Reservoir_Volume <= 14.0 L, set Pump_Flow = 0.0 L/min and trigger ALERT: Pump Sucking Air / Dry Run Hazard
  const pumpFailureAlert = waterVol <= 14.0;
  if (pumpFailureAlert) {
    pumpFlow = 0.0;
    pumpSpeed = 0;
  }

  return {
    t: parseFloat(t.toFixed(2)),
    phaseName,
    waterVol: parseFloat(waterVol.toFixed(1)),
    evapRate: parseFloat(evapRate.toFixed(2)),
    pH: parseFloat(pH.toFixed(2)),
    ec: dynamicEC,
    tds: dynamicTDS,
    doVal: parseFloat(doVal.toFixed(1)),
    waterTemp: parseFloat(waterTemp.toFixed(1)),
    airTemp: 23.0,
    humidity: 50,
    n: Math.round(n),
    p: Math.round(p),
    k: Math.round(k),
    ca: Math.round(ca),
    mg: Math.round(mg),
    s: Math.round(s),
    fe,
    mn,
    feAvailability,
    mnAvailability,
    feLockoutAlert,
    concentrationFactor,
    rootHealthIndex,
    pythiumRootRot,
    pumpFailureAlert,
    pumpFlow,
    pumpSpeed,
    health: Math.round(health),
    plantEffect,
    stage,
    height: parseFloat(height.toFixed(1)),
    leafCount,
    rootLength: parseFloat(rootLength.toFixed(1)),
    freshBiomass: parseFloat(freshBiomass.toFixed(1)),
  };
}
