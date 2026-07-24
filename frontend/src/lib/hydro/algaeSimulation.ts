/**
 * Algae Bloom 28-Day Hydroponic Research Simulation Engine
 * 
 * Synthesized from controlled-environment NFT research specification (Algae.docx)
 * for Green Coral Lettuce (L. sativa).
 * 
 * Simulates algal life cycle progression from initial colonization through peak bloom,
 * senescence, and die-off sludge formation:
 * - Day 0-3: Clean system, crystal clear water, DO 8.3 mg/L.
 * - Day 4-7: Spore attachment & faint edge biofilm.
 * - Day 8-13: Exponential bloom, green patches in channels, DO 7.4 mg/L.
 * - Day 14-18: Peak bloom, dense mats & cloudy water, DO 6.5 mg/L.
 * - Day 19-24: Colony senescence & bacterial BOD, DO 5.8 mg/L.
 * - Day 25-28: Cell death & sludge accumulation. Harvest weight reaches ~170g (62% health).
 */

export interface AlgaeBloomState {
  t: number;                           // Day (0 to 70)
  phaseName: string;                  // Research Phase Name
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying";
  health: number;                     // Health Index (0 to 100%)
  algaeDensity: number;               // 0.0 to 1.0
  
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
  turbidity: number;                  // NTU
  
  // Solutes (ppm)
  n: number;
  p: number;
  k: number;
  ca: number;
  mg: number;
  s: number;
  fe: number;
  
  // Morphology & Growth
  height: number;                     // cm
  rootLength: number;                 // cm
  leafCount: number;                  // count
  freshBiomass: number;               // grams
  waterUptake: number;                // mL/day
  growthRate: number;                 // % daily growth rate
  growthPotential: number;            // 0.0 to 1.0
  rootColor: string;                  // hex
  plantEffect: string;                // Visual description
}

