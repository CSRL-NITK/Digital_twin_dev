/**
 * Normal Growth 28-Day 6-Phase Hydroponic Research Simulation Engine
 * 
 * Synthesized from controlled-environment NFT hydroponic research specifications (normal.docx)
 * for Green Coral Lettuce (L. sativa).
 */

export interface NormalGrowthState {
  t: number;                           // Current day (0 to 28+)
  phaseName: string;                  // Phase Description
  stage: "Germination" | "Seedling" | "Vegetative" | "Mature";
  health: number;                     // Health Index (100%)
  
  // Reservoir Chemistry & Environmental Dynamics
  ec: number;                         // Solute EC (mS/cm)
  tds: number;                        // Total Dissolved Solids (ppm)
  pH: number;                         // Reservoir pH
  doVal: number;                      // Dissolved Oxygen (mg/L)
  waterTemp: number;                  // Water Temp (°C)
  airTemp: number;                    // Air Temp (°C)
  humidity: number;                   // Humidity (%)
  ledIntensity: number;               // PPFD (µmol/m²/s)
  lux: number;                        // Light Intensity (Lux)
  
  // Macronutrients (ppm)
  n: number;
  p: number;
  k: number;
  ca: number;
  mg: number;
  s: number;
  
  // Micronutrients (ppm)
  fe: number;
  mn: number;
  zn: number;
  cu: number;
  b: number;
  mo: number;
  cl: number;
  
  // Crop Morphology & Biometrics
  height: number;                     // cm
  rootLength: number;                 // cm
  leafCount: number;                  // count
  freshBiomass: number;               // grams
  waterUptake: number;                // mL/day
  growthRate: number;                 // % daily growth rate
  plantEffect: string;                // Visual description
}

