/**
 * Tipburn Risk 28-Day Hydroponic Research Simulation Engine
 * 
 * Synthesized from controlled-environment NFT research specification (Tip_Burn.docx)
 * for Green Coral Lettuce (L. sativa).
 * 
 * Simulates physiological tipburn caused by excessive artificial light intensity (380 PPFD):
 * - Solution has adequate Calcium (90 ppm), but high PPFD drives growth faster than xylem
 *   transpires Ca into rapidly expanding inner leaf tips.
 * - Day 0-3: Normal Germination (150 PPFD, 100% health).
 * - Day 4-7: Vigorous Seedling expansion under 350 PPFD (100% health).
 * - Day 8-13: Accelerated growth under 380 PPFD (98% health, slight cupping).
 * - Day 14-18: Early Tip Burn (90% health, inner leaf margin lesions).
 * - Day 19-24: Moderate Tip Burn (75% health, 135g weight).
 * - Day 25-28: Severe Tip Burn Disorder (65% health, 185g final yield, inner head damaged).
 */

export interface TipburnState {
  t: number;                           // Day (0 to 70)
  phaseName: string;                  // Research Phase Name
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying";
  health: number;                     // Health Index (0 to 100%)
  tipburnSeverity: number;            // 0.0 to 1.0
  
  // Reservoir Chemistry & Environment
  ec: number;                         // mS/cm
  tds: number;                        // ppm
  pH: number;                         // Reservoir pH
  doVal: number;                      // Dissolved Oxygen (mg/L)
  waterTemp: number;                  // °C
  airTemp: number;                    // °C
  humidity: number;                   // %
  ledIntensity: number;               // PPFD (380 µmol/m²/s)
  lux: number;                        // Lux
  
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
  plantEffect: string;                // Visual description
}

