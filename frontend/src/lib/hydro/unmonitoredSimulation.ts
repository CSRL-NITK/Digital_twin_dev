/**
 * Unmonitored Hydroponic System 28-Day Simulation Engine
 * 
 * Synthesized from controlled-environment NFT research specification (Unmonitored.docx)
 * for Green Coral Lettuce (L. sativa).
 * 
 * Simulates a 50L NFT system initialized on Day 0 and left unmonitored:
 * - Water level drops from 50L to 7.5L (15% left at Day 28).
 * - Solute EC concentrates from 0.7 to 2.5 mS/cm (high salt stress).
 * - pH drifts from 6.00 to 7.10 (alkaline lockout).
 * - Dissolved Nitrogen & Potassium drop by 80%+.
 * - Harvest weight reaches 165g (vs 230g in Normal Growth) with 62% Health.
 */

export interface UnmonitoredState {
  t: number;                           // Day (0 to 70)
  phaseName: string;                  // Research Phase Name
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying";
  health: number;                     // Health Index (0 to 100%)
  
  // Reservoir Chemistry
  waterVol: number;                   // Litres remaining (in 50L tank)
  ec: number;                         // mS/cm
  tds: number;                        // ppm
  pH: number;                         // Reservoir pH
  doVal: number;                      // Dissolved Oxygen (mg/L)
  waterTemp: number;                  // °C
  airTemp: number;                    // °C
  humidity: number;                   // %
  ledIntensity: number;               // PPFD
  lux: number;                        // Lux
  
  // Remaining Nutrient Concentrations (ppm)
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
  rootColor: string;                  // hex or color name
  pythiumRootRot: boolean;
  plantEffect: string;                // Symptom description
}

