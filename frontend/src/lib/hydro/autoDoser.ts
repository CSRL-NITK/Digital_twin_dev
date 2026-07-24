/**
 * Closed-Loop Space-Biology Telemetry Engine & Auto-Dose Environmental Controller
 * 
 * Enforces hardcoded daily target baselines by plant growth stage when [Auto-Dose = ON]:
 * - STAGE 1: Germination (Days 0 - 5) -> pH 6.0, EC 0.8 mS/cm (400 PPM), DO 8.5 mg/L
 * - STAGE 2: Early Vegetative (Days 6 - 12) -> pH 5.9, EC 1.3 mS/cm (650 PPM), DO 8.0 mg/L
 * - STAGE 3: Late Vegetative (Days 13 - 22) -> pH 5.8, EC 1.7 mS/cm (850 PPM), DO 7.5 mg/L
 * - STAGE 4: Maturation & Pre-Harvest (Days 23 - 30) -> pH 5.7, EC 1.9 mS/cm (950 PPM), DO 7.0 mg/L
 */

export interface StageTarget {
  stageName: string;
  stageId: number;
  targetPH: number;
  minPH: number;
  maxPH: number;
  targetEC: number;
  totalPPM: number;
  n: number;
  p: number;
  k: number;
  ca: number;
  mg: number;
  micros: number;
  do: number;
}

export interface AutoDoseLogEntry {
  day: number;
  stageName: string;
  preCorrectionDrift: {
    ph: number;
    ec: number;
    totalPPM: number;
    n: number;
    p: number;
    k: number;
    ca: number;
    mg: number;
    micros: number;
    do: number;
    driftReason: string;
  };
  interventions: string[];
  postCorrectionFinal: {
    ph: number;
    ec: number;
    totalPPM: number;
    n: number;
    p: number;
    k: number;
    ca: number;
    mg: number;
    micros: number;
    do: number;
  };
  antiGravityImpact: string;
}

export function getStageTargetForDay(day: number): StageTarget {
  if (day <= 5) {
    return {
      stageName: "STAGE 1: Germination (Days 0 - 5)",
      stageId: 1,
      targetPH: 6.0,
      minPH: 5.8,
      maxPH: 6.2,
      targetEC: 0.8,
      totalPPM: 400,
      n: 50,
      p: 15,
      k: 60,
      ca: 40,
      mg: 20,
      micros: 1.0,
      do: 8.5,
    };
  } else if (day <= 12) {
    return {
      stageName: "STAGE 2: Early Vegetative (Days 6 - 12)",
      stageId: 2,
      targetPH: 5.9,
      minPH: 5.8,
      maxPH: 6.0,
      targetEC: 1.3,
      totalPPM: 650,
      n: 100,
      p: 30,
      k: 120,
      ca: 80,
      mg: 35,
      micros: 2.0,
      do: 8.0,
    };
  } else if (day <= 22) {
    return {
      stageName: "STAGE 3: Late Vegetative (Days 13 - 22)",
      stageId: 3,
      targetPH: 5.8,
      minPH: 5.7,
      maxPH: 5.9,
      targetEC: 1.7,
      totalPPM: 850,
      n: 150,
      p: 45,
      k: 200,
      ca: 120,
      mg: 50,
      micros: 3.0,
      do: 7.5,
    };
  } else {
    return {
      stageName: "STAGE 4: Maturation & Pre-Harvest (Days 23 - 30)",
      stageId: 4,
      targetPH: 5.7,
      minPH: 5.6,
      maxPH: 5.8,
      targetEC: 1.9,
      totalPPM: 950,
      n: 175,
      p: 50,
      k: 230,
      ca: 140,
      mg: 55,
      micros: 3.5,
      do: 7.0,
    };
  }
}

