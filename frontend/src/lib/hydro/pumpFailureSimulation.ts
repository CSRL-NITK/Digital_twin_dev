/**
 * Pump Failure 28-Day Hydroponic Research Simulation Engine
 * 
 * Synthesized from controlled-environment NFT research specification (Pump_Failure.docx)
 * for Green Coral Lettuce (L. sativa).
 * 
 * Simulates abrupt circulation pump mechanical failure on Day 10:
 * - Days 0-9: Healthy germination and establishment under continuous flow (DO 8.0 - 8.3 mg/L).
 * - Day 10: PUMP FAILURE EVENT (Flow = 0 L/min, Pump Speed = 0%).
 * - Days 10-13: Hidden root oxygen stress (DO 6.2 mg/L, Health 92%).
 * - Days 14-18: Progressive wilting & leaf sag (DO 5.5 mg/L, Health 75%).
 * - Days 19-24: Anaerobic root rot & chlorosis (DO 4.5 mg/L, Health 48%).
 * - Days 25-28: Complete canopy collapse & plant death (DO < 4.0 mg/L, Health 0%, Yield <80g).
 */

export interface PumpFailureState {
  t: number;                           // Day (0 to 70)
  phaseName: string;                  // Research Phase Name
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying";
  health: number;                     // Health Index (0 to 100%)
  pumpRunning: boolean;
  pumpSpeed: number;                  // %
  flowRate: number;                   // L/min
  
  // Reservoir Chemistry
  waterVol: number;                   // Litres remaining
  ec: number;                         // mS/cm
  tds: number;                        // ppm
  pH: number;                         // Reservoir pH
  doVal: number;                      // Dissolved Oxygen (mg/L)
  waterTemp: number;                  // °C
  airTemp: number;                    // °C
  humidity: number;                   // %
  ledIntensity: number;               // PPFD
  
  // Solutes (ppm)
  n: number;
  p: number;
  k: number;
  ca: number;
  mg: number;
  s: number;
  fe: number;
  
  // Morphology & Health
  height: number;                     // cm
  rootLength: number;                 // cm
  leafCount: number;                  // count
  freshBiomass: number;               // grams
  waterUptake: number;                // mL/day
  growthRate: number;                 // % daily growth rate
  rootColor: string;                  // hex
  failureStage: number;               // 1 to 4
  plantEffect: string;                // Visual description
}

