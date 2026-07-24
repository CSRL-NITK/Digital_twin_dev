import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LettuceEnvironmentalStats, LettuceMetrics } from "../../types";
import { useTheme } from "../ThemeProvider";

interface UnattendedDecayVisualizerProps {
  stats: LettuceEnvironmentalStats;
  metrics: LettuceMetrics;
  reservoirLevel?: number;
  pumpRunning: boolean;
  animationSpeed?: number;
}

export default function UnattendedDecayVisualizer({
  stats,
  metrics,
  pumpRunning,
  animationSpeed = 1,
}: UnattendedDecayVisualizerProps) {
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

  // 1. Dynamic Leaf Colors based on 70-day decay phase
  const leafColor = useMemo(() => {
    if (age >= 51 || health <= 5) return "#1c1917"; // Day 51-70: Liquefaction (black/slimy mold)
    if (metrics.pythiumRootRot || age >= 31) return "#5c4033"; // Day 31-40: Anoxia & Pythium root rot wilting brown
    if (age >= 23) return "#785f43"; // Day 23-30: Salt stress & tipburn browning
    if (age >= 15) return "#eab308"; // Day 15-22: Interveinal chlorosis (Iron lockout yellow)
    if (age >= 6) return "#bef264"; // Day 6-14: Etiolation pale stretched yellow-green
    return "#10b981"; // Day 0-5: Germination cotyledon emerald
  }, [age, health, metrics.pythiumRootRot]);

  // Leaf tip burn effect
  const tipBurnOpacity = useMemo(() => {
    if (age >= 50) return 1.0;
    if (age >= 23) return 0.85; // Tip burn marginal leaf necrosis
    return 0;
  }, [age]);

  // Wilt angle based on desiccation and decay phase
  const wiltAngle = useMemo(() => {
    if (age >= 51) return 55; // Completely collapsed on channel floor
    if (age >= 41) return 45; // Channel desiccation & canopy collapse
    if (age >= 31) return 30; // Wilting canopy (Pythium outbreak)
    if (age >= 23) return 15;
    return 0;
  }, [age]);

  // Root color based on decay phase
  const rootColor = useMemo(() => {
    if (age >= 51 || health <= 5) return "#1c1917"; // Black rotten organic residue
    if (metrics.pythiumRootRot || age >= 31) return "#3e1c07"; // Brown, slimy disintegrating roots
    if (age >= 23) return "#b45309"; // Dull tan roots
    return "#fef08a"; // Healthy white-yellow
  }, [age, health, metrics.pythiumRootRot]);

  // Compute Lettuce rosette leaves with decay shrivel & etiolation stretch
  const leaves = useMemo(() => {
    const list: Array<{
      id: number;
      angle: number;
      scaleX: number;
      scaleY: number;
    }> = [];

    const maxRenderLeaves = Math.min(leafCount, 24);
    for (let i = 0; i < maxRenderLeaves; i++) {
      const leafAngle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves;
      let sizeX = 0.4 + ageFactor * 0.7;
      let sizeY = 0.5 + ageFactor * 0.8;

      // Etiolation stretch (Day 6-14)
      if (age >= 6 && age <= 14) {
        sizeY *= 1.45; // Stretched thin stems
        sizeX *= 0.65;
      }

      // Decay shrivel (Day 41-70)
      if (age >= 51) {
        sizeX *= 0.35;
        sizeY *= 0.30;
      } else if (age >= 41) {
        sizeX *= 0.55;
        sizeY *= 0.50;
      } else if (age >= 31) {
        sizeX *= 0.75;
        sizeY *= 0.70;
      }

      list.push({
        id: i,
        angle: leafAngle,
        scaleX: sizeX,
        scaleY: sizeY,
      });
    }
    return list;
  }, [leafCount, age]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination" || age <= 5) return 0.22;
    if (stage === "Seedling" || age <= 14) return 0.45;
    if (stage === "Vegetative" || age <= 30) return 0.75;
    return 0.95;
  }, [stage, age]);

  // Root paths inside NFT channel
  const rootPaths = useMemo(() => {
    const paths: string[] = [];
    const maxDepth = Math.min(rootLength * 1.5, 95);
    
    paths.push(`M 200 240 Q 200 ${240 + maxDepth * 0.5} ${200 + Math.sin(rootLength) * 5} ${240 + maxDepth}`);
    
    if (rootLength > 3) {
      paths.push(`M 200 248 Q 185 260 170 270`);
      paths.push(`M 200 248 Q 215 260 230 270`);
    }
    if (rootLength > 8 && age < 41) {
      paths.push(`M 195 265 Q 175 285 160 295`);
      paths.push(`M 205 265 Q 225 285 240 295`);
    }
    return paths;
  }, [rootLength, age]);

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#090a0f] p-8 flex flex-col items-center justify-center select-none animate-in fade-in duration-200"
          : "relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      }
      id="unattended-decay-viewport"
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#ef44440b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Decay Phase Tag Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800/60 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
        <span>Unattended Day {age.toFixed(1)}: {metrics.phaseName || "System Decay"}</span>
      </div>

      {/* Floating Zoom & Fullscreen Controls */}
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

      {/* SVG Stage */}
      <svg
        viewBox={viewBoxString}
        className={`w-full z-0 transition-all duration-300 ease-out ${
          isFullscreen ? "h-auto max-h-[85vh] max-w-full" : "h-full max-h-[220px]"
        }`}
        id="decay-growth-svg"
      >
        <defs>
          <linearGradient id="decayLedBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>

          <filter id="decayGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
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
            `}
          </style>
        </defs>

        {/* LED Light Beam */}
        <g id="decay-led-fixture">
          <polygon
            points="140,30 260,30 350,240 50,240"
            fill="url(#decayLedBeam)"
            opacity={age >= 48 ? 0.05 : 0.15 + (ledIntensity / 400) * 0.35}
          />
          <rect x="130" y="22" width="140" height="10" rx="3" fill="#334155" />
          <rect x="140" y="32" width="120" height="4" fill={age >= 48 ? "#ef4444" : "#eab308"} />
        </g>

        {/* NFT Channel & Stagnant Water / Dry Channel */}
        <g id="decay-nft-channel">
          <rect x="30" y="240" width="340" height="90" rx="10" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke={age >= 48 ? "#ef4444" : isDark ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <rect x="50" y="240" width="300" height="8" fill={isDark ? "#1e293b" : "#e2e8f0"} />
          <circle cx="200" cy="240" r="22" fill={isDark ? "#020617" : "#cbd5e1"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="2" />
          
          {/* Stagnant Water / Dry channel */}
          {pumpRunning && age < 48 ? (
            <path d="M 40 310 Q 200 315 360 310 L 360 322 L 40 322 Z" fill="#b45309" opacity="0.8" />
          ) : (
            <path d="M 40 318 Q 200 320 360 318 L 360 322 L 40 322 Z" fill="#3e1c07" opacity="0.9" /> // Stagnant residue
          )}
        </g>

        {/* Rotting Root Strands */}
        <g id="decaying-roots">
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

        {/* Plant Rosette Leaves with Wilting & Rot Shader */}
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
                
                {/* Interveinal Chlorosis Vein Pattern (Day 15-22) */}
                {age >= 15 && age < 31 && (
                  <path d="M 200 235 Q 200 160 200 115" fill="none" stroke="#15803d" strokeWidth="2.5" opacity="0.9" />
                )}

                {/* Tipburn Brown Margins (Day 23+) */}
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

            {/* Core Rot Crown */}
            <circle cx="200" cy="232" r="8" fill={age >= 51 ? "#0c0a09" : "#78350f"} />
          </g>
        </g>
      </svg>
    </div>
  );
}
