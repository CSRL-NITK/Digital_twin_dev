import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LettuceEnvironmentalStats, LettuceMetrics } from "../../types";
import { useTheme } from "../ThemeProvider";

interface NormalGrowthVisualizerProps {
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
  pumpRunning,
  onHarvest,
  animationSpeed = 1,
}: NormalGrowthVisualizerProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scaledSpeed = Math.sqrt(animationSpeed);
  const { ledIntensity, airTemp } = stats;
  const { stage, leafCount, rootLength } = metrics;

  // Always healthy vibrant green in normal growth with auto-dosing
  const leafColor = useMemo(() => {
    if (airTemp > 32) return "#a3e635"; // Slight heat stress tint
    return "#10b981"; // Healthy lush emerald green
  }, [airTemp]);

  const tipBurnOpacity = useMemo(() => {
    if (stats.targetEC > 2.2) return 0.4;
    return 0;
  }, [stats.targetEC]);

  // Slight natural sway
  const swayAnimationSpeed = scaledSpeed;

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

  // Healthy white-yellow roots
  const rootColor = "#fef08a";

  // Compute Lettuce rosette leaves
  const leaves = useMemo(() => {
    const list: Array<{
      id: number;
      angle: number;
      scaleX: number;
      scaleY: number;
    }> = [];

    const maxRenderLeaves = Math.min(leafCount, 24);
    for (let i = 0; i < maxRenderLeaves; i++) {
      const angle = (i * 137.5) % 360;
      const ageFactor = i / maxRenderLeaves;
      const sizeX = 0.4 + ageFactor * 0.7;
      const sizeY = 0.5 + ageFactor * 0.8;

      list.push({
        id: i,
        angle,
        scaleX: sizeX,
        scaleY: sizeY,
      });
    }
    return list;
  }, [leafCount]);

  const lettuceScale = useMemo(() => {
    if (stage === "Germination") return 0.22;
    if (stage === "Seedling") return 0.45;
    if (stage === "Vegetative") return 0.75;
    if (stage === "Mature" || stage === "Ready for Harvest") return 1.05;
    return 1.15;
  }, [stage]);

  // Root paths inside NFT channel
  const rootPaths = useMemo(() => {
    const paths: string[] = [];
    const maxDepth = Math.min(rootLength * 1.5, 95);
    
    paths.push(`M 200 240 Q 200 ${240 + maxDepth * 0.5} ${200 + Math.sin(rootLength) * 5} ${240 + maxDepth}`);
    
    if (rootLength > 3) {
      paths.push(`M 200 248 Q 185 260 170 270`);
      paths.push(`M 200 248 Q 215 260 230 270`);
    }
    if (rootLength > 8) {
      paths.push(`M 195 265 Q 175 285 160 295`);
      paths.push(`M 205 265 Q 225 285 240 295`);
    }
    if (rootLength > 15) {
      paths.push(`M 200 285 Q 185 305 175 320`);
      paths.push(`M 200 285 Q 215 305 225 320`);
    }
    return paths;
  }, [rootLength]);

  const isReady = stage === "Ready for Harvest";

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#090a0f] p-8 flex flex-col items-center justify-center select-none animate-in fade-in duration-200"
          : "relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      }
      id="normal-growth-viewport"
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b9810b_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none opacity-40" />

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
        id="normal-growth-svg"
      >
        <defs>
          <linearGradient id="normalLedBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? 0.2 : 0.4} />
            <stop offset="60%" stopColor="#a3e635" stopOpacity={isDark ? 0.03 : 0.08} />
            <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
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
                animation: smoothSway ${4 / swayAnimationSpeed}s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* LED Light Fixture Beam */}
        <g id="led-light-fixture">
          <polygon
            points="140,30 260,30 350,240 50,240"
            fill="url(#normalLedBeam)"
            opacity={0.15 + (ledIntensity / 400) * 0.85}
          />
          <rect x="130" y="22" width="140" height="10" rx="3" fill={isDark ? "#334155" : "#64748b"} />
          <rect x="140" y="32" width="120" height="4" fill="#fef08a" filter="url(#glowGreen)" />
        </g>

        {/* NFT Channel & Water Stream */}
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

        {/* Healthy Root Strands */}
        <g id="healthy-roots">
          {rootPaths.map((d, idx) => (
            <path
              key={`root-strand-${idx}`}
              d={d}
              fill="none"
              stroke={rootColor}
              strokeWidth={idx === 0 ? "3.5" : "2"}
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}
        </g>

        {/* Plant Rosette Leaves */}
        <g id="lettuce-rosette" className="animate-smooth-sway">
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
                {/* Center Leaf Vein */}
                <path d="M 200 235 Q 200 160 200 115" fill="none" stroke="#a3e635" strokeWidth="2.0" opacity="0.8" />

                {/* Optional Tipburn border */}
                {tipBurnOpacity > 0 && (
                  <path
                    d="M 185 130 C 180 110, 200 100, 200 100 C 200 100, 220 110, 215 130"
                    fill="none"
                    stroke="#78350f"
                    strokeWidth="3"
                    opacity={tipBurnOpacity}
                  />
                )}
              </g>
            ))}

            {/* Inner Crown Leaf Core */}
            <circle cx="200" cy="232" r="10" fill="#a3e635" />
            <circle cx="200" cy="232" r="6" fill="#bef264" />
          </g>
        </g>

        {/* Ready for Harvest Badge Button */}
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
