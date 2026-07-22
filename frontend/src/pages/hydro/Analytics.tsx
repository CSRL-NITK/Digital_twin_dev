import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Leaf } from "lucide-react";
import ControlsPanel from "../../components/hydro/ControlsPanel";
import PlantVisualizer from "../../components/hydro/PlantVisualizer";
import type { LettuceEnvironmentalStats, ReservoirStats, LettuceMetrics, NutrientSolution } from "../../types";
import { assessLettuceConditions, LETTUCE_REFERENCE_RECIPE } from "../../lib/hydro/lettuceModel";
import { useTheme } from "../../components/ThemeProvider";

function hexToRgba(hex: string, alpha: number = 1): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const getTimelineProgressPercent = (age: number): number => {
  if (age <= 0) return 0;
  if (age <= 5) return (age / 5) * 25;
  if (age <= 14) return 25 + ((age - 5) / (14 - 5)) * 25;
  if (age <= 28) return 50 + ((age - 14) / (28 - 14)) * 25;
  if (age <= 35) return 75 + ((age - 28) / (35 - 28)) * 25;
  return 100;
};

const getBiometricsForAge = (age: number) => {
  if (age <= 5) {
    const ratio = age / 5;
    return {
      leafCount: Math.round(2 + ratio * (6 - 2)),
      rootLength: 1.2 + ratio * (4.1 - 1.2),
    };
  } else if (age <= 14) {
    const ratio = (age - 5) / 9;
    return {
      leafCount: Math.round(6 + ratio * (16 - 6)),
      rootLength: 4.1 + ratio * (10.5 - 4.1),
    };
  } else if (age <= 28) {
    const ratio = (age - 14) / 14;
    return {
      leafCount: Math.round(16 + ratio * (28 - 16)),
      rootLength: 10.5 + ratio * (18.0 - 10.5),
    };
  } else {
    const ratio = Math.min(1.0, (age - 28) / 7);
    return {
      leafCount: Math.round(28 + ratio * (34 - 28)),
      rootLength: 18.0 + ratio * (21.0 - 18.0),
    };
  }
};

