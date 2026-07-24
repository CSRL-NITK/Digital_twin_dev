import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import type { ScenarioVisualizerProps } from "./NormalGrowthVisualizer";

export default function TipburnRiskVisualizer({
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

  // Stressed dark green leaves with high EC tipburn risk
  const leafColor = "#15803d";
  const rootColor = "#d97706"; // Light tan root salt stress

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
      id="tipburn-risk-viewport"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b0b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Tipburn Warning Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-amber-950/90 border border-amber-500/50 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
        <span>Tipburn Risk Day {age.toFixed(1)}: {metrics.phaseName || "Excessive Light (380 PPFD) / Ca Transport Deficit"}</span>
        {age >= 25 && age <= 28 && <span className="ml-1 text-red-400 font-bold">✂ MARKET VALUE DOWNGRADED (185g)</span>}
      </div>

      {/* Zoom Controls */}
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
        id="tipburn-svg"
      >
        <defs>
          <linearGradient id="tipburnBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
            <stop offset="60%" stopColor="#fde047" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#fde047" stopOpacity={0} />
          </linearGradient>

          <style>
            {`
              @keyframes fastSway {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(2.5deg); }
              }
              .animate-fast-sway {
                transform-origin: 200px 240px;
                animation: fastSway ${2.5 / scaledSpeed}s ease-in-out infinite;
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
        <g id="tipburn-led">
          <polygon points="140,30 260,30 350,240 50,240" fill="url(#tipburnBeam)" opacity={0.25 + (ledIntensity / 400) * 0.75} />
          <rect x="130" y="22" width="140" height="10" rx="3" fill="#334155" />
          <rect x="140" y="32" width="120" height="4" fill="#fde047" />
        </g>

        {/* NFT Channel */}
        <g id="tipburn-channel">
          <rect x="30" y="240" width="340" height="90" rx="10" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke="#f59e0b" strokeWidth="2.5" />
          <rect x="50" y="240" width="300" height="8" fill={isDark ? "#1e293b" : "#e2e8f0"} />
          <circle cx="200" cy="240" r="22" fill={isDark ? "#020617" : "#cbd5e1"} stroke="#475569" strokeWidth="2" />
          <path d="M 40 310 Q 200 315 360 310 L 360 322 L 40 322 Z" fill="#0284c7" opacity="0.85" />
          {pumpRunning && (
            <path d="M 40 310 Q 200 315 360 310" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,4" className="animate-pulse" />
          )}
        </g>

        {/* Stressed Root Strands */}
        <g id="tipburn-roots" className={pumpRunning ? "animate-root-sway" : ""}>
          {rootPaths.map((d, idx) => (
            <path key={`tipburn-root-${idx}`} d={d} fill="none" stroke={rootColor} strokeWidth={idx === 0 ? "3.5" : "2"} strokeLinecap="round" opacity="0.9" />
          ))}
        </g>

        {/* Rosette Canopy with Sharp Brown Tipburn Margins */}
        <g id="tipburn-rosette" className="animate-fast-sway">
          <g transform={`translate(200, 238) scale(${lettuceScale}) translate(-200, -238)`}>
            {leaves.map((leaf) => (
              <g key={`tipburn-leaf-${leaf.id}`} transform={`translate(200, 235) rotate(${leaf.angle}) scale(${leaf.scaleX}, ${leaf.scaleY}) translate(-200, -235)`}>
                <path d="M 200 235 C 160 170, 160 110, 200 100 C 240 110, 240 170, 200 235 Z" fill={leafColor} stroke="#064e3b" strokeWidth="1.5" />
                <path d="M 200 235 Q 200 160 200 115" fill="none" stroke="#4ade80" strokeWidth="2.0" opacity="0.8" />
                
                {/* Prominent Tipburn Necrosis Border */}
                <path d="M 185 130 C 180 110, 200 100, 200 100 C 200 100, 220 110, 215 130" fill="none" stroke="#451a03" strokeWidth="4.5" opacity="0.95" />
                <path d="M 187 128 C 183 112, 200 103, 200 103 C 200 103, 217 112, 213 128" fill="none" stroke="#78350f" strokeWidth="2.5" opacity="0.9" />
              </g>
            ))}
            <circle cx="200" cy="232" r="9" fill="#166534" />
          </g>
        </g>
      </svg>
    </div>
  );
}