export function executeAutoDoseTelemetry(day: number): AutoDoseLogEntry {
  const target = getStageTargetForDay(day);

  // 1. Calculate pre-correction raw drift based on day and anti-gravity dynamics
  let rawPH = target.targetPH;
  let rawEC = target.targetEC;
  let rawPPM = target.totalPPM;
  let rawDO = target.do;
  let driftReason = "";
  const interventions: string[] = [];
  let antiGravityImpact = "";

  if (day === 0) {
    rawPH = 6.45;
    rawEC = 0.95;
    rawPPM = 475;
    rawDO = 7.6;
    driftReason = "Initial reservoir fill alkaline shift; surface tension micro-layer accumulation raised PPM.";
    interventions.push("+1.8 mL pH Down (Phosphoric Acid)");
    interventions.push("+320 mL RO Water Dilution");
    interventions.push("Engaged Micro-Bubble Aeration Pump (+0.9 mg/L DO)");
    antiGravityImpact = "Prevented osmotic shock and radicle root tip dehydration in zero-g liquid film.";
  } else if (day === 3) {
    rawPH = 6.38;
    rawEC = 0.92;
    rawPPM = 460;
    rawDO = 7.8;
    driftReason = "Sprout anion exchange releasing OH- ions; micro-channel transpiration concentrated salts.";
    interventions.push("+1.5 mL pH Down (Phosphoric Acid)");
    interventions.push("+250 mL RO Water Dilution");
    interventions.push("Micro-Bubble Cavitation Active (+0.7 mg/L DO)");
    antiGravityImpact = "Mitigated surface-tension ion accumulation around young cotyledon root zone.";
  } else if (day === 7) {
    rawPH = 6.52;
    rawEC = 1.58;
    rawPPM = 790;
    rawDO = 6.8;
    driftReason = "Rapid nitrate anion absorption shifted pH to 6.52; microgravity transpiration loss spiked EC to 1.58 mS/cm.";
    interventions.push("+2.6 mL pH Down (Phosphoric Acid)");
    interventions.push("+450 mL RO Fresh Water Injection");
    interventions.push("Engaged Oxygen Cavitation Loop (+1.2 mg/L DO)");
    antiGravityImpact = "Neutralized alkaline drift and prevented early Iron & Manganese precipitation lockout.";
  } else if (day === 14) {
    rawPH = 6.68;
    rawEC = 2.15;
    rawPPM = 1075;
    rawDO = 6.1;
    driftReason = "Late vegetative canopy absorption shifted pH upward; zero-g capillary evaporation caused high salt spike (1075 PPM).";
    interventions.push("+3.8 mL pH Down (Phosphoric Acid)");
    interventions.push("+680 mL RO Fresh Water Dilution");
    interventions.push("+1.2 mL Part A (Cal-Mag Balance)");
    interventions.push("Cavitation Aeration Boosted (+1.4 mg/L DO)");
    antiGravityImpact = "Diluted high-TDS salt spike from zero-g transpiration, preventing tip burn necrosis and hypoxic root suffocation.";
  } else if (day === 21) {
    rawPH = 6.42;
    rawEC = 1.45;
    rawPPM = 725;
    rawDO = 5.9;
    driftReason = "Dense vegetative root mass depleted K and Ca rapidly in anti-gravity boundary layer; DO dropped due to root respiration.";
    interventions.push("+2.1 mL pH Down (Phosphoric Acid)");
    interventions.push("+4.5 mL Stock Part A (Cal-Mag/Iron)");
    interventions.push("+6.2 mL Stock Part B (NPK/Micros)");
    interventions.push("Activated Micro-Bubble Cavitation Pump (+1.6 mg/L DO)");
    antiGravityImpact = "Engaged cavitation aeration to eliminate stagnant boundary layer anoxia and restored missing K/Ca macro balance.";
  } else { // Day 30 or other maturation days
    rawPH = 6.55;
    rawEC = 2.38;
    rawPPM = 1190;
    rawDO = 5.4;
    driftReason = "Pre-harvest canopy fluid uptake caused severe salt concentration spike (1190 PPM); boundary layer stagnant anoxia.";
    interventions.push("+4.2 mL pH Down (Phosphoric Acid)");
    interventions.push("+850 mL RO Fresh Water Dilution");
    interventions.push("+2.0 mL Stock Part A (Fe Chelate)");
    interventions.push("High-Frequency Cavitation Aeration Engaged (+1.6 mg/L DO)");
    antiGravityImpact = "Stabilized high-yield nutrient ratio at 950 PPM; prevented calcium deficiency leaf margin necrosis and root rot in zero-g.";
  }

  // Pre-Correction Raw State
  const rawN = Math.round(target.n * (rawPPM / target.totalPPM));
  const rawP = Math.round(target.p * (rawPPM / target.totalPPM));
  const rawK = Math.round(target.k * (rawPPM / target.totalPPM));
  const rawCa = Math.round(target.ca * (rawPPM / target.totalPPM));
  const rawMg = Math.round(target.mg * (rawPPM / target.totalPPM));
  const rawMicros = parseFloat((target.micros * (rawPPM / target.totalPPM)).toFixed(2));

  return {
    day,
    stageName: target.stageName,
    preCorrectionDrift: {
      ph: rawPH,
      ec: rawEC,
      totalPPM: rawPPM,
      n: rawN,
      p: rawP,
      k: rawK,
      ca: rawCa,
      mg: rawMg,
      micros: rawMicros,
      do: rawDO,
      driftReason,
    },
    interventions,
    postCorrectionFinal: {
      ph: target.targetPH,
      ec: target.targetEC,
      totalPPM: target.totalPPM,
      n: target.n,
      p: target.p,
      k: target.k,
      ca: target.ca,
      mg: target.mg,
      micros: target.micros,
      do: target.do,
    },
    antiGravityImpact,
  };
}
