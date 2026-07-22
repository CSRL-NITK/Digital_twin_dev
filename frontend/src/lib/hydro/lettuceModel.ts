import type { LettuceEnvironmentalStats, NutrientSolution, ReservoirStats } from "../../types";

/**
 * Lettuce (Lactuca sativa) hydroponic reference recipe.
 *
 * Elemental targets (ppm) are direct from the supplied specification.
 * Dry-salt and liquid-additive dosages were supplied in per-100-gallons /
 * per-gallon units and have been converted to per-100L (÷ 3.78541) so they
 * match the unit labels shown in the UI.
 *
 * Dose-range midpoints are used where a range was given (e.g. 1–3 → 2,
 * then ÷ 3.78541 → ~5.3 mL/100L for Phosphoric Acid).
 */
export const LETTUCE_REFERENCE_RECIPE: NutrientSolution = {
  // ── Macronutrients (ppm) ──────────────────────────────────────────────────
  nitrogen:   150,
  calcium:     90,
  potassium:  210,
  phosphorus:  31,
  magnesium:   24,
  sulfur:      32,

  // ── Micronutrients (ppm) ─────────────────────────────────────────────────
  iron:        1.000,
  manganese:   0.250,
  zinc:        0.130,
  boron:       0.160,
  copper:      0.023,
  molybdenum:  0.024,
  chlorine:    4.900, // target "under 5.0 ppm"

  // ── Dry Salt Fertilizers (g/100L) ─────────────────────────────────────────
  // Source values in g/100 US gallons ÷ 3.78541 = g/100L
  calciumNitrate:          22.7,   // 86.0  g / 100 gal
  potassiumNitrate:        11.9,   // 45.0  g / 100 gal
  monoammoniumPhosphate:    3.0,   // 11.5  g / 100 gal
  epsomSalts:               6.5,   // 24.5  g / 100 gal
  ironChelate:              1.0,   //  3.8  g / 100 gal
  traceMicronutrientBlend:  0.5,   //  2.0  g / 100 gal

  // ── Liquid Additives & Biologicals (mL/100L) ──────────────────────────────
  // pH-adjustment acids: midpoint of range ÷ 37.8541 (mL/10 gal → mL/100L)
  phosphoricAcid:    5.3,   // 1–3 mL / 10 gal  → mid 2 mL → 5.3 mL/100L
  nitricAcid:        4.0,   // 1–2 mL / 10 gal  → mid 1.5 → 4.0 mL/100L
  potassiumHydroxide: 4.0,  // 1–2 mL / 10 gal  → mid 1.5 → 4.0 mL/100L
  // Biologicals: midpoint ÷ 3.78541 (mL/gallon → mL/100L ×26.42)
  bacillusAmyloliquefaciens: 19.8, // 0.5–1.0 mL/gal → mid 0.75 mL/gal
  hypochlorousAcid:          39.6, // 1.0–2.0 mL/gal → mid 1.5  mL/gal
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export type LettuceModelAssessment = {
  solutionStrength: number;
  growthFactor: number;
  qualityFactor: number;
  antioxidantFactor: number;
  recommendation: string;
  mode: "Yield focus" | "Quality focus" | "Stress risk";
};

export function assessLettuceConditions(
  environment: LettuceEnvironmentalStats,
  reservoir: ReservoirStats,
): LettuceModelAssessment {
  // 3/4 strength in the paper is represented by 1.4 mS/cm in this interface.
  const strength = clamp(reservoir.ec / 1.87, 0, 1.2);
  const ppfd = environment.ledIntensity;
  const lightForYield = Math.exp(-Math.pow((ppfd - 350) / 125, 2));
  const nutrientForYield = Math.exp(-Math.pow((strength - 0.75) / 0.28, 2));
  const lightForAntioxidants = Math.exp(-Math.pow((ppfd - 350) / 105, 2));
  const nutrientForAntioxidants = Math.exp(-Math.pow((strength - 0.25) / 0.20, 2));
  const highLightPenalty = ppfd > 400 ? clamp((ppfd - 400) / 120) : 0;

  const climateFactor =
    Math.exp(-Math.pow((environment.airTemp - 23.5) / 8, 2)) *
    Math.exp(-Math.pow((environment.waterTemp - 21) / 5, 2)) *
    clamp(environment.humidity / 50, 0.55, 1) *
    clamp(environment.flowRate / 1.0, 0, 1);
  const chemistryFactor =
    Math.exp(-Math.pow((reservoir.pH - 6.0) / 0.8, 2)) *
    clamp(1 - Math.max(0, reservoir.ec - 2.0) / 1.2, 0.35, 1);

  const growthFactor = clamp((0.35 + 0.65 * lightForYield * nutrientForYield) * climateFactor * chemistryFactor * (1 - highLightPenalty));
  const antioxidantFactor = clamp(0.35 + 0.65 * lightForAntioxidants * nutrientForAntioxidants);
  const qualityFactor = clamp(0.45 * growthFactor + 0.55 * antioxidantFactor);

  if (ppfd >= 320 && ppfd <= 380 && strength >= 0.62 && strength <= 0.88) {
    return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Yield focus", recommendation: "Yield zone: 350 PPFD with about 3/4-strength solution supports the strongest biomass response." };
  }
  if (ppfd >= 300 && ppfd <= 380 && strength >= 0.15 && strength <= 0.38) {
    return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Quality focus", recommendation: "Quality zone: 350 PPFD with about 1/4-strength solution favours antioxidant accumulation, with a yield trade-off." };
  }
  if (ppfd > 400) {
    return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Stress risk", recommendation: "High-light risk: the reference study observed reduced lettuce biomass at 450 PPFD." };
  }
  return { solutionStrength: strength, growthFactor, qualityFactor, antioxidantFactor, mode: "Yield focus", recommendation: "Move toward 350 PPFD and 3/4-strength solution for yield, or 1/4 strength for antioxidant quality." };
}
