import { useMemo, useState, useEffect } from "react";
import { AlertTriangle, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import type { ScenarioVisualizerProps } from "./NormalGrowthVisualizer";

export default function PumpFailureVisualizer({
  stats,
  metrics,
  animationSpeed = 1,
}: ScenarioVisualizerProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scaledSpeed = Math.sqrt(animationSpeed);
  const { ledIntensity } = stats;
  const { stage, leafCount, rootLength, health } = metrics;

  // Determine Pump Failure Sequential Collapse Stage (Days 1 -> 4 -> 7 -> 14)
  const failureStage = useMemo(() => {
    if (health <= 5) return 4;   // Day 14+: Total Decay & Black Root Sludge
    if (health <= 35) return 3;  // Day 7: Complete Evaporation & Dark Blackish Knot Core
    if (health <= 70) return 2;  // Day 4: Flat Collapse & White Nutrient Salt Crusts
    return 1;                    // Day 1: Initial Shock & Soft Deflated Droop
  }, [health]);

  // Leaf color progression: Matte Sage Green -> Paper Yellow -> Paper Brown -> Black Rot
  const leafColor = useMemo(() => {
    if (failureStage === 4) return "#1c1917"; // Blackish shriveled dead weed
    if (failureStage === 3) return "#785f43"; // Dry brittle paper-brown
    if (failureStage === 2) return "#ca8a04"; // Paper-thin yellow with brown edges
    return "#577c59";                         // Matte sage green initial shock
  }, [failureStage]);

  // Root color progression: Dull Tan -> Brown -> Black Moldy Sludge
  const rootColor = useMemo(() => {
    if (failureStage === 4) return "#090a0f"; // Rotten black sludge
    if (failureStage >= 3) return "#451a03";  // Dark brown dry roots
    return "#78350f";                         // Dull tan roots
  }, [failureStage]);

  // Rotational Wilt Angle
  const wiltAngle = useMemo(() => {
    if (failureStage === 4) return 65; // Completely flat collapsed against deck
    if (failureStage === 3) return 55;
    if (failureStage === 2) return 45;
    return 35;                         // 40° initial droop
  }, [failureStage]);

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

    let shrinkFactor = 0.8;
    if (failureStage === 4) shrinkFactor = 0.35;
    else if (failureStage === 3) shrinkFactor = 0.50;
    else if (failureStage === 2) shrinkFactor = 0.65;

    for (let i = 0; i < maxRenderLeaves; i++) {
      const angle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves;
      list.push({
        id: i,
        angle,
        scaleX: (0.4 + ageFactor * 0.7) * shrinkFactor,
        scaleY: (0.5 + ageFactor * 0.8) * (shrinkFactor * 0.85),
      });
    }
    return list;
  }, [leafCount, failureStage]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination") return 0.22;
    if (stage === "Seedling") return 0.45;
    if (stage === "Vegetative") return 0.75;
    return 0.95;
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

  const stageLabel = useMemo(() => {
    if (failureStage === 4) return "PANEL 4 (DAY 14): TOTAL DECAY & ROTTEN ROOT SLUDGE";
    if (failureStage === 3) return "PANEL 3 (DAY 7): BRITTLE PAPER-BROWN DRYOUT & KNOT CORE";
    if (failureStage === 2) return "PANEL 2 (DAY 4): FLAT CANOPY COLLAPSE & SALT CRUSTS";
    return "PANEL 1 (DAY 1): INITIAL SHOCK & SOFT DEFLATED LEAF DROOP";
  }, [failureStage]);

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#090a0f] p-8 flex flex-col items-center justify-center select-none animate-in fade-in duration-200"
          : "relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      }
      id="pump-failure-viewport"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#ef44440b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Emergency Pump Cutoff Warning Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-red-950/90 border border-red-500/60 text-red-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
        <AlertTriangle size={12} className="text-red-400 animate-bounce" />
        <span>{metrics.age < 10 ? "FLOW NORMAL (1.5 L/MIN)" : "PUMP FAILURE (0.0 L/MIN)"} | {metrics.phaseName || stageLabel}</span>
        {metrics.age >= 25 && metrics.age <= 28 && <span className="ml-1 text-red-400 font-bold">🛑 CROP FAILURE (&lt;80g)</span>}
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
        id="pump-failure-svg"
      >
        <defs>
          {/* Intense Dual-Spectrum LED Grow Light Matrix Gradient */}
          <linearGradient id="magentaBlueLedBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
            <stop offset="60%" stopColor="#fde047" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#fde047" stopOpacity={0} />
          </linearGradient>

          <style>
            {`
              @keyframes failureDroop {
                0%, 100% { transform: rotate(${wiltAngle}deg); }
                50% { transform: rotate(${wiltAngle + 2}deg); }
              }
              .animate-failure-droop {
                transform-origin: 200px 240px;
                animation: failureDroop ${5 / scaledSpeed}s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Dual-Spectrum LED Matrix Lighting */}
        <g id="pump-failure-led">
          <polygon points="140,30 260,30 350,240 50,240" fill="url(#magentaBlueLedBeam)" opacity={0.35 + (ledIntensity / 400) * 0.65} />
          <rect x="130" y="22" width="140" height="10" rx="3" fill="#334155" />
          <rect x="140" y="32" width="120" height="4" fill="#fde047" />
          <circle cx="160" cy="34" r="1.5" fill="#fde047" />
          <circle cx="200" cy="34" r="1.5" fill="#fde047" />
          <circle cx="240" cy="34" r="1.5" fill="#fde047" />
        </g>

        {/* NFT Channel (Bone-Dry Channel Floor with Salt Crusts & Sludge) */}
        <g id="pump-failure-channel">
          <rect x="30" y="240" width="340" height="90" rx="10" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke="#ef4444" strokeWidth="3" />
          <rect x="50" y="240" width="300" height="8" fill={isDark ? "#1e293b" : "#e2e8f0"} />
          <circle cx="200" cy="240" r="22" fill={isDark ? "#020617" : "#cbd5e1"} stroke="#991b1b" strokeWidth="2" />
          
          {/* Bone-Dry Channel Floor Base Layer */}
          <path d="M 40 320 Q 200 321 360 320 L 360 322 L 40 322 Z" fill="#451a03" opacity="0.9" />

          {/* White Nutrient Salt Crust Patches on Dry Channel Deck (Panel 2+) */}
          {failureStage >= 2 && (
            <g id="salt-crusts" opacity="0.85">
              <ellipse cx="140" cy="321" rx="18" ry="1.5" fill="#f8fafc" />
              <ellipse cx="210" cy="321" rx="26" ry="1.8" fill="#f1f5f9" />
              <ellipse cx="280" cy="321" rx="14" ry="1.2" fill="#e2e8f0" />
            </g>
          )}

          {/* Black Moldy Root Sludge (Panel 4) */}
          {failureStage === 4 && (
            <path d="M 40 318 Q 200 323 360 318 L 360 322 L 40 322 Z" fill="#090a0f" opacity="0.95" />
          )}
        </g>

        {/* Dry Desiccated / Moldy Sludge Roots */}
        <g id="pump-failure-roots">
          {rootPaths.map((d, idx) => (
            <path 
              key={`failure-root-${idx}`} 
              d={d} 
              fill="none" 
              stroke={rootColor} 
              strokeWidth={idx === 0 ? "3" : "1.8"} 
              strokeDasharray={failureStage >= 3 ? "2,2" : "3,3"} 
              strokeLinecap="round" 
              opacity={failureStage === 4 ? "0.6" : "0.85"} 
            />
          ))}
        </g>

        {/* Collapsed Wilting Canopy */}
        <g id="pump-failure-rosette" transform={`rotate(${wiltAngle}, 200, 240)`}>
          <g transform={`translate(200, 238) scale(${lettuceScale}) translate(-200, -238)`}>
            {leaves.map((leaf) => (
              <g key={`failure-leaf-${leaf.id}`} transform={`translate(200, 235) rotate(${leaf.angle}) scale(${leaf.scaleX}, ${leaf.scaleY}) translate(-200, -235)`}>
                <path d="M 200 235 C 160 170, 160 110, 200 100 C 240 110, 240 170, 200 235 Z" fill={leafColor} stroke={failureStage >= 3 ? "#1c1917" : "#451a03"} strokeWidth="1.5" />
                <path d="M 200 235 Q 200 160 200 115" fill="none" stroke={failureStage >= 2 ? "#451a03" : "#78350f"} strokeWidth="2.0" opacity="0.9" />
                
                {/* Paper-thin brown leaf margin necrosis in Stage 2+ */}
                {failureStage >= 2 && (
                  <path d="M 185 130 C 180 110, 200 100, 200 100 C 200 100, 220 110, 215 130" fill="none" stroke="#451a03" strokeWidth="2.5" opacity="0.9" />
                )}
              </g>
            ))}

            {/* Growth Point Core (Shrivels into a dark blackish knot in Stage 3 & 4) */}
            <circle cx="200" cy="232" r={failureStage >= 3 ? 5 : 8} fill={failureStage >= 3 ? "#1c1917" : "#451a03"} />
          </g>
        </g>
      </svg>
    </div>
  );
}