export function getUnmonitoredState(age: number): UnmonitoredState {
  const t = Math.max(0, age);

  let phaseName = "Healthy Germination";
  let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying" = "Germination";
  let health = 100;
  
  let waterVol = 50.0;
  let ec = 0.70;
  let tds = 450;
  let pH = 6.00;
  let doVal = 8.2;
  let waterTemp = 20.5;
  let airTemp = 22.5;
  let humidity = 72;
  let ledIntensity = 135;
  let lux = 8000;

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
  let pythiumRootRot = false;
  let plantEffect = "Ideal initial solution. Radicle emergence and white root hair development.";

  if (t <= 3) {
    // Phase 1: Healthy Germination (Days 0 to 3)
    const r = t / 3;
    phaseName = "Healthy Germination";
    stage = "Germination";
    waterVol = parseFloat((50.0 - r * 1.0).toFixed(1));
    ec = parseFloat((0.60 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = parseFloat((8.2 - r * 0.2).toFixed(1));
    waterTemp = 20.5;
    airTemp = 22.5;
    humidity = 72;
    ledIntensity = Math.round(120 + r * 30);
    lux = Math.round(7000 + r * 2000);

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
    pythiumRootRot = false;
    plantEffect = "Freshly prepared nutrient solution provides ideal germination conditions.";
  } else if (t <= 7) {
    // Phase 2: Early Growth (Days 4 to 7)
    const r = (t - 3) / 4;
    phaseName = "Early Growth";
    stage = "Seedling";
    waterVol = parseFloat((49.0 - r * 3.0).toFixed(1)); // 46L (92%)
    ec = parseFloat((0.80 + r * 0.20).toFixed(2)); // ~1.0 mS/cm
    tds = Math.round(ec * 640);
    pH = parseFloat((6.00 + r * 0.05).toFixed(2));
    doVal = 8.1;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 70;
    ledIntensity = Math.round(180 + r * 40);
    lux = Math.round(10000 + r * 3000);

    n = Math.round(45 + r * 33);
    p = Math.round(22 + r * 3);
    k = Math.round(70 + r * 48);
    ca = Math.round(30 + r * 19);
    mg = Math.round(12 + r * 3.8);
    s = Math.round(15 + r * 5);
    fe = 0.8;

    height = parseFloat((1.2 + r * 2.8).toFixed(1));
    rootLength = parseFloat((1.5 + r * 3.5).toFixed(1));
    leafCount = Math.round(1 + r * 1);
    freshBiomass = parseFloat((0.15 + r * 1.85).toFixed(2));
    waterUptake = Math.round(20 + r * 20);
    health = 100;
    rootColor = "#f8fafc";
    pythiumRootRot = false;
    plantEffect = "Cotyledons open and first true leaf forms. Water level begins to drop slowly.";
  } else if (t <= 13) {
    // Phase 3: Hidden Nutrient Drift (Days 8 to 13)
    const r = (t - 7) / 6;
    phaseName = "Hidden Nutrient Drift";
    stage = "Vegetative";
    waterVol = parseFloat((46.0 - r * 7.0).toFixed(1)); // 39L (78%)
    ec = parseFloat((1.00 + r * 0.45).toFixed(2)); // 1.45 mS/cm
    tds = Math.round(ec * 640);
    pH = parseFloat((6.05 + r * 0.25).toFixed(2)); // 6.30
    doVal = parseFloat((8.1 - r * 0.5).toFixed(1)); // 7.6 mg/L
    waterTemp = 22.0;
    airTemp = 23.0;
    humidity = 68;
    ledIntensity = Math.round(250 + r * 50);
    lux = Math.round(14000 + r * 3000);

    n = Math.round(78 + r * 24);
    p = Math.round(25 + r * 2);
    k = Math.round(118 + r * 30);
    ca = Math.round(49 + r * 17);
    mg = Math.round(15.8 + r * 2.6);
    s = Math.round(20 + r * 8);
    fe = 0.95;

    height = parseFloat((4.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((5.0 + r * 7.0).toFixed(1));
    leafCount = Math.round(2 + r * 3);
    freshBiomass = parseFloat((2.0 + r * 20.0).toFixed(1));
    waterUptake = Math.round(40 + r * 45);
    health = Math.round(100 - r * 2); // 98%
    rootColor = "#f1f5f9";
    pythiumRootRot = false;
    plantEffect = "Rapid growth increases uptake. Water evaporates and salt concentration begins drifting.";
  } else if (t <= 18) {
    // Phase 4: Stress Development (Days 14 to 18)
    const r = (t - 13) / 5;
    phaseName = "Stress Development";
    stage = "Vegetative";
    waterVol = parseFloat((39.0 - r * 9.0).toFixed(1)); // 30L (60%)
    ec = parseFloat((1.45 + r * 0.25).toFixed(2)); // 1.70 mS/cm
    tds = Math.round(ec * 640);
    pH = parseFloat((6.30 + r * 0.30).toFixed(2)); // 6.60
    doVal = parseFloat((7.6 - r * 0.7).toFixed(1)); // 6.9 mg/L
    waterTemp = 24.0;
    airTemp = 24.0;
    humidity = 64;
    ledIntensity = Math.round(300 + r * 50);
    lux = Math.round(17000 + r * 2000);

    n = Math.round(102 - r * 8); // 94 ppm
    p = Math.round(27 - r * 3);
    k = Math.round(148 - r * 25);
    ca = Math.round(66 - r * 5);
    mg = Math.round(18.4);
    s = Math.round(28 - r * 2);
    fe = 0.85;

    height = parseFloat((10.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((12.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(5 + r * 4);
    freshBiomass = parseFloat((22.0 + r * 58.0).toFixed(1));
    waterUptake = Math.round(85 + r * 115);
    health = Math.round(98 - r * 6); // 92%
    growthRate = 1.45;
    rootColor = "#fef08a";
    pythiumRootRot = false;
    plantEffect = "Water level falls rapidly to 60%. Cream root tips and slight chlorosis develop.";
  } else if (t <= 24) {
    // Phase 5: Visible Deficiencies (Days 19 to 24)
    const r = (t - 18) / 6;
    phaseName = "Visible Deficiencies";
    stage = "Mature";
    waterVol = parseFloat((30.0 - r * 12.5).toFixed(1)); // 17.5L (35%)
    ec = parseFloat((1.70 + r * 0.40).toFixed(2)); // 2.10 mS/cm
    tds = Math.round(ec * 640);
    pH = parseFloat((6.60 + r * 0.30).toFixed(2)); // 6.90
    doVal = parseFloat((6.9 - r * 0.8).toFixed(1)); // 6.1 mg/L
    waterTemp = 25.0;
    airTemp = 24.5;
    humidity = 60;
    ledIntensity = 350;
    lux = 18900;

    n = Math.round(94 - r * 34); // 60 ppm
    p = Math.round(24 - r * 4);
    k = Math.round(123 - r * 50);
    ca = Math.round(61 - r * 21);
    mg = Math.round(18.4 - r * 4.0);
    s = Math.round(26 - r * 4);
    fe = 0.70;

    height = parseFloat((16.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((15.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(9 + r * 5);
    freshBiomass = parseFloat((80.0 + r * 60.0).toFixed(1));
    waterUptake = Math.round(200 + r * 100);
    health = Math.round(92 - r * 14); // 78%
    growthRate = 1.10;
    rootColor = "#eab308";
    pythiumRootRot = false;
    plantEffect = "Tipburn on young leaf edges, older leaf yellowing (N/K depletion), and osmotic salt stress.";
  } else if (t <= 28) {
    // Phase 6: Poor Harvest (Days 25 to 28)
    const r = Math.min(1.0, (t - 24) / 4);
    phaseName = "Poor Harvest";
    stage = "Mature";
    waterVol = parseFloat((17.5 - r * 10.0).toFixed(1)); // 7.5L (15%)
    ec = parseFloat((2.10 + r * 0.40).toFixed(2)); // 2.50 mS/cm
    tds = Math.round(ec * 640);
    pH = parseFloat((6.90 + r * 0.20).toFixed(2)); // 7.10
    doVal = parseFloat((6.1 - r * 0.3).toFixed(1)); // 5.8 mg/L
    waterTemp = 26.0;
    airTemp = 25.0;
    humidity = 58;
    ledIntensity = 350;
    lux = 18900;

    n = Math.round(60 - r * 30); // 30 ppm
    p = Math.round(20 - r * 4.5);
    k = Math.round(73 - r * 41.5);
    ca = Math.round(40 - r * 17.5);
    mg = Math.round(14.4 - r * 3.6);
    s = Math.round(22 - r * 4);
    fe = 0.55;

    height = parseFloat((22.0 + r * 3.0).toFixed(1));
    rootLength = parseFloat((18.0 + r * 1.0).toFixed(1));
    leafCount = Math.round(14 + r * 2);
    freshBiomass = parseFloat((140.0 + r * 25.0).toFixed(1)); // 165g final yield
    waterUptake = Math.round(300 + r * 50);
    health = Math.round(78 - r * 16); // 62%
    growthRate = 0.60;
    rootColor = "#ca8a04";
    pythiumRootRot = false;
    plantEffect = "Downgraded harvest quality: 30% yield loss, tipburn necrosis, nitrogen chlorosis, and alkaline lockout.";
  } else {
    // Post-28 Day Deep Senescence (Days 29 to 70)
    const r = Math.min(1.0, (t - 28) / 42);
    phaseName = "Post-Harvest Senescence & Desiccation";
    stage = "Decaying";
    waterVol = Math.max(1.0, parseFloat((7.5 - r * 6.5).toFixed(1))); // Down to 1.0L
    ec = parseFloat((2.50 + r * 1.50).toFixed(2)); // Up to 4.0 mS/cm
    tds = Math.round(ec * 640);
    pH = parseFloat((7.10 + r * 1.40).toFixed(2)); // Up to 8.50
    doVal = Math.max(0.1, parseFloat((5.8 - r * 5.7).toFixed(1)));
    waterTemp = 27.0;
    airTemp = 26.0;
    humidity = 50;

    n = Math.max(5, Math.round(30 - r * 25));
    p = Math.max(3, Math.round(15.5 - r * 12));
    k = Math.max(5, Math.round(31.5 - r * 26));
    ca = Math.max(5, Math.round(22.5 - r * 17));
    mg = Math.max(2, Math.round(10.8 - r * 8.8));
    s = Math.max(3, Math.round(18 - r * 15));
    fe = 0.20;

    height = parseFloat((25.0 - r * 8.0).toFixed(1));
    rootLength = 19.0;
    leafCount = Math.max(6, Math.round(16 - r * 10));
    freshBiomass = Math.max(20.0, parseFloat((165.0 - r * 145.0).toFixed(1)));
    waterUptake = Math.max(0, Math.round(350 - r * 350));
    health = Math.max(0, Math.round(62 - r * 62));
    growthRate = 0.0;
    rootColor = "#451a03";
    pythiumRootRot = t > 35;
    plantEffect = "Surpassed harvest window. Tissue desiccation, Pythium root rot, and complete plant decay.";
  }

  return {
    t: parseFloat(t.toFixed(2)),
    phaseName,
    stage,
    health,
    waterVol,
    ec,
    tds,
    pH,
    doVal,
    waterTemp,
    airTemp,
    humidity,
    ledIntensity,
    lux,
    n,
    p,
    k,
    ca,
    mg,
    s,
    fe,
    height,
    rootLength,
    leafCount,
    freshBiomass,
    waterUptake,
    growthRate,
    rootColor,
    pythiumRootRot,
    plantEffect,
  };
}