export default function Analytics() {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  // Simulation States
  const [scenario, setScenario] = useState<string>("Normal Growth");
  const [activeStatusTab, setActiveStatusTab] = useState<"macro" | "micro" | "fertilizers" | "additives">("macro");
  const [_growthStage, setGrowthStage] = useState<"Germination" | "Seedling" | "Vegetative" | "Mature">("Germination");
  const [cropType, setCropType] = useState<string>("Lettuce");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [realTime, setRealTime] = useState<boolean>(true);
  const [warpFactor, setWarpFactor] = useState<number>(1);
  const [autoCorrect, setAutoCorrect] = useState<boolean>(false);
  const [simMinutes, setSimMinutes] = useState<number>(0);
  const [turbidity, setTurbidity] = useState<number>(4.2);
  const [tankVolume, setTankVolume] = useState<number>(50); // actual tank capacity in litres

  // Accumulators
  const [waterUptake, setWaterUptake] = useState<number>(1.0);
  const [nutrientsFed, setNutrientsFed] = useState<number>(0.0);

  // Core Environmental States
  const [environmentalStats, setEnvironmentalStats] = useState<LettuceEnvironmentalStats>({
    ledIntensity: 350,
    photoperiod: 16,
    pumpSpeed: 100,
    flowRate: 1.5,
    waterTemp: 21.0,
    airTemp: 23.0,
    humidity: 60,
    targetPH: 6.0,
    targetEC: 1.4,
    nutrientDoseAmount: 50,
  });

  // Detailed Macronutrient Solutes State (ppm)
  const [nutrients, setNutrients] = useState<NutrientSolution>({
    ...LETTUCE_REFERENCE_RECIPE,
  });

  // Reservoir States
  const [reservoir, setReservoir] = useState<ReservoirStats>({
    volume: 47.5,          // 95% of 50 L tank
    maxVolume: 50.0,
    ec: 1.4,
    tds: 900,
    pH: 6.00,
    nutrientPercentage: 100,
    waterConsumptionToday: 0.05,
    predictedRefillDays: 24,
    predictedNutrientRefillDays: 30,
  });

  // Biological Metrics States
  const [metrics, setMetrics] = useState<LettuceMetrics>({
    age: 0,
    stage: "Germination",
    height: 0.5,
    leafCount: 2,
    leafAreaIndex: 0.02,
    rootLength: 1.2,
    freshBiomass: 0.1,
    dryBiomass: 0.01,
    estimatedHarvestWeight: 185.0,
    health: 100.0,
    growthRate: 2.1,
    photosynthesisRate: 14.5,
    waterConsumption: 0.05,
    nutrientConsumption: 12.0,
  });



  // Simulation Timeline Log
  const [timeline, setTimeline] = useState<string[]>([
    "[00:00] Simulation initialized for Lettuce (Germination stage).",
    "[00:00] System checks: NFT pump active, LED arrays online.",
    "[00:00] Lactuca sativa physiology synchronized: current health 100%."
  ]);



  const timelineEndRef = useRef<HTMLDivElement>(null);
  const prevHourRef = useRef<number>(0);
  const lastRoutineLogRef = useRef<string>("");

  const renderStatusProgressBar = (
    value: number,
    max: number,
    label: string,
    unit: string,
    minLimit: number,
    target: number,
    maxLimit: number,
    hexColor: string,
  ) => {
    const isDeficient = value < minLimit;
    const isExcessive = value > maxLimit;
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    const baseColor = isDeficient ? "#f59e0b" : isExcessive ? "#ef4444" : hexColor || "#3b82f6";
    const glowColor = hexToRgba(baseColor, 0.85);
    const glowColorSoft = hexToRgba(baseColor, 0.45);
    const trackBg = isDark ? "#070810" : "#e2e8f0";
    const trackBorderColor = hexToRgba(baseColor, isDark ? 0.28 : 0.5);

    return (
      <div className="flex flex-col space-y-1.5 w-full" key={label}>
        {/* Header */}
        <div className={`flex justify-between items-baseline font-mono ${isDark ? "text-slate-300" : "text-slate-800"}`}>
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-wide">{label}</span>
            <span className={`text-[8px] uppercase tracking-widest font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>Current: ppm</span>
          </div>
          <span className={`text-sm font-black tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>
            {value} <span className="text-[10px] font-normal opacity-70">{unit}</span>
          </span>
        </div>

        {/* Volumetric Laser Conduit Track */}
        <div
          className="h-5 rounded-full relative border select-none"
          style={{
            overflow: "visible",
            backgroundColor: trackBg,
            borderColor: trackBorderColor,
            boxShadow: isDark
              ? "inset 0 2px 8px rgba(0,0,0,0.95), inset 0 -1px 2px rgba(0,0,0,0.6)"
              : "inset 0 2px 6px rgba(0,0,0,0.18)",
          }}
        >
          {/* Inner clip container — keeps fill inside track */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {/* Core laser fill beam — teardrop gradient, smooth 400ms ease-out */}
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-[width] ease-out ${
                isDeficient || isExcessive ? "animate-pulse" : ""
              }`}
              style={{
                width: `${percent}%`,
                transitionDuration: "400ms",
                background: `linear-gradient(90deg,
                  ${hexToRgba(baseColor, isDark ? 0.08 : 0.15)} 0%,
                  ${hexToRgba(baseColor, isDark ? 0.35 : 0.55)} 18%,
                  ${hexToRgba(baseColor, isDark ? 0.72 : 0.88)} 55%,
                  ${baseColor} 100%)`,
                boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColorSoft}`,
              }}
            >
              {/* Animated plasma energy wave layer */}
              <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                <svg
                  className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave"
                  viewBox="0 0 1200 32"
                  preserveAspectRatio="none"
                >
                  {/* Upper wave crest ripple */}
                  <path
                    d="M 0 16 Q 100 4, 200 16 T 400 16 T 600 16 T 800 16 T 1000 16 T 1200 16 L 1200 32 L 0 32 Z"
                    fill={isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.35)"}
                  />
                  {/* Bright focal horizon line */}
                  <path
                    d="M 0 16 Q 100 8, 200 16 T 400 16 T 600 16 T 800 16 T 1000 16 T 1200 16"
                    fill="none"
                    stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.9)"}
                    strokeWidth="1.5"
                  />
                  {/* Secondary deeper wave */}
                  <path
                    d="M 0 22 Q 150 14, 300 22 T 600 22 T 900 22 T 1200 22"
                    fill="none"
                    stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)"}
                    strokeWidth="1"
                  />
                </svg>
              </div>

              {/* White-hot focal centerline */}
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none mix-blend-overlay"
                style={{ height: "30%" }}
              >
                <div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Min / Target / Max footer labels */}
        <div className={`flex justify-between text-[9px] uppercase font-mono font-extrabold px-0.5 ${isDark ? "text-slate-600" : "text-slate-500"}`}>
          <span>Min: {minLimit}</span>
          <span>Target: {target}</span>
          <span>Max: {maxLimit}</span>
        </div>
      </div>
    );
  };

  // Auto-scroll timeline logs
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Clock Formatting (e.g. "08:14")
  const formattedClock = useMemo(() => {
    const hours = Math.floor(simMinutes / 60) % 24;
    const mins = simMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }, [simMinutes]);



  // Derive growthStage from metrics or fall back to the state value
  const growthStage = ((metrics.stage ?? _growthStage) as "Germination" | "Seedling" | "Vegetative" | "Mature");

  // Map currentTurbidity to refer directly to turbidity state for seamless UI updates
  const currentTurbidity = turbidity;
  const lettuceAssessment = useMemo(
    () => assessLettuceConditions(environmentalStats, reservoir),
    [environmentalStats, reservoir],
  );



  // Active deficiencies evaluation
  const activeDeficiencies = useMemo(() => {
    const issues: string[] = [];
    // Thresholds aligned to real recipe minimums so healthy values never trigger false alarms
    if (nutrients.nitrogen   < 100) issues.push("Nitrogen Deficient (slow growth)");
    if (nutrients.nitrogen   > 200) issues.push("Nitrogen Toxic (salt stress)");
    if (nutrients.phosphorus <  20) issues.push("Phosphorus Deficient (stunted roots)");
    if (nutrients.potassium  < 150) issues.push("Potassium Deficient (chlorotic margins)");
    if (nutrients.calcium    <  60) issues.push("Calcium Deficient (Tipburn risk!)");
    if (nutrients.magnesium  <  15) issues.push("Magnesium Deficient (interveinal yellowing)");
    if (nutrients.sulfur     <  20) issues.push("Sulfur Deficient (young-leaf chlorosis)");
    return issues;
  }, [nutrients]);

  // Real-time concise simulation alerts for ControlsPanel slot
  const activeAlerts = useMemo(() => {
    const alerts: { id: string; type: "critical" | "warning" | "info"; message: string }[] = [];

    // Reservoir pH
    if (reservoir.pH < 5.5) {
      alerts.push({ id: "ph-low", type: "critical", message: `pH low (${reservoir.pH.toFixed(2)} < 5.5)` });
    } else if (reservoir.pH > 6.5) {
      alerts.push({ id: "ph-high", type: "critical", message: `pH high (${reservoir.pH.toFixed(2)} > 6.5)` });
    }

    // Reservoir EC
    if (reservoir.ec < 1.0) {
      alerts.push({ id: "ec-low", type: "warning", message: `EC low (${reservoir.ec.toFixed(2)} < 1.0 mS/cm)` });
    } else if (reservoir.ec > 1.8) {
      alerts.push({ id: "ec-high", type: "warning", message: `EC high (${reservoir.ec.toFixed(2)} > 1.8 mS/cm)` });
    }

    // Reservoir Volume
    const volPercent = (reservoir.volume / reservoir.maxVolume) * 100;
    if (volPercent < 25) {
      alerts.push({ id: "vol-low", type: "critical", message: `Low Reservoir (${reservoir.volume.toFixed(1)}L / ${volPercent.toFixed(0)}%)` });
    }

    // Water Temp
    if (environmentalStats.waterTemp > 24) {
      alerts.push({ id: "wtemp-high", type: "warning", message: `Water temp high (${environmentalStats.waterTemp}°C)` });
    } else if (environmentalStats.waterTemp < 18) {
      alerts.push({ id: "wtemp-low", type: "warning", message: `Water temp low (${environmentalStats.waterTemp}°C)` });
    }

    // Air Temp
    if (environmentalStats.airTemp > 28) {
      alerts.push({ id: "atemp-high", type: "warning", message: `Air temp high (${environmentalStats.airTemp}°C)` });
    }

    // Humidity
    if (environmentalStats.humidity < 40) {
      alerts.push({ id: "hum-low", type: "warning", message: `Humidity low (${environmentalStats.humidity}%)` });
    } else if (environmentalStats.humidity > 80) {
      alerts.push({ id: "hum-high", type: "warning", message: `Humidity high (${environmentalStats.humidity}%)` });
    }

    // Nutrients
    if (nutrients.nitrogen < 100) alerts.push({ id: "n-low", type: "warning", message: `N low (${nutrients.nitrogen} ppm)` });
    if (nutrients.nitrogen > 200) alerts.push({ id: "n-high", type: "warning", message: `N high (${nutrients.nitrogen} ppm)` });
    if (nutrients.phosphorus < 20) alerts.push({ id: "p-low", type: "warning", message: `P low (${nutrients.phosphorus} ppm)` });
    if (nutrients.potassium < 150) alerts.push({ id: "k-low", type: "warning", message: `K low (${nutrients.potassium} ppm)` });
    if (nutrients.calcium < 60) alerts.push({ id: "ca-low", type: "critical", message: `Ca low (${nutrients.calcium} ppm)` });
    if (nutrients.magnesium < 15) alerts.push({ id: "mg-low", type: "warning", message: `Mg low (${nutrients.magnesium} ppm)` });
    if (nutrients.sulfur < 20) alerts.push({ id: "s-low", type: "warning", message: `S low (${nutrients.sulfur} ppm)` });

    return alerts;
  }, [reservoir, environmentalStats, nutrients]);



  // Handle Nutrient Sliders Change
  const handleNutrientChange = (key: keyof NutrientSolution, val: number) => {
    setNutrients((prev) => {
      const updated = { ...prev, [key]: val };
      
      // Compute total PPM (macronutrients + static micro elements)
      const totalPpm = Math.round(
        updated.nitrogen +
        updated.phosphorus +
        updated.potassium +
        updated.calcium +
        updated.magnesium +
        updated.sulfur +
        (updated.iron || 4.5) +
        (updated.manganese || 0.5) +
        (updated.boron || 0.5) +
        (updated.zinc || 0.05) +
        (updated.copper || 0.02) +
        (updated.molybdenum || 0.01)
      );

      // standard EC proxy calculation (TDS / 640)
      const nextEC = parseFloat((totalPpm / 640).toFixed(2));

      setReservoir((prevRes) => ({
        ...prevRes,
        ec: nextEC,
        tds: totalPpm,
      }));

      return updated;
    });
  };

  // Reset Nutrients Formula
  const handleResetNutrients = () => {
    const baseNutrients: NutrientSolution = { ...LETTUCE_REFERENCE_RECIPE };
    setNutrients(baseNutrients);
    setReservoir((prevRes) => ({
      ...prevRes,
      ec: 1.4,
      tds: 900,
    }));
    setTimeline((prev) => [
      ...prev,
      `[${formattedClock}] Nutrients reset: Restored the supplied study's reference recipe; reservoir remains at 3/4-strength (EC ~1.4 mS/cm).`
    ]);
  };

  // Reset all microclimate sliders, reservoir EC/pH, and nutrient solution recipe back to normal required plant baseline
  const handleResetNormalInputs = () => {
    setEnvironmentalStats({
      ledIntensity: 350,
      photoperiod: 16,
      pumpSpeed: 100,
      flowRate: 1.5,
      airTemp: 23.0,
      waterTemp: 21.0,
      humidity: 60,
      targetEC: 1.4,
      targetPH: 6.0,
      nutrientDoseAmount: 50,
    });
    setReservoir((prev) => ({
      ...prev,
      pH: 6.0,
      ec: 1.4,
      tds: 900,
    }));
    setTurbidity(4.2);
    setNutrients({ ...LETTUCE_REFERENCE_RECIPE });
    setScenario("Normal Growth");
    setTimeline((prev) => [
      ...prev,
      `[${formattedClock}] 🔄 Reset to Normal Inputs: Microclimate parameters, reservoir EC/pH, and nutrient recipe restored to optimal required plant baseline.`
    ]);
  };

  // Handle Scenario Change
  const handleScenarioChange = (newScen: string) => {
    setScenario(newScen);
    const clockLabel = formattedClock;

    if (newScen === "Normal Growth") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        waterTemp: 21.0,
        airTemp: 23.0,
        humidity: 60,
        ledIntensity: 350,
        flowRate: 1.5,
        pumpSpeed: 100,
        targetEC: 1.4,
        targetPH: 6.0,
      }));
      setReservoir((prev) => ({ ...prev, pH: 6.0, ec: 1.4, tds: 900 }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] Scenario changed: Normal Growth loaded. Hydroponic variables restored to homeostasis.`
      ]);
    } else if (newScen === "Tipburn Risk") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        waterTemp: 22.0,
        airTemp: 31.0,
        humidity: 30,
        ledIntensity: 350,
        flowRate: 1.5,
        pumpSpeed: 100,
        targetEC: 1.8,
      }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] WARNING: Scenario set to Tipburn Risk. Cabin heat at 31°C, humidity dropped to 30%.`
      ]);
    } else if (newScen === "Algae Bloom") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        waterTemp: 26.0,
        airTemp: 25.0,
        humidity: 65,
        ledIntensity: 380,
      }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] WARNING: Algae Bloom scenario loaded. Solution temperature elevated to 26°C with excess light.`
      ]);
    } else if (newScen === "Pump Failure") {
      setEnvironmentalStats((prev) => ({
        ...prev,
        flowRate: 0.0,
        pumpSpeed: 0,
      }));
      setTurbidity(4.2);
      setTimeline((prev) => [
        ...prev,
        `[${clockLabel}] CRITICAL: Recirculating pump mechanics decoupled. Fluid film flow rate collapsed!`
      ]);
    }
  };

  // Handle Growth Stage Change
  const handleStageChange = (stage: "Germination" | "Seedling" | "Vegetative" | "Mature") => {
    setGrowthStage(stage);
    const clockLabel = formattedClock;

    if (stage === "Germination") {
      setMetrics((prev) => ({
        ...prev,
        age: 0,
        stage: "Germination",
        height: 0.5,
        leafCount: 2,
        leafAreaIndex: 0.02,
        rootLength: 1.2,
        freshBiomass: 0.1,
        health: 100,
        growthRate: 2.1,
      }));
      setSimMinutes(0);
      setTimeline((prev) => [...prev, `[${clockLabel}] Sprout initialized: Lettuce re-seeded at Germination stage.`]);
    } else if (stage === "Seedling") {
      setMetrics((prev) => ({
        ...prev,
        age: 5,
        stage: "Seedling",
        height: 3.2,
        leafCount: 6,
        leafAreaIndex: 0.25,
        rootLength: 4.1,
        freshBiomass: 2.8,
        health: 100,
        growthRate: 1.95,
      }));
      setSimMinutes(5 * 1440);
      setTimeline((prev) => [...prev, `[${clockLabel}] Stage shifted: Root expansion active. Seedling initialized.`]);
    } else if (stage === "Vegetative") {
      setMetrics((prev) => ({
        ...prev,
        age: 14,
        stage: "Vegetative",
        height: 12.5,
        leafCount: 16,
        leafAreaIndex: 1.25,
        rootLength: 10.5,
        freshBiomass: 18.0,
        health: 98,
        growthRate: 1.80,
      }));
      setSimMinutes(14 * 1440);
      setTimeline((prev) => [...prev, `[${clockLabel}] Stage shifted: Core canopy photosynthesis engaged. Vegetative initialized.`]);
    } else if (stage === "Mature") {
      setMetrics((prev) => ({
        ...prev,
        age: 28,
        stage: "Mature",
        height: 22.0,
        leafCount: 28,
        leafAreaIndex: 2.85,
        rootLength: 18.0,
        freshBiomass: 145.0,
        health: 98,
        growthRate: 1.25,
      }));
      setSimMinutes(28 * 1440);
      setTimeline((prev) => [...prev, `[${clockLabel}] Stage shifted: Crown packing dense rosette leaves. Mature stage initialized.`]);
    }
  };

  // Handle Plant Age Change (Direct Day Interpolation)
  const handleAgeChange = (newAge: number) => {
    // Determine growth stage based on age
    let stage: "Germination" | "Seedling" | "Vegetative" | "Mature" = "Germination";
    if (newAge > 28) stage = "Mature";
    else if (newAge > 14) stage = "Vegetative";
    else if (newAge > 5) stage = "Seedling";

    setGrowthStage(stage);

    // Piecewise linear interpolation of biological parameters based on newAge (0 to 35 days)
    let height = 0.5;
    let leafCount = 2;
    let leafAreaIndex = 0.02;
    let rootLength = 1.2;
    let freshBiomass = 0.1;
    let growthRate = 2.1;

    if (newAge <= 5) {
      // Interpolate Germination (0) to Seedling (5)
      const ratio = newAge / 5;
      height = 0.5 + ratio * (3.2 - 0.5);
      leafCount = Math.round(2 + ratio * (6 - 2));
      leafAreaIndex = 0.02 + ratio * (0.25 - 0.02);
      rootLength = 1.2 + ratio * (4.1 - 1.2);
      freshBiomass = 0.1 + ratio * (2.8 - 0.1);
      growthRate = 2.1 + ratio * (1.95 - 2.1);
    } else if (newAge <= 14) {
      // Interpolate Seedling (5) to Vegetative (14)
      const ratio = (newAge - 5) / 9;
      height = 3.2 + ratio * (12.5 - 3.2);
      leafCount = Math.round(6 + ratio * (16 - 6));
      leafAreaIndex = 0.25 + ratio * (1.25 - 0.25);
      rootLength = 4.1 + ratio * (10.5 - 4.1);
      freshBiomass = 2.8 + ratio * (18.0 - 2.8);
      growthRate = 1.95 + ratio * (1.80 - 1.95);
    } else if (newAge <= 28) {
      // Interpolate Vegetative (14) to Mature (28)
      const ratio = (newAge - 14) / 14;
      height = 12.5 + ratio * (22.0 - 12.5);
      leafCount = Math.round(16 + ratio * (28 - 16));
      leafAreaIndex = 1.25 + ratio * (2.85 - 1.25);
      rootLength = 10.5 + ratio * (18.0 - 10.5);
      freshBiomass = 18.0 + ratio * (145.0 - 18.0);
      growthRate = 1.80 + ratio * (1.25 - 1.80);
    } else {
      // Interpolate Mature (28) to Harvest Day (35)
      const ratio = Math.min(1.0, (newAge - 28) / 7);
      height = 22.0 + ratio * (26.0 - 22.0);
      leafCount = Math.round(28 + ratio * (34 - 28));
      leafAreaIndex = 2.85 + ratio * (3.30 - 2.85);
      rootLength = 18.0 + ratio * (21.0 - 18.0);
      freshBiomass = 145.0 + ratio * (195.0 - 145.0);
      growthRate = 1.25 + ratio * (0.95 - 1.25);
    }

    setMetrics((prev) => ({
      ...prev,
      age: parseFloat(newAge.toFixed(2)),
      stage,
      height: parseFloat(height.toFixed(1)),
      leafCount,
      leafAreaIndex: parseFloat(leafAreaIndex.toFixed(2)),
      rootLength: parseFloat(rootLength.toFixed(1)),
      freshBiomass: parseFloat(freshBiomass.toFixed(1)),
      growthRate: parseFloat(growthRate.toFixed(2)),
    }));

    setSimMinutes(Math.round(newAge * 1440));

    const clockLabel = formattedClock;
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] Time Jump: Crop age manually updated to Day ${newAge.toFixed(1)} (${stage} stage). Physiology synchronized.`
    ]);
  };

  // Handle Crop Variety Change
  const handleCropChange = (crop: string) => {
    setCropType(crop);
    const clockLabel = formattedClock;
    setTimeline((prev) => [...prev, `[${clockLabel}] Crop variety switched to: ${crop}.`]);
    
    // Auto-adjust target parameters based on crop botanical recommendations
    let targetEC = 1.4;
    let targetPH = 6.0;
    if (crop === "Basil") {
      targetEC = 1.6;
      targetPH = 6.2;
    } else if (crop === "Spinach") {
      targetEC = 1.8;
      targetPH = 5.8;
    }
    
    setEnvironmentalStats((prev) => ({
      ...prev,
      targetEC,
      targetPH,
    }));
  };

  // Manual dosing (Tuning tool)
  const handleManualDose = () => {
    const clockLabel = formattedClock;
    setReservoir((prev) => {
      const nextEC = parseFloat(Math.min(3.0, prev.ec + 0.15).toFixed(2));
      return {
        ...prev,
        ec: nextEC,
        tds: Math.round(nextEC * 640),
      };
    });
    setNutrientsFed((f) => f + 1.2);
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] Manual dosing: Injected 50 mL concentrated macronutrients. EC increased by +0.15 mS/cm.`
    ]);
  };

  // Manual water refill
  const handleManualRefill = () => {
    const clockLabel = formattedClock;
    setReservoir((prev) => ({
      ...prev,
      volume: 95.0,
    }));
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] Reservoir top-off: Replenished water level back to 95.0 Liters.`
    ]);
  };

  // Reset Simulation
  const handleReset = () => {
    setSimMinutes(0);
    setWaterUptake(1.0);
    setNutrientsFed(0.0);
    prevHourRef.current = 0;
    lastRoutineLogRef.current = "";
    
    // Reset reservoir stats
    setReservoir({
      volume: 95.0,
      maxVolume: 100.0,
      pH: 6.0,
      ec: 1.4,
      tds: 900,
      nutrientPercentage: 100,
      waterConsumptionToday: 0.05,
      predictedRefillDays: 24,
      predictedNutrientRefillDays: 30,
    });

    // Reset plant metrics to Germination Day 0
    setMetrics({
      age: 0,
      stage: "Germination",
      height: 0.5,
      leafCount: 2,
      leafAreaIndex: 0.02,
      rootLength: 1.2,
      freshBiomass: 0.1,
      dryBiomass: 0.01,
      estimatedHarvestWeight: 0.1,
      health: 100,
      growthRate: 2.1,
      photosynthesisRate: 0.1,
      waterConsumption: 0.01,
      nutrientConsumption: 5.0,
    });

    // Reset macronutrient solution recipe
    setNutrients({ ...LETTUCE_REFERENCE_RECIPE });

    setGrowthStage("Germination");
    setScenario("Normal Growth");

    setTimeline([
      "[00:00] Simulation clock reset. Re-calibrating physical models...",
      "[00:00] Hydroponic parameters established at baseline configurations (95.0 L, 350 PPFD, 3/4-strength reference solution)."
    ]);
  };

  // Interactive Harvest Event
  const handleHarvest = () => {
    const clockLabel = formattedClock;
    const finalWeight = metrics.freshBiomass;
    setTimeline((prev) => [
      ...prev,
      `[${clockLabel}] ✂️ HARVEST EVENT: Harvested delicious Green Coral ${cropType}! Fresh weight yield: ${finalWeight.toFixed(1)}g.`,
      `[${clockLabel}] Re-seeding new crops in NFT channels...`
    ]);
    handleStageChange("Germination");
  };

  // Instantaneous Fast Growth Time Warp Jump
  const handleTimeJump = useCallback((hours: number) => {
    const clockLabel = formattedClock;
    
    setSimMinutes((prevMinutes) => {
      let currentMinutes = prevMinutes;
      let tempMetrics = { ...metrics };
      let tempReservoir = { ...reservoir };
      let tempTurbidity = turbidity;
      let tempWaterUptake = waterUptake;
      let tempNutrientsFed = nutrientsFed;
      const newTimelineLogs: string[] = [];

      for (let step = 1; step <= hours; step++) {
        currentMinutes += 60;

        // 1. Hourly Biology Update
        let nextHealth = tempMetrics.health;
        let healthDelta = 0.5;
        const nextAge = tempMetrics.age + 1 / 24;

        if (nextAge > 70) {
          healthDelta -= (nextAge - 70) * 0.15;
        }

        if (scenario === "Pump Failure") {
          healthDelta -= 3.5;
        }

        // Direct Air Temp stress
        if (environmentalStats.airTemp > 30) {
          healthDelta -= (environmentalStats.airTemp - 30) * 0.25;
        } else if (environmentalStats.airTemp < 15) {
          healthDelta -= (15 - environmentalStats.airTemp) * 0.15;
        }

        // Direct Water Temp stress
        if (environmentalStats.waterTemp > 24) {
          healthDelta -= (environmentalStats.waterTemp - 24) * 0.35;
        } else if (environmentalStats.waterTemp < 15) {
          healthDelta -= (15 - environmentalStats.waterTemp) * 0.15;
        }

        // Direct pH stress
        if (tempReservoir.pH < 4.5 || tempReservoir.pH > 8.0) {
          healthDelta -= 2.0;
        } else if (tempReservoir.pH < 5.5 || tempReservoir.pH > 6.5) {
          healthDelta -= 0.3;
        }

        // Direct EC/TDS stress
        if (tempReservoir.ec < 0.6) {
          healthDelta -= (0.6 - tempReservoir.ec) * 1.5;
        } else if (tempReservoir.ec > 2.4) {
          healthDelta -= (tempReservoir.ec - 2.4) * 1.0;
        }

        // Direct Turbidity stress
        if (tempTurbidity > 7.0) {
          healthDelta -= (tempTurbidity - 7.0) * 0.25;
        }

        // Direct Light stress
        if (environmentalStats.ledIntensity > 320) {
          healthDelta -= (environmentalStats.ledIntensity - 320) * 0.01;
        }

        const minHealth = nextAge > 70 ? 0 : 5;
        nextHealth = Math.max(minHealth, Math.min(100, nextHealth + healthDelta));

        // Macronutrient penalties — thresholds must match deficiency alert thresholds exactly
        // so auto-dosing (which keeps nutrients at target) prevents ALL penalty blocks
        let activePenalty = 0;
        if (nutrients.nitrogen   < 100) activePenalty += 0.8;
        if (nutrients.calcium    <  60) activePenalty += 1.5;
        if (nutrients.potassium  < 150) activePenalty += 0.4;
        if (nutrients.magnesium  <  15) activePenalty += 0.4;
        if (nutrients.sulfur     <  20) activePenalty += 0.3;

        if (activePenalty > 0) {
          nextHealth = Math.max(minHealth, nextHealth - activePenalty);
        }

        let growthMultiplier = nextHealth / 100;
        growthMultiplier *= lettuceAssessment.growthFactor * 1.2;

        if (environmentalStats.airTemp > 28) {
          growthMultiplier *= Math.max(0.2, 1 - (environmentalStats.airTemp - 28) * 0.05);
        }

        const sizeInc = 0.05 * growthMultiplier;
        const nextStage: "Germination" | "Seedling" | "Vegetative" | "Mature" = nextAge > 28 ? "Mature" : nextAge > 14 ? "Vegetative" : nextAge > 5 ? "Seedling" : "Germination";
        const { leafCount, rootLength } = getBiometricsForAge(nextAge);

        tempMetrics = {
          ...tempMetrics,
          health: parseFloat(nextHealth.toFixed(1)),
          height: parseFloat((tempMetrics.height + sizeInc * 1.5).toFixed(1)),
          freshBiomass: parseFloat((tempMetrics.freshBiomass + sizeInc * 8.5).toFixed(1)),
          age: parseFloat(nextAge.toFixed(2)),
          stage: nextStage,
          leafCount,
          rootLength: parseFloat(rootLength.toFixed(1)),
        };

        // 2. Hourly Turbidity Update
        if (scenario === "Algae Bloom") {
          tempTurbidity = Math.min(15.0, tempTurbidity + 0.4);
        }

        // 3. Hourly Reservoir Update
        const cropWaterAbsorption = scenario === "Tipburn Risk" ? 0.35 : 0.15;
        let nextVol = Math.max(10.0, tempReservoir.volume - cropWaterAbsorption);
        tempWaterUptake += cropWaterAbsorption;

        let nextPH = tempReservoir.pH + 0.03;
        let nextEC = tempReservoir.ec;

        if (scenario === "Algae Bloom") {
          nextEC = Math.max(0.5, nextEC - 0.02);
        }

        if (autoCorrect) {
          // pH correction
          if (nextPH > 6.2) {
            nextPH = 6.0;
            newTimelineLogs.push(`Auto dosing: Injected pH Down. Corrected pH to 6.0.`);
          } else if (nextPH < 5.8) {
            nextPH = 6.0;
            newTimelineLogs.push(`Auto dosing: Injected pH Up. Corrected pH to 6.0.`);
          }
          // EC / TDS correction
          if (nextEC < environmentalStats.targetEC) {
            nextEC = environmentalStats.targetEC;
            tempNutrientsFed += 0.8;
            newTimelineLogs.push(`Auto dosing: Nutrient pump active. Realigned EC to target ${environmentalStats.targetEC} mS/cm.`);
          }
          // Water-level correction
          if (nextVol < 80.0) {
            nextVol = 95.0;
            newTimelineLogs.push(`Auto-Refill Valve: Reservoir fell below 80L. Automatically topped off water to 95.0 L.`);
          }
          // *** Critical fix: top-up individual nutrient ppm so health-penalty blocks never fire ***
          // When auto-dosing is on the system should maintain the reference recipe concentrations.
          setNutrients((prevNutrients) => {
            let changed = false;
            const patched = { ...prevNutrients };
            if (patched.nitrogen   < 100) { patched.nitrogen   = LETTUCE_REFERENCE_RECIPE.nitrogen;   changed = true; }
            if (patched.phosphorus <  20) { patched.phosphorus = LETTUCE_REFERENCE_RECIPE.phosphorus; changed = true; }
            if (patched.potassium  < 150) { patched.potassium  = LETTUCE_REFERENCE_RECIPE.potassium;  changed = true; }
            if (patched.calcium    <  60) { patched.calcium    = LETTUCE_REFERENCE_RECIPE.calcium;    changed = true; }
            if (patched.magnesium  <  15) { patched.magnesium  = LETTUCE_REFERENCE_RECIPE.magnesium;  changed = true; }
            if (patched.sulfur     <  20) { patched.sulfur     = LETTUCE_REFERENCE_RECIPE.sulfur;     changed = true; }
            if (changed) {
              newTimelineLogs.push(`Auto dosing: Nutrient levels low — topped up N/P/K/Ca/Mg/S to reference recipe.`);
            }
            return changed ? patched : prevNutrients;
          });
        } else {
          nextPH = Math.max(3.8, Math.min(9.5, nextPH));
        }

        tempReservoir = {
          ...tempReservoir,
          volume: parseFloat(nextVol.toFixed(1)),
          pH: parseFloat(nextPH.toFixed(2)),
          ec: parseFloat(nextEC.toFixed(2)),
          tds: Math.round(nextEC * 640),
          nutrientPercentage: tempReservoir.nutrientPercentage,
          waterConsumptionToday: tempReservoir.waterConsumptionToday,
          predictedRefillDays: tempReservoir.predictedRefillDays,
          predictedNutrientRefillDays: tempReservoir.predictedNutrientRefillDays,
        };
      }

      // Commit local accumulated state to react state
      setMetrics(tempMetrics);
      setReservoir(tempReservoir);
      setTurbidity(tempTurbidity);
      setWaterUptake(tempWaterUptake);
      setNutrientsFed(tempNutrientsFed);
      prevHourRef.current = Math.floor(currentMinutes / 60);

      // Append Timelines
      setTimeline((prevLogs) => {
        const uniqueDosingLogs = Array.from(new Set(newTimelineLogs));
        const formattedDosingLogs = uniqueDosingLogs.map(log => `  ↳ ${log}`);
        return [
          ...prevLogs,
          `[${clockLabel}] ⚡ TIME WARP: Advanced simulation by exactly ${hours} Hours (+${hours * 60} mins). Crop age is now ${tempMetrics.age.toFixed(2)} days.`,
          ...formattedDosingLogs
        ];
      });
      return currentMinutes;
    });
  }, [metrics, reservoir, turbidity, waterUptake, nutrientsFed, environmentalStats, scenario, autoCorrect, nutrients, lettuceAssessment]);

  // Simulation Clock Ticking interval loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      handleTimeJump(warpFactor * 2);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, warpFactor, handleTimeJump]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }} className={`font-mono text-sm antialiased selection:bg-[#a3e635] selection:text-slate-950 ${isDark ? "text-slate-100 bg-[#090a0f]" : "text-slate-800 bg-slate-100"}`}>
      
      {/* Dynamic Header */}
      <header className={`border-b px-6 py-4 flex items-center justify-between shrink-0 ${isDark ? "border-slate-900 bg-[#090a0f]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-600 to-yellow-400 flex items-center justify-center shadow-md">
            <Leaf className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className={`text-sm font-black tracking-wider uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
              GreenTwin: Lettuce Twin
            </h1>
          </div>
        </div>

        {/* Live Simulation Clock */}
        <div className={`flex items-center space-x-3 px-3 py-1.5 rounded shadow ${isDark ? "bg-[#12141c] border border-slate-900" : "bg-slate-50 border border-slate-200"}`}>
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping" />
            <span className={`text-[10.5px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Sim Day: <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>Day {metrics.age.toFixed(1)}</span>
            </span>
          </div>
          <div className={`w-px h-3.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />
          <span className={`text-[10.5px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Clock: <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{formattedClock}</span>
          </span>
        </div>
      </header>

      {/* Main Grid: Fully Integrated Layout with Workspace Tabs */}
      <main style={{ flex: 1, minHeight: 0 }} className="w-full mx-auto p-2.5 lg:p-3.5 grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* COLUMN 1: INTERACTIVE SIMULATOR SIDEBAR */}
        <section className="xl:col-span-3 flex flex-col space-y-2.5 min-h-0 h-full overflow-y-auto pr-1 animate-fade-in" id="controls-panel-container">
          {/* Simulation Control Card */}
          <div className={`border rounded-lg p-2.5 flex flex-col flex-grow flex-1 ${isDark ? "bg-[#111217]/50 border-slate-900" : "bg-white border-slate-200 shadow-sm"}`}>
            <ControlsPanel
              scenario={scenario}
              onScenarioChange={handleScenarioChange}
              growthStage={growthStage}
              onStageChange={handleStageChange}
              isRunning={isRunning}
              onToggleRunning={() => setIsRunning(!isRunning)}
              onReset={handleReset}
              realTime={realTime}
              onRealTimeToggle={() => setRealTime(!realTime)}
              autoCorrect={autoCorrect}
              onAutoCorrectToggle={() => setAutoCorrect(!autoCorrect)}
              metrics={metrics}
              harvestDays={Math.max(1.0, 28 - metrics.age)}
              waterUptake={waterUptake}
              nutrientsFed={nutrientsFed}
              environmentalStats={environmentalStats}
              onStatsChange={setEnvironmentalStats}
              onManualDose={handleManualDose}
              onManualRefill={handleManualRefill}
              nutrients={nutrients}
              onNutrientChange={handleNutrientChange}
              onResetNutrients={handleResetNutrients}
              onResetNormalInputs={handleResetNormalInputs}
              activeAlerts={activeAlerts}
              onAgeChange={handleAgeChange}
              simMinutes={simMinutes}
              reservoir={reservoir}
              onReservoirChange={setReservoir}
              turbidity={turbidity}
              onTurbidityChange={setTurbidity}
              onTimeJump={handleTimeJump}
              warpFactor={warpFactor}
              onWarpFactorChange={setWarpFactor}
              tankVolume={tankVolume}
              onTankVolumeChange={(vol: number) => {
                setTankVolume(vol);
                // Update reservoir to match new tank physical capacity
                setReservoir((prev) => ({
                  ...prev,
                  maxVolume: vol,
                  volume: Math.min(prev.volume, vol * 0.95),
                }));
              }}
            />
          </div>
        </section>

        {/* COLUMN 2 & 3 Combined: HIGH-DENSITY WORKSPACE WITH TAB TOGGLES */}
        <section className="xl:col-span-9 flex flex-col space-y-3 min-h-0 h-full" id="workspace-container">
           <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 shrink-0 border-b ${isDark ? "border-slate-900" : "border-slate-200"}`} id="workspace-tabs-bar">
            <div className="flex items-center gap-2 px-1">
              <Leaf className="w-5 h-5 text-[#a3e635] animate-pulse" />
              <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-100" : "text-slate-900"}`}>Digital Twin Engine</span>
            </div>

            {/* High density specs readout right aligned */}
            <div className={`flex items-center space-x-3.5 text-[9px] font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-900 font-black"}`}>
              <div className="flex items-center gap-1">
                <span className={isDark ? "text-slate-500" : "text-slate-900 font-extrabold"}>HEALTH:</span>
                <span className={metrics.health > 85 ? (isDark ? "text-emerald-400 font-extrabold" : "text-emerald-700 font-black") : (isDark ? "text-amber-400 font-extrabold" : "text-amber-700 font-black")}>
                  {metrics.health}%
                </span>
              </div>
              <div className={`w-px h-3 ${isDark ? "bg-slate-900" : "bg-slate-300"}`} />
              <div className="flex items-center gap-1">
                <span className={isDark ? "text-slate-500" : "text-slate-900 font-extrabold"}>GROWTH:</span>
                <span className={isDark ? "text-yellow-500" : "text-amber-800 font-black"}>{Math.min(100, Math.round((metrics.age / 28) * 100))}%</span>
              </div>
              <div className={`w-px h-3 ${isDark ? "bg-slate-900" : "bg-slate-300"}`} />
              <div className="flex items-center gap-1">
                <span className={isDark ? "text-slate-500" : "text-slate-900 font-extrabold"}>RESERVOIR:</span>
                <span className={isDark ? "text-cyan-400" : "text-cyan-800 font-black"}>{reservoir.volume.toFixed(1)}L</span>
              </div>
            </div>
          </div>

          <div style={{ height: 'calc(100% - 50px)' }} className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 flex-1 overflow-hidden animate-fade-in" id="tab-twin-content">
              
              {/* Center Column: Crop Species, Visualizer & Charts */}
              <div className="lg:col-span-8 flex flex-col space-y-3.5 min-h-0 h-full">
                
                {/* Crop Species Selector Card */}
                <div className={`border-2 rounded-lg p-3 flex flex-col space-y-2 shrink-0 ${isDark ? "bg-[#12141c]/60 border-slate-700" : "bg-white border-slate-300 shadow-md"}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Crop Species</span>
                  <select
                    value={cropType}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 text-sm font-black ${isDark ? "bg-[#14151c] text-slate-100 border-slate-800" : "bg-slate-50 text-slate-900 border-slate-300 focus:bg-white"}`}
                    id="select-crop-type-center"
                  >
                    <option value="Lettuce">Green Coral Lettuce (L. sativa)</option>
                  </select>
                </div>

                {/* Twin Biological Specs Card */}
                <div className={`flex flex-col border-2 rounded-lg overflow-hidden shrink-0 ${isDark ? "border-slate-700 bg-[#12141c]/40 shadow-md" : "border-slate-300 bg-white shadow-md"}`} id="twin-biological-specs">
                  {/* Visualizer Frame */}
                  <div className={`w-full h-[280px] p-3.5 flex flex-col justify-between relative ${isDark ? "bg-slate-950/40" : "bg-slate-50/80"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wide ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
                        Digital Twin Model
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded ${isDark ? "text-emerald-400 bg-emerald-950/30 border border-emerald-900/30" : "text-emerald-700 bg-emerald-50 border border-emerald-300 shadow-sm"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Live
                      </span>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center">
                      <PlantVisualizer
                        stats={environmentalStats}
                        metrics={metrics}
                        reservoirLevel={(reservoir.volume / reservoir.maxVolume) * 100}
                        pumpRunning={environmentalStats.flowRate > 0}
                        onHarvest={handleHarvest}
                        animationSpeed={warpFactor}
                      />
                    </div>
                  </div>
                </div>

                {/* Crop Growth Days & Lifecycle Timeline Card */}
                <div className={`border-2 rounded-lg p-3.5 flex flex-col space-y-3.5 shrink-0 ${isDark ? "bg-[#12141c]/40 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`} id="twin-days-timeline-card">
                  <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-slate-900" : "border-slate-200"}`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-[12px]">📅</span>
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
                        Crop Growth Days & Lifecycle Timeline
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${isDark ? "text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/20" : "text-emerald-900 bg-emerald-100 border border-emerald-300 font-black"}`}>
                      Current: Day {metrics.age.toFixed(1)}
                    </span>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="relative py-2.5">
                    {/* Background Progress Bar Track */}
                    <div className={`absolute top-[12px] left-6 right-6 h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-200"}`}>
                      {/* Active Progress Fill */}
                      <div 
                        className="h-full bg-[#a3e635] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, getTimelineProgressPercent(metrics.age))}%` }}
                      />
                    </div>

                    {/* Timeline Nodes */}
                    <div className="relative flex justify-between px-6 z-10">
                      {/* Day 0 */}
                      <button 
                        onClick={() => handleAgeChange(0)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                          metrics.age >= 0 && metrics.age < 5 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 5
                            ? isDark ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-emerald-100 text-emerald-700 border-emerald-500"
                            : isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-100 text-slate-400 border-slate-300"
                        }`}>
                          0
                        </div>
                        <span className={`text-[9.5px] font-black mt-1.5 transition-colors ${metrics.age >= 0 && metrics.age < 5 ? (isDark ? "text-[#a3e635]" : "text-emerald-700 font-black") : isDark ? "text-slate-500" : "text-slate-900"}`}>
                          Sprout
                        </span>
                      </button>

                      {/* Day 5 */}
                      <button 
                        onClick={() => handleAgeChange(5)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                          metrics.age >= 5 && metrics.age < 14 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 14
                            ? isDark ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-emerald-100 text-emerald-700 border-emerald-500"
                            : isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-100 text-slate-400 border-slate-300"
                        }`}>
                          5
                        </div>
                        <span className={`text-[9.5px] font-black mt-1.5 transition-colors ${metrics.age >= 5 && metrics.age < 14 ? (isDark ? "text-[#a3e635]" : "text-emerald-700 font-black") : isDark ? "text-slate-500" : "text-slate-900"}`}>
                          Seedling
                        </span>
                      </button>

                      {/* Day 14 */}
                      <button 
                        onClick={() => handleAgeChange(14)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                          metrics.age >= 14 && metrics.age < 28 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 28
                            ? isDark ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-emerald-100 text-emerald-700 border-emerald-500"
                            : isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-100 text-slate-400 border-slate-300"
                        }`}>
                          14
                        </div>
                        <span className={`text-[9.5px] font-black mt-1.5 transition-colors ${metrics.age >= 14 && metrics.age < 28 ? (isDark ? "text-[#a3e635]" : "text-emerald-700 font-black") : isDark ? "text-slate-500" : "text-slate-900"}`}>
                          Vegetative
                        </span>
                      </button>

                      {/* Day 28 */}
                      <button 
                        onClick={() => handleAgeChange(28)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                          metrics.age >= 28 && metrics.age < 35 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : metrics.age >= 35
                            ? isDark ? "bg-slate-900 text-emerald-400 border-emerald-500" : "bg-emerald-100 text-emerald-700 border-emerald-500"
                            : isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-100 text-slate-400 border-slate-300"
                        }`}>
                          28
                        </div>
                        <span className={`text-[9.5px] font-black mt-1.5 transition-colors ${metrics.age >= 28 && metrics.age < 35 ? (isDark ? "text-[#a3e635]" : "text-emerald-700 font-black") : isDark ? "text-slate-500" : "text-slate-900"}`}>
                          Mature
                        </span>
                      </button>

                      {/* Day 35 */}
                      <button 
                        onClick={() => handleAgeChange(35)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                          metrics.age >= 35 
                            ? "bg-[#a3e635] text-slate-950 border-[#a3e635] scale-110 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                            : isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-100 text-slate-400 border-slate-300"
                        }`}>
                          35
                        </div>
                        <span className={`text-[9.5px] font-black mt-1.5 transition-colors ${metrics.age >= 35 ? (isDark ? "text-[#a3e635]" : "text-emerald-700 font-black") : isDark ? "text-slate-500" : "text-slate-900"}`}>
                          Harvest
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Active stage target tips */}
                  <div className={`border p-3 rounded-lg text-[10.5px] font-mono mt-1.5 leading-relaxed ${isDark ? "bg-slate-950/40 border-slate-900 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-900 font-bold"}`}>
                    <span className={`font-bold uppercase tracking-wider ${isDark ? "text-[#a3e635]" : "text-emerald-800 font-black"}`}>
                      {metrics.age < 5 ? "Germination Guidance" : metrics.age < 14 ? "Seedling Guidance" : metrics.age < 28 ? "Vegetative Guidance" : "Mature Guidance"}:
                    </span>{" "}
                    {metrics.age < 5 
                      ? "Keep LED intensity low (~120-150 PPFD) and EC moderate (~1.0-1.2 mS/cm) to support fragile cotyledons and root establishment." 
                      : metrics.age < 14 
                      ? "Gradually increase LED output to ~180-220 PPFD. Target EC at 1.2-1.4 mS/cm. Keep circulation flow continuous." 
                      : metrics.age < 28 
                      ? "Maximum photosynthesis! Elevate LED intensity to ~220-280 PPFD. Feed full-strength nutrient recipe at 1.4-1.6 mS/cm." 
                      : "Canopy fully packed. Monitor for tipburn risk by securing humidity above 50% and ensuring constant fan/exhaust ventilation."}
                  </div>
                </div>

                {/* Real-time Solutes Dashboard */}
                <div className={`border-2 rounded-lg p-3.5 flex flex-col space-y-3 flex-1 ${isDark ? "bg-[#12141c]/60 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`}>
                  <div className="flex flex-col space-y-2 shrink-0">
                    <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center justify-between ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
                      <span>Solutes Recipe Status</span>
                      <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-900 font-black"}`}>TDS: {reservoir.tds} ppm</span>
                    </span>

                    {/* Category tabs */}
                    <div className={`flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider border-b pb-1.5 ${isDark ? "border-slate-900" : "border-slate-200"}`}>
                      {(["macro", "micro", "fertilizers", "additives"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveStatusTab(tab)}
                          className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                            activeStatusTab === tab
                              ? isDark ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/35" : "bg-emerald-700 text-white font-black shadow-sm"
                              : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-700 hover:text-slate-900 font-bold bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {tab === "macro" ? "Macro" : tab === "micro" ? "Micro" : tab === "fertilizers" ? "Fertilizers" : "Additives"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active deficiencies warning banner */}
                  {activeDeficiencies.length > 0 && (
                    <div className={`border px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 animate-pulse shrink-0 ${isDark ? "bg-amber-950/40 border-amber-900/30 text-amber-400" : "bg-amber-50 border-amber-300 text-amber-900 font-black"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block shrink-0" />
                      <span>Deficiency alert: {activeDeficiencies.join(", ")}</span>
                    </div>
                  )}

                  {/* Progress bars */}
                  <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-xs overflow-y-auto flex-grow pr-1 py-1" style={{ overflow: "visible auto" }}>
                    {activeStatusTab === "macro" && (
                      <>
                        {renderStatusProgressBar(nutrients.nitrogen,  300, "Nitrogen (N)",   "ppm",  100,  150,  200, "#3b82f6")}
                        {renderStatusProgressBar(nutrients.phosphorus, 100, "Phosphorus (P)", "ppm",   20,   31,   50, "#a855f7")}
                        {renderStatusProgressBar(nutrients.potassium,  350, "Potassium (K)",  "ppm",  150,  210,  280, "#f97316")}
                        {renderStatusProgressBar(nutrients.calcium,    200, "Calcium (Ca)",   "ppm",   60,   90,  140, "#ef4444")}
                        {renderStatusProgressBar(nutrients.magnesium,   80, "Magnesium (Mg)", "ppm",   15,   24,   40, "#818cf8")}
                        {renderStatusProgressBar(nutrients.sulfur,      80, "Sulfur (S)",     "ppm",   20,   32,   55, "#06b6d4")}
                      </>
                    )}
                    {activeStatusTab === "micro" && (
                      <>
                        {renderStatusProgressBar(nutrients.iron,       3,     "Iron (Fe)",        "ppm", 0.50,  1.00,  2.00,  "#f97316")}
                        {renderStatusProgressBar(nutrients.manganese,  1,     "Manganese (Mn)",   "ppm", 0.10,  0.25,  0.60,  "#84cc16")}
                        {renderStatusProgressBar(nutrients.zinc,       0.5,   "Zinc (Zn)",        "ppm", 0.05,  0.13,  0.30,  "#06b6d4")}
                        {renderStatusProgressBar(nutrients.boron,      0.5,   "Boron (B)",        "ppm", 0.08,  0.16,  0.30,  "#0284c7")}
                        {renderStatusProgressBar(nutrients.copper,     0.1,   "Copper (Cu)",      "ppm", 0.010, 0.023, 0.050, "#a855f7")}
                        {renderStatusProgressBar(nutrients.molybdenum, 0.1,   "Molybdenum (Mo)",  "ppm", 0.010, 0.024, 0.050, "#eab308")}
                        {renderStatusProgressBar(nutrients.chlorine,   5,     "Chlorine (Cl)",    "ppm", 0.00,  4.90,  5.00,  "#10b981")}
                      </>
                    )}
                    {activeStatusTab === "fertilizers" && (
                      <>
                        {renderStatusProgressBar(nutrients.calciumNitrate,          60,  "Calcium Nitrate",   "g/100L",  15,   22.7,  40,  "#3b82f6")}
                        {renderStatusProgressBar(nutrients.potassiumNitrate,         30, "Potassium Nitrate", "g/100L",   8,   11.9,  20,  "#f97316")}
                        {renderStatusProgressBar(nutrients.monoammoniumPhosphate,    10, "MAP (Phos)",        "g/100L",   1,    3.0,   6,  "#a855f7")}
                        {renderStatusProgressBar(nutrients.epsomSalts,               20, "Epsom Salts",       "g/100L",   3,    6.5,  12,  "#818cf8")}
                        {renderStatusProgressBar(nutrients.ironChelate,               5, "Iron Chelate",      "g/100L",   0.5,  1.0,   3,  "#f97316")}
                        {renderStatusProgressBar(nutrients.traceMicronutrientBlend,   3, "Trace Blend",       "g/100L",   0.2,  0.5,   1,  "#06b6d4")}
                      </>
                    )}
                    {activeStatusTab === "additives" && (
                      <>
                        {renderStatusProgressBar(nutrients.phosphoricAcid,           20, "Phosphoric Acid",  "mL/100L",  2.6,  5.3,  7.9,  "#ef4444")}
                        {renderStatusProgressBar(nutrients.nitricAcid,               15, "Nitric Acid",      "mL/100L",  2.6,  4.0,  5.3,  "#0284c7")}
                        {renderStatusProgressBar(nutrients.potassiumHydroxide,       15, "KOH (pH Up)",      "mL/100L",  2.6,  4.0,  5.3,  "#f97316")}
                        {renderStatusProgressBar(nutrients.bacillusAmyloliquefaciens, 50, "Bacillus amyloliq.","mL/100L", 13.2, 19.8, 26.4, "#10b981")}
                        {renderStatusProgressBar(nutrients.hypochlorousAcid,          80, "Hypochlorous Acid","mL/100L", 26.4, 39.6, 52.8, "#6366f1")}
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Twin Right column: Live Probes & Simulation Timeline */}
              <div className="lg:col-span-4 flex flex-col space-y-3 min-h-0 h-full">
                
                {/* Probes Display */}
                <div className={`border-2 rounded-lg p-3.5 flex flex-col space-y-3.5 shrink-0 ${isDark ? "bg-[#12141c]/60 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`} id="live-sensors-card">
                  <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? "border-slate-900" : "border-slate-200"}`}>
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
                      Live Probes
                    </span>
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${isDark ? "text-emerald-400 bg-emerald-950/20 border border-emerald-900/30" : "text-emerald-800 bg-emerald-100 border border-emerald-300 font-black"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      PUMP: {environmentalStats.pumpSpeed}%
                    </span>
                  </div>
 
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">

                    {/* pH Probe */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-550" : "text-slate-900"}`}>pH Sensor</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-650" : "text-slate-700"}`}>pH</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{reservoir.pH.toFixed(2)}</span>
                      {(() => {
                        const pct = Math.min(100, (reservoir.pH / 14) * 100);
                        const col = "#84cc16";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* TDS Probe */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-550" : "text-slate-900"}`}>TDS Sensor</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>ppm</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{reservoir.tds}</span>
                      {(() => {
                        const pct = Math.min(100, (reservoir.tds / 2000) * 100);
                        const col = "#06b6d4";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Solute EC Probe */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-550" : "text-slate-900"}`}>Solute EC</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>mS/cm</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{reservoir.ec.toFixed(2)}</span>
                      {(() => {
                        const pct = Math.min(100, (reservoir.ec / 3.0) * 100);
                        const col = "#06b6d4";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Water Temp */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-550" : "text-slate-900"}`}>Water Temp</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>°C</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.waterTemp.toFixed(1)}</span>
                      {(() => {
                        const pct = Math.min(100, (environmentalStats.waterTemp / 40) * 100);
                        const col = "#14b8a6";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Air Temp */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-555" : "text-slate-900"}`}>Air Temp</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>°C</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.airTemp.toFixed(1)}</span>
                      {(() => {
                        const pct = Math.min(100, (environmentalStats.airTemp / 45) * 100);
                        const col = "#f97316";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Light Lux */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-555" : "text-slate-900"}`}>Light Lux</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>Lux</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{Math.round(environmentalStats.ledIntensity * 54).toLocaleString()}</span>
                      {(() => {
                        const pct = Math.min(100, ((environmentalStats.ledIntensity * 54) / 21600) * 100);
                        const col = "#eab308";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Turbidity */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-555" : "text-slate-900"}`}>Turbidity</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>NTU</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{currentTurbidity.toFixed(1)}</span>
                      {(() => {
                        const pct = Math.min(100, (currentTurbidity / 12) * 100);
                        const col = "#ec4899";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Light PPFD */}
                    <div className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[60px] ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase font-black ${isDark ? "text-slate-555" : "text-slate-900"}`}>Light PPFD</span>
                        <span className={`text-[9px] font-bold ${isDark ? "text-slate-655" : "text-slate-700"}`}>µmol</span>
                      </div>
                      <span className={`text-lg font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.ledIntensity}</span>
                      {(() => {
                        const pct = Math.min(100, (environmentalStats.ledIntensity / 400) * 100);
                        const col = "#a3e635";
                        const glow = hexToRgba(col, 0.85);
                        const glowSoft = hexToRgba(col, 0.45);
                        return (
                          <div className="relative h-2.5 rounded-full mt-1.5 border" style={{ backgroundColor: isDark ? "#07080f" : "#e2e8f0", borderColor: hexToRgba(col, isDark ? 0.3 : 0.5), boxShadow: isDark ? "inset 0 1px 4px rgba(0,0,0,0.9)" : "inset 0 1px 3px rgba(0,0,0,0.15)", overflow: "visible" }}>
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] ease-out" style={{ width: `${pct}%`, transitionDuration: "400ms", background: `linear-gradient(90deg, ${hexToRgba(col, isDark ? 0.1 : 0.2)} 0%, ${hexToRgba(col, isDark ? 0.4 : 0.6)} 20%, ${hexToRgba(col, isDark ? 0.75 : 0.9)} 55%, ${col} 100%)`, boxShadow: `0 0 12px ${glow}, 0 0 24px ${glowSoft}` }}>
                                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"><svg className="absolute top-0 left-0 h-full w-[200%] animate-plasma-wave" viewBox="0 0 1200 20" preserveAspectRatio="none"><path d="M 0 10 Q 100 3, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10 L 1200 20 L 0 20 Z" fill={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"} /><path d="M 0 10 Q 100 5, 200 10 T 400 10 T 600 10 T 800 10 T 1000 10 T 1200 10" fill="none" stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.95)"} strokeWidth="1.2" /></svg></div>
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mix-blend-overlay pointer-events-none" style={{ height: "30%" }}><div className="w-full h-full bg-gradient-to-b from-transparent via-white/90 to-transparent" /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>

                {/* Growth Potential Card */}
                <div className={`border-2 rounded-lg p-4 flex flex-col justify-between shrink-0 ${isDark ? "bg-[#12141c]/60 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`} id="growth-potential-card">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Growth Potential</span>
                  <strong className={`mt-1 block text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                    {Math.round(lettuceAssessment.growthFactor * 100)}<span className={`text-xs font-bold ${isDark ? "text-slate-500" : "text-slate-700"}`}>%</span>
                  </strong>
                </div>

                {/* Solution Strength Card */}
                <div className={`border-2 rounded-lg p-4 flex flex-col justify-between shrink-0 ${isDark ? "bg-[#12141c]/60 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`} id="solution-strength-card">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Solution Strength</span>
                  <strong className={`mt-1 block text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                    {Math.round(lettuceAssessment.solutionStrength * 100)}<span className={`text-xs font-bold ${isDark ? "text-slate-500" : "text-slate-700"}`}>% full</span>
                  </strong>
                </div>

                {/* Antioxidant Focus Card */}
                <div className={`border-2 rounded-lg p-4 flex flex-col justify-between shrink-0 ${isDark ? "bg-[#12141c]/60 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`} id="antioxidant-focus-card">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Antioxidant Focus</span>
                  <strong className={`mt-1 block text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                    {Math.round(lettuceAssessment.antioxidantFactor * 100)}<span className={`text-xs font-bold ${isDark ? "text-slate-500" : "text-slate-700"}`}>%</span>
                  </strong>
                </div>
 
                {/* Timeline Console */}
                <div className={`flex-1 border-2 rounded-lg p-3.5 flex flex-col space-y-2 min-h-[140px] overflow-hidden ${isDark ? "bg-[#12141c]/60 border-slate-700 shadow-md" : "bg-white border-slate-300 shadow-md"}`} id="simulation-timeline-card">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
                    Simulation Timeline Log
                  </span>
                  <div className={`flex-1 p-3 rounded overflow-y-auto text-xs font-mono space-y-2.5 animate-fade-in border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-300 shadow-inner"}`} id="timeline-logs-viewport">
                    {timeline.map((log, idx) => (
                      <div key={`log-row-${idx}`} className={`leading-relaxed border-l-2 pl-2.5 transition-all duration-300 ${isDark ? "border-slate-700 hover:border-lime-400" : "border-slate-300 hover:border-emerald-600"}`}>
                        <span className={`font-black ${isDark ? "text-lime-400" : "text-emerald-800"}`}>{log.slice(0, 7)}</span>
                        <span className={`font-bold ${isDark ? "text-sky-300" : "text-slate-900"}`}>{log.slice(7)}</span>
                      </div>
                    ))}
                    <div ref={timelineEndRef} />
                  </div>
                </div>

              </div>

            </div>

        </section>
      </main>

    </div>
  );
}
