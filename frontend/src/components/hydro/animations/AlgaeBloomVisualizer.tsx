import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import type { ScenarioVisualizerProps } from "./NormalGrowthVisualizer";

export default function AlgaeBloomVisualizer({
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
  const { stage, leafCount, rootLength, age } = metrics;

  // Helper to interpolate hex colors
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  const algaeDensity = useMemo(() => {
    const age = metrics.age || 0;
    if (age <= 4) return 0.01;
    if (age <= 10) return Math.min(1.0, 0.01 * Math.pow(1.85, age - 4));
    if (age <= 18) return 1.0;
    if (age <= 35) return Math.max(0.05, 1.0 - ((age - 18) / 17) * 0.85);
    if (age <= 55) return Math.max(0.01, 0.15 - ((age - 35) / 20) * 0.14);
    return 0.0;
  }, [metrics.age]);

  const { leafColor, rootColor, waterColor, channelStroke, cupStroke, flowStroke, bubbleColor } = useMemo(() => {
    const age = metrics.age || 0;

    if (age <= 4) {
      // Phase 1: Incubation (Days 0-4)
      return {
        leafColor: "#22c55e",
        rootColor: "#f5f5f4",
        waterColor: "#0284c7",
        channelStroke: "#3b82f6",
        cupStroke: "#3b82f6",
        flowStroke: "#60a5fa",
        bubbleColor: "#93c5fd",
      };
    } else if (age <= 10) {
      // Phase 2: Exponential Algae Bloom (Days 5-10)
      const r = (age - 4) / 6;
      return {
        leafColor: interpolateColor("#22c55e", "#a3e635", r),
        rootColor: interpolateColor("#f5f5f4", "#854d0e", r),
        waterColor: interpolateColor("#0284c7", "#15803d", r),
        channelStroke: interpolateColor("#3b82f6", "#22c55e", r),
        cupStroke: interpolateColor("#3b82f6", "#15803d", r),
        flowStroke: interpolateColor("#60a5fa", "#4ade80", r),
        bubbleColor: interpolateColor("#93c5fd", "#84cc16", r),
      };
    } else if (age <= 18) {
      // Phase 3: Root Choking & Lockout Crisis (Days 11-18)
      return {
        leafColor: "#a3e635",
        rootColor: "#854d0e",
        waterColor: "#15803d",
        channelStroke: "#22c55e",
        cupStroke: "#15803d",
        flowStroke: "#4ade80",
        bubbleColor: "#84cc16",
      };
    } else if (age <= 35) {
      // Phase 4: Plant Necrosis & Algae Crash (Days 19-35)
      const r = (age - 18) / 17;
      return {
        leafColor: interpolateColor("#a3e635", "#57534e", r),
        rootColor: interpolateColor("#854d0e", "#171717", r),
        waterColor: interpolateColor("#15803d", "#2b1e17", r),
        channelStroke: interpolateColor("#22c55e", "#78350f", r),
        cupStroke: interpolateColor("#15803d", "#451a03", r),
        flowStroke: interpolateColor("#4ade80", "#78350f", r),
        bubbleColor: interpolateColor("#84cc16", "#78350f", r),
      };
    } else if (age <= 55) {
      // Phase 5: Deep Microbial Decomposition (Days 36-55)
      const r = (age - 35) / 20;
      return {
        leafColor: interpolateColor("#57534e", "#292524", r),
        rootColor: interpolateColor("#171717", "#0a0a0a", r),
        waterColor: interpolateColor("#2b1e17", "#1c120c", r),
        channelStroke: "#78350f",
        cupStroke: "#451a03",
        flowStroke: "#451a03",
        bubbleColor: "#451a03",
      };
    } else {
      // Phase 6: System Desiccation & Chemical Stasis (Days 56-70)
      return {
        leafColor: "#292524",
        rootColor: "#0a0a0a",
        waterColor: "#1c120c",
        channelStroke: "#451a03",
        cupStroke: "#27272a",
        flowStroke: "#27272a",
        bubbleColor: "#1c120c",
      };
    }
  }, [metrics.age]);

  // The LED grow lights are fixed hardware fixtures and maintain their color/spectrum output constants
  const beamColor1 = "#fde047";
  const beamColor2 = "#fde047";

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

  const leaves = useMemo(() => {
    const list: Array<{ id: number; angle: number; scaleX: number; scaleY: number }> = [];
    const maxRenderLeaves = Math.min(leafCount, 24);
    for (let i = 0; i < maxRenderLeaves; i++) {
      const angle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves;
      list.push({
        id: i,
        angle,
        scaleX: 0.4 + ageFactor * 0.7,
        scaleY: 0.5 + ageFactor * 0.8,
      });
    }
    return list;
  }, [leafCount]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination") return 0.22;
    if (stage === "Seedling") return 0.45;
    if (stage === "Vegetative") return 0.75;
    return 1.05;
  }, [stage]);

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
    if (len > 8) {
      paths.push(`M 190 270 Q 180 290 175 ${240 + maxDepth}`);
      paths.push(`M 210 270 Q 220 290 225 ${240 + maxDepth}`);
    }
    return paths;
  }, [rootLength]);

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#090a0f] p-8 flex flex-col items-center justify-center select-none animate-in fade-in duration-200"
          : "relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      }
      id="algae-bloom-viewport"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#22c55e0b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Algae Alert Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
        <span>Algae Bloom Day {age.toFixed(1)}: {metrics.phaseName || "Elevated Temp & Biofilm Bio-fouling"}</span>
        {age >= 25 && age <= 28 && <span className="ml-1 text-red-400 font-bold">⚠️ YIELD PENALTY (170g)</span>}
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
        id="algae-svg"
      >
        <defs>
          <linearGradient id="algaeBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
            <stop offset="60%" stopColor={beamColor2} stopOpacity={0.15} />
            <stop offset="100%" stopColor={beamColor1} stopOpacity={0} />
          </linearGradient>

          <style>
            {`
              @keyframes algaeBubble {
                0% { transform: translateY(0px); opacity: 0.8; }
                100% { transform: translateY(-12px); opacity: 0.2; }
              }
              .animate-algae-bubble {
                animation: algaeBubble ${1.5 / scaledSpeed}s ease-in-out infinite;
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

        {/* LED Fixture */}
        <g id="algae-led">
          <polygon points="140,30 260,30 350,240 50,240" fill="url(#algaeBeam)" opacity={0.3 + (ledIntensity / 400) * 0.7} />
          <rect x="130" y="22" width="140" height="10" rx="3" fill="#334155" />
          <rect x="140" y="32" width="120" height="4" fill={beamColor2} />
        </g>

        {/* NFT Channel with Murky Water & Algae Film */}
        <g id="algae-channel">
          <rect x="30" y="240" width="340" height="90" rx="10" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke={channelStroke} strokeWidth="3" />
          <rect x="50" y="240" width="300" height="8" fill={isDark ? "#1e293b" : "#e2e8f0"} />
          <circle cx="200" cy="240" r="22" fill={isDark ? "#020617" : "#cbd5e1"} stroke={cupStroke} strokeWidth="2" />
          
          {/* Murky Algae Stream */}
          <path d="M 40 310 Q 200 315 360 310 L 360 322 L 40 322 Z" fill={waterColor} opacity="0.9" />
          {pumpRunning && (
            <path d="M 40 310 Q 200 315 360 310" fill="none" stroke={flowStroke} strokeWidth="3" strokeDasharray="10,5" className="animate-pulse" />
          )}

          {/* Floating Algae Particles & Bio-bubbles */}
          <circle cx="80" cy="314" r="3" fill={bubbleColor} opacity={algaeDensity * 0.9} className="animate-algae-bubble" />
          <circle cx="160" cy="316" r="4" fill={bubbleColor} opacity={algaeDensity * 0.9} className="animate-algae-bubble" />
          <circle cx="240" cy="313" r="3.5" fill={bubbleColor} opacity={algaeDensity * 0.9} className="animate-algae-bubble" />
          <circle cx="310" cy="315" r="2.5" fill={bubbleColor} opacity={algaeDensity * 0.9} className="animate-algae-bubble" />
        </g>

        {/* Algae Coated Root Strands */}
        <g id="algae-roots" className={pumpRunning ? "animate-root-sway" : ""}>
          {rootPaths.map((d, idx) => (
            <path key={`algae-root-${idx}`} d={d} fill="none" stroke={rootColor} strokeWidth={idx === 0 ? "4" : "2.5"} strokeLinecap="round" opacity="0.95" />
          ))}
        </g>

        {/* Rosette Canopy */}
        <g id="algae-rosette">
          <g transform={`translate(200, 238) scale(${lettuceScale}) translate(-200, -238)`}>
            {leaves.map((leaf) => (
              <g key={`algae-leaf-${leaf.id}`} transform={`translate(200, 235) rotate(${leaf.angle}) scale(${leaf.scaleX}, ${leaf.scaleY}) translate(-200, -235)`}>
                <path d="M 200 235 C 160 170, 160 110, 200 100 C 240 110, 240 170, 200 235 Z" fill={leafColor} stroke="#3f6212" strokeWidth="1.5" />
                <path d="M 200 235 Q 200 160 200 115" fill="none" stroke="#65a30d" strokeWidth="2.0" opacity="0.85" />
              </g>
            ))}
            <circle cx="200" cy="232" r="9" fill="#4d7c0f" />
          </g>
        </g>
      </svg>
    </div>
  );
}
