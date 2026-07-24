import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import type { ScenarioVisualizerProps } from "./NormalGrowthVisualizer";

export default function UnattendedDecayVisualizer({
  stats,
  metrics,
  pumpRunning,
  animationSpeed = 1,
}: ScenarioVisualizerProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scaledSpeed = Math.sqrt(animationSpeed);
  const { ledIntensity } = stats;
  const { stage, health, leafCount, rootLength, age } = metrics;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const viewBoxString = useMemo(() => {
    if (zoom === 1.0) return "0 0 400 400";
    const width = 400 / zoom;
    const height = 400 / zoom;
    const centerX = 200;
    const centerY = 230;
    const minX = Math.max(0, Math.min(400 - width, centerX - width / 2));
    const minY = Math.max(0, Math.min(400 - height, centerY - height / 2));
    return `${minX} ${minY} ${width} ${height}`;
  }, [zoom]);

  // 1. Dynamic Leaf Colors based on Unmonitored research phases
  const leafColor = useMemo(() => {
    if (age >= 51 || health <= 5) return "#1c1917"; // Day 51-70: Desiccation
    if (metrics.pythiumRootRot || age >= 29) return "#5c4033"; // Day 29-50: Deep Senescence & Pythium
    if (age >= 25) return "#b45309"; // Day 25-28: Poor Harvest (Tipburn & N chlorosis)
    if (age >= 19) return "#d97706"; // Day 19-24: Visible Deficiencies
    if (age >= 14) return "#eab308"; // Day 14-18: Stress Development (Interveinal chlorosis)
    if (age >= 8) return "#84cc16"; // Day 8-13: Hidden Nutrient Drift
    return "#10b981"; // Day 0-7: Healthy Germination & Early Growth
  }, [age, health, metrics.pythiumRootRot]);

  // Leaf tip burn effect
  const tipBurnOpacity = useMemo(() => {
    if (age >= 50) return 1.0;
    if (age >= 19) return 0.85; // Tip burn marginal leaf necrosis
    return 0;
  }, [age]);

  // Wilt angle based on desiccation and decay phase
  const wiltAngle = useMemo(() => {
    if (age >= 51) return 55; // Completely collapsed on channel floor
    if (age >= 41) return 45; // Channel desiccation & canopy collapse
    if (age >= 29) return 30; // Wilting canopy
    if (age >= 19) return 15;
    return 0;
  }, [age]);

  // Root color based on Unmonitored research phases
  const rootColor = useMemo(() => {
    if (age >= 51 || health <= 5) return "#1c1917"; // Black rotten organic residue
    if (metrics.pythiumRootRot || age >= 29) return "#3e1c07"; // Brown disintegrating roots
    if (age >= 25) return "#ca8a04"; // Light brown roots
    if (age >= 19) return "#eab308"; // Cream roots
    if (age >= 8) return "#fef08a"; // Off-white / light cream
    return "#f8fafc"; // Healthy bright white
  }, [age, health, metrics.pythiumRootRot]);

  // Compute Lettuce rosette leaves with decay shrivel & etiolation stretch
  const leaves = useMemo(() => {
    const list: Array<{ id: number; angle: number; scaleX: number; scaleY: number }> = [];

    const maxRenderLeaves = Math.min(leafCount, 24);

    let shrinkFactor = 1.0;
    if (age >= 51) shrinkFactor = 0.45;
    else if (age >= 29) shrinkFactor = 0.65;
    else if (age >= 25) shrinkFactor = 0.80;

    for (let i = 0; i < maxRenderLeaves; i++) {
      const angle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves;
      list.push({
        id: i,
        angle,
        scaleX: (0.4 + ageFactor * 0.7) * shrinkFactor,
        scaleY: (0.5 + ageFactor * 0.8) * shrinkFactor,
      });
    }
    return list;
  }, [leafCount, age]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination" || age <= 3) return 0.22;
    if (stage === "Seedling" || age <= 7) return 0.45;
    if (stage === "Vegetative" || age <= 18) return 0.75;
    return 0.95;
  }, [stage, age]);

  // Root paths inside NFT channel
  const rootPaths = useMemo(() => {
    const paths: string[] = [];
    const len = rootLength || 4.0;
    const maxDepth = Math.max(28, Math.min(78, 24 + len * 2.6));
    paths.push(`M 200 240 Q ${200 + Math.sin(len) * 4} ${240 + maxDepth * 0.5} ${200 + Math.sin(len * 1.5) * 6} ${240 + maxDepth}`);
    paths.push(`M 200 248 Q 185 260 172 ${240 + maxDepth * 0.7}`);
    paths.push(`M 200 248 Q 215 260 228 ${240 + maxDepth * 0.7}`);
    if (len > 3) {
      paths.push(`M 195 260 Q 175 280 162 ${240 + maxDepth * 0.88}`);
      paths.push(`M 205 260 Q 225 280 238 ${240 + maxDepth * 0.88}`);
    }
    if (len > 8 && age < 41) {
      paths.push(`M 190 270 Q 180 290 175 ${240 + maxDepth}`);
      paths.push(`M 210 270 Q 220 290 225 ${240 + maxDepth}`);
    }
    return paths;
  }, [rootLength, age]);

  const isPoorHarvest = age >= 25 && age <= 28;

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#090a0f] p-8 flex flex-col items-center justify-center select-none animate-in fade-in duration-200"
          : "relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      }
      id="unattended-decay-viewport"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#ef44440b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Decay Phase Tag Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800/60 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
        <span>Unmonitored Day {age.toFixed(1)}: {metrics.phaseName || "Unmonitored System"}</span>
        {isPoorHarvest && <span className="ml-1 text-red-400 font-bold">⚠️ DOWNGRADED YIELD (165g)</span>}
      </div>

      {/* Controls */}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1.0, parseFloat((z - 0.25).toFixed(2))))}
            className={`w-5 h-5 rounded border text-xs cursor-pointer select-none font-black active:scale-90 transition-all flex items-center justify-center ${
              isDark ? "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white" : "bg-white/90 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
            }`}
            title="Zoom Out"
          >
            -
          </button>
          <span className={`border text-[8px] font-mono font-black px-1.5 rounded flex items-center justify-center select-none min-w-[32px] ${
            isDark ? "bg-slate-900/80 border-slate-800 text-slate-400" : "bg-white/90 border-slate-300 text-slate-700 shadow-sm"
          }`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(2.5, parseFloat((z + 0.25).toFixed(2))))}
            className={`w-5 h-5 rounded border text-xs cursor-pointer select-none font-black active:scale-90 transition-all flex items-center justify-center ${
              isDark ? "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white" : "bg-white/90 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
            }`}
            title="Zoom In"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer active:scale-90 transition-all ${
            isDark ? "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white" : "bg-white/90 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
          }`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
        </button>
      </div>

      <svg
        viewBox={viewBoxString}
        className={`w-full z-0 transition-all duration-300 ease-out ${
          isFullscreen ? "h-auto max-h-[85vh] max-w-full" : "h-full max-h-[220px]"
        }`}
        id="decay-growth-svg"
      >
        <defs>
          <linearGradient id="decayLedBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? 0.25 : 0.45} />
            <stop offset="60%" stopColor="#fde047" stopOpacity={isDark ? 0.05 : 0.12} />
            <stop offset="100%" stopColor="#fde047" stopOpacity={0} />
          </linearGradient>

          <filter id="decayGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <style>
            {`
              @keyframes decaySway {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(0.6deg); }
              }
              .animate-decay-sway {
                transform-origin: 200px 240px;
                animation: decaySway ${6 / scaledSpeed}s ease-in-out infinite;
              }
              @keyframes rootSway {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(2deg) scaleX(1.03); }
              }
              .animate-root-sway {
                transform-origin: 200px 240px;
                animation: rootSway ${3.5 / scaledSpeed}s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* LED Light Fixture (Continuous Photoperiod 350 PPFD / 18,900 Lux) */}
        <g id="decay-led-fixture">
          <polygon
            points="140,30 260,30 350,240 50,240"
            fill="url(#decayLedBeam)"
            opacity={0.15 + (ledIntensity / 400) * 0.85}
          />
          <rect x="130" y="22" width="140" height="10" rx="3" fill={isDark ? "#334155" : "#64748b"} />
          <rect x="140" y="32" width="120" height="4" fill="#fde047" filter="url(#decayGlow)" />
        </g>

        {/* NFT Channel */}
        <g id="decay-nft-channel">
          <rect x="30" y="240" width="340" height="90" rx="10" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke={age >= 48 ? "#ef4444" : isDark ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <rect x="50" y="240" width="300" height="8" fill={isDark ? "#1e293b" : "#e2e8f0"} />
          <circle cx="200" cy="240" r="22" fill={isDark ? "#020617" : "#cbd5e1"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="2" />
          
          {pumpRunning && age < 48 ? (
            <path d="M 40 310 Q 200 315 360 310 L 360 322 L 40 322 Z" fill="#b45309" opacity="0.8" />
          ) : (
            <path d="M 40 318 Q 200 320 360 318 L 360 322 L 40 322 Z" fill="#3e1c07" opacity="0.9" />
          )}
        </g>

        {/* Rotting Roots */}
        <g id="decaying-roots" className={pumpRunning && age < 48 ? "animate-root-sway" : ""}>
          {rootPaths.map((d, idx) => (
            <path
              key={`decay-root-${idx}`}
              d={d}
              fill="none"
              stroke={rootColor}
              strokeWidth={idx === 0 ? "3.5" : "2"}
              strokeDasharray={metrics.pythiumRootRot ? "4,3" : undefined}
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}
        </g>

        {/* Rosette Canopy */}
        <g id="decay-lettuce-rosette" transform={`rotate(${wiltAngle}, 200, 240)`}>
          <g transform={`translate(200, 238) scale(${lettuceScale}) translate(-200, -238)`}>
            {leaves.map((leaf) => (
              <g
                key={`decay-leaf-${leaf.id}`}
                transform={`translate(200, 235) rotate(${leaf.angle}) scale(${leaf.scaleX}, ${leaf.scaleY}) translate(-200, -235)`}
              >
                <path
                  d="M 200 235 C 160 170, 160 110, 200 100 C 240 110, 240 170, 200 235 Z"
                  fill={leafColor}
                  stroke={age >= 51 ? "#000000" : age >= 15 ? "#78350f" : "#047857"}
                  strokeWidth="1.5"
                />
                
                {age >= 15 && age < 31 && (
                  <path d="M 200 235 Q 200 160 200 115" fill="none" stroke="#15803d" strokeWidth="2.5" opacity="0.9" />
                )}

                {tipBurnOpacity > 0 && (
                  <path
                    d="M 185 130 C 180 110, 200 100, 200 100 C 200 100, 220 110, 215 130"
                    fill="none"
                    stroke="#451a03"
                    strokeWidth="3.5"
                    opacity={tipBurnOpacity}
                  />
                )}
              </g>
            ))}

            <circle cx="200" cy="232" r="8" fill={age >= 51 ? "#0c0a09" : "#78350f"} />
          </g>
        </g>
      </svg>
    </div>
  );
}
