import { useState } from "react";
import { Play, Pause, RotateCcw, Sliders, Settings2, Database } from "lucide-react";
import type { LettuceEnvironmentalStats, NutrientSolution, ReservoirStats } from "../../types";
import { useTheme } from "../ThemeProvider";

interface ControlsPanelProps {
  scenario: string;
  onScenarioChange: (scenario: string) => void;
  growthStage: string;
  onStageChange: (stage: "Germination" | "Seedling" | "Vegetative" | "Mature") => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  realTime: boolean;
  onRealTimeToggle: () => void;
  autoCorrect: boolean;
  onAutoCorrectToggle: () => void;
  metrics: {
    growthRate: number;
    health: number;
    age: number;
  };
  harvestDays: number;
  waterUptake: number;
  nutrientsFed: number;
  environmentalStats: LettuceEnvironmentalStats;
  onStatsChange: (stats: LettuceEnvironmentalStats) => void;
  onManualDose: () => void;
  onManualRefill: () => void;
  nutrients: NutrientSolution;
  onNutrientChange: (key: keyof NutrientSolution, val: number) => void;
  onResetNutrients: () => void;
  onResetNormalInputs?: () => void;
  activeAlerts?: { id: string; type: "critical" | "warning" | "info"; message: string }[];
  onAgeChange: (newAge: number) => void;
  simMinutes: number;
  reservoir: ReservoirStats;
  onReservoirChange: (reservoir: ReservoirStats) => void;
  turbidity: number;
  onTurbidityChange: (turbidity: number) => void;
  onTimeJump: (hours: number) => void;
  warpFactor: number;
  onWarpFactorChange: (factor: number) => void;
  tankVolume: number;
  onTankVolumeChange: (vol: number) => void;
}

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

interface HydroLiquidSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  isDark: boolean;
  id?: string;
  color?: string;
}

