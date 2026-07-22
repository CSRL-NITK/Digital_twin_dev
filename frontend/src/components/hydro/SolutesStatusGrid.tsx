import { useMemo } from "react";

export type NutrientKey =
  | "nitrogen"
  | "phosphorus"
  | "potassium"
  | "calcium"
  | "magnesium"
  | "sulfur";

export interface NutrientConfig {
  key: NutrientKey;
  label: string;
  min: number;
  max: number;
  target: number;
  unit: string;
  colorHex: string;
  glowColor: string;
}

export const MACRO_NUTRIENT_CONFIGS: Record<NutrientKey, NutrientConfig> = {
  nitrogen: {
    key: "nitrogen",
    label: "Nitrogen (N)",
    min: 100,
    target: 150,
    max: 200,
    unit: "ppm",
    colorHex: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.85)",
  },
  phosphorus: {
    key: "phosphorus",
    label: "Phosphorus (P)",
    min: 20,
    target: 31,
    max: 50,
    unit: "ppm",
    colorHex: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.85)",
  },
  potassium: {
    key: "potassium",
    label: "Potassium (K)",
    min: 150,
    target: 210,
    max: 280,
    unit: "ppm",
    colorHex: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.85)",
  },
  calcium: {
    key: "calcium",
    label: "Calcium (Ca)",
    min: 60,
    target: 90,
    max: 140,
    unit: "ppm",
    colorHex: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.85)",
  },
  magnesium: {
    key: "magnesium",
    label: "Magnesium (Mg)",
    min: 15,
    target: 24,
    max: 40,
    unit: "ppm",
    colorHex: "#818cf8",
    glowColor: "rgba(129, 140, 248, 0.85)",
  },
  sulfur: {
    key: "sulfur",
    label: "Sulfur (S)",
    min: 20,
    target: 32,
    max: 55,
    unit: "ppm",
    colorHex: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.85)",
  },
};

function hexToRgba(hex: string, alpha: number = 1): string {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((char) => char + char).join("");
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function VolumetricLaserConduit({
  value,
  max,
  label,
  unit,
  minLimit,
  target,
  maxLimit,
  colorHex,
  isDark = true,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  minLimit: number;
  target: number;
  maxLimit: number;
  colorHex: string;
  isDark?: boolean;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const isDeficient = value < minLimit;
  const isExcessive = value > maxLimit;

  const baseColor = isDeficient ? "#f59e0b" : isExcessive ? "#ef4444" : colorHex || "#3b82f6";
  const glowColor = hexToRgba(baseColor, 0.85);
  const trackBorderColor = hexToRgba(baseColor, 0.35);

  return (
    <div className="flex flex-col space-y-1.5 w-full select-none" key={label}>
      {/* Header Label and Value */}
      <div className="flex justify-between items-baseline text-xs font-bold font-mono">
        <span className={`tracking-wide font-black ${isDark ? "text-slate-300" : "text-slate-900"}`}>{label}</span>
        <span className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>
          {value} <span className="text-[10px] font-normal opacity-80">{unit}</span>
        </span>
      </div>

      {/* Recessed Channel Base Track */}
      <div
        className={`h-4 rounded-full relative overflow-visible border transition-colors ${
          isDark
            ? "bg-[#07090e] border-slate-900/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]"
            : "bg-slate-200 border-slate-300 shadow-inner"
        }`}
        style={isDark ? { borderColor: trackBorderColor } : undefined}
      >
        {/* Volumetric Laser Core Fill with Smooth Ease-Out Width Easing */}
        <div
          className={`h-full rounded-full relative overflow-hidden transition-[width] duration-400 ease-out ${
            isDeficient || isExcessive ? "animate-pulse" : ""
          }`}
          style={{
            width: `${percent}%`,
            background: isDark
              ? `linear-gradient(90deg, ${hexToRgba(baseColor, 0.45)} 0%, ${baseColor} 100%)`
              : baseColor,
            boxShadow: isDark
              ? `0 0 16px ${glowColor}, inset 0 1px 2px rgba(255,255,255,0.4)`
              : undefined,
            filter: isDark ? `drop-shadow(0 0 10px ${glowColor})` : undefined,
          }}
        >
          {/* Animated Plasma Energy Wave Layer */}
          {isDark && (
            <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-90">
              <svg
                className="absolute top-0 left-0 h-full w-[200%] animate-liquid-wave"
                viewBox="0 0 1200 24"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 12 Q 150 2, 300 12 T 600 12 T 900 12 T 1200 12 L 1200 24 L 0 24 Z"
                  fill="rgba(255, 255, 255, 0.28)"
                />
                <path
                  d="M 0 12 Q 150 22, 300 12 T 600 12 T 900 12 T 1200 12"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.85)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          )}

          {/* White-Hot Focal Line Running Dead Center Horizon */}
          <div className="absolute h-[30%] top-1/2 -translate-y-1/2 w-full bg-gradient-to-b from-transparent via-white/90 to-transparent mix-blend-overlay pointer-events-none" />

          {/* High-Intensity Leading Spark Capsule Edge Marker */}
          {percent > 1 && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-[85%] bg-white rounded-full translate-x-1/3 mix-blend-normal z-10 pointer-events-none"
              style={{
                boxShadow: `0 0 8px #ffffff, 0 0 16px ${baseColor}, 0 0 24px ${glowColor}`,
              }}
            />
          )}
        </div>
      </div>

      {/* Min / Target / Max Bounds Footer */}
      <div className={`flex justify-between text-[9px] uppercase font-mono font-extrabold px-0.5 ${isDark ? "text-slate-500" : "text-slate-900 font-black"}`}>
        <span>MIN: {minLimit}</span>
        <span>TARGET: {target}</span>
        <span>MAX: {maxLimit}</span>
      </div>
    </div>
  );
}

export interface SolutesStatusGridProps {
  currentValues: Record<NutrientKey, number>;
  isDark?: boolean;
}

export default function SolutesStatusGrid({
  currentValues,
  isDark = true,
}: SolutesStatusGridProps) {
  const nutrientKeys: NutrientKey[] = useMemo(
    () => ["nitrogen", "phosphorus", "potassium", "calcium", "magnesium", "sulfur"],
    []
  );

  return (
    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs w-full">
      {nutrientKeys.map((key) => {
        const config = MACRO_NUTRIENT_CONFIGS[key];
        const val = currentValues[key] ?? 0;
        return (
          <VolumetricLaserConduit
            key={key}
            value={val}
            max={config.max * 1.5}
            label={config.label}
            unit={config.unit}
            minLimit={config.min}
            target={config.target}
            maxLimit={config.max}
            colorHex={config.colorHex}
            isDark={isDark}
          />
        );
      })}
    </div>
  );
}
