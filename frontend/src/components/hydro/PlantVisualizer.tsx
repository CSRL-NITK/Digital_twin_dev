import { useMemo, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LettuceEnvironmentalStats, LettuceMetrics } from "../../types";
import { useTheme } from "../ThemeProvider";

interface PlantVisualizerProps {
  stats: LettuceEnvironmentalStats;
  metrics: LettuceMetrics;
  reservoirLevel?: number; // unused in svg but required in page integration
  pumpRunning: boolean;
  onHarvest?: () => void;
  animationSpeed?: number;
}

export default function PlantVisualizer({
  stats,
  metrics,
  pumpRunning,
  onHarvest,
  animationSpeed = 1,
}: PlantVisualizerProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scaledSpeed = Math.sqrt(animationSpeed);
  const { ledIntensity, flowRate, waterTemp, airTemp } = stats;
  const { stage, health, leafCount, rootLength } = metrics;

  const isDead = health <= 5 || metrics.age > 88;
  const swayAnimationSpeed = isDead ? 0.001 : scaledSpeed;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Center of interest is the plant rosette (x=200, y=240)
  const viewBoxString = useMemo(() => {
    if (zoom === 1.0) return "0 0 400 400";
    const width = 400 / zoom;
    const height = 400 / zoom;
    const centerX = 200;
    const centerY = 230; // center slightly above the lid to showcase the foliage
    const minX = Math.max(0, Math.min(400 - width, centerX - width / 2));
    const minY = Math.max(0, Math.min(400 - height, centerY - height / 2));
    return `${minX} ${minY} ${width} ${height}`;
  }, [zoom]);

  // 1. Dynamic Leaf Colors based on health and age
  const leafColor = useMemo(() => {
    if (metrics.age > 70) {
      if (metrics.age > 85) return "#3e2723"; // Dead, rotten dark brown
      if (metrics.age > 78) return "#5c4033"; // Severely rotten brown
      return "#bef264"; // Withered yellow-green
    }
    if (health <= 5) return "#3e2723"; // Dead, rotten dark brown
    if (health <= 15) return "#5c4033"; // Severely rotten brown
    if (health <= 30) return "#785f43"; // Decaying brown/yellowish
    if (health < 40) return "#a3e635"; // Sick yellowish-green
    if (stats.targetEC < 0.9) return "#bef264"; // Pale chlorotic
    if (stats.targetPH > 6.6) return "#eab308"; // High pH iron lockout
    if (stats.targetEC > 2.2) return "#15803d"; // Excess nitrogen dark
    return "#10b981"; // Healthy emerald
  }, [health, stats.targetEC, stats.targetPH, metrics.age]);

  // Leaf tip burn effect
  const tipBurnOpacity = useMemo(() => {
    if (metrics.age > 70) return 0.95; // tips are burnt/decayed in old age
    if (health <= 10) return 0.95;
    if (health <= 30) return 0.6;
    if (stats.targetEC > 2.0) return 0.85;
    if (stats.targetEC > 1.8) return 0.4;
    return 0;
  }, [stats.targetEC, health, metrics.age]);

  // Wilt angle based on air temperature, water stress, and age
  const wiltAngle = useMemo(() => {
    let angle = 0;
    if (metrics.age > 70) {
      angle += Math.min(45, (metrics.age - 70) * 2.2); // progressive droop
    }
    if (health <= 5) angle += 40; // collapsed droop angle
    else if (health <= 15) angle += 30;
    else if (health <= 30) angle += 20;

    if (airTemp > 29) angle += (airTemp - 29) * 1.8;
    if (!pumpRunning) angle += 15;
    return Math.min(angle, 55);
  }, [airTemp, pumpRunning, health, metrics.age]);

  // Root color based on temperature, health, and age
  const rootColor = useMemo(() => {
    if (metrics.age > 70) {
      if (metrics.age > 82) return "#3e1c07"; // rotten black-brown
      return "#78350f"; // decaying brown
    }
    if (health <= 5) return "#3e1c07"; // completely decayed blackish-brown
    if (health <= 15) return "#5c2e0b"; // severely rotten brown
    if (waterTemp > 24.5) return "#78350f"; // rotten brown
    if (waterTemp > 23.0) return "#b45309"; // muddy amber
    return "#fef08a"; // healthy white-yellow
  }, [waterTemp, health, metrics.age]);



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
      let sizeX = 0.4 + ageFactor * 0.7;
      let sizeY = 0.5 + ageFactor * 0.8;

      // Shrivel effect if health is low or age is high
      if (metrics.age > 70) {
        const decayFactor = Math.max(0.20, 1 - (metrics.age - 70) * 0.05);
        sizeX *= decayFactor;
        sizeY *= decayFactor;
      } else if (health <= 5) {
        sizeX *= 0.55;
        sizeY *= 0.50; // Droop/collapse
      } else if (health <= 15) {
        sizeX *= 0.70;
        sizeY *= 0.65;
      } else if (health <= 30) {
        sizeX *= 0.85;
        sizeY *= 0.80;
      }

      list.push({
        id: i,
        angle,
        scaleX: sizeX,
        scaleY: sizeY,
      });
    }
    return list;
  }, [leafCount, health, metrics.age]);

  const stretchYMultiplier = useMemo(() => {
    if (health <= 5) return 0.45; // severely collapsed/drooped
    if (health <= 15) return 0.6;
    if (health <= 30) return 0.8;
    return ledIntensity < 120 ? 1.4 : 1.0;
  }, [health, ledIntensity]);

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
    const maxDepth = Math.min(rootLength * 1.5, 95); // clamp visual depth to 95px
    
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
      id="lettuce-nft-viewport"
    >
      {/* Visual background lines */}
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

      {/* Main SVG Render Stage */}
      <svg
        viewBox={viewBoxString}
        className={`w-full z-0 transition-all duration-300 ease-out ${
          isFullscreen ? "h-auto max-h-[85vh] max-w-full" : "h-full max-h-[220px]"
        }`}
        id="lettuce-svg-stage"
      >
        <defs>
          {/* LED Glow beam gradient */}
          <linearGradient id="ledBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? 0.2 : 0.4} />
            <stop offset="60%" stopColor="#a3e635" stopOpacity={isDark ? 0.03 : 0.08} />
            <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
          </linearGradient>

          {/* Hydroponic Flow stream gradient */}
          <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 1. OVERHEAD WHITE GROW LED FIXTURE */}
        <g id="overhead-grow-lights">
          <rect x="50" y="15" width="300" height="12" rx="4" fill={isDark ? "#1e293b" : "#cbd5e1"} stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth="1.5" />
          <rect
            x="60"
            y="21"
            width="280"
            height="4"
            rx="1"
            fill="#ffffff"
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
          />
          {ledIntensity > 0 && (
            <polygon
              points="60,27 340,27 380,240 20,240"
              fill="url(#ledBeam)"
              opacity={Math.min(ledIntensity / 250, 0.7)}
              className="transition-all duration-500 pointer-events-none"
            />
          )}
        </g>

        {/* 2. THE WHITE NFT GROW CHANNEL (CUT SECTION) */}
        <g id="nft-channel-structure">
          {/* Gutter back wall */}
          <rect x="15" y="240" width="370" height="90" rx="4" fill={isDark ? "#0f172a" : "#f1f5f9"} stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
          
          {/* Flowing thin film of nutrient solution */}
          {pumpRunning && flowRate > 0 ? (
            <g id="nutrient-film">
              <path
                d="M 15 315 Q 100 314 200 315 T 385 315 L 385 328 L 15 328 Z"
                fill="url(#streamGradient)"
                className="transition-all duration-300"
              />
              <line
                x1="25"
                y1="321"
                x2="375"
                y2="321"
                stroke="#e0f2fe"
                strokeWidth="1.5"
                strokeDasharray="12 40"
                strokeLinecap="round"
                className={`water-flow-item-${animationSpeed}`}
                opacity="0.6"
              />
            </g>
          ) : (
            <line x1="15" y1="325" x2="385" y2="325" stroke="#451a03" strokeWidth="2.5" opacity="0.4" />
          )}

          {/* Gutter front glass facade */}
          <rect
            x="15"
            y="240"
            width="370"
            height="90"
            rx="4"
            fill="#1e293b"
            fillOpacity="0.1"
            stroke="#475569"
            strokeWidth="1.5"
            style={{ backdropFilter: "blur(1px)" }}
          />

          {/* Channel Lid hole rim */}
          <ellipse cx="200" cy="240" rx="35" ry="6" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
        </g>

        <g id="fibrous-lettuce-roots" className={`root-sway-group-${animationSpeed}`}>
          <g stroke={rootColor} strokeLinecap="round" strokeWidth="2" fill="none" className="transition-all duration-1000">
            {rootPaths.map((path, idx) => (
              <path key={`root-hair-${idx}`} d={path} opacity={0.6 + Math.min(health / 250, 0.4)} />
            ))}
          </g>
        </g>

        {/* 4. BLACK NEST POT/CUP INSERTED IN THE LID */}
        <g id="net-pot-basket">
          <polygon
            points="172,240 228,240 216,258 184,258"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="1.2"
          />
          {/* pebbles */}
          <circle cx="190" cy="242" r="4" fill="#a16207" />
          <circle cx="210" cy="241" r="4.5" fill="#a16207" />
          <circle cx="200" cy="243" r="4" fill="#854d0e" />
        </g>

        {/* 5. TELEMETRY SENSOR INDICATORS */}
        <g id="submersed-nft-probes" className="font-mono text-[8px] font-bold">
          <g transform="translate(50, 220)">
            <rect x="0" y="0" width="8" height="35" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
            <circle cx="4" cy="35" r="2.5" fill="#22d3ee" className={`probe-pulse-item-${animationSpeed}`} />
          </g>
          <g transform="translate(110, 225)">
            <rect x="0" y="0" width="6" height="30" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
            <circle cx="3" cy="30" r="2" fill="#34d399" className={`probe-pulse-item-${animationSpeed}`} />
          </g>
        </g>

        {/* 6. GREEN CORAL LETTUCE ROSETTE */}
        <g
          id="lettuce-rosette-crown"
          transform={`translate(200, 240) scale(${lettuceScale})`}
          className="transition-all duration-700"
        >
          {ledIntensity < 110 && stage !== "Germination" && (
            <rect x="-6" y="-35" width="12" height="36" fill="#4ade80" stroke="#166534" strokeWidth="1.5" rx="3" />
          )}

          {stage === "Germination" ? (
            <g className="animate-pulse">
              <path d="M 0 0 C 0 -6 -2 -14 -6 -16" fill="none" stroke="#22c55e" strokeWidth="2.5" />
              <path d="M 0 0 C 0 -6 2 -14 6 -16" fill="none" stroke="#22c55e" strokeWidth="2.5" />
              <ellipse cx="-7" cy="-17" rx="6" ry="4" fill="#10b981" transform="rotate(-20 -7 -17)" />
              <ellipse cx="7" cy="-17" rx="6" ry="4" fill="#10b981" transform="rotate(20 7 -17)" />
            </g>
          ) : (
            <g transform={`rotate(${wiltAngle})`} className={`sway-lettuce-group-${animationSpeed}`}>
              {leaves.map((leaf) => {
                const tiltAngle = leaf.angle;
                const pathData = "M 0 0 C -22 -18 -32 -48 -18 -68 C -8 -78 8 -78 18 -68 C 32 -48 22 -18 0 0";
                
                return (
                  <g
                    key={`lettuce-leaf-${leaf.id}`}
                    transform={`rotate(${tiltAngle}) scale(${leaf.scaleX}, ${leaf.scaleY * stretchYMultiplier})`}
                    className="transition-all duration-500 lettuce-leaf-item"
                  >
                    <path
                      d={pathData}
                      fill={leafColor}
                      stroke={health <= 5 ? "#1a0f08" : health <= 15 ? "#2c1a0e" : health < 50 ? "#a3e635" : "#14532d"}
                      strokeWidth="1.0"
                      opacity="0.94"
                    />
                    <path
                      d="M -15 -62 C -20 -50 -10 -40 0 -25 C 10 -40 20 -50 15 -62"
                      fill="none"
                      stroke={health <= 5 ? "#4e3629" : health <= 15 ? "#795c34" : "#86efac"}
                      strokeWidth="0.8"
                      opacity={health <= 15 ? 0.25 : 0.45}
                    />
                    {tipBurnOpacity > 0 && (
                      <path
                        d="M -15 -68 C -5 -78 5 -78 15 -68"
                        fill="none"
                        stroke="#78350f"
                        strokeWidth="3.5"
                        opacity={tipBurnOpacity}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {/* Harvest Overlay direct button */}
      {isReady && onHarvest && (
        <button
          onClick={onHarvest}
          className={`absolute bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono text-[9px] font-black px-3 py-1 rounded shadow-lg animate-bounce active:scale-95 z-20 ${
            isFullscreen ? "bottom-8" : "bottom-1"
          }`}
        >
          ✂️ Harvest Crop 🥬
        </button>
      )}

      {/* Styles */}
      <style>{`
        @keyframes flow {
          to { stroke-dashoffset: -200; }
        }
        .water-flow-item-${animationSpeed} {
          animation: flow ${1.5 / scaledSpeed}s linear infinite;
        }
        @keyframes lettuce-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.2deg) skewX(0.4deg); }
        }
        .sway-lettuce-group-${animationSpeed} {
          animation: lettuce-sway ${5 / swayAnimationSpeed}s ease-in-out infinite;
          transform-origin: 0px 0px;
        }
        .lettuce-leaf-item {
          transform-origin: 0px 0px;
        }
        @keyframes root-sway {
          0%, 100% { transform: rotate(0deg) scaleX(1); }
          50% { transform: rotate(-1.5deg) scaleX(1.04) skewX(-0.5deg); }
        }
        .root-sway-group-${animationSpeed} {
          animation: root-sway ${6.8 / swayAnimationSpeed}s ease-in-out infinite;
          transform-origin: 200px 240px;
        }
        @keyframes probe-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .probe-pulse-item-${animationSpeed} {
          animation: probe-pulse ${2 / scaledSpeed}s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