function HydroLiquidSlider({
  min,
  max,
  step,
  value,
  onChange,
  onDecrease,
  onIncrease,
  isDark,
  id,
  color,
}: HydroLiquidSliderProps) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const baseColor = color || "#a3e635";
  const glowColor = hexToRgba(baseColor, 0.85);
  const glowColorSoft = hexToRgba(baseColor, 0.4);
  const trackBorderColor = hexToRgba(baseColor, isDark ? 0.35 : 0.55);
  const trackBg = isDark ? "#08090f" : "#e2e8f0";

  return (
    <div className="flex items-center space-x-2.5 w-full">
      {/* Minus Button */}
      <button
        type="button"
        onClick={onDecrease}
        className={`w-5.5 h-5.5 rounded border flex items-center justify-center font-black text-xs cursor-pointer select-none active:scale-90 transition-all shrink-0 ${
          isDark
            ? "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 shadow-sm"
        }`}
      >
        −
      </button>

      {/* Capsule Track Shell with Matching Tinted Border */}
      <div
        className="relative flex-1 h-3.5 rounded-full overflow-hidden border cursor-pointer select-none flex items-center"
        style={{
          backgroundColor: trackBg,
          borderColor: trackBorderColor,
          boxShadow: isDark
            ? "inset 0 2px 4px rgba(0,0,0,0.85)"
            : "inset 0 1px 3px rgba(0,0,0,0.18)",
        }}
      >
        {/* Active Liquid Progress Fill Track with Dynamic Color Gradient & Matching Ambient Glow */}
        <div
          className="h-full rounded-full relative overflow-hidden transition-all duration-75"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${hexToRgba(baseColor, isDark ? 0.6 : 0.45)} 0%, ${baseColor} 100%)`,
            boxShadow: `0 0 16px ${glowColor}, 0 0 28px ${glowColorSoft}, inset 0 1px 2px rgba(255,255,255,0.4)`,
          }}
        >
          {/* Animated Neon Liquid Fluid Wave SVG — always active */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <svg
              className="absolute top-0 left-0 h-full w-[200%] animate-liquid-wave"
              viewBox="0 0 1200 24"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 12 Q 150 2, 300 12 T 600 12 T 900 12 T 1200 12 L 1200 24 L 0 24 Z"
                fill={isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.4)"}
              />
              <path
                d="M 0 12 Q 150 22, 300 12 T 600 12 T 900 12 T 1200 12"
                fill="none"
                stroke={isDark ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.95)"}
                strokeWidth="2.5"
              />
            </svg>
          </div>
          {/* White-hot focal centerline */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none mix-blend-overlay"
            style={{ height: "30%" }}
          >
            <div className="w-full h-full bg-gradient-to-b from-transparent via-white/80 to-transparent" />
          </div>
        </div>

        {/* Crisp Circle Handle (Matching Row's Accent Color & Multi-Layered Glow) */}
        <div
          className="w-4.5 h-4.5 rounded-full border-2 border-white absolute top-1/2 -translate-y-1/2 -ml-2.25 pointer-events-none transition-all"
          style={{
            left: `${percent}%`,
            backgroundColor: baseColor,
            boxShadow: isDark
              ? `0 0 14px ${baseColor}, 0 0 5px ${glowColor}`
              : `0 0 10px ${glowColor}, 0 0 20px ${glowColorSoft}, 0 2px 4px rgba(0,0,0,0.2)`,
          }}
        />

        {/* Native Range Input (Invisible Overlay for Mouse Drag & Touch) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          id={id}
        />
      </div>

      {/* Plus Button */}
      <button
        type="button"
        onClick={onIncrease}
        className={`w-5.5 h-5.5 rounded border flex items-center justify-center font-black text-xs cursor-pointer select-none active:scale-90 transition-all shrink-0 ${
          isDark
            ? "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 shadow-sm"
        }`}
      >
        +
      </button>
    </div>
  );
}

export default function ControlsPanel({
  scenario,
  onScenarioChange,
  growthStage,
  onStageChange,
  isRunning,
  onToggleRunning,
  onReset,
  realTime,
  onRealTimeToggle,
  autoCorrect,
  onAutoCorrectToggle,
  metrics,
  harvestDays,
  waterUptake,
  nutrientsFed,
  environmentalStats,
  onStatsChange,
  onManualDose,
  onManualRefill,
  nutrients,
  onNutrientChange,
  onResetNutrients,
  onResetNormalInputs,
  activeAlerts = [],
  onAgeChange,
  simMinutes,
  reservoir,
  onReservoirChange,
  turbidity,
  onTurbidityChange,
  onTimeJump,
  warpFactor,
  onWarpFactorChange,
  tankVolume,
  onTankVolumeChange,
}: ControlsPanelProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [controlTab, setControlTab] = useState<"Scenarios" | "Tuning" | "Nutrients" | "Days" | "Tank">("Scenarios");
  const [expandedNutrientSec, setExpandedNutrientSec] = useState<"macro" | "micro" | "fertilizers" | "additives">("macro");

  const renderNutrientInput = (
    key: keyof NutrientSolution,
    label: string,
    min: number,
    max: number,
    step: number,
    unit: string,
    hexColor?: string,
  ) => {
    const value = nutrients[key] ?? 0;
    return (
      <div className={`flex flex-col space-y-1.5 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-slate-50 border-slate-200"}`} key={key}>
        <div className="flex justify-between text-xs font-bold px-0.5">
          <span className={`font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>{label}</span>
          <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{value} {unit}</span>
        </div>
        <HydroLiquidSlider
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(val) => onNutrientChange(key, parseFloat(val.toFixed(3)))}
          onDecrease={() => onNutrientChange(key, parseFloat(Math.max(min, value - step).toFixed(3)))}
          onIncrease={() => onNutrientChange(key, parseFloat(Math.min(max, value + step).toFixed(3)))}
          isDark={isDark}
          color={hexColor}
          id={`slider-nutrient-${key}`}
        />
      </div>
    );
  };

  // Handle slider updates
  const handleSliderChange = (key: keyof LettuceEnvironmentalStats, val: number) => {
    const updated = { ...environmentalStats, [key]: val };
    
    // Automatically recalculate derived stats like Flow Rate from pumpSpeed
    if (key === "pumpSpeed") {
      updated.flowRate = parseFloat(((val / 100) * 1.5).toFixed(2));
    }
    onStatsChange(updated);
  };

  // Scenario description text
  const getScenarioDescription = (scen: string) => {
    switch (scen) {
      case "Normal Growth":
        return "Optimal variables configured. Ready for homeostasis.";
      case "Tipburn Risk":
        return "Hot room & transpiration arrest restricts Calcium uptake.";
      case "Algae Bloom":
        return "High light & organic accumulation spurs algal growth.";
      case "Pump Failure":
        return "Circulating pump stops. Solution film in channels dried.";
      default:
        return "Custom parameters configured.";
    }
  };

  return (
    <div className={`flex flex-col space-y-4.5 text-sm font-mono select-none h-full ${isDark ? "text-slate-100" : "text-slate-800"}`} id="sim-control-sidebar">
      
      {/* Simulation Playback Bar */}
      <div className={`flex flex-col space-y-3 p-3.5 rounded-lg border-2 ${isDark ? "bg-slate-950/40 border-slate-700" : "bg-white border-slate-300 shadow-md"}`} id="sim-playback-box">
        <span className={`text-xs font-extrabold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-900 font-black"}`}>
          Simulation Control Engine
        </span>
        
        {/* Core Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleRunning}
            className={`flex-1 py-2.5 px-3 rounded-lg font-black transition-all text-xs flex items-center justify-center gap-1.5 shadow-md ${
              isRunning
                ? isDark
                  ? "bg-slate-900 text-amber-500 border border-amber-500/30 hover:bg-slate-950 cursor-pointer"
                  : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer"
                : isDark
                ? "bg-[#a3e635] text-slate-950 border-transparent hover:bg-[#bbf246] active:scale-95 cursor-pointer"
                : "bg-[#15803D] text-white border-transparent hover:bg-[#166534] active:scale-95 cursor-pointer shadow-sm"
            }`}
            id="btn-toggle-sim"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Sim</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{metrics.age === 0 ? "Start Sim" : "Resume Sim"}</span>
              </>
            )}
          </button>
          <button
            onClick={onResetNormalInputs || onResetNutrients}
            className={`px-2.5 py-2 border rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[10px] font-black uppercase ${
              isDark ? "border-slate-800 bg-slate-900 text-emerald-400 hover:bg-slate-850" : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 shadow-sm"
            }`}
            title="Reset all climate sliders, reservoir EC/pH, and nutrient amounts back to normal required plant baseline"
            id="btn-reset-normal-inputs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Normal</span>
          </button>
          <button
            onClick={onReset}
            className={`p-2 border rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              isDark ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-white" : "border-slate-300 bg-white text-slate-600 hover:text-slate-900 shadow-sm"
            }`}
            title="Reset Sim Clock"
            id="btn-reset-sim"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Growth Time Jump Grid (Days Pattern) */}
        <div className={`grid grid-cols-4 gap-1 p-1.5 rounded-lg border ${isDark ? "bg-slate-950/60 border-slate-900" : "bg-slate-100 border-slate-200"}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
            <button
              key={s}
              onClick={() => {
                onTimeJump(s * 2);
                onWarpFactorChange(s);
              }}
              className={`py-1 border rounded-md text-[10.5px] font-black transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                warpFactor === s
                  ? isDark
                    ? "bg-[#a3e635] text-slate-950 border-[#a3e635] font-black shadow-[0_0_8px_rgba(163,230,53,0.35)]"
                    : "bg-[#15803D] text-white border-[#15803D] font-black shadow-sm"
                  : isDark
                  ? "bg-slate-900 hover:bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white"
                  : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
              }`}
              id={`speed-btn-${s}`}
              title={`Instantly advance simulation by ${s * 2} hours`}
            >
              <span className={`font-black ${warpFactor === s ? (isDark ? "text-slate-950" : "text-white") : isDark ? "text-[#a3e635]" : "text-emerald-700"}`}>{s}x</span>
              <span className={`text-[8.5px] font-bold ${warpFactor === s ? (isDark ? "text-emerald-950" : "text-emerald-100") : "text-slate-500"}`}>+{s * 2}h</span>
            </button>
          ))}
        </div>

        {/* Speed Growth - 24-Hour Jump Button */}
        <button
          onClick={() => {
            onTimeJump(24);
            onWarpFactorChange(12);
          }}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-[#a3e635] to-emerald-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:from-[#bbf246] hover:to-emerald-400 cursor-pointer shadow active:scale-[0.98] transition-all"
          id="btn-five-hour-jump"
          title="Instantly advance crop growth by 24 hours"
        >
          <span className="text-[12px]">⚡</span>
          <span>Jump +24 Hours (1 Day)</span>
        </button>
      </div>

      {/* Control Tabs Toggle */}
      <div className={`grid grid-cols-5 gap-1 p-1.5 rounded-lg border-2 ${isDark ? "bg-slate-950 border-slate-700" : "bg-slate-100 border-slate-300 shadow-sm"}`} id="tabs-toggle">
        <button
          onClick={() => setControlTab("Scenarios")}
          className={`py-2 px-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            controlTab === "Scenarios"
              ? isDark ? "bg-[#a3e635] text-slate-950 shadow-md" : "bg-[#15803D] text-white shadow-sm"
              : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-700 hover:text-slate-900 font-bold"
          }`}
        >
          <Settings2 className="w-3 h-3" />
          <span>Scenes</span>
        </button>
        <button
          onClick={() => setControlTab("Tuning")}
          className={`py-2 px-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            controlTab === "Tuning"
              ? isDark ? "bg-[#a3e635] text-slate-950 shadow-md" : "bg-[#15803D] text-white shadow-sm"
              : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-700 hover:text-slate-900 font-bold"
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Climate</span>
        </button>
        <button
          onClick={() => setControlTab("Nutrients")}
          className={`py-2 px-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            controlTab === "Nutrients"
              ? isDark ? "bg-[#a3e635] text-slate-950 shadow-md" : "bg-[#15803D] text-white shadow-sm"
              : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-700 hover:text-slate-900 font-bold"
          }`}
        >
          <Database className="w-3 h-3" />
          <span>Nutrients</span>
        </button>
        <button
          onClick={() => setControlTab("Days")}
          className={`py-2 px-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            controlTab === "Days"
              ? isDark ? "bg-[#a3e635] text-slate-950 shadow-md" : "bg-[#15803D] text-white shadow-sm"
              : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-700 hover:text-slate-900 font-bold"
          }`}
        >
          <span className="text-[10px]">📅</span>
          <span>Days</span>
        </button>
        <button
          onClick={() => setControlTab("Tank")}
          className={`py-2 px-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            controlTab === "Tank"
              ? isDark ? "bg-cyan-400 text-slate-950 shadow-md" : "bg-cyan-700 text-white shadow-sm font-black"
              : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-700 hover:text-slate-900 font-bold"
          }`}
          id="tab-tank-btn"
        >
          <span className="text-[10px]">🪣</span>
          <span>Tank</span>
        </button>
      </div>

      {controlTab === "Scenarios" && (
        <div className="flex flex-col space-y-4.5 shrink-0 py-1" id="tab-scenarios-panel">
          {/* SIMULATION SCENARIO SELECT */}
          <div className={`flex flex-col space-y-2.5 p-4 rounded-lg border-2 shrink-0 ${isDark ? "bg-slate-900/40 border-slate-700" : "bg-slate-50 border-slate-300 shadow-md"}`}>
            <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-900"}`}>
              Anomalies & Scenarios
            </label>
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 text-sm font-black ${isDark ? "bg-[#14151c] text-slate-100 border-slate-800" : "bg-white text-slate-900 border-slate-300 shadow-sm"}`}
              id="select-scenario"
            >
              <option value="Normal Growth">Normal Growth (Baseline)</option>
            </select>
            <p className={`text-xs leading-relaxed mt-1.5 font-bold ${isDark ? "text-slate-400" : "text-slate-900"}`}>
              {getScenarioDescription(scenario)}
            </p>
          </div>

          {/* PLANT GROWTH STAGE SELECT */}
          <div className={`flex flex-col space-y-2.5 p-4 rounded-lg border-2 shrink-0 ${isDark ? "bg-slate-900/40 border-slate-700" : "bg-slate-50 border-slate-300 shadow-md"}`}>
            <label className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-900"}`}>
              Plant Growth Stage
            </label>
            <div className="grid grid-cols-2 gap-2" id="stage-buttons-grid">
              {(["Germination", "Seedling", "Vegetative", "Mature"] as const).map((stg) => (
                <button
                  key={stg}
                  onClick={() => onStageChange(stg)}
                  className={`py-2 px-2.5 rounded-lg border text-left flex flex-col justify-between h-16 transition-all cursor-pointer ${
                    growthStage === stg
                      ? isDark
                        ? "bg-slate-950 border-[#a3e635] text-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.2)]"
                        : "bg-emerald-50 border-emerald-600 text-emerald-950 font-black shadow-sm"
                      : isDark
                      ? "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200"
                      : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm font-extrabold"
                  }`}
                >
                  <span className="font-black text-[11px]">{stg}</span>
                  <span className={`text-[9px] font-bold leading-tight ${growthStage === stg ? (isDark ? "text-emerald-400" : "text-emerald-800") : (isDark ? "text-slate-400" : "text-slate-700")}`}>
                    {stg === "Germination" && "Cotyledon sprout (Day 0-5)"}
                    {stg === "Seedling" && "Root elongation (Day 5-14)"}
                    {stg === "Vegetative" && "Rapid leafing (Day 14-28)"}
                    {stg === "Mature" && "Harvest ready (Day 28+)"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {controlTab === "Tuning" && (
        <div className={`flex flex-col space-y-4 p-4 rounded-lg border-2 overflow-y-auto flex-grow min-h-0 ${isDark ? "bg-slate-900/20 border-slate-700" : "bg-slate-50 border-slate-300 shadow-md"}`} id="tab-tuning-panel">
          
          <div className={`flex justify-between items-center border-b pb-2.5 mb-1.5 shrink-0 ${isDark ? "border-slate-950" : "border-slate-200"}`}>
            <span className={`text-xs font-extrabold uppercase tracking-wide ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
              Microclimate Tuning
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onResetNormalInputs || onResetNutrients}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors shadow-sm flex items-center gap-1"
                title="Reset all climate sliders, reservoir EC/pH, and nutrient amounts back to normal required plant baseline"
                id="btn-tuning-reset-normal"
              >
                🔄 Reset Normal
              </button>
              <button
                onClick={onManualRefill}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors shadow-sm"
                title="Refill reservoir water back to 95L"
              >
                💧 Refill
              </button>
              <button
                onClick={onManualDose}
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors shadow-sm"
                title="Dose concentrated nutrient solution"
              >
                ⚡ Dose
              </button>
            </div>
          </div>

          {/* LED intensity */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>LED intensity (PPFD)</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.ledIntensity} µmol</span>
            </div>
            <HydroLiquidSlider
              min={0}
              max={400}
              step={10}
              value={environmentalStats.ledIntensity}
              onChange={(val) => handleSliderChange("ledIntensity", val)}
              onDecrease={() => handleSliderChange("ledIntensity", Math.max(0, environmentalStats.ledIntensity - 10))}
              onIncrease={() => handleSliderChange("ledIntensity", Math.min(400, environmentalStats.ledIntensity + 10))}
              isDark={isDark}
              color="#a3e635"
              id="slider-led-intensity"
            />
          </div>

          {/* Photoperiod */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Photoperiod</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.photoperiod} hrs/day</span>
            </div>
            <HydroLiquidSlider
              min={0}
              max={24}
              step={1}
              value={environmentalStats.photoperiod}
              onChange={(val) => handleSliderChange("photoperiod", val)}
              onDecrease={() => handleSliderChange("photoperiod", Math.max(0, environmentalStats.photoperiod - 1))}
              onIncrease={() => handleSliderChange("photoperiod", Math.min(24, environmentalStats.photoperiod + 1))}
              isDark={isDark}
              color="#2563eb"
              id="slider-photoperiod"
            />
          </div>

          {/* Pump speed */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Recirculation Pump</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.pumpSpeed}% ({environmentalStats.flowRate} L/m)</span>
            </div>
            <HydroLiquidSlider
              min={0}
              max={100}
              step={5}
              value={environmentalStats.pumpSpeed}
              onChange={(val) => handleSliderChange("pumpSpeed", val)}
              onDecrease={() => handleSliderChange("pumpSpeed", Math.max(0, environmentalStats.pumpSpeed - 5))}
              onIncrease={() => handleSliderChange("pumpSpeed", Math.min(100, environmentalStats.pumpSpeed + 5))}
              isDark={isDark}
              color="#06b6d4"
              id="slider-pump-speed"
            />
          </div>

          {/* Ambient Air Temp */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Ambient Air Temp</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.airTemp.toFixed(1)} °C</span>
            </div>
            <HydroLiquidSlider
              min={10}
              max={45}
              step={0.5}
              value={environmentalStats.airTemp}
              onChange={(val) => handleSliderChange("airTemp", val)}
              onDecrease={() => handleSliderChange("airTemp", Math.max(10, environmentalStats.airTemp - 0.5))}
              onIncrease={() => handleSliderChange("airTemp", Math.min(45, environmentalStats.airTemp + 0.5))}
              isDark={isDark}
              color="#f97316"
              id="slider-air-temp"
            />
          </div>

          {/* Nutrient Water Temp */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Nutrient Water Temp</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.waterTemp.toFixed(1)} °C</span>
            </div>
            <HydroLiquidSlider
              min={10}
              max={40}
              step={0.5}
              value={environmentalStats.waterTemp}
              onChange={(val) => handleSliderChange("waterTemp", val)}
              onDecrease={() => handleSliderChange("waterTemp", Math.max(10, environmentalStats.waterTemp - 0.5))}
              onIncrease={() => handleSliderChange("waterTemp", Math.min(40, environmentalStats.waterTemp + 0.5))}
              isDark={isDark}
              color="#14b8a6"
              id="slider-water-temp"
            />
          </div>

          {/* Cabin Humidity */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Cabin Humidity</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.humidity}%</span>
            </div>
            <HydroLiquidSlider
              min={10}
              max={100}
              step={5}
              value={environmentalStats.humidity}
              onChange={(val) => handleSliderChange("humidity", val)}
              onDecrease={() => handleSliderChange("humidity", Math.max(10, environmentalStats.humidity - 5))}
              onIncrease={() => handleSliderChange("humidity", Math.min(100, environmentalStats.humidity + 5))}
              isDark={isDark}
              color="#a855f7"
              id="slider-humidity"
            />
          </div>

          {/* Nutrient Target EC */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Target EC (Concentration)</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.targetEC.toFixed(2)} mS/cm</span>
            </div>
            <HydroLiquidSlider
              min={0.5}
              max={3.0}
              step={0.05}
              value={environmentalStats.targetEC}
              onChange={(val) => handleSliderChange("targetEC", val)}
              onDecrease={() => handleSliderChange("targetEC", parseFloat(Math.max(0.5, environmentalStats.targetEC - 0.05).toFixed(2)))}
              onIncrease={() => handleSliderChange("targetEC", parseFloat(Math.min(3.0, environmentalStats.targetEC + 0.05).toFixed(2)))}
              isDark={isDark}
              color="#eab308"
              id="slider-target-ec"
            />
          </div>

          {/* Target pH */}
          <div className={`flex flex-col space-y-2 shrink-0 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Target pH</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{environmentalStats.targetPH.toFixed(2)} pH</span>
            </div>
            <HydroLiquidSlider
              min={4.5}
              max={8.5}
              step={0.05}
              value={environmentalStats.targetPH}
              onChange={(val) => handleSliderChange("targetPH", val)}
              onDecrease={() => handleSliderChange("targetPH", parseFloat(Math.max(4.5, environmentalStats.targetPH - 0.05).toFixed(2)))}
              onIncrease={() => handleSliderChange("targetPH", parseFloat(Math.min(8.5, environmentalStats.targetPH + 0.05).toFixed(2)))}
              isDark={isDark}
              color="#84cc16"
              id="slider-target-ph"
            />
          </div>

          {/* Direct Solution Overrides Separator */}
          <div className={`border-t my-1 pt-2.5 flex flex-col space-y-3.5 shrink-0 ${isDark ? "border-slate-950" : "border-slate-200"}`}>
            <span className={`text-[11px] font-black uppercase tracking-wide ${isDark ? "text-amber-500" : "text-amber-700"}`}>
              Direct Solution Overrides
            </span>

            {/* Direct Reservoir pH */}
            <div className={`flex flex-col space-y-2 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex justify-between text-xs font-bold px-0.5">
                <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Direct Reservoir pH</span>
                <span className={`font-black ${isDark ? "text-[#84cc16]" : "text-lime-700"}`}>{reservoir.pH.toFixed(2)} pH</span>
              </div>
              <HydroLiquidSlider
                min={3.0}
                max={10.0}
                step={0.05}
                value={reservoir.pH}
                onChange={(val) => onReservoirChange({ ...reservoir, pH: val })}
                onDecrease={() => onReservoirChange({ ...reservoir, pH: parseFloat(Math.max(3.0, reservoir.pH - 0.05).toFixed(2)) })}
                onIncrease={() => onReservoirChange({ ...reservoir, pH: parseFloat(Math.min(10.0, reservoir.pH + 0.05).toFixed(2)) })}
                isDark={isDark}
                color="#84cc16"
                id="slider-reservoir-ph"
              />
            </div>

            {/* Direct Reservoir TDS / EC */}
            <div className={`flex flex-col space-y-2 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex justify-between text-xs font-bold px-0.5">
                <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Direct Reservoir TDS</span>
                <span className={`font-black ${isDark ? "text-[#eab308]" : "text-amber-800"}`}>{reservoir.tds} ppm ({reservoir.ec.toFixed(2)} mS/cm)</span>
              </div>
              <HydroLiquidSlider
                min={100}
                max={2500}
                step={25}
                value={reservoir.tds}
                onChange={(val) => {
                  const nextEC = parseFloat((val / 640).toFixed(2));
                  onReservoirChange({ ...reservoir, tds: val, ec: nextEC });
                }}
                onDecrease={() => {
                  const nextTds = Math.max(100, reservoir.tds - 25);
                  const nextEC = parseFloat((nextTds / 640).toFixed(2));
                  onReservoirChange({ ...reservoir, tds: nextTds, ec: nextEC });
                }}
                onIncrease={() => {
                  const nextTds = Math.min(2500, reservoir.tds + 25);
                  const nextEC = parseFloat((nextTds / 640).toFixed(2));
                  onReservoirChange({ ...reservoir, tds: nextTds, ec: nextEC });
                }}
                isDark={isDark}
                color="#eab308"
                id="slider-reservoir-tds"
              />
            </div>

            {/* Direct Solution Turbidity */}
            <div className={`flex flex-col space-y-2 p-2.5 rounded-lg border ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex justify-between text-xs font-bold px-0.5">
                <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Direct Water Turbidity</span>
                <span className={`font-black ${isDark ? "text-[#ec4899]" : "text-pink-700"}`}>{turbidity.toFixed(1)} NTU</span>
              </div>
              <HydroLiquidSlider
                min={1.0}
                max={15.0}
                step={0.1}
                value={turbidity}
                onChange={(val) => onTurbidityChange(val)}
                onDecrease={() => onTurbidityChange(parseFloat(Math.max(1.0, turbidity - 0.1).toFixed(1)))}
                onIncrease={() => onTurbidityChange(parseFloat(Math.min(15.0, turbidity + 0.1).toFixed(1)))}
                isDark={isDark}
                color="#ec4899"
                id="slider-turbidity"
              />
            </div>
          </div>
        </div>
      )}

      {controlTab === "Nutrients" && (
        <div className={`flex flex-col space-y-3 p-4 rounded-lg border-2 overflow-y-auto flex-grow min-h-0 ${isDark ? "bg-slate-900/20 border-slate-700" : "bg-slate-50 border-slate-300 shadow-md"}`} id="tab-nutrients-panel">
          <div className={`flex justify-between items-center border-b pb-2 mb-1.5 shrink-0 ${isDark ? "border-slate-950" : "border-slate-200"}`}>
            <span className={`text-xs font-extrabold uppercase tracking-wide ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
              Nutrient Recipe Tuning
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onResetNormalInputs || onResetNutrients}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors shadow-sm flex items-center gap-1"
                title="Reset all climate sliders, reservoir EC/pH, and nutrient amounts back to normal required plant baseline"
                id="btn-nutrients-reset-normal"
              >
                🔄 Reset Normal
              </button>
              <button
                onClick={onResetNutrients}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-black cursor-pointer uppercase transition-colors shadow-sm"
              >
                Reset Recipe
              </button>
            </div>
          </div>

          {/* Accordion Tabs */}
          <div className="grid grid-cols-2 gap-1.5 shrink-0 text-[10px] font-bold">
            <button
              onClick={() => setExpandedNutrientSec("macro")}
              className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                expandedNutrientSec === "macro"
                  ? isDark ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 font-black" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-sm"
                  : isDark ? "bg-slate-900/40 border-slate-950 text-slate-400 hover:text-slate-250" : "bg-white border-slate-300 text-slate-900 font-black hover:bg-slate-100 shadow-sm"
              }`}
            >
              Macro Elements
            </button>
            <button
              onClick={() => setExpandedNutrientSec("micro")}
              className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                expandedNutrientSec === "micro"
                  ? isDark ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 font-black" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-sm"
                  : isDark ? "bg-slate-900/40 border-slate-950 text-slate-400 hover:text-slate-250" : "bg-white border-slate-300 text-slate-900 font-black hover:bg-slate-100 shadow-sm"
              }`}
            >
              Micro Elements
            </button>
            <button
              onClick={() => setExpandedNutrientSec("fertilizers")}
              className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                expandedNutrientSec === "fertilizers"
                  ? isDark ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 font-black" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-sm"
                  : isDark ? "bg-slate-900/40 border-slate-950 text-slate-400 hover:text-slate-250" : "bg-white border-slate-300 text-slate-900 font-black hover:bg-slate-100 shadow-sm"
              }`}
            >
              Salt Fertilizers
            </button>
            <button
              onClick={() => setExpandedNutrientSec("additives")}
              className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                expandedNutrientSec === "additives"
                  ? isDark ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 font-black" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-sm"
                  : isDark ? "bg-slate-900/40 border-slate-950 text-slate-400 hover:text-slate-250" : "bg-white border-slate-300 text-slate-900 font-black hover:bg-slate-100 shadow-sm"
              }`}
            >
              Water Additives
            </button>
          </div>

          <div className="flex flex-col space-y-2.5 overflow-y-auto flex-grow pr-1">
            {expandedNutrientSec === "macro" && (
              <>
                {renderNutrientInput("nitrogen",   "Nitrogen (N) — Rapid leaf growth",  0, 300,  5,  "ppm", "#3b82f6")}
                {renderNutrientInput("phosphorus",  "Phosphorus (P) — Root expansion",   0, 100,  1,  "ppm", "#a855f7")}
                {renderNutrientInput("potassium",   "Potassium (K) — Leaf crispness",    0, 350,  5,  "ppm", "#eab308")}
                {renderNutrientInput("calcium",     "Calcium (Ca) — Prevent tipburn",    0, 200,  5,  "ppm", "#ef4444")}
                {renderNutrientInput("magnesium",   "Magnesium (Mg) — Photosynthesis",   0,  80,  2,  "ppm", "#ec4899")}
                {renderNutrientInput("sulfur",      "Sulfur (S) — Plant proteins",       0,  80,  2,  "ppm", "#14b8a6")}
              </>
            )}

            {expandedNutrientSec === "micro" && (
              <>
                {renderNutrientInput("iron",       "Iron (Fe) — Prevent leaf yellowing",    0, 3,   0.05,  "ppm", "#f97316")}
                {renderNutrientInput("manganese",  "Manganese (Mn) — Nitrogen metabolism",  0, 1,   0.01,  "ppm", "#84cc16")}
                {renderNutrientInput("zinc",       "Zinc (Zn) — Activate growth hormones",  0, 0.5, 0.005, "ppm", "#06b6d4")}
                {renderNutrientInput("boron",      "Boron (B) — Stable cell walls",         0, 0.5, 0.005, "ppm", "#3b82f6")}
                {renderNutrientInput("copper",     "Copper (Cu) — Immune defenses",         0, 0.1, 0.001, "ppm", "#a855f7")}
                {renderNutrientInput("molybdenum", "Molybdenum (Mo) — Convert nitrates",    0, 0.1, 0.001, "ppm", "#eab308")}
                {renderNutrientInput("chlorine",   "Chlorine (Cl) — Keep under 5.0 ppm",   0, 5,   0.1,   "ppm", "#10b981")}
              </>
            )}

            {expandedNutrientSec === "fertilizers" && (
              <>
                {renderNutrientInput("calciumNitrate",         "Calcium Nitrate — Ca & NO₃",     0, 60,  0.5,  "g/100L", "#3b82f6")}
                {renderNutrientInput("potassiumNitrate",        "Potassium Nitrate — K & NO₃",    0, 30,  0.5,  "g/100L", "#eab308")}
                {renderNutrientInput("monoammoniumPhosphate",   "MAP — NH₄⁺ & Phosphorus",        0, 10,  0.1,  "g/100L", "#a855f7")}
                {renderNutrientInput("epsomSalts",              "Epsom Salts — Mg & Sulfur",      0, 20,  0.5,  "g/100L", "#ec4899")}
                {renderNutrientInput("ironChelate",             "Iron Chelate (Fe-DTPA)",         0,  5,  0.1,  "g/100L", "#f97316")}
                {renderNutrientInput("traceMicronutrientBlend", "Trace Micronutrient Blend",      0,  3,  0.05, "g/100L", "#14b8a6")}
              </>
            )}

            {expandedNutrientSec === "additives" && (
              <>
                {renderNutrientInput("phosphoricAcid",           "Phosphoric Acid (pH Down)",           0, 20, 0.1, "mL/100L", "#ef4444")}
                {renderNutrientInput("nitricAcid",               "Nitric Acid (pH Down Alt)",           0, 15, 0.1, "mL/100L", "#3b82f6")}
                {renderNutrientInput("potassiumHydroxide",       "Potassium Hydroxide (pH Up)",         0, 15, 0.1, "mL/100L", "#eab308")}
                {renderNutrientInput("bacillusAmyloliquefaciens","Bacillus amyloliquefaciens — Bio Prot",0, 50, 0.5, "mL/100L", "#10b981")}
                {renderNutrientInput("hypochlorousAcid",         "Hypochlorous Acid — Sterile",         0, 80, 1,   "mL/100L", "#6366f1")}
              </>
            )}
          </div>
        </div>
      )}

      {controlTab === "Days" && (
        <div className={`flex flex-col space-y-4 p-4 rounded-lg border-2 overflow-y-auto shrink-0 ${isDark ? "bg-slate-900/20 border-slate-700" : "bg-slate-50 border-slate-300 shadow-md"}`} id="tab-days-panel">
          <div className={`flex justify-between items-center border-b pb-2.5 mb-1.5 shrink-0 ${isDark ? "border-slate-950" : "border-slate-200"}`}>
            <span className={`text-xs font-extrabold uppercase tracking-wide ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
              Simulated Time & Crop Age
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-black ${isDark ? "text-emerald-400 bg-emerald-950/20 border border-emerald-900/30" : "text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm"}`}>
              Day {Math.floor(simMinutes / 1440) + 1}
            </span>
          </div>

          {/* Simulated Elapsed Time readout */}
          <div className={`p-3 rounded-lg border text-xs space-y-1.5 shrink-0 ${isDark ? "bg-[#14151b] border-slate-900 text-slate-300" : "bg-white border-slate-300 text-slate-900 shadow-sm"}`}>
            <div className="flex justify-between">
              <span className={`font-black ${isDark ? "text-slate-500" : "text-slate-900"}`}>Total Sim Elapsed:</span>
              <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{Math.floor(simMinutes / 1440)}d {Math.floor((simMinutes % 1440) / 60)}h {simMinutes % 60}m</span>
            </div>
            <div className="flex justify-between">
              <span className={`font-black ${isDark ? "text-slate-500" : "text-slate-900"}`}>Current Crop Age:</span>
              <span className={`font-black ${isDark ? "text-[#a3e635]" : "text-emerald-800"}`}>{metrics.age.toFixed(1)} Days</span>
            </div>
          </div>

          {/* Quick 24-Hour Jump */}
          <button
            onClick={() => {
              onTimeJump(24);
              onWarpFactorChange(12);
            }}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#a3e635] to-emerald-500 hover:from-[#bbf246] hover:to-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow shrink-0"
            id="btn-days-five-hour-jump"
            title="Advance crop life and solution updates by exactly 24 hours"
          >
            <span>⚡ Jump +24 Hours (1 Day)</span>
          </button>

          {/* Crop Age fine-tuning Slider */}
          <div className={`flex flex-col space-y-2 p-2.5 rounded-lg border shrink-0 ${isDark ? "bg-[#14151b]/40 border-slate-900/60" : "bg-white border-slate-300 shadow-sm"}`}>
            <div className="flex justify-between text-xs font-bold px-0.5">
              <span className={`font-black uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-900"}`}>Fine-Tune Crop Age</span>
              <span className={`font-black text-xs ${isDark ? "text-white" : "text-slate-900"}`}>{metrics.age.toFixed(1)} Days</span>
            </div>
            <HydroLiquidSlider
              min={0}
              max={35}
              step={0.5}
              value={metrics.age}
              onChange={(val) => onAgeChange(val)}
              onDecrease={() => onAgeChange(parseFloat(Math.max(0, metrics.age - 0.5).toFixed(1)))}
              onIncrease={() => onAgeChange(parseFloat(Math.min(35, metrics.age + 0.5).toFixed(1)))}
              isDark={isDark}
              id="slider-fine-tune-crop-age"
            />
            <p className={`text-[9.5px] font-bold mt-1 leading-normal italic px-0.5 ${isDark ? "text-slate-500" : "text-slate-700"}`}>
              Adjusting the age immediately recalculates leaves, root length, and canopy biomass.
            </p>
          </div>

          {/* Quick-Jump Milestone Buttons */}
          <div className={`flex flex-col space-y-2 p-3 rounded-lg border shrink-0 ${isDark ? "bg-slate-900/40 border-slate-900" : "bg-white border-slate-300 shadow-sm"}`}>
            <span className={`text-[11px] uppercase tracking-wider font-extrabold ${isDark ? "text-slate-400" : "text-slate-900"}`}>
              Lifecycle Milestones
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAgeChange(0)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 0 && metrics.age < 5
                    ? isDark ? "bg-slate-950 border-[#a3e635] text-[#a3e635]" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-md"
                    : isDark ? "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm"
                }`}
              >
                <span className="font-extrabold">Day 0: Germination</span>
                <span className={`text-[8.5px] font-bold ${metrics.age >= 0 && metrics.age < 5 ? (isDark ? "text-slate-500" : "text-emerald-100") : (isDark ? "text-slate-500" : "text-slate-600")}`}>Sprout begins</span>
              </button>
              <button
                onClick={() => onAgeChange(5)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 5 && metrics.age < 14
                    ? isDark ? "bg-slate-950 border-[#a3e635] text-[#a3e635]" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-md"
                    : isDark ? "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm"
                }`}
              >
                <span className="font-extrabold">Day 5: Seedling</span>
                <span className={`text-[8.5px] font-bold ${metrics.age >= 5 && metrics.age < 14 ? (isDark ? "text-slate-500" : "text-emerald-100") : (isDark ? "text-slate-500" : "text-slate-600")}`}>Roots active</span>
              </button>
              <button
                onClick={() => onAgeChange(14)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 14 && metrics.age < 28
                    ? isDark ? "bg-slate-950 border-[#a3e635] text-[#a3e635]" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-md"
                    : isDark ? "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm"
                }`}
              >
                <span className="font-extrabold">Day 14: Vegetative</span>
                <span className={`text-[8.5px] font-bold ${metrics.age >= 14 && metrics.age < 28 ? (isDark ? "text-slate-500" : "text-emerald-100") : (isDark ? "text-slate-500" : "text-slate-600")}`}>Rapid leafing</span>
              </button>
              <button
                onClick={() => onAgeChange(28)}
                className={`py-1.5 px-2.5 rounded-lg font-bold text-[10px] border text-left flex flex-col justify-between h-14 transition-all cursor-pointer ${
                  metrics.age >= 28
                    ? isDark ? "bg-slate-950 border-[#a3e635] text-[#a3e635]" : "bg-emerald-700 border-emerald-800 text-white font-black shadow-md"
                    : isDark ? "bg-[#14151b] border-slate-900 text-slate-400 hover:text-slate-200" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm"
                }`}
              >
                <span className="font-extrabold">Day 28: Mature</span>
                <span className={`text-[8.5px] font-bold ${metrics.age >= 28 ? (isDark ? "text-slate-500" : "text-emerald-100") : (isDark ? "text-slate-500" : "text-slate-600")}`}>Ready for yield</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switches & Safeties */}
      <div className={`flex flex-col space-y-1.5 p-2.5 rounded border-2 ${isDark ? "bg-[#12141c]/50 border-slate-700" : "bg-slate-50 border-slate-300 shadow-md"}`} id="automatic-safeties">
        <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${isDark ? "text-slate-500" : "text-slate-900"}`}>
          Automation Loops
        </span>
        <div className="flex justify-between gap-4">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={realTime}
              onChange={onRealTimeToggle}
              className="rounded accent-[#15803D] bg-slate-800 border-slate-700 text-[#15803D] focus:ring-0"
              id="chk-real-time"
            />
            <span className={`text-[10.5px] font-black ${isDark ? "text-slate-300" : "text-slate-900"}`}>Real-time stats</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCorrect}
              onChange={onAutoCorrectToggle}
              className="rounded accent-[#15803D] bg-slate-800 border-slate-700 text-[#15803D] focus:ring-0"
              id="chk-auto-correct"
            />
            <span className={`text-[10.5px] font-black ${isDark ? "text-slate-300" : "text-slate-900"}`}>Auto Dosing</span>
          </label>
        </div>
      </div>

      {/* Accumulated simulation telemetry readout */}
      <div className={`p-3 rounded-lg border-2 flex flex-col space-y-2.5 mt-auto shrink-0 ${isDark ? "bg-[#12141c]/60 border-slate-700" : "bg-white border-slate-300 shadow-md"}`} id="accumulated-ledger">
        <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-yellow-500" : "text-amber-700"}`}>
          Resources Accumulated Ledger
        </span>
        <div className="grid grid-cols-2 gap-2.5 shrink-0" id="ledger-stats">
          <div className={`p-2.5 rounded-lg border flex flex-col space-y-1 justify-center ${isDark ? "bg-slate-950/45 border-slate-900/60" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[9px] uppercase font-black tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Water Absorbed</span>
            <span className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}>💧 {waterUptake.toFixed(2)} L</span>
          </div>
          <div className={`p-2.5 rounded-lg border flex flex-col space-y-1 justify-center ${isDark ? "bg-slate-950/45 border-slate-900/60" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[9px] uppercase font-black tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Minerals Fed</span>
            <span className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}>🧪 {nutrientsFed.toFixed(2)} g</span>
          </div>
          <div className={`p-2.5 rounded-lg border flex flex-col space-y-1 justify-center ${isDark ? "bg-slate-950/45 border-slate-900/60" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[9px] uppercase font-black tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Net Growth Rate</span>
            <span className={`font-black text-sm ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>📈 +{metrics.growthRate.toFixed(2)}%</span>
          </div>
          <div className={`p-2.5 rounded-lg border flex flex-col space-y-1 justify-center ${isDark ? "bg-slate-950/45 border-slate-900/60" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[9px] uppercase font-black tracking-wider ${isDark ? "text-slate-500" : "text-slate-900"}`}>Harvest Horizon</span>
            <span className={`font-black text-sm ${isDark ? "text-slate-200" : "text-slate-900"}`}>⏱️ {harvestDays.toFixed(1)} Days</span>
          </div>
        </div>
      </div>

      {/* Real-time System Alerts Slot */}
      <div className={`p-3 rounded-lg border-2 flex flex-col space-y-2 flex-1 min-h-[110px] overflow-hidden mt-auto ${isDark ? "bg-[#12141c]/80 border-slate-700" : "bg-white border-slate-300 shadow-md"}`} id="sim-alerts-slot">
        <div className="flex items-center justify-between shrink-0">
          <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-amber-400" : "text-amber-800 font-black"}`}>
            ⚠️ Real-Time Alerts
          </span>
          <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded ${
            activeAlerts.length > 0
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
          }`}>
            {activeAlerts.length > 0 ? `${activeAlerts.length} Active` : "Nominal"}
          </span>
        </div>

        <div className="flex-1 flex flex-col space-y-1.5 overflow-y-auto pr-0.5 min-h-0">
          {activeAlerts.length > 0 ? (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`px-2.5 py-1.5 rounded border text-xs font-black flex items-center gap-2 transition-all shrink-0 ${
                  alert.type === "critical"
                    ? isDark
                      ? "bg-red-950/50 border-red-800 text-red-300"
                      : "bg-red-50 border-red-300 text-red-900 shadow-sm"
                    : isDark
                    ? "bg-amber-950/50 border-amber-800 text-amber-300"
                    : "bg-amber-50 border-amber-300 text-amber-900 shadow-sm"
                }`}
              >
                <span className="text-sm shrink-0">{alert.type === "critical" ? "🚨" : "⚠️"}</span>
                <span className="leading-tight flex-1">{alert.message}</span>
              </div>
            ))
          ) : (
            <div className={`px-2.5 py-2 rounded border text-xs font-black flex items-center gap-2 shrink-0 ${isDark ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400" : "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm"}`}>
              <span>✅</span>
              <span>All parameters within safe limits</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TANK SETUP TAB ═══ */}
      {controlTab === "Tank" && (
        <div className="flex flex-col space-y-3 overflow-y-auto flex-grow pr-1" id="tab-tank-panel">

          {/* Tank Volume Input */}
          <div className={`border-2 rounded-lg p-4 flex flex-col space-y-3 shrink-0 ${isDark ? "bg-[#12141c]/80 border-cyan-900/40" : "bg-slate-50 border-slate-300 shadow-md"}`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? "border-slate-900" : "border-slate-200"}`}>
              <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-cyan-400" : "text-cyan-800 font-black"}`}>
                🪣 Tank Volume Setup
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? "text-slate-400 bg-cyan-950/30 border border-cyan-900/30" : "text-cyan-900 bg-cyan-100 border border-cyan-300 font-black shadow-sm"}`}>
                {tankVolume} L capacity
              </span>
            </div>

            {/* Volume Slider */}
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between text-xs font-bold px-0.5">
                <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>Water Tank Volume</span>
                <span className={`font-black ${isDark ? "text-cyan-300" : "text-cyan-800 font-black"}`}>{tankVolume} Litres</span>
              </div>
              <HydroLiquidSlider
                min={10}
                max={500}
                step={5}
                value={tankVolume}
                onChange={(val) => onTankVolumeChange(val)}
                onDecrease={() => onTankVolumeChange(Math.max(10, tankVolume - 5))}
                onIncrease={() => onTankVolumeChange(Math.min(500, tankVolume + 5))}
                isDark={isDark}
                color="#06b6d4"
                id="slider-tank-volume"
              />
              {/* Quick presets */}
              <div className="flex gap-1 flex-wrap pt-1">
                {[20, 50, 100, 200, 300].map((v) => (
                  <button
                    key={v}
                    onClick={() => onTankVolumeChange(v)}
                    className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${
                      tankVolume === v
                        ? "bg-cyan-700 text-white font-black shadow-sm"
                        : isDark ? "bg-slate-900 border border-slate-880 text-slate-400 hover:text-white" : "bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 font-black shadow-sm"
                    }`}
                  >
                    {v}L
                  </button>
                ))}
              </div>
            </div>

            {/* Summary bar */}
            <div className={`grid grid-cols-3 gap-2 text-center rounded-lg p-2 border ${isDark ? "bg-slate-950/40 border-slate-900" : "bg-white border-slate-300 shadow-sm"}`}>
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase ${isDark ? "text-slate-500" : "text-slate-900"}`}>Expected TDS</span>
                <span className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>~900 ppm</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase ${isDark ? "text-slate-500" : "text-slate-900"}`}>Expected EC</span>
                <span className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>~1.40 mS/cm</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase ${isDark ? "text-slate-500" : "text-slate-900"}`}>Target pH</span>
                <span className={`text-xs font-black ${isDark ? "text-cyan-300" : "text-cyan-800"}`}>6.0 – 6.5</span>
              </div>
            </div>
          </div>

          {/* Calculated Dosing Amounts */}
          <div className={`border-2 rounded-lg p-4 flex flex-col space-y-3 ${isDark ? "bg-[#12141c]/80 border-cyan-900/40" : "bg-slate-50 border-slate-300 shadow-md"}`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? "border-slate-900" : "border-slate-200"}`}>
              <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-cyan-400" : "text-cyan-800 font-black"}`}>
                📐 Calculated Dosing — for {tankVolume} L
              </span>
              <span className={`text-[9px] font-bold italic ${isDark ? "text-slate-500" : "text-slate-700"}`}>auto-scaled from recipe</span>
            </div>

            {/* Dry Salts */}
            <div className="flex flex-col space-y-1.5">
              <span className={`text-[9.5px] uppercase font-black tracking-widest border-b pb-1 ${isDark ? "text-slate-400 border-slate-900/60" : "text-slate-900 border-slate-200"}`}>
                🧂 Dry Salt Fertilizers (grams to dissolve)
              </span>
              {[
                { label: "Calcium Nitrate",    key: "calciumNitrate" as const,         color: isDark ? "text-blue-400" : "text-blue-700" },
                { label: "Potassium Nitrate",   key: "potassiumNitrate" as const,       color: isDark ? "text-yellow-400" : "text-amber-700" },
                { label: "MAP (Phosphorus)",    key: "monoammoniumPhosphate" as const,  color: isDark ? "text-purple-400" : "text-purple-700" },
                { label: "Epsom Salts",         key: "epsomSalts" as const,             color: isDark ? "text-pink-400" : "text-pink-700" },
                { label: "Iron Chelate (DTPA)", key: "ironChelate" as const,            color: isDark ? "text-orange-400" : "text-orange-700" },
                { label: "Trace Blend",         key: "traceMicronutrientBlend" as const,color: isDark ? "text-teal-400" : "text-teal-700" },
              ].map(({ label, key, color }) => {
                const perHundred = nutrients[key] as number;
                const forTank = parseFloat(((perHundred / 100) * tankVolume).toFixed(2));
                return (
                  <div key={key} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${isDark ? "bg-slate-950/30 border-slate-900/50" : "bg-white border-slate-300 shadow-sm"}`}>
                    <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black ${color}`}>{forTank} g</span>
                      <span className={`text-[9.5px] font-black ${isDark ? "text-slate-600" : "text-slate-900"}`}>({perHundred} g/100L)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Liquid Additives */}
            <div className="flex flex-col space-y-1.5">
              <span className={`text-[9.5px] uppercase font-black tracking-widest border-b pb-1 ${isDark ? "text-slate-400 border-slate-900/60" : "text-slate-900 border-slate-200"}`}>
                🧪 Liquid Additives (mL to add)
              </span>
              {[
                { label: "Phosphoric Acid (pH↓)",  key: "phosphoricAcid" as const,           color: isDark ? "text-red-400" : "text-red-700" },
                { label: "Nitric Acid (pH↓ alt)",  key: "nitricAcid" as const,               color: isDark ? "text-sky-400" : "text-sky-700" },
                { label: "KOH (pH↑)",              key: "potassiumHydroxide" as const,        color: isDark ? "text-amber-400" : "text-amber-700" },
                { label: "Bacillus amyloliq.",      key: "bacillusAmyloliquefaciens" as const, color: isDark ? "text-emerald-400" : "text-emerald-700" },
                { label: "Hypochlorous Acid",       key: "hypochlorousAcid" as const,          color: isDark ? "text-indigo-400" : "text-indigo-700" },
              ].map(({ label, key, color }) => {
                const perHundred = nutrients[key] as number;
                const forTank = parseFloat(((perHundred / 100) * tankVolume).toFixed(2));
                return (
                  <div key={key} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${isDark ? "bg-slate-950/30 border-slate-900/50" : "bg-white border-slate-300 shadow-sm"}`}>
                    <span className={`font-black ${isDark ? "text-slate-400" : "text-slate-900"}`}>{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black ${color}`}>{forTank} mL</span>
                      <span className={`text-[9.5px] font-black ${isDark ? "text-slate-600" : "text-slate-900"}`}>({perHundred} mL/100L)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Elemental Result Summary */}
            <div className="flex flex-col space-y-1.5">
              <span className={`text-[9.5px] uppercase font-black tracking-widest border-b pb-1 ${isDark ? "text-slate-400 border-slate-900/60" : "text-slate-900 border-slate-200"}`}>
                ⚗️ Resulting Concentrations (same regardless of tank size)
              </span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {[
                  { label: "N",   val: nutrients.nitrogen,  unit: "ppm", color: isDark ? "bg-blue-950/40 border-blue-900/40 text-blue-300" : "bg-blue-100 border-blue-400 text-blue-950" },
                  { label: "P",   val: nutrients.phosphorus, unit: "ppm", color: isDark ? "bg-purple-950/40 border-purple-900/40 text-purple-300" : "bg-purple-100 border-purple-400 text-purple-950" },
                  { label: "K",   val: nutrients.potassium, unit: "ppm", color: isDark ? "bg-yellow-950/40 border-yellow-900/40 text-yellow-300" : "bg-amber-100 border-amber-400 text-amber-950" },
                  { label: "Ca",  val: nutrients.calcium,   unit: "ppm", color: isDark ? "bg-red-950/40 border-red-900/40 text-red-300" : "bg-red-100 border-red-400 text-red-950" },
                  { label: "Mg",  val: nutrients.magnesium, unit: "ppm", color: isDark ? "bg-pink-950/40 border-pink-900/40 text-pink-300" : "bg-pink-100 border-pink-400 text-pink-950" },
                  { label: "S",   val: nutrients.sulfur,    unit: "ppm", color: isDark ? "bg-teal-950/40 border-teal-900/40 text-teal-300" : "bg-teal-100 border-teal-400 text-teal-950" },
                ].map(({ label, val, unit, color }) => (
                  <div key={label} className={`flex flex-col items-center p-1.5 rounded border font-black shadow-sm ${color}`}>
                    <span className="font-black text-[11px]">{val}</span>
                    <span className="text-[8px] font-extrabold uppercase">{label} {unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