export function getNormalGrowthState(age: number): NormalGrowthState {
  const t = Math.max(0, age);

  let phaseName = "Germination & Radicle Emergence";
  let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" = "Germination";
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
  let mn = 0.15;
  let zn = 0.05;
  let cu = 0.01;
  let b = 0.12;
  let mo = 0.015;
  let cl = 2.5;

  let height = 0.5;
  let rootLength = 0.8;
  let leafCount = 0;
  let freshBiomass = 0.05;
  let waterUptake = 15;
  let growthRate = 2.1;
  let plantEffect = "Radicle emergence and early seed reserve utilization.";

  if (t <= 3) {
    // Phase 1: Germination & Radicle Emergence (Days 0 to 3)
    const r = t / 3;
    phaseName = "Germination & Radicle Emergence";
    stage = "Germination";
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

    height = parseFloat((0.2 + r * 1.0).toFixed(1));
    rootLength = parseFloat((0.3 + r * 1.2).toFixed(1));
    leafCount = 0;
    freshBiomass = parseFloat((0.02 + r * 0.13).toFixed(2));
    waterUptake = Math.round(10 + r * 10);
    growthRate = 2.1;
    plantEffect = "Radicle emergence and white root hair initiation. Cotyledons remain mostly closed.";
  } else if (t <= 7) {
    // Phase 2: Cotyledon Expansion (Days 4 to 7)
    const r = (t - 3) / 4;
    phaseName = "Cotyledon Expansion";
    stage = "Seedling";
    ec = parseFloat((0.85 + r * 0.15).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = 8.0;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 70;
    ledIntensity = Math.round(180 + r * 40);
    lux = Math.round(10000 + r * 3000);

    n = Math.round(45 + r * 35);
    p = Math.round(22 + r * 4);
    k = Math.round(70 + r * 50);
    ca = Math.round(30 + r * 20);
    mg = Math.round(12 + r * 4);
    s = Math.round(15 + r * 5);
    fe = 0.8; mn = 0.18; zn = 0.07; cu = 0.015; b = 0.14; mo = 0.018; cl = 3.0;

    height = parseFloat((1.2 + r * 2.8).toFixed(1));
    rootLength = parseFloat((1.5 + r * 3.5).toFixed(1));
    leafCount = Math.round(1 + r * 2);
    freshBiomass = parseFloat((0.15 + r * 1.85).toFixed(2));
    waterUptake = Math.round(20 + r * 20);
    growthRate = 1.95;
    plantEffect = "Cotyledons fully open and first true leaf appears. Photosynthetic nutrient uptake initiated.";
  } else if (t <= 13) {
    // Phase 3: Early Vegetative Growth (Days 8 to 13)
    const r = (t - 7) / 6;
    phaseName = "Early Vegetative Growth";
    stage = "Vegetative";
    ec = parseFloat((1.00 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = 8.0;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 68;
    ledIntensity = Math.round(250 + r * 50);
    lux = Math.round(14000 + r * 3000);

    n = Math.round(80 + r * 40);
    p = Math.round(26 + r * 4);
    k = Math.round(120 + r * 60);
    ca = Math.round(50 + r * 25);
    mg = Math.round(16 + r * 6);
    s = Math.round(20 + r * 8);
    fe = 1.0; mn = 0.22; zn = 0.10; cu = 0.020; b = 0.15; mo = 0.020; cl = 4.0;

    height = parseFloat((4.0 + r * 8.0).toFixed(1));
    rootLength = parseFloat((5.0 + r * 10.0).toFixed(1));
    leafCount = Math.round(3 + r * 3);
    freshBiomass = parseFloat((2.0 + r * 28.0).toFixed(1));
    waterUptake = Math.round(40 + r * 80);
    growthRate = 1.80;
    plantEffect = "Rapid leaf initiation with 3–5 true leaves. Dense, bright white root system hanging in channel.";
  } else if (t <= 18) {
    // Phase 4: Rapid Biomass Accumulation (Days 14 to 18)
    const r = (t - 13) / 5;
    phaseName = "Rapid Biomass Accumulation";
    stage = "Vegetative";
    ec = parseFloat((1.20 + r * 0.20).toFixed(2));
    tds = Math.round(ec * 640);
    doVal = 8.0;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 63;
    ledIntensity = Math.round(300 + r * 50);
    lux = Math.round(17000 + r * 2000);

    n = Math.round(120 + r * 25);
    p = Math.round(30 + r * 1);
    k = Math.round(180 + r * 25);
    ca = Math.round(75 + r * 13);
    mg = Math.round(22 + r * 2);
    s = Math.round(28 + r * 4);
    fe = 1.0; mn = 0.24; zn = 0.12; cu = 0.022; b = 0.155; mo = 0.022; cl = 4.5;

    height = parseFloat((12.0 + r * 12.0).toFixed(1));
    rootLength = parseFloat((15.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(6 + r * 6);
    freshBiomass = parseFloat((30.0 + r * 90.0).toFixed(1));
    waterUptake = Math.round(120 + r * 130);
    growthRate = 1.65;
    plantEffect = "Fastest growth period. Overlapping leaves expand quickly into dense rosette canopy.";
  } else if (t <= 24) {
    // Phase 5: Head Formation (Days 19 to 24)
    const r = (t - 18) / 6;
    phaseName = "Head Formation";
    stage = "Mature";
    ec = 1.40;
    tds = 900;
    doVal = 8.0;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 60;
    ledIntensity = 350;
    lux = 18900;

    n = 150; p = 31; k = 210; ca = 90; mg = 24; s = 32;
    fe = 1.0; mn = 0.25; zn = 0.13; cu = 0.023; b = 0.16; mo = 0.024; cl = 4.9;

    height = parseFloat((24.0 + r * 6.0).toFixed(1));
    rootLength = parseFloat((18.0 + r * 3.0).toFixed(1));
    leafCount = Math.round(12 + r * 6);
    freshBiomass = parseFloat((120.0 + r * 60.0).toFixed(1));
    waterUptake = Math.round(250 + r * 100);
    growthRate = 1.25;
    plantEffect = "Prominent leaf curl and compact rosette head formation. Transpiration and potassium uptake peak.";
  } else {
    // Phase 6: Harvest Maturity (Days 25 to 28+)
    const r = Math.min(1.0, (t - 24) / 4);
    phaseName = "Harvest Maturity";
    stage = "Mature";
    ec = 1.40;
    tds = 900;
    doVal = 8.0;
    waterTemp = 21.0;
    airTemp = 23.0;
    humidity = 60;
    ledIntensity = 350;
    lux = 18900;

    n = 150; p = 31; k = 210; ca = 90; mg = 24; s = 32;
    fe = 1.0; mn = 0.25; zn = 0.13; cu = 0.023; b = 0.16; mo = 0.024; cl = 4.9;

    height = parseFloat((30.0 + r * 5.0).toFixed(1));
    rootLength = parseFloat((21.0 + r * 4.0).toFixed(1));
    leafCount = Math.round(18 + r * 6);
    freshBiomass = parseFloat((180.0 + r * 70.0).toFixed(1));
    waterUptake = Math.round(350 + r * 100);
    growthRate = 0.95;
    plantEffect = "Full commercial harvest quality with dense white root network and rich green rosette head.";
  }

  const health = t > 70 ? Math.max(0, Math.round(100 - (t - 70) * 3.8)) : 100;

  return {
    t: parseFloat(t.toFixed(2)),
    phaseName,
    stage,
    health,
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
    mn,
    zn,
    cu,
    b,
    mo,
    cl,
    height,
    rootLength,
    leafCount,
    freshBiomass,
    waterUptake,
    growthRate,
    plantEffect,
  };
}
