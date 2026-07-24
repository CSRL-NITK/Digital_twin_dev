import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LettuceEnvironmentalStats, LettuceMetrics } from "../../../types";
import { useTheme } from "../../ThemeProvider";

export interface ScenarioVisualizerProps {
  stats: LettuceEnvironmentalStats;
  metrics: LettuceMetrics;
  reservoirLevel?: number;
  pumpRunning: boolean;
  onHarvest?: () => void;
  animationSpeed?: number;
}

export default function NormalGrowthVisualizer({
  stats,
  metrics,
  reservoirLevel,
  pumpRunning,
  onHarvest,
  animationSpeed = 1,
}: ScenarioVisualizerProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scaledSpeed = Math.sqrt(animationSpeed);
  const { ledIntensity, airTemp, targetPH, targetEC } = stats;
  const { stage, leafCount, rootLength, age, health } = metrics;
  const isPost70Decay = age > 70;
  const isDriftStressed = !isPost70Decay && (health < 90 || targetPH > 6.8 || (reservoirLevel !== undefined && reservoirLevel <= 25));

  // Dynamic Leaf Color: Green -> Yellow (Iron Lockout at pH > 6.8 or health loss) -> Brown -> Black
  const leafColor = useMemo(() => {
    if (age > 88 || health <= 5) return "#1c1917"; // Dead black/slimy rot
    if (age > 78 || health <= 25) return "#451a03"; // Necrotic brown decay
    if (age > 70 || health <= 50) return "#785f43"; // Senescence or severe stress
    if (targetPH > 8.0 || health <= 70) return "#eab308"; // Interveinal chlorosis (Iron lockout yellow)
    if (targetPH > 6.8 || health <= 85 || (reservoirLevel !== undefined && reservoirLevel <= 20)) return "#a3e635"; // Sickly pale yellow-green
    if (airTemp > 32) return "#a3e635";
    return "#10b981"; // Healthy emerald
  }, [airTemp, age, health, targetPH, reservoirLevel]);

  // Leaf tipburn necrosis border opacity
  const tipBurnOpacity = useMemo(() => {
    if (age > 70 || health <= 40) return 0.9;
    if (targetPH > 7.5 || health <= 70 || targetEC > 1.8) return 0.7;
    if (targetPH > 6.8 || health <= 85) return 0.35;
    return 0;
  }, [targetPH, targetEC, health, age]);

  // Root color: White-yellow -> Dull tan/brown decaying roots
  const rootColor = useMemo(() => {
    if (age > 85 || health <= 5) return "#1c1917";
    if (age > 70 || health <= 60 || targetPH > 7.2 || (reservoirLevel !== undefined && reservoirLevel <= 20)) return "#78350f";
    return "#fef08a";
  }, [age, health, targetPH, reservoirLevel]);

  // Canopy wilt angle for over-mature droop or unmonitored water stress
  const wiltAngle = useMemo(() => {
    if (age > 85 || health <= 5) return 48;
    if (age > 70) return Math.min(45, (age - 70) * 2.5);
    if (health <= 20) return 40;
    if (health <= 50 || (reservoirLevel !== undefined && reservoirLevel <= 15)) return 25; // Water stress wilting
    if (health <= 80 || targetPH > 7.5) return 12;
    return 0;
  }, [age, health, reservoirLevel, targetPH]);

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
    
    let decayFactor = 1.0;
    if (age > 70) decayFactor = Math.max(0.3, 1 - (age - 70) * 0.035);
    else if (health <= 20) decayFactor = 0.55;
    else if (health <= 50) decayFactor = 0.75;
    else if (health <= 80) decayFactor = 0.88;

    for (let i = 0; i < maxRenderLeaves; i++) {
      const angle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves;
      list.push({
        id: i,
        angle,
        scaleX: (0.4 + ageFactor * 0.7) * decayFactor,
        scaleY: (0.5 + ageFactor * 0.8) * decayFactor,
      });
    }
    return list;
  }, [leafCount, age, health]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination") return 0.22;
    if (stage === "Seedling") return 0.45;
    if (stage === "Vegetative") return 0.75;
    if (stage === "Mature" || stage === "Ready for Harvest") return 1.05;
    return 1.15;
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
    if (len > 8 && age <= 85) {
      paths.push(`M 190 270 Q 180 290 175 ${240 + maxDepth}`);
      paths.push(`M 210 270 Q 220 290 225 ${240 + maxDepth}`);
    }
    return paths;
  }, [rootLength, age]);

  const isReady = age >= 25 && age <= 35 && health > 70;

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#090a0f] p-8 flex flex-col items-center justify-center select-none animate-in fade-in duration-200"
          : "relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      }
      id="normal-growth-viewport"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#10b9810b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

      {/* Phase Status Badge */}
      {!isPost70Decay && !isDriftStressed && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>{metrics.phaseName || "Normal Growth Baseline"}</span>
          {isReady && <span className="ml-1 text-yellow-300 font-bold">✂ HARVEST READY</span>}
        </div>
      )}

      {/* Over-Mature Senescence Badge */}
      {isPost70Decay && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-amber-950/90 border border-amber-500/60 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
          <span>Over-Mature Decay (Day {age.toFixed(1)} &gt; 70)</span>
        </div>
      )}

      {/* Unmonitored Parameter Drift Badge */}
      {isDriftStressed && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-red-950/90 border border-red-500/60 text-red-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
          <span>Unmonitored Drift Stress: pH {targetPH.toFixed(2)} | Health {health.toFixed(0)}%</span>
        </div>
      )}

      {/* Floating Controls */}
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
        id="normal-growth-svg"
      >
        <defs>
          <linearGradient id="normalLedBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? 0.25 : 0.45} />
            <stop offset="60%" stopColor="#fde047" stopOpacity={isDark ? 0.05 : 0.12} />
            <stop offset="100%" stopColor="#fde047" stopOpacity={0} />
          </linearGradient>

          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <style>
            {`
              @keyframes smoothSway {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(1.2deg); }
              }
              .animate-smooth-sway {
                transform-origin: 200px 240px;
                animation: smoothSway ${4 / scaledSpeed}s ease-in-out infinite;
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
        <g id="led-light-fixture">
          <polygon
            points="140,30 260,30 350,240 50,240"
            fill="url(#normalLedBeam)"
            opacity={0.15 + (ledIntensity / 400) * 0.85}
          />
          <rect x="130" y="22" width="140" height="10" rx="3" fill={isDark ? "#334155" : "#64748b"} />
          <rect x="140" y="32" width="120" height="4" fill="#fde047" filter="url(#glowGreen)" />
        </g>

        {/* NFT Channel */}
        <g id="nft-channel">
          <rect x="30" y="240" width="340" height="90" rx="10" fill={isDark ? "#0f172a" : "#cbd5e1"} stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <rect x="50" y="240" width="300" height="8" fill={isDark ? "#1e293b" : "#e2e8f0"} />
          <circle cx="200" cy="240" r="22" fill={isDark ? "#020617" : "#cbd5e1"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="2" />
          <rect x="182" y="240" width="36" height="14" rx="2" fill={isDark ? "#1e293b" : "#94a3b8"} />
          <path d="M 40 310 Q 200 315 360 310 L 360 322 L 40 322 Z" fill="#06b6d4" opacity="0.8" />
          {pumpRunning && (
            <path
              d="M 40 310 Q 200 315 360 310"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="2"
              strokeDasharray="8,6"
              className="animate-pulse"
            />
          )}
        </g>

        {/* Roots */}
        <g id="healthy-roots" className={pumpRunning ? "animate-root-sway" : ""}>
          {rootPaths.map((d, idx) => (
            <path
              key={`normal-root-${idx}`}
              d={d}
              fill="none"
              stroke={rootColor}
              strokeWidth={idx === 0 ? "3.5" : "2"}
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}
        </g>

        {/* Rosette Canopy */}
        <g id="lettuce-rosette" className="animate-smooth-sway" transform={wiltAngle > 0 ? `rotate(${wiltAngle}, 200, 240)` : undefined}>
          <g transform={`translate(200, 238) scale(${lettuceScale}) translate(-200, -238)`}>
            {leaves.map((leaf) => (
              <g
                key={`leaf-${leaf.id}`}
                transform={`translate(200, 235) rotate(${leaf.angle}) scale(${leaf.scaleX}, ${leaf.scaleY}) translate(-200, -235)`}
              >
                <path
                  d="M 200 235 C 160 170, 160 110, 200 100 C 240 110, 240 170, 200 235 Z"
                  fill={leafColor}
                  stroke={isDark ? "#064e3b" : "#047857"}
                  strokeWidth="1.5"
                />
                <path d="M 200 235 Q 200 160 200 115" fill="none" stroke={health <= 70 || targetPH > 7.0 ? "#65a30d" : "#a3e635"} strokeWidth="2.0" opacity="0.8" />
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
            <circle cx="200" cy="232" r="10" fill="#a3e635" />
            <circle cx="200" cy="232" r="6" fill="#bef264" />
          </g>
        </g>

        {isReady && onHarvest && (
          <g transform="translate(145, 120)" className="cursor-pointer" onClick={onHarvest} id="btn-svg-harvest">
            <rect x="0" y="0" width="110" height="26" rx="13" fill="#10b981" filter="url(#glowGreen)" />
            <text x="55" y="17" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">
              ✂ HARVEST!
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