export function getPumpFailureState(age: number): PumpFailureState {
  const t = Math.max(0, age);

  let phaseName = "Normal Germination";
  let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying" = "Germination";
  let health = 100;
  let pumpRunning = true;
  let pumpSpeed = 100;
  let flowRate = 1.5;
  
  let waterVol = 50.0;
  let ec = 0.70;
  let tds = 450;
  let pH = 6.00;
  let doVal = 8.3;
  let waterTemp = 20.5;
  let airTemp = 22.5;
  let humidity = 72;
  let ledIntensity = 135;

  let n = 35;
  let p = 20;
  let k = 60;
  let ca = 25;
  let mg = 11;
  let s = 13;
  let fe = 0.6;

  let height = 0.5;
  let rootLength = 0.8;
  let leafCount = 0;
  let freshBiomass = 0.05;
  let waterUptake = 15;
  let growthRate = 2.1;
  let rootColor = "#f8fafc";
  let failureStage = 1;
  let plantEffect = "Normal germination using seed reserves under continuous flow.";

  if (t <= 3) {
    // Phase 1: Normal Germination (Days 0 to 3)
    const r = t / 3;
    phaseName = "Normal Germination";
    stage = "Germination";
    pumpRunning = true; pumpSpeed = 100; flowRate = 1.5;
    waterVol = parseFloat((50.0 - r * 1.0).toFixed(1));
    ec = parseFloat((0.60 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = parseFloat((8.3 - r * 0.1).toFixed(1));
    waterTemp = 20.5;
    airTemp = 22.5;
    humidity = 72;
    ledIntensity = Math.round(120 + r * 30);

    n = Math.round(30 + r * 15);
    p = Math.round(18 + r * 4);
    k = Math.round(55 + r * 15);
    ca = Math.round(20 + r * 10);
    mg = Math.round(10 + r * 2);
    s = Math.round(12 + r * 3);
    fe = 0.6;

    height = parseFloat((0.2 + r * 1.0).toFixed(1));
    rootLength = parseFloat((0.3 + r * 1.2).toFixed(1));
    leafCount = 0;
    freshBiomass = parseFloat((0.02 + r * 0.13).toFixed(2));
    waterUptake = Math.round(10 + r * 10);
    health = 100;
    rootColor = "#f8fafc";
    failureStage = 1;
    plantEffect = "Normal germination using seed reserves under continuous flow.";
  } else if (t <= 9) {
    // Phase 2: Healthy Establishment (Days 4 to 9)
    const r = (t - 3) / 6;
    phaseName = "Healthy Establishment";
    stage = "Seedling";
    pumpRunning = true; pumpSpeed = 100; flowRate = 1.5;
    waterVol = parseFloat((49.0 - r * 3.0).toFixed(1));
    ec = parseFloat((0.80 + r * 0.35).toFixed(2));
    tds = Math.round(ec * 640);
    pH = 6.05;
    doVal = 8.0;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 70;
    ledIntensity = Math.round(180 + r * 50);

    n = Math.round(45 + r * 45);
    p = Math.round(22 + r * 4);
    k = Math.round(70 + r * 65);
    ca = Math.round(30 + r * 25);
    mg = Math.round(12 + r * 5);
    s = Math.round(15 + r * 7);
    fe = 0.8;

    height = parseFloat((1.2 + r * 5.8).toFixed(1));
    rootLength = parseFloat((1.5 + r * 6.5).toFixed(1));
    leafCount = Math.round(1 + r * 3);
    freshBiomass = parseFloat((0.15 + r * 19.85).toFixed(1));
    waterUptake = Math.round(20 + r * 30);
    health = 100;
    rootColor = "#f8fafc";
    failureStage = 1;
    plantEffect = "Continuous NFT circulation. Rapid root branching and leaf expansion.";
  } else if (t <= 13) {
    // Failure Event & Phase 3: Early Root Oxygen Stress (Days 10 to 13)
    const r = (t - 9) / 4;
    phaseName = t < 10.5 ? "PUMP FAILURE DETECTED (Day 10)" : "Early Root Oxygen Stress";
    stage = "Vegetative";
    pumpRunning = false; pumpSpeed = 0; flowRate = 0.0;
    waterVol = 46.0;
    ec = 1.20;
    tds = 768;
    pH = parseFloat((6.05 + r * 0.15).toFixed(2));
    doVal = parseFloat((8.0 - r * 1.8).toFixed(1)); // 8.0 -> 6.2 mg/L
    waterTemp = 22.5;
    airTemp = 23.5;
    humidity = 68;
    ledIntensity = 250;

    n = Math.round(90 - r * 10);
    p = Math.round(26 - r * 2);
    k = Math.round(135 - r * 15);
    ca = Math.round(55 - r * 5);
    mg = 17; s = 22; fe = 0.7;

    height = parseFloat((7.0 + r * 3.0).toFixed(1));
    rootLength = parseFloat((8.0 + r * 4.0).toFixed(1));
    leafCount = Math.round(4 + r * 2);
    freshBiomass = parseFloat((20.0 + r * 15.0).toFixed(1));
    waterUptake = Math.round(50 - r * 20);
    health = Math.round(100 - r * 8); // 92%
    growthRate = 1.30;
    rootColor = "#fef08a";
    failureStage = 1;
    plantEffect = "PUMP FAILED: Circulation stopped. Water flow 0 L/min. Early root oxygen depletion.";
  } else if (t <= 18) {
    // Phase 4: Progressive Wilting & Anoxia (Days 14 to 18)
    const r = (t - 13) / 5;
    phaseName = "Progressive Wilting & Anoxia";
    stage = "Vegetative";
    pumpRunning = false; pumpSpeed = 0; flowRate = 0.0;
    waterVol = 45.0;
    ec = 1.20;
    tds = 768;
    pH = parseFloat((6.20 + r * 0.20).toFixed(2));
    doVal = parseFloat((6.2 - r * 0.7).toFixed(1)); // 6.2 -> 5.5 mg/L
    waterTemp = 24.5;
    airTemp = 24.0;
    humidity = 64;
    ledIntensity = 300;

    n = Math.round(80 - r * 15);
    p = Math.round(24 - r * 3);
    k = Math.round(120 - r * 20);
    ca = Math.round(50 - r * 10);
    mg = 15; s = 20; fe = 0.5;

    height = parseFloat((10.0 + r * 3.0).toFixed(1));
    rootLength = parseFloat((12.0 + r * 2.0).toFixed(1));
    leafCount = Math.round(6 + r * 2);
    freshBiomass = parseFloat((35.0 + r * 20.0).toFixed(1));
    waterUptake = Math.round(30 - r * 15);
    health = Math.round(92 - r * 17); // 75%
    growthRate = 0.70;
    rootColor = "#eab308";
    failureStage = 2;
    plantEffect = "Prolonged oxygen deprivation. Leaves wilt and sag downward; root tips brown.";
  } else if (t <= 24) {
    // Phase 5: Root Rot & Severe Stress (Days 19 to 24)
    const r = (t - 18) / 6;
    phaseName = "Root Rot & Severe Stress";
    stage = "Mature";
    pumpRunning = false; pumpSpeed = 0; flowRate = 0.0;
    waterVol = 44.0;
    ec = 1.20;
    tds = 768;
    pH = parseFloat((6.40 + r * 0.30).toFixed(2));
    doVal = parseFloat((5.5 - r * 1.0).toFixed(1)); // 5.5 -> 4.5 mg/L
    waterTemp = 25.5;
    airTemp = 24.5;
    humidity = 60;
    ledIntensity = 350;

    n = Math.round(65 - r * 20);
    p = Math.round(21 - r * 4);
    k = Math.round(100 - r * 30);
    ca = Math.round(40 - r * 15);
    mg = 12; s = 16; fe = 0.3;

    height = parseFloat((13.0 + r * 2.0).toFixed(1));
    rootLength = 14.0;
    leafCount = Math.round(8 + r * 2);
    freshBiomass = parseFloat((55.0 + r * 17.0).toFixed(1));
    waterUptake = Math.round(15 - r * 10);
    health = Math.round(75 - r * 27); // 48%
    growthRate = 0.20;
    rootColor = "#b45309";
    failureStage = 3;
    plantEffect = "Anaerobic root decomposition. Severe wilting, interveinal chlorosis, and growth arrest.";
  } else if (t <= 28) {
    // Phase 6: Plant Death & Crop Loss (Days 25 to 28)
    const r = Math.min(1.0, (t - 24) / 4);
    phaseName = "Plant Death & Total Crop Loss";
    stage = "Mature";
    pumpRunning = false; pumpSpeed = 0; flowRate = 0.0;
    waterVol = 43.0;
    ec = 1.20;
    tds = 768;
    pH = 6.80;
    doVal = Math.max(0.1, parseFloat((4.5 - r * 1.0).toFixed(1))); // < 4.0 mg/L
    waterTemp = 26.0;
    airTemp = 25.0;
    humidity = 58;
    ledIntensity = 350;

    n = Math.round(45 - r * 25);
    p = Math.round(17 - r * 7);
    k = Math.round(70 - r * 40);
    ca = Math.round(25 - r * 15);
    mg = 9; s = 12; fe = 0.1;

    height = parseFloat((15.0 - r * 3.0).toFixed(1));
    rootLength = 14.0;
    leafCount = Math.max(4, Math.round(10 - r * 4));
    freshBiomass = parseFloat((72.0 + r * 3.0).toFixed(1)); // <80g final weight
    waterUptake = 0;
    health = Math.max(0, Math.round(48 - r * 48)); // 0%
    growthRate = 0.0;
    rootColor = "#3e1c07";
    failureStage = 4;
    plantEffect = "CROP FAILURE: Complete canopy collapse, black rotten roots, and zero marketable yield.";
  } else {
    // Post-28 Day Desiccation
    const r = Math.min(1.0, (t - 28) / 42);
    phaseName = "Channel Desiccation & Decomposition";
    stage = "Decaying";
    pumpRunning = false; pumpSpeed = 0; flowRate = 0.0;
    waterVol = Math.max(5.0, parseFloat((43.0 - r * 38.0).toFixed(1)));
    ec = 1.20; tds = 768; pH = 7.20; doVal = 0.0;
    waterTemp = 27.0; airTemp = 26.0; humidity = 50; ledIntensity = 350;

    n = 10; p = 5; k = 10; ca = 5; mg = 2; s = 3; fe = 0.05;
    height = 8.0; rootLength = 14.0; leafCount = 2; freshBiomass = 15.0; waterUptake = 0;
    health = 0; growthRate = 0.0; rootColor = "#090a0f"; failureStage = 4;
    plantEffect = "Complete plant collapse and channel organic sludge desiccation.";
  }

  return {
    t: parseFloat(t.toFixed(2)),
    phaseName,
    stage,
    health,
    pumpRunning,
    pumpSpeed,
    flowRate,
    waterVol,
    ec,
    tds,
    pH,
    doVal,
    waterTemp,
    airTemp,
    humidity,
    ledIntensity,
    n, p, k, ca, mg, s, fe,
    height,
    rootLength,
    leafCount,
    freshBiomass,
    waterUptake,
    growthRate,
    rootColor,
    failureStage,
    plantEffect,
  };
}
