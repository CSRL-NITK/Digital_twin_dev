import React from 'react';
import { LayerId, LayerConfig, MaterialCustomization } from '../types';

interface SolarPanelProps {
  layers: Record<LayerId, LayerConfig>;
  materials: MaterialCustomization;
  showDimensions?: boolean;
  activeHoverLayer?: LayerId | null;
  onLayerHover?: (layerId: LayerId | null) => void;
  onLayerClick?: (layerId: LayerId) => void;
  sunPosition?: number; // 0 to 180 (for glare / reflection shift)
  className?: string;
}

export const IndustrialSolarPanelSVG: React.FC<SolarPanelProps> = ({
  layers,
  materials,
  showDimensions = false,
  activeHoverLayer = null,
  onLayerHover,
  onLayerClick,
  sunPosition = 90,
  className = '',
}) => {
  // Helper to check layer visibility and opacity
  const isVisible = (id: LayerId) => layers[id]?.visible ?? true;
  const getOpacity = (id: LayerId) => layers[id]?.opacity ?? 1;
  const isHighlighted = (id: LayerId) => layers[id]?.highlighted || activeHoverLayer === id;

  // Pivot Axis Point
  const PIVOT_X = 500;
  const PIVOT_Y = 500;

  // Material dynamic color mapping
  const getCellColors = () => {
    switch (materials.cellType) {
      case 'obsidian-black':
        return { base1: '#0f1115', base2: '#1b1e24', cell: '#14171d', grid: '#808080', border: '#2a2e38' };
      case 'poly-cyan':
        return { base1: '#004b6e', base2: '#0077b6', cell: '#005f87', grid: '#e0e0e0', border: '#0096c7' };
      case 'mono-blue':
      default:
        return { base1: '#0d1b2a', base2: '#1b263b', cell: '#12253a', grid: '#d8d8d8', border: '#203d5d' };
    }
  };

  const getFrameGradients = () => {
    switch (materials.frameFinish) {
      case 'anodized-black':
        return { top: '#2c2d30', mid: '#1a1a1c', dark: '#0c0c0e', stroke: '#404247' };
      case 'raw-zinc':
        return { top: '#b8c2cc', mid: '#8a94a0', dark: '#5e6773', stroke: '#d1d8e0' };
      case 'brushed-silver':
      default:
        return { top: '#e2e8f0', mid: '#cbd5e1', dark: '#94a3b8', stroke: '#f8fafc' };
    }
  };

  const getPoleGradients = () => {
    switch (materials.poleFinish) {
      case 'matte-black':
        return { light: '#4b5563', mid: '#1f2937', dark: '#111827', rust: '#374151' };
      case 'industrial-yellow':
        return { light: '#fde047', mid: '#eab308', dark: '#ca8a04', rust: '#a16207' };
      case 'galvanized-silver':
      default:
        return { light: '#e5e7eb', mid: '#9ca3af', dark: '#4b5563', rust: '#6b7280' };
    }
  };

  const cellColors = getCellColors();
  const frameColors = getFrameGradients();
  const poleColors = getPoleGradients();

  // Sun glare X shift based on sunPosition (0 to 180)
  const glareX = 200 + (sunPosition / 180) * 600;

  // Render 6 columns x 10 rows solar cell matrix (60 cells) in perspective
  const renderSolarCells = () => {
    const cols = 6;
    const rows = 10;
    const cells = [];
    const pad = 3;

    for (let r = 0; r < rows; r++) {
      const vRatioTop = r / rows;
      const vRatioBottom = (r + 1) / rows;

      const yTop = 205 + vRatioTop * (475 - 205);
      const yBottom = 205 + vRatioBottom * (475 - 205);

      const xLeftTop = 265 + vRatioTop * (205 - 265);
      const xRightTop = 735 + vRatioTop * (795 - 735);

      const xLeftBottom = 265 + vRatioBottom * (205 - 265);
      const xRightBottom = 735 + vRatioBottom * (795 - 735);

      for (let c = 0; c < cols; c++) {
        const hRatioLeft = c / cols;
        const hRatioRight = (c + 1) / cols;

        const x1 = xLeftTop + hRatioLeft * (xRightTop - xLeftTop) + pad;
        const x2 = xLeftTop + hRatioRight * (xRightTop - xLeftTop) - pad;
        const x3 = xLeftBottom + hRatioRight * (xRightBottom - xLeftBottom) - pad;
        const x4 = xLeftBottom + hRatioLeft * (xRightBottom - xLeftBottom) + pad;

        const y1 = yTop + pad * 0.8;
        const y2 = yTop + pad * 0.8;
        const y3 = yBottom - pad * 0.8;
        const y4 = yBottom - pad * 0.8;

        const cut = 3.5;
        const pathData = `
          M ${x1 + cut} ${y1}
          L ${x2 - cut} ${y2}
          L ${x2} ${y2 + cut}
          L ${x3} ${y3 - cut}
          L ${x3 - cut} ${y3}
          L ${x4 + cut} ${y4}
          L ${x4} ${y4 - cut}
          L ${x1} ${y1 + cut}
          Z
        `;

        cells.push(
          <path
            key={`cell-${r}-${c}`}
            d={pathData}
            fill="url(#pv-cell-gradient)"
            stroke={cellColors.border}
            strokeWidth="0.6"
            className="transition-colors duration-300"
          />
        );
      }
    }

    const busbars = [];
    for (let c = 0; c < cols; c++) {
      [0.25, 0.5, 0.75].forEach((subRatio, bIdx) => {
        const colRatio = (c + subRatio) / cols;
        const xTop = 265 + colRatio * (735 - 265);
        const xBottom = 205 + colRatio * (795 - 205);

        busbars.push(
          <line
            key={`busbar-${c}-${bIdx}`}
            x1={xTop}
            y1={205}
            x2={xBottom}
            y2={475}
            stroke={cellColors.grid}
            strokeWidth="1.2"
            strokeOpacity="0.85"
          />
        );
      });
    }

    const fingers = [];
    const totalFingers = 30;
    for (let f = 0; f < totalFingers; f++) {
      const fRatio = (f + 0.5) / totalFingers;
      const yF = 205 + fRatio * (475 - 205);
      const xLeftF = 265 + fRatio * (205 - 265);
      const xRightF = 735 + fRatio * (795 - 735);

      fingers.push(
        <line
          key={`finger-${f}`}
          x1={xLeftF + 4}
          y1={yF}
          x2={xRightF - 4}
          y2={yF}
          stroke={cellColors.grid}
          strokeWidth="0.3"
          strokeOpacity="0.4"
        />
      );
    }

    return (
      <g id="solar-cells" data-layer="solar-cells">
        {cells}
        {busbars}
        {fingers}
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 1000 1200"
      className={`w-full h-auto select-none transition-all duration-300 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Cell Gradient */}
        <linearGradient id="pv-cell-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={cellColors.base1} />
          <stop offset="50%" stopColor={cellColors.cell} />
          <stop offset="100%" stopColor={cellColors.base2} />
        </linearGradient>

        {/* Frame Brushed Aluminum Metallic Gradients */}
        <linearGradient id="frame-top-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={frameColors.top} />
          <stop offset="50%" stopColor={frameColors.stroke} />
          <stop offset="100%" stopColor={frameColors.mid} />
        </linearGradient>

        <linearGradient id="frame-bevel-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={frameColors.top} />
          <stop offset="40%" stopColor={frameColors.mid} />
          <stop offset="100%" stopColor={frameColors.dark} />
        </linearGradient>

        {/* Galvanized Steel Pole Gradient */}
        <linearGradient id="pole-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={poleColors.dark} />
          <stop offset="25%" stopColor={poleColors.light} />
          <stop offset="60%" stopColor={poleColors.mid} />
          <stop offset="100%" stopColor={poleColors.dark} />
        </linearGradient>

        {/* Linear Actuator Metallic Chrome Rod */}
        <linearGradient id="actuator-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="30%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Spangle Texture Pattern for Galvanized Steel */}
        <pattern id="galvanized-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M0,5 L5,0 L10,5 L5,10 Z" fill="#ffffff" fillOpacity="0.06" />
          <path d="M10,15 L15,10 L20,15 L15,20 Z" fill="#000000" fillOpacity="0.08" />
        </pattern>

        {/* Glass Reflection Glare */}
        <linearGradient id="glass-glare" x1={`${(glareX - 200) / 6}%`} y1="0%" x2={`${(glareX + 200) / 6}%`} y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>

        {/* Cable Insulation Gradient */}
        <linearGradient id="cable-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3d4046" />
          <stop offset="50%" stopColor="#1a1c20" />
          <stop offset="100%" stopColor="#0d0e10" />
        </linearGradient>

        {/* Glow Filter for Active Layer Selection */}
        <filter id="layer-highlight-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="1.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* BACKGROUND GROUND REFERENCE AXIS */}
      <line x1="150" y1="1100" x2="850" y2="1100" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6,6" opacity="0.4" />

      {/* ==============================================================
          FIXED / STATIONARY STRUCTURE (Pole, Base, Bolts, Pivot Hinge)
          ============================================================== */}

      {/* 1. SUPPORT POLE (Stationary) */}
      {isVisible('support-pole') && (
        <g
          id="support-pole"
          data-layer="support-pole"
          opacity={getOpacity('support-pole')}
          filter={isHighlighted('support-pole') ? 'url(#layer-highlight-glow)' : undefined}
          onMouseEnter={() => onLayerHover?.('support-pole')}
          onMouseLeave={() => onLayerHover?.(null)}
          onClick={() => onLayerClick?.('support-pole')}
          className="cursor-pointer transition-all duration-200"
        >
          <rect x="475" y="470" width="50" height="610" rx="2" fill="url(#pole-gradient)" />
          <rect x="475" y="470" width="50" height="610" rx="2" fill="url(#galvanized-pattern)" opacity="0.6" />
          <line x1="475" y1="470" x2="475" y2="1080" stroke="#334155" strokeWidth="1.5" />
          <line x1="525" y1="470" x2="525" y2="1080" stroke="#1e293b" strokeWidth="2" />
          <line x1="488" y1="470" x2="488" y2="1080" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
          <ellipse cx="500" cy="470" rx="25" ry="8" fill={poleColors.light} stroke="#475569" strokeWidth="1.5" />
        </g>
      )}

      {/* 2. BASE PLATE (Stationary) */}
      {isVisible('base-plate') && (
        <g
          id="base-plate"
          data-layer="base-plate"
          opacity={getOpacity('base-plate')}
          filter={isHighlighted('base-plate') ? 'url(#layer-highlight-glow)' : undefined}
          onMouseEnter={() => onLayerHover?.('base-plate')}
          onMouseLeave={() => onLayerHover?.(null)}
          onClick={() => onLayerClick?.('base-plate')}
          className="cursor-pointer transition-all duration-200"
        >
          <polygon
            points="390,1095 410,1075 590,1075 610,1095 610,1105 590,1115 410,1115 390,1105"
            fill="url(#pole-gradient)"
            stroke="#334155"
            strokeWidth="2"
          />
          <polygon
            points="395,1095 412,1078 588,1078 605,1095"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          <polygon points="440,1075 475,1075 475,1020" fill={poleColors.mid} stroke="#334155" strokeWidth="1.2" />
          <polygon points="560,1075 525,1075 525,1020" fill={poleColors.dark} stroke="#334155" strokeWidth="1.2" />
          <polygon points="485,1075 500,1075 492,1030" fill={poleColors.light} stroke="#475569" strokeWidth="1" />
          <polygon points="500,1075 515,1075 508,1030" fill={poleColors.mid} stroke="#475569" strokeWidth="1" />
          <path d="M 470,1075 Q 475,1072 475,1065" stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.8" />
          <path d="M 530,1075 Q 525,1072 525,1065" stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.8" />
        </g>
      )}

      {/* 3. ANCHOR BOLTS (Stationary) */}
      {isVisible('anchor-bolts') && (
        <g
          id="anchor-bolts"
          data-layer="anchor-bolts"
          opacity={getOpacity('anchor-bolts')}
          filter={isHighlighted('anchor-bolts') ? 'url(#layer-highlight-glow)' : undefined}
          onMouseEnter={() => onLayerHover?.('anchor-bolts')}
          onMouseLeave={() => onLayerHover?.(null)}
          onClick={() => onLayerClick?.('anchor-bolts')}
          className="cursor-pointer transition-all duration-200"
        >
          {[
            { x: 420, y: 1085 },
            { x: 580, y: 1085 },
            { x: 435, y: 1105 },
            { x: 565, y: 1105 },
          ].map((bolt, idx) => (
            <g key={`bolt-${idx}`}>
              <rect x={bolt.x - 3} y={bolt.y - 18} width="6" height="22" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
              <line x1={bolt.x - 3} y1={bolt.y - 15} x2={bolt.x + 3} y2={bolt.y - 15} stroke="#64748b" strokeWidth="0.8" />
              <line x1={bolt.x - 3} y1={bolt.y - 12} x2={bolt.x + 3} y2={bolt.y - 12} stroke="#64748b" strokeWidth="0.8" />
              <line x1={bolt.x - 3} y1={bolt.y - 9} x2={bolt.x + 3} y2={bolt.y - 9} stroke="#64748b" strokeWidth="0.8" />
              <polygon
                points={`${bolt.x - 7},${bolt.y - 4} ${bolt.x - 4},${bolt.y - 8} ${bolt.x + 4},${bolt.y - 8} ${bolt.x + 7},${bolt.y - 4} ${bolt.x + 4},${bolt.y} ${bolt.x - 4},${bolt.y}`}
                fill="#cbd5e1"
                stroke="#1e293b"
                strokeWidth="1"
              />
              <polygon
                points={`${bolt.x - 7},${bolt.y - 10} ${bolt.x - 4},${bolt.y - 14} ${bolt.x + 4},${bolt.y - 14} ${bolt.x + 7},${bolt.y - 10} ${bolt.x + 4},${bolt.y - 6} ${bolt.x - 4},${bolt.y - 6}`}
                fill="#f1f5f9"
                stroke="#334155"
                strokeWidth="1"
              />
              <rect x={bolt.x - 9} y={bolt.y} width="18" height="3" rx="1" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
            </g>
          ))}
        </g>
      )}

      {/* 4. U-BOLTS (Stationary Pole Clamps) */}
      {isVisible('u-bolts') && (
        <g
          id="u-bolts"
          data-layer="u-bolts"
          opacity={getOpacity('u-bolts')}
          filter={isHighlighted('u-bolts') ? 'url(#layer-highlight-glow)' : undefined}
          onMouseEnter={() => onLayerHover?.('u-bolts')}
          onMouseLeave={() => onLayerHover?.(null)}
          onClick={() => onLayerClick?.('u-bolts')}
          className="cursor-pointer transition-all duration-200"
        >
          <path d="M 465,475 C 450,475 450,495 465,495" fill="none" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />
          <path d="M 465,475 C 450,475 450,495 465,495" fill="none" stroke="#475569" strokeWidth="1" />
          <rect x="535" y="471" width="10" height="8" rx="1" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
          <rect x="535" y="491" width="10" height="8" rx="1" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />

          <path d="M 465,525 C 450,525 450,545 465,545" fill="none" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />
          <path d="M 465,525 C 450,525 450,545 465,545" fill="none" stroke="#475569" strokeWidth="1" />
          <rect x="535" y="521" width="10" height="8" rx="1" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
          <rect x="535" y="541" width="10" height="8" rx="1" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
        </g>
      )}

      {/* 5. PIVOT HINGE (Stationary Pivot Assembly & Linear Actuator Cylinder Body) */}
      {isVisible('pivot-hinge') && (
        <g
          id="pivot-hinge"
          data-layer="pivot-hinge"
          opacity={getOpacity('pivot-hinge')}
          filter={isHighlighted('pivot-hinge') ? 'url(#layer-highlight-glow)' : undefined}
          onMouseEnter={() => onLayerHover?.('pivot-hinge')}
          onMouseLeave={() => onLayerHover?.(null)}
          onClick={() => onLayerClick?.('pivot-hinge')}
          className="cursor-pointer transition-all duration-200"
        >
          {/* Welded Heavy Steel Collar Clamped to Pole */}
          <rect x="465" y="460" width="70" height="85" rx="4" fill="url(#pole-gradient)" stroke="#334155" strokeWidth="2" />
          <rect x="467" y="462" width="66" height="81" rx="3" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />

          {/* Heavy Bearing Housing Block centered on Pivot Axis (500, 500) */}
          <rect x="480" y="480" width="40" height="40" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Grease Zerk Nipple for Bearing Lubrication */}
          <circle cx="500" cy="475" r="2.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.8" />

          {/* Outer Bearing Retainer Ring */}
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="15" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          {/* Bronze Self-Lubricating Bushing Ring */}
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="11" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
          {/* Central M24 Alloy Steel Pivot Pin */}
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="7" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="3" fill="#475569" />

          {/* Linear Actuator Cylinder Base Mount (Lower Stationary Pivot) */}
          <circle cx="500" cy="545" r="5" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          <line x1="492" y1="545" x2="508" y2="545" stroke="#64748b" strokeWidth="1" />

          {/* Actuator Heavy Black Hydraulic Cylinder Body */}
          <path d="M 494,545 L 496,525 L 504,525 L 506,545 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        </g>
      )}

      {/* LINEAR ACTUATOR PISTON ROD (Connects Pole Mount to Bracket Pin) */}
      <g id="linear-actuator-rod" className="pointer-events-none">
        {/* Stainless Steel Extension Piston Rod */}
        <line
          x1="500"
          y1="535"
          x2="575"
          y2="480"
          stroke="url(#actuator-chrome)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="500"
          y1="535"
          x2="575"
          y2="480"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeDasharray="2,8"
          opacity="0.8"
        />
        {/* Actuator Clevis End Joint Bolt at Bracket Pin */}
        <circle cx="575" cy="480" r="5" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="575" cy="480" r="2" fill="#1e293b" />
      </g>

      {/* 6. GROUNDING WIRE (Stationary) */}
      {isVisible('grounding-wire') && (
        <g
          id="grounding-wire"
          data-layer="grounding-wire"
          opacity={getOpacity('grounding-wire')}
          filter={isHighlighted('grounding-wire') ? 'url(#layer-highlight-glow)' : undefined}
          onMouseEnter={() => onLayerHover?.('grounding-wire')}
          onMouseLeave={() => onLayerHover?.(null)}
          onClick={() => onLayerClick?.('grounding-wire')}
          className="cursor-pointer transition-all duration-200"
        >
          <path
            d="M 465,490 Q 460,540 462,700 Q 464,900 462,1015 Q 460,1070 435,1082"
            fill="none"
            stroke="#eab308"
            strokeWidth="4"
            strokeDasharray="12,12"
          />
          <path
            d="M 465,490 Q 460,540 462,700 Q 464,900 462,1015 Q 460,1070 435,1082"
            fill="none"
            stroke="#22c55e"
            strokeWidth="4"
            strokeDasharray="0,12,12,0"
          />
          <rect x="458" y="1010" width="10" height="12" rx="2" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
          <circle cx="463" cy="1016" r="3" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
          <rect x="460" y="485" width="12" height="10" rx="1" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        </g>
      )}

      {/* ==============================================================
          PANEL MOUNTING & FRAME ASSEMBLY
          ============================================================== */}
      <g id="solar-panel-assembly">
        {/* 7. TILT BRACKET (Rotating Quadrant Arc Plate & Tracker Saddle) */}
        {isVisible('mounting-bracket') && (
          <g
            id="tilt-bracket"
            data-layer="mounting-bracket"
            opacity={getOpacity('mounting-bracket')}
            filter={isHighlighted('mounting-bracket') ? 'url(#layer-highlight-glow)' : undefined}
            onMouseEnter={() => onLayerHover?.('mounting-bracket')}
            onMouseLeave={() => onLayerHover?.(null)}
            onClick={() => onLayerClick?.('mounting-bracket')}
            className="cursor-pointer transition-all duration-200"
          >
            {/* Heavy Single-Axis Tracker Saddle / Torque Tube Clamp */}
            <path
              d="M 480,480 L 520,480 L 530,520 L 470,520 Z"
              fill="url(#pole-gradient)"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Adjustable Tilt Arc Quadrant Plate (0° - 90° Angle Ticks) */}
            <path
              d="M 515,480 L 595,420 A 75 75 0 0 1 615,525 L 535,525 Z"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Curved Arc Adjustment Slot */}
            <path
              d="M 545,470 A 55 55 0 0 1 585,515"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Degree Scale Ticks along Arc (0°, 30°, 60°, 90°) */}
            <line x1="535" y1="465" x2="540" y2="460" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="560" y1="475" x2="568" y2="470" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="580" y1="495" x2="588" y2="492" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="590" y1="520" x2="598" y2="520" stroke="#0f172a" strokeWidth="1.5" />

            {/* Lock Bolt & Pointer Arrow at Active Angle Indicator Slot */}
            <circle cx="572" cy="492" r="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
            <polygon points="570,488 574,488 576,492 574,496 570,496 568,492" fill="#64748b" />
          </g>
        )}

        {/* 8. SUPPORT ARMS & C-CHANNEL RAILS (Rotating) */}
        {isVisible('support-arms') && (
          <g
            id="support-arms"
            data-layer="support-arms"
            opacity={getOpacity('support-arms')}
            filter={isHighlighted('support-arms') ? 'url(#layer-highlight-glow)' : undefined}
            onMouseEnter={() => onLayerHover?.('support-arms')}
            onMouseLeave={() => onLayerHover?.(null)}
            onClick={() => onLayerClick?.('support-arms')}
            className="cursor-pointer transition-all duration-200"
          >
            {/* Top Back Rail (Steel C-Channel Section attached to Panel Backsheet) */}
            <polygon
              points="330,270 670,270 675,285 325,285"
              fill="#64748b"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            {/* Bottom Back Rail */}
            <polygon
              points="280,420 720,420 725,435 275,435"
              fill="#475569"
              stroke="#1e293b"
              strokeWidth="1.5"
            />

            {/* Left Upper Support Arm */}
            <polygon
              points="500,500 350,280 360,275 508,495"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Right Upper Support Arm */}
            <polygon
              points="500,500 650,280 640,275 492,495"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="1.2"
            />

            {/* Left Lower Diagonal Strut */}
            <polygon
              points="480,520 310,425 318,418 488,513"
              fill="#cbd5e1"
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Right Lower Diagonal Strut */}
            <polygon
              points="520,520 690,425 682,418 512,513"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1.2"
            />

            {/* Fastener Bolts on Support Arms */}
            <circle cx="355" cy="278" r="4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
            <circle cx="645" cy="278" r="4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
            <circle cx="314" cy="421" r="4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
            <circle cx="686" cy="421" r="4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
          </g>
        )}

        {/* 9. JUNCTION BOX (Rotating with panel backsheet) */}
        {isVisible('junction-box') && (
          <g
            id="junction-box"
            data-layer="junction-box"
            opacity={getOpacity('junction-box')}
            filter={isHighlighted('junction-box') ? 'url(#layer-highlight-glow)' : undefined}
            onMouseEnter={() => onLayerHover?.('junction-box')}
            onMouseLeave={() => onLayerHover?.(null)}
            onClick={() => onLayerClick?.('junction-box')}
            className="cursor-pointer transition-all duration-200"
          >
            <rect
              x="460"
              y="290"
              width="80"
              height="55"
              rx="6"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />
            <rect x="464" y="294" width="72" height="47" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <line x1="472" y1="300" x2="472" y2="335" stroke="#334155" strokeWidth="1.5" />
            <line x1="480" y1="300" x2="480" y2="335" stroke="#334155" strokeWidth="1.5" />
            <line x1="520" y1="300" x2="520" y2="335" stroke="#334155" strokeWidth="1.5" />
            <line x1="528" y1="300" x2="528" y2="335" stroke="#334155" strokeWidth="1.5" />
            <polygon points="500,305 508,320 492,320" fill="#eab308" />
            <text x="500" y="318" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#000000">!</text>

            <rect x="480" y="345" width="12" height="14" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1" />
            <rect x="482" y="359" width="8" height="5" rx="1" fill="#dc2626" />
            <rect x="508" y="345" width="12" height="14" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1" />
            <rect x="510" y="359" width="8" height="5" rx="1" fill="#2563eb" />
          </g>
        )}

        {/* 10. CABLES & MC4 CONNECTORS (Rotating) */}
        {isVisible('cables') && (
          <g
            id="cables"
            data-layer="cables"
            opacity={getOpacity('cables')}
            filter={isHighlighted('cables') ? 'url(#layer-highlight-glow)' : undefined}
            onMouseEnter={() => onLayerHover?.('cables')}
            onMouseLeave={() => onLayerHover?.(null)}
            onClick={() => onLayerClick?.('cables')}
            className="cursor-pointer transition-all duration-200"
          >
            <path
              d="M 486,364 Q 480,410 460,430 Q 440,460 480,500"
              fill="none"
              stroke="url(#cable-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 486,364 Q 480,410 460,430 Q 440,460 480,500"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="10,20"
            />

            <path
              d="M 514,364 Q 520,410 540,430 Q 550,460 510,500"
              fill="none"
              stroke="url(#cable-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 514,364 Q 520,410 540,430 Q 550,460 510,500"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeDasharray="10,20"
            />

            <g transform="translate(450, 430) rotate(-25)">
              <rect x="0" y="0" width="14" height="32" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <line x1="0" y1="6" x2="14" y2="6" stroke="#64748b" strokeWidth="1.5" />
              <line x1="0" y1="10" x2="14" y2="10" stroke="#64748b" strokeWidth="1.5" />
              <rect x="2" y="22" width="10" height="4" rx="1" fill="#ef4444" />
            </g>

            <g transform="translate(540, 430) rotate(25)">
              <rect x="0" y="0" width="14" height="32" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <line x1="0" y1="6" x2="14" y2="6" stroke="#64748b" strokeWidth="1.5" />
              <line x1="0" y1="10" x2="14" y2="10" stroke="#64748b" strokeWidth="1.5" />
              <rect x="2" y="22" width="10" height="4" rx="1" fill="#3b82f6" />
            </g>
          </g>
        )}

        {/* 11. ALUMINUM FRAME & GLASS ENCLOSURE (Rotating) */}
        {isVisible('aluminum-frame') && (
          <g
            id="aluminum-frame"
            data-layer="aluminum-frame"
            opacity={getOpacity('aluminum-frame')}
            filter={isHighlighted('aluminum-frame') ? 'url(#layer-highlight-glow)' : undefined}
            onMouseEnter={() => onLayerHover?.('aluminum-frame')}
            onMouseLeave={() => onLayerHover?.(null)}
            onClick={() => onLayerClick?.('aluminum-frame')}
            className="cursor-pointer transition-all duration-200"
          >
            <polygon
              points="250,200 750,200 810,480 190,480"
              fill="url(#frame-bevel-gradient)"
              stroke={frameColors.stroke}
              strokeWidth="2"
            />
            <polygon
              points="250,190 750,190 750,200 250,200"
              fill="url(#frame-top-gradient)"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <polygon
              points="250,190 250,200 190,480 185,475"
              fill={frameColors.mid}
              stroke="#475569"
              strokeWidth="1"
            />
            <polygon
              points="750,190 750,200 810,480 815,475"
              fill={frameColors.dark}
              stroke="#334155"
              strokeWidth="1"
            />
            <polygon
              points="185,475 815,475 810,488 190,488"
              fill="url(#frame-top-gradient)"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <circle cx="260" cy="195" r="2.5" fill="#475569" />
            <circle cx="740" cy="195" r="2.5" fill="#475569" />
            <circle cx="198" cy="480" r="2.5" fill="#475569" />
            <circle cx="802" cy="480" r="2.5" fill="#475569" />
          </g>
        )}

        {/* 12. SOLAR PANEL MODULE & CELL GRID (Rotating) */}
        {isVisible('solar-panel') && (
          <g
            id="solar-panel"
            data-layer="solar-panel"
            opacity={getOpacity('solar-panel')}
            filter={isHighlighted('solar-panel') ? 'url(#layer-highlight-glow)' : undefined}
            onMouseEnter={() => onLayerHover?.('solar-panel')}
            onMouseLeave={() => onLayerHover?.(null)}
            onClick={() => onLayerClick?.('solar-panel')}
            className="cursor-pointer transition-all duration-200"
          >
            <polygon
              points="260,202 740,202 798,473 202,473"
              fill="#080e18"
              stroke="#1e293b"
              strokeWidth="1"
            />
            {isVisible('solar-cells') && renderSolarCells()}
            <polygon
              points="260,202 740,202 798,473 202,473"
              fill="url(#glass-glare)"
              pointerEvents="none"
            />
          </g>
        )}
      </g>

      {/* ==============================================================
          13. CAD ENGINEERING SPECIFICATIONS & DYNAMIC TILT ANGLE OVERLAY
          ============================================================== */}
      {showDimensions && (
        <g id="cad-dimensions" className="pointer-events-none select-none">
          {/* Dynamic Pivot Axis Visual Target Pin at (500, 500) */}
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="18" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,4" />
          <line x1="470" y1="500" x2="530" y2="500" stroke="#06b6d4" strokeWidth="1" />
          <line x1="500" y1="470" x2="500" y2="530" stroke="#06b6d4" strokeWidth="1" />
          <rect x="420" y="440" width="160" height="20" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
          <text x="500" y="454" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#67e8f9" className="font-mono">
            PIVOT AXIS (0°-90°)
          </text>

          {/* Width Dimension (1650mm) */}
          <line x1="240" y1="180" x2="760" y2="180" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,4" />
          <line x1="240" y1="170" x2="240" y2="190" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1="760" y1="170" x2="760" y2="190" stroke="#06b6d4" strokeWidth="1.5" />
          <rect x="440" y="165" width="120" height="20" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
          <text x="500" y="179" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#67e8f9" className="font-mono">
            1650 mm (Width)
          </text>

          {/* Height Dimension (2400mm) */}
          <line x1="120" y1="200" x2="120" y2="1100" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,4" />
          <line x1="110" y1="200" x2="130" y2="200" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1="110" y1="1100" x2="130" y2="1100" stroke="#06b6d4" strokeWidth="1.5" />
          <rect x="60" y="630" width="120" height="20" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
          <text x="120" y="644" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#67e8f9" className="font-mono">
            2400 mm (Total H)
          </text>

          {/* Pole Diameter Dimension (89mm) */}
          <line x1="475" y1="850" x2="525" y2="850" stroke="#06b6d4" strokeWidth="1.5" />
          <polygon points="475,850 483,846 483,854" fill="#06b6d4" />
          <polygon points="525,850 517,846 517,854" fill="#06b6d4" />
          <rect x="540" y="840" width="80" height="20" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
          <text x="580" y="854" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#67e8f9" className="font-mono">
            Ø 89 mm
          </text>

          {/* Standard 30° Tilt Angle Arc Overlay */}
          <path d="M 525,500 A 45 45 0 0 0 565,470" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
          <rect x="580" y="470" width="80" height="22" rx="4" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
          <text x="620" y="485" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#fde047" className="font-mono">
            30.0° Tilt
          </text>

          {/* Base Flange Bolt Circle */}
          <circle cx="500" cy="1095" r="85" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" />
        </g>
      )}
    </svg>
  );
};