export function getTipburnState(age: number): TipburnState {
  const t = Math.max(0, age);

  let phaseName = "Normal Germination";
  let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" | "Decaying" = "Germination";
  let health = 100;
  let tipburnSeverity = 0.0;
  
  let ec = 0.70;
  let tds = 450;
  let pH = 6.00;
  let doVal = 8.3;
  let waterTemp = 20.5;
  let airTemp = 22.5;
  let humidity = 72;
  let ledIntensity = 150;
  let lux = 8500;

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
  let plantEffect = "Normal germination using seed reserves under modest 150 PPFD light.";

  if (t <= 3) {
    // Phase 1: Normal Germination (Days 0 to 3)
    const r = t / 3;
    phaseName = "Normal Germination";
    stage = "Germination";
    ledIntensity = Math.round(120 + r * 30);
    lux = Math.round(7000 + r * 1500);
    ec = parseFloat((0.60 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = 8.3;
    waterTemp = 20.5;
    airTemp = 22.5;
    humidity = 72;

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
    tipburnSeverity = 0.0;
    plantEffect = "Normal germination using seed reserves under modest 150 PPFD light.";
  } else if (t <= 7) {
    // Phase 2: Healthy Seedling (Days 4 to 7)
    const r = (t - 3) / 4;
    phaseName = "Healthy Seedling";
    stage = "Seedling";
    ledIntensity = Math.round(180 + r * 170); // Ramps up to 350 PPFD
    lux = Math.round(10000 + r * 8900);
    ec = parseFloat((0.80 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    pH = 6.00;
    doVal = 8.0;
    waterTemp = 21.5;
    airTemp = 23.5;
    humidity = 68;

    n = Math.round(45 + r * 35);
    p = Math.round(22 + r * 4);
    k = Math.round(70 + r * 50);
    ca = Math.round(30 + r * 20);
    mg = Math.round(12 + r * 4);
    s = Math.round(15 + r * 5);
    fe = 0.8;

    height = parseFloat((1.2 + r * 2.8).toFixed(1));
    rootLength = parseFloat((1.5 + r * 3.5).toFixed(1));
    leafCount = Math.round(1 + r * 2);
    freshBiomass = parseFloat((0.15 + r * 1.85).toFixed(2));
    waterUptake = Math.round(20 + r * 20);
    health = 100;
    tipburnSeverity = 0.0;
    plantEffect = "High LED intensity (350 PPFD) drives rapid photosynthesis. No damage visible yet.";
  } else if (t <= 13) {
    // Phase 3: Accelerated Vegetative Growth (Days 8 to 13)
    const r = (t - 7) / 6;
    phaseName = "Accelerated Vegetative Growth";
    stage = "Vegetative";
    ledIntensity = 380;
    lux = 20520;
    ec = parseFloat((1.00 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    pH = 6.00;
    doVal = 8.0;
    waterTemp = 22.0;
    airTemp = 24.5;
    humidity = 64;

    n = Math.round(80 + r * 40);
    p = Math.round(26 + r * 4);
    k = Math.round(120 + r * 60);
    ca = Math.round(50 + r * 25);
    mg = Math.round(16 + r * 6);
    s = Math.round(20 + r * 8);
    fe = 1.0;

    height = parseFloat((4.0 + r * 8.0).toFixed(1));
    rootLength = parseFloat((5.0 + r * 10.0).toFixed(1));
    leafCount = Math.round(3 + r * 3);
    freshBiomass = parseFloat((2.0 + r * 23.0).toFixed(1));
    waterUptake = Math.round(40 + r * 60);
    health = Math.round(100 - r * 2); // 98%
    growthRate = 1.90;
    tipburnSeverity = parseFloat((r * 0.10).toFixed(2));
    plantEffect = "Continuous high PPFD drives rapid growth. Calcium demand rises faster than xylem transport.";
  } else if (t <= 18) {
    // Phase 4: Early Tip Burn (Days 14 to 18)
    const r = (t - 13) / 5;
    phaseName = "Early Tip Burn";
    stage = "Vegetative";
    ledIntensity = 380;
    lux = 20520;
    ec = parseFloat((1.20 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    pH = 6.00;
    doVal = 8.0;
    waterTemp = 23.0;
    airTemp = 25.0;
    humidity = 60;

    n = Math.round(120 + r * 25);
    p = 30;
    k = Math.round(180 + r * 25);
    ca = Math.round(75 + r * 13);
    mg = 22; s = 28; fe = 1.0;

    height = parseFloat((12.0 + r * 10.0).toFixed(1));
    rootLength = parseFloat((15.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(6 + r * 5);
    freshBiomass = parseFloat((25.0 + r * 50.0).toFixed(1));
    waterUptake = Math.round(100 + r * 100);
    health = Math.round(98 - r * 8); // 90%
    growthRate = 1.60;
    tipburnSeverity = parseFloat((0.10 + r * 0.35).toFixed(2));
    plantEffect = "Inner expanding leaves develop tiny brown necrotic lesions on margins due to Ca deficit.";
  } else if (t <= 24) {
    // Phase 5: Moderate Tip Burn (Days 19 to 24)
    const r = (t - 18) / 6;
    phaseName = "Moderate Tip Burn";
    stage = "Mature";
    ledIntensity = 380;
    lux = 20520;
    ec = 1.40;
    tds = 900;
    pH = 6.00;
    doVal = 8.0;
    waterTemp = 23.5;
    airTemp = 25.0;
    humidity = 58;

    n = 150; p = 31; k = 210; ca = 90; mg = 24; s = 32; fe = 1.0;

    height = parseFloat((22.0 + r * 5.0).toFixed(1));
    rootLength = parseFloat((18.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(11 + r * 5);
    freshBiomass = parseFloat((75.0 + r * 60.0).toFixed(1));
    waterUptake = Math.round(200 + r * 100);
    health = Math.round(90 - r * 15); // 75%
    growthRate = 1.20;
    tipburnSeverity = parseFloat((0.45 + r * 0.35).toFixed(2));
    plantEffect = "Newly emerging leaves develop larger necrotic brown margins. Inner canopy expansion restricted.";
  } else if (t <= 28) {
    // Phase 6: Severe Physiological Disorder (Days 25 to 28)
    const r = Math.min(1.0, (t - 24) / 4);
    phaseName = "Severe Tip Burn Disorder";
    stage = "Mature";
    ledIntensity = 380;
    lux = 20520;
    ec = 1.40;
    tds = 900;
    pH = 6.00;
    doVal = 8.0;
    waterTemp = 24.0;
    airTemp = 25.0;
    humidity = 58;

    n = 150; p = 31; k = 210; ca = 90; mg = 24; s = 32; fe = 1.0;

    height = parseFloat((27.0 + r * 3.0).toFixed(1));
    rootLength = parseFloat((21.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(16 + r * 4);
    freshBiomass = parseFloat((135.0 + r * 50.0).toFixed(1)); // 185g final yield
    waterUptake = Math.round(300 + r * 50);
    health = Math.round(75 - r * 10); // 65%
    growthRate = 0.80;
    tipburnSeverity = 1.00;
    plantEffect = "MARKET VALUE DOWNGRADED: Inner head exhibits extensive tipburn. Outer leaves remain green.";
  } else {
    // Post-28 Day
    const r = Math.min(1.0, (t - 28) / 42);
    phaseName = "Over-Mature Head Necrosis";
    stage = "Decaying";
    ledIntensity = 380; lux = 20520; ec = 1.40; tds = 900; pH = 6.00; doVal = 7.5;
    n = 150; p = 31; k = 210; ca = 90; mg = 24; s = 32; fe = 0.8;

    height = 30.0; rootLength = 24.0; leafCount = 20; freshBiomass = 185.0; waterUptake = 200;
    health = Math.max(10, Math.round(65 - r * 55)); growthRate = 0.0; tipburnSeverity = 1.00;
    plantEffect = "Permanent inner head tipburn necrosis and over-mature leaf breakdown.";
  }

  return {
    t: parseFloat(t.toFixed(2)),
    phaseName,
    stage,
    health,
    tipburnSeverity,
    ec,
    tds,
    pH,
    doVal,
    waterTemp,
    airTemp,
    humidity,
    ledIntensity,
    lux,
    n, p, k, ca, mg, s, fe,
    height,
    rootLength,
    leafCount,
    freshBiomass,
    waterUptake,
    growthRate,
    plantEffect,
  };
}