export function getAlgaeBloomState(age: number): AlgaeBloomState {
  const t = Math.max(0, age);

  let phaseName = "Clean System";
  let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying" = "Germination";
  let health = 100;
  let algaeDensity = 0.0;
  
  let waterVol = 50.0;
  let ec = 0.70;
  let tds = 450;
  let pH = 6.00;
  let doVal = 8.3;
  let waterTemp = 20.5;
  let airTemp = 22.5;
  let humidity = 72;
  let ledIntensity = 135;
  let lux = 8000;
  let turbidity = 2.0;

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
  let growthPotential = 1.0;
  let rootColor = "#f8fafc";
  let plantEffect = "Clean reservoir and NFT channels. Germination optimal with bright white roots.";

  if (t <= 3) {
    // Phase 1: Clean System (Days 0 to 3)
    const r = t / 3;
    phaseName = "Clean System";
    stage = "Germination";
    algaeDensity = 0.0;
    waterVol = parseFloat((50.0 - r * 1.0).toFixed(1));
    ec = parseFloat((0.60 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = parseFloat((8.3 - r * 0.1).toFixed(1));
    waterTemp = 20.5;
    airTemp = 22.5;
    humidity = 72;
    ledIntensity = Math.round(120 + r * 30);
    lux = Math.round(7000 + r * 2000);
    turbidity = 2.0;

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
    growthPotential = 1.0;
    rootColor = "#f8fafc";
    plantEffect = "Clean reservoir and NFT channels. Germination optimal with bright white roots.";
  } else if (t <= 7) {
    // Phase 2: Initial Colonization (Days 4 to 7)
    const r = (t - 3) / 4;
    phaseName = "Initial Colonization";
    stage = "Seedling";
    algaeDensity = parseFloat((r * 0.15).toFixed(2));
    waterVol = parseFloat((49.0 - r * 3.0).toFixed(1));
    ec = parseFloat((0.80 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    pH = parseFloat((6.00 + r * 0.10).toFixed(2));
    doVal = 8.0;
    waterTemp = 21.5;
    airTemp = 23.0;
    humidity = 70;
    ledIntensity = Math.round(180 + r * 40);
    lux = Math.round(10000 + r * 3000);
    turbidity = parseFloat((2.0 + r * 3.0).toFixed(1));

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
    growthPotential = 0.98;
    rootColor = "#f8fafc";
    plantEffect = "Faint transparent-green biofilm forms near channel edges exposed to light.";
  } else if (t <= 13) {
    // Phase 3: Early Bloom (Days 8 to 13)
    const r = (t - 7) / 6;
    phaseName = "Early Bloom";
    stage = "Vegetative";
    algaeDensity = parseFloat((0.15 + r * 0.35).toFixed(2));
    waterVol = parseFloat((46.0 - r * 7.0).toFixed(1));
    ec = parseFloat((1.00 + r * 0.25).toFixed(2));
    tds = Math.round(ec * 640);
    pH = parseFloat((6.10 + r * 0.20).toFixed(2));
    doVal = parseFloat((8.0 - r * 0.6).toFixed(1));
    waterTemp = 22.5;
    airTemp = 23.5;
    humidity = 68;
    ledIntensity = Math.round(250 + r * 50);
    lux = Math.round(14000 + r * 3000);
    turbidity = parseFloat((5.0 + r * 15.0).toFixed(1));

    n = Math.round(78 + r * 22);
    p = Math.round(25 + r * 2);
    k = Math.round(118 + r * 25);
    ca = Math.round(49 + r * 15);
    mg = Math.round(15.8 + r * 2.0);
    s = Math.round(20 + r * 6);
    fe = 0.9;

    height = parseFloat((4.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((5.0 + r * 7.0).toFixed(1));
    leafCount = Math.round(2 + r * 3);
    freshBiomass = parseFloat((2.0 + r * 20.0).toFixed(1));
    waterUptake = Math.round(40 + r * 40);
    health = Math.round(100 - r * 4); // 96%
    growthPotential = 0.92;
    rootColor = "#fef08a";
    plantEffect = "Biofilm thickens into green patches. Algae photo-respiration competes for N, P and Fe.";
  } else if (t <= 18) {
    // Phase 4: Peak Bloom (Days 14 to 18)
    const r = (t - 13) / 5;
    phaseName = "Peak Bloom";
    stage = "Vegetative";
    algaeDensity = parseFloat((0.50 + r * 0.40).toFixed(2));
    waterVol = parseFloat((39.0 - r * 9.0).toFixed(1));
    ec = parseFloat((1.25 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    pH = parseFloat((6.30 + r * 0.30).toFixed(2));
    doVal = parseFloat((7.4 - r * 0.9).toFixed(1));
    waterTemp = 24.0;
    airTemp = 24.0;
    humidity = 64;
    ledIntensity = Math.round(300 + r * 50);
    lux = Math.round(17000 + r * 2000);
    turbidity = parseFloat((20.0 + r * 40.0).toFixed(1));

    n = Math.round(100 - r * 15);
    p = Math.round(27 - r * 3);
    k = Math.round(143 - r * 20);
    ca = Math.round(64 - r * 8);
    mg = Math.round(17.8 - r * 1.0);
    s = Math.round(26 - r * 2);
    fe = 0.75;

    height = parseFloat((10.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((12.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(5 + r * 4);
    freshBiomass = parseFloat((22.0 + r * 48.0).toFixed(1));
    waterUptake = Math.round(80 + r * 70);
    health = Math.round(96 - r * 8); // 88%
    growthRate = 1.35;
    growthPotential = 0.80;
    rootColor = "#eab308";
    plantEffect = "Dense green mats reduce clarity. Root surfaces partially coated, restricting oxygen transfer.";
  } else if (t <= 24) {
    // Phase 5: Mature Bloom & Decline (Days 19 to 24)
    const r = (t - 18) / 6;
    phaseName = "Mature Bloom & Decline";
    stage = "Mature";
    algaeDensity = parseFloat((0.90 - r * 0.30).toFixed(2));
    waterVol = parseFloat((30.0 - r * 12.5).toFixed(1));
    ec = parseFloat((1.45 + r * 0.15).toFixed(2));
    tds = Math.round(ec * 640);
    pH = parseFloat((6.60 + r * 0.20).toFixed(2));
    doVal = parseFloat((6.5 - r * 0.7).toFixed(1));
    waterTemp = 25.0;
    airTemp = 24.5;
    humidity = 60;
    ledIntensity = 350;
    lux = 18900;
    turbidity = parseFloat((60.0 + r * 25.0).toFixed(1));

    n = Math.round(85 - r * 20);
    p = Math.round(24 - r * 4);
    k = Math.round(123 - r * 30);
    ca = Math.round(56 - r * 11);
    mg = Math.round(16.8 - r * 2.0);
    s = Math.round(24 - r * 4);
    fe = 0.65;

    height = parseFloat((16.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((15.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(9 + r * 5);
    freshBiomass = parseFloat((70.0 + r * 60.0).toFixed(1));
    waterUptake = Math.round(150 + r * 100);
    health = Math.round(88 - r * 16); // 72%
    growthRate = 1.05;
    growthPotential = 0.65;
    rootColor = "#ca8a04";
    plantEffect = "Nutrient limitation initiates algal senescence. Dark green patches mixed with brown decaying algae.";
  } else if (t <= 28) {
    // Phase 6: Algae Die-Off & Sludge (Days 25 to 28)
    const r = Math.min(1.0, (t - 24) / 4);
    phaseName = "Algae Die-Off & Sludge";
    stage = "Mature";
    algaeDensity = parseFloat((0.60 - r * 0.35).toFixed(2));
    waterVol = parseFloat((17.5 - r * 10.0).toFixed(1));
    ec = 1.60;
    tds = 1024;
    pH = parseFloat((6.80 + r * 0.20).toFixed(2));
    doVal = parseFloat((5.8 - r * 0.6).toFixed(1));
    waterTemp = 26.0;
    airTemp = 25.0;
    humidity = 58;
    ledIntensity = 350;
    lux = 18900;
    turbidity = parseFloat((85.0 + r * 35.0).toFixed(1));

    n = Math.round(65 + r * 35); // Organic N re-mineralization from cell breakdown
    p = Math.round(20 + r * 5);
    k = Math.round(93 + r * 20);
    ca = Math.round(45 + r * 5);
    mg = Math.round(14.8 + r * 2);
    s = Math.round(20 + r * 2);
    fe = 0.55;

    height = parseFloat((22.0 + r * 3.0).toFixed(1));
    rootLength = parseFloat((18.0 + r * 1.0).toFixed(1));
    leafCount = Math.round(14 + r * 2);
    freshBiomass = parseFloat((130.0 + r * 40.0).toFixed(1)); // 170g final yield
    waterUptake = Math.round(250 + r * 50);
    health = Math.round(72 - r * 10); // 62%
    growthRate = 0.50;
    growthPotential = 0.45;
    rootColor = "#a16207";
    plantEffect = "Algae die-off & organic sludge formation. Dissolved N re-mineralizes, but harvest yield is downgraded.";
  } else {
    // Post-28 Day Advanced Algae Collapse (Days 29 to 70)
    const r = Math.min(1.0, (t - 28) / 42);
    phaseName = "Plant Necrosis & Algae Crash";
    stage = "Decaying";
    algaeDensity = Math.max(0.05, parseFloat((0.25 - r * 0.20).toFixed(2)));
    waterVol = Math.max(1.0, parseFloat((7.5 - r * 6.5).toFixed(1)));
    ec = parseFloat((1.60 + r * 0.80).toFixed(2));
    tds = Math.round(ec * 640);
    pH = parseFloat((7.00 + r * 1.20).toFixed(2));
    doVal = Math.max(0.1, parseFloat((5.2 - r * 5.1).toFixed(1)));
    waterTemp = 27.0;
    airTemp = 26.0;
    humidity = 50;
    turbidity = Math.min(150.0, parseFloat((120.0 + r * 30.0).toFixed(1)));

    n = Math.max(10, Math.round(100 - r * 80));
    p = Math.max(3, Math.round(25 - r * 20));
    k = Math.max(5, Math.round(113 - r * 90));
    ca = Math.max(5, Math.round(50 - r * 40));
    mg = Math.max(2, Math.round(16.8 - r * 13));
    s = Math.max(3, Math.round(22 - r * 18));
    fe = 0.20;

    height = parseFloat((25.0 - r * 8.0).toFixed(1));
    rootLength = 19.0;
    leafCount = Math.max(6, Math.round(16 - r * 10));
    freshBiomass = Math.max(20.0, parseFloat((170.0 - r * 150.0).toFixed(1)));
    waterUptake = Math.max(0, Math.round(300 - r * 300));
    health = Math.max(0, Math.round(62 - r * 62));
    growthRate = 0.0;
    growthPotential = 0.0;
    rootColor = "#451a03";
    plantEffect = "Severe root necrosis and total algae collapse. Deep microbial decomposition.";
  }

  return {
    t: parseFloat(t.toFixed(2)),
    phaseName,
    stage,
    health,
    algaeDensity,
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
    turbidity,
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
    growthPotential,
    rootColor,
    plantEffect,
  };
}
