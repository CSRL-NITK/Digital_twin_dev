import React from 'react';

export interface ModelViewState {
  zoom?: number;
  pan?: { x: number; y: number };
  lidOpacity?: number; // 0 to 1
  ledPower?: boolean;
  redLedBrightness?: number; // 0 to 100
  amberLedBrightness?: number; // 0 to 100
  highlightedComponentId?: string | null;
  showTraceOverlays?: boolean;
  activeMode?: 'model' | 'xray' | 'schematic';
  backgroundColor?: 'white' | 'neutral' | 'blueprint' | 'dark';
}

interface ControllerModelSvgProps {
  viewState?: ModelViewState;
  onSelectComponent?: (id: string) => void;
  className?: string;
}

export const ControllerModelSvg: React.FC<ControllerModelSvgProps> = ({
  viewState = {},
  onSelectComponent = () => {},
  className = '',
}) => {
  const {
    zoom = 1,
    pan = { x: 0, y: 0 },
    lidOpacity = 0.35,
    ledPower = true,
    redLedBrightness = 90,
    amberLedBrightness = 70,
    highlightedComponentId = null,
    activeMode = 'model',
  } = viewState;

  const redGlowOpacity = ledPower ? (redLedBrightness / 100) : 0.05;
  const amberGlowOpacity = ledPower ? (amberLedBrightness / 100) : 0.05;

  const isHighlighted = (id: string) => highlightedComponentId === id;

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 500 620"
        className="w-full h-full max-h-[82vh] drop-shadow-xl transition-transform duration-200 ease-out object-contain"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* LED Glow Filters */}
          <filter id="red-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="12" result="blur1" />
            <feGaussianBlur stdDeviation="5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="amber-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          <filter id="wire-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
          </filter>

          {/* Gradients */}
          <radialGradient id="red-led-grad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#FF3355" />
            <stop offset="70%" stopColor="#E6002A" />
            <stop offset="100%" stopColor="#99001A" />
          </radialGradient>

          <radialGradient id="red-halo-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF1A3C" stopOpacity={0.95 * redGlowOpacity} />
            <stop offset="40%" stopColor="#FF002B" stopOpacity={0.6 * redGlowOpacity} />
            <stop offset="75%" stopColor="#FF002B" stopOpacity={0.2 * redGlowOpacity} />
            <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="red-reflection-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF3355" stopOpacity={0.5 * redGlowOpacity} />
            <stop offset="60%" stopColor="#FF0022" stopOpacity={0.15 * redGlowOpacity} />
            <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="amber-led-grad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFDD" />
            <stop offset="35%" stopColor="#FFC107" />
            <stop offset="80%" stopColor="#FF8F00" />
            <stop offset="100%" stopColor="#C76800" />
          </radialGradient>

          <radialGradient id="amber-halo-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFC107" stopOpacity={0.85 * amberGlowOpacity} />
            <stop offset="50%" stopColor="#FF9800" stopOpacity={0.4 * amberGlowOpacity} />
            <stop offset="100%" stopColor="#FF5722" stopOpacity="0" />
          </radialGradient>

          {/* Enclosure Frame Gradient */}
          <linearGradient id="enclosure-frame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F7FA" />
            <stop offset="40%" stopColor="#E4E8EC" />
            <stop offset="80%" stopColor="#D1D6DC" />
            <stop offset="100%" stopColor="#B0B7C0" />
          </linearGradient>

          <linearGradient id="enclosure-inner-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
            <stop offset="15%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="85%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>

          {/* Screw metallic gradient */}
          <radialGradient id="screw-metal" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#D6DCE0" />
            <stop offset="50%" stopColor="#8A949E" />
            <stop offset="85%" stopColor="#4F565E" />
            <stop offset="100%" stopColor="#2C3136" />
          </radialGradient>

          {/* Blue relay gradient */}
          <linearGradient id="blue-relay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0077E6" />
            <stop offset="30%" stopColor="#005BBA" />
            <stop offset="80%" stopColor="#003D82" />
            <stop offset="100%" stopColor="#002959" />
          </linearGradient>

          {/* Translucent Lid Glare */}
          <linearGradient id="glass-glare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          <pattern id="pcb-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#102A45" strokeWidth="0.5" />
            <circle cx="10" cy="10" r="0.75" fill="#1A3B5C" />
          </pattern>
        </defs>

        {/* BACKGROUND MOUNTING POLE */}
        <g id="mounting-pole" opacity="0.85">
          <rect x="55" y="0" width="22" height="620" fill="#90A4AE" />
          <rect x="55" y="0" width="5" height="620" fill="#CFD8DC" />
          <rect x="72" y="0" width="5" height="620" fill="#546E7A" />
          <rect x="48" y="140" width="36" height="16" rx="3" fill="#607D8B" stroke="#37474F" strokeWidth="1" />
          <rect x="48" y="380" width="36" height="16" rx="3" fill="#607D8B" stroke="#37474F" strokeWidth="1" />
        </g>

        {/* BOTTOM MOUNTING BRACKET */}
        <g
          id="mounting-bracket"
          className="cursor-pointer transition-opacity"
          onClick={() => onSelectComponent('mounting-bracket')}
          filter="url(#soft-shadow)"
        >
          <path
            d="M 195 450 L 305 450 L 295 490 L 275 580 L 225 580 L 205 490 Z"
            fill="#EAEFF2"
            stroke="#B0BEC5"
            strokeWidth="1.5"
          />
          <path d="M 220 450 L 235 570" stroke="#CFD8DC" strokeWidth="2" />
          <path d="M 280 450 L 265 570" stroke="#CFD8DC" strokeWidth="2" />
          <rect x="235" y="470" width="30" height="40" fill="#DCE2E6" rx="2" stroke="#B0BEC5" strokeWidth="1" />
          <rect x="190" y="565" width="120" height="30" rx="4" fill="#E2E8EC" stroke="#90A4AE" strokeWidth="1.5" />
          <circle cx="210" cy="580" r="6" fill="#78909C" stroke="#37474F" strokeWidth="1.5" />
          <circle cx="210" cy="580" r="3" fill="#263238" />
          <circle cx="250" cy="580" r="6" fill="#78909C" stroke="#37474F" strokeWidth="1.5" />
          <circle cx="250" cy="580" r="3" fill="#263238" />
          <circle cx="290" cy="580" r="6" fill="#78909C" stroke="#37474F" strokeWidth="1.5" />
          <circle cx="290" cy="580" r="3" fill="#263238" />
        </g>

        {/* EXTERNAL CABLES */}
        <g
          id="top-conduit"
          className="cursor-pointer"
          onClick={() => onSelectComponent('top-conduit')}
        >
          <path
            d="M 245 0 L 245 80"
            fill="none"
            stroke="#CCD1D9"
            strokeWidth="18"
            strokeLinecap="square"
          />
          {[10, 22, 34, 46, 58, 70].map((y) => (
            <line key={y} x1="234" y1={y} x2="256" y2={y} stroke="#AAB2BD" strokeWidth="3" />
          ))}
          <rect x="232" y="70" width="26" height="15" rx="3" fill="#505A69" stroke="#333" strokeWidth="1" />
        </g>

        <g
          id="bottom-cable"
          className="cursor-pointer"
          onClick={() => onSelectComponent('bottom-cable')}
        >
          <path
            d="M 280 440 L 280 500 C 280 540 270 570 260 620"
            fill="none"
            stroke="#1C2024"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 280 440 L 280 500 C 280 540 270 570 260 620"
            fill="none"
            stroke="#3A3F47"
            strokeWidth="4"
            strokeDasharray="8,12"
          />
          <rect x="270" y="440" width="20" height="18" rx="2" fill="#3A3F47" stroke="#111" strokeWidth="1" />
        </g>

        {/* MAIN ENCLOSURE BOX FRAME */}
        <g id="enclosure-box" filter="url(#soft-shadow)">
          <rect
            x="100"
            y="80"
            width="300"
            height="370"
            rx="20"
            ry="20"
            fill="url(#enclosure-frame)"
            stroke="#9EA7B0"
            strokeWidth="2"
          />

          <rect
            x="116"
            y="96"
            width="268"
            height="338"
            rx="12"
            ry="12"
            fill="#091017"
            stroke="#78848F"
            strokeWidth="3"
          />
          <rect
            x="116"
            y="96"
            width="268"
            height="338"
            rx="12"
            ry="12"
            fill="url(#enclosure-inner-shadow)"
          />

          {/* 4 Corner Screw Boss Posts */}
          <g transform="translate(102, 82)">
            <circle cx="22" cy="22" r="18" fill="#D5DCE2" stroke="#90A4AE" strokeWidth="2" />
            <circle cx="22" cy="22" r="12" fill="#263238" stroke="#546E7A" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="8" fill="url(#screw-metal)" />
            <line x1="17" y1="22" x2="27" y2="22" stroke="#1C2024" strokeWidth="2" />
            <line x1="22" y1="17" x2="22" y2="27" stroke="#1C2024" strokeWidth="2" />
          </g>

          <g transform="translate(358, 82)">
            <circle cx="22" cy="22" r="18" fill="#D5DCE2" stroke="#90A4AE" strokeWidth="2" />
            <circle cx="22" cy="22" r="12" fill="#263238" stroke="#546E7A" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="8" fill="url(#screw-metal)" />
            <line x1="17" y1="22" x2="27" y2="22" stroke="#1C2024" strokeWidth="2" />
            <line x1="22" y1="17" x2="22" y2="27" stroke="#1C2024" strokeWidth="2" />
          </g>

          <g transform="translate(102, 408)">
            <circle cx="22" cy="22" r="18" fill="#D5DCE2" stroke="#90A4AE" strokeWidth="2" />
            <circle cx="22" cy="22" r="12" fill="#263238" stroke="#546E7A" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="8" fill="url(#screw-metal)" />
            <line x1="17" y1="22" x2="27" y2="22" stroke="#1C2024" strokeWidth="2" />
            <line x1="22" y1="17" x2="22" y2="27" stroke="#1C2024" strokeWidth="2" />
          </g>

          <g transform="translate(358, 408)">
            <circle cx="22" cy="22" r="18" fill="#D5DCE2" stroke="#90A4AE" strokeWidth="2" />
            <circle cx="22" cy="22" r="12" fill="#263238" stroke="#546E7A" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="8" fill="url(#screw-metal)" />
            <line x1="17" y1="22" x2="27" y2="22" stroke="#1C2024" strokeWidth="2" />
            <line x1="22" y1="17" x2="22" y2="27" stroke="#1C2024" strokeWidth="2" />
          </g>
        </g>

        {/* INTERNAL PCB BOARD */}
        <g
          id="pcb-base"
          className="cursor-pointer"
          onClick={() => onSelectComponent('pcb-base')}
        >
          <rect
            x="125"
            y="105"
            width="250"
            height="320"
            rx="8"
            ry="8"
            fill={activeMode === 'schematic' ? '#041624' : '#0B1B2B'}
            stroke="#1D3E5E"
            strokeWidth="2"
          />
          <rect x="125" y="105" width="250" height="320" rx="8" fill="url(#pcb-grid)" />

          <g stroke="#C29A2B" strokeWidth="1.2" fill="none" opacity="0.75">
            <path d="M 135 125 L 365 125 M 135 130 L 365 130" stroke="#00E5FF" strokeWidth="0.8" opacity="0.4" />
            <path d="M 140 160 L 210 160 L 210 210 L 140 210" />
            <path d="M 290 150 L 350 150 L 350 180 L 290 180" />
            <path d="M 140 280 L 200 280 L 230 310 L 350 310" stroke="#3A92FF" strokeWidth="1.5" />
            <path d="M 150 350 L 220 350 L 250 380 L 350 380" stroke="#FF5722" strokeWidth="1" />
            <path d="M 135 410 L 365 410" stroke="#00E5FF" strokeWidth="1" />
            {[
              { x: 140, y: 160 }, { x: 210, y: 160 }, { x: 210, y: 210 },
              { x: 160, y: 240 }, { x: 330, y: 240 }, { x: 200, y: 280 },
              { x: 320, y: 350 }, { x: 180, y: 380 }, { x: 340, y: 390 }
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill="#FFD700" stroke="#000" strokeWidth="0.5" />
            ))}
          </g>

          <circle cx="138" cy="118" r="4" fill="#B0BEC5" stroke="#37474F" strokeWidth="1" />
          <circle cx="362" cy="118" r="4" fill="#B0BEC5" stroke="#37474F" strokeWidth="1" />
          <circle cx="138" cy="412" r="4" fill="#B0BEC5" stroke="#37474F" strokeWidth="1" />
          <circle cx="362" cy="412" r="4" fill="#B0BEC5" stroke="#37474F" strokeWidth="1" />

          <g fill="#1A232A" stroke="#B0BEC5" strokeWidth="0.5">
            <rect x="142" y="170" width="30" height="25" rx="1" fill="#0D1318" stroke="#546E7A" strokeWidth="1" />
            {[172, 177, 182, 187, 192].map((y) => (
              <React.Fragment key={y}>
                <rect x="138" y={y} width="4" height="2" fill="#CFD8DC" />
                <rect x="172" y={y} width="4" height="2" fill="#CFD8DC" />
              </React.Fragment>
            ))}
            <circle cx="146" cy="175" r="1.5" fill="#78909C" />

            <rect x="315" y="270" width="35" height="20" rx="1" fill="#0D1318" stroke="#546E7A" strokeWidth="1" />
            <circle cx="320" cy="275" r="1.5" fill="#78909C" />

            <rect x="180" y="120" width="8" height="4" fill="#E6A100" stroke="#FFF" strokeWidth="0.3" />
            <rect x="195" y="120" width="8" height="4" fill="#E6A100" stroke="#FFF" strokeWidth="0.3" />
            <rect x="300" y="120" width="10" height="5" fill="#2C3E50" stroke="#CFD8DC" strokeWidth="0.5" />
            <rect x="318" y="120" width="10" height="5" fill="#E6A100" stroke="#CFD8DC" strokeWidth="0.5" />

            <rect x="140" y="225" width="10" height="5" fill="#E6A100" />
            <rect x="155" y="225" width="10" height="5" fill="#222" />
            <rect x="170" y="225" width="10" height="5" fill="#E6A100" />

            <rect x="310" y="160" width="6" height="12" fill="#E6A100" />
            <rect x="320" y="160" width="6" height="12" fill="#111" />

            <rect x="140" y="300" width="12" height="6" fill="#E6A100" />
            <rect x="156" y="300" width="12" height="6" fill="#111" />
          </g>

          <g id="top-terminal" fill="#2E3B4E" stroke="#1A232A" strokeWidth="1">
            <rect x="225" y="112" width="50" height="18" rx="2" fill="#1E2A38" stroke="#3A4B5F" strokeWidth="1" />
            {[232, 242, 252, 262].map((x) => (
              <circle key={x} cx={x} cy={121} r="3" fill="#8A949E" stroke="#111" strokeWidth="1" />
            ))}
          </g>

          <g id="lower-terminal">
            <rect x="200" y="380" width="100" height="24" rx="3" fill="#1A2634" stroke="#37474F" strokeWidth="1.5" />
            {[210, 222, 234, 246, 258, 270, 282, 292].map((x) => (
              <g key={x}>
                <rect x={x - 4} y="384" width="8" height="16" fill="#263238" stroke="#455A64" strokeWidth="0.8" />
                <circle cx={x} cy="392" r="2.5" fill="#B0BEC5" stroke="#111" strokeWidth="0.8" />
                <line x1={x - 1.5} y1="392" x2={x + 1.5} y2="392" stroke="#222" strokeWidth="0.8" />
              </g>
            ))}
          </g>
        </g>

        {/* BLUE RELAY MODULES */}
        <g
          id="main-relay-module"
          className="cursor-pointer transition-transform"
          onClick={() => onSelectComponent('main-relay-module')}
          filter="url(#soft-shadow)"
        >
          <rect
            x="215"
            y="138"
            width="72"
            height="68"
            rx="4"
            fill="url(#blue-relay)"
            stroke="#0088FF"
            strokeWidth="1.5"
          />
          <rect x="217" y="140" width="68" height="6" fill="#4DA6FF" opacity="0.6" rx="2" />
          <rect x="225" y="152" width="52" height="38" rx="2" fill="#003D7A" stroke="#0066CC" strokeWidth="1" />
          <path d="M 235 162 L 245 162 M 245 158 L 245 166 L 255 162 L 265 162" stroke="#80C1FF" strokeWidth="1.2" fill="none" />
          <circle cx="235" cy="162" r="1.5" fill="#FFF" />
          <circle cx="265" cy="162" r="1.5" fill="#FFF" />
          <text x="251" y="182" fill="#B3D9FF" fontSize="7" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
            10A 250VAC
          </text>
        </g>

        <g
          id="secondary-relay-module"
          className="cursor-pointer"
          onClick={() => onSelectComponent('secondary-relay-module')}
          filter="url(#soft-shadow)"
        >
          <rect
            x="298"
            y="188"
            width="58"
            height="62"
            rx="4"
            fill="url(#blue-relay)"
            stroke="#0088FF"
            strokeWidth="1.5"
          />
          <rect x="300" y="190" width="54" height="5" fill="#4DA6FF" opacity="0.6" rx="2" />
          <rect x="306" y="200" width="42" height="35" rx="2" fill="#003D7A" />
          <text x="327" y="222" fill="#B3D9FF" fontSize="6" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
            RELAY 2
          </text>
        </g>

        {/* REFLECTED RED LIGHT */}
        <circle cx="251" cy="222" r="85" fill="url(#red-reflection-grad)" pointerEvents="none" />

        {/* WIRING HARNESS */}
        <g
          id="wiring-harness"
          className="cursor-pointer"
          onClick={() => onSelectComponent('wiring-harness')}
          filter="url(#wire-shadow)"
        >
          <path
            d="M 210 392 C 160 380 145 310 165 260 C 180 220 215 210 225 195"
            fill="none"
            stroke="#FF2A4B"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 210 392 C 160 380 145 310 165 260 C 180 220 215 210 225 195"
            fill="none"
            stroke="#FFA8B6"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
          />

          <path
            d="M 222 392 C 185 360 175 320 185 275 C 195 240 230 230 240 210"
            fill="none"
            stroke="#E60026"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <path
            d="M 242 121 C 242 160 235 220 235 270 C 235 320 220 370 234 392"
            fill="none"
            stroke="#FFC107"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 242 121 C 242 160 235 220 235 270 C 235 320 220 370 234 392"
            fill="none"
            stroke="#FFF2B2"
            strokeWidth="1"
            strokeLinecap="round"
          />

          <path
            d="M 252 121 C 255 170 248 230 250 280 C 252 320 270 350 258 392"
            fill="none"
            stroke="#FFB300"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <path
            d="M 262 121 C 268 180 260 240 275 290 C 290 330 285 365 270 392"
            fill="none"
            stroke="#FFA000"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <path
            d="M 330 248 C 340 280 335 330 300 365 C 290 375 285 385 282 392"
            fill="none"
            stroke="#0088FF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 330 248 C 340 280 335 330 300 365 C 290 375 285 385 282 392"
            fill="none"
            stroke="#99D6FF"
            strokeWidth="1"
            strokeLinecap="round"
          />

          <path
            d="M 232 121 C 215 150 195 200 205 250 C 210 270 220 280 222 300"
            fill="none"
            stroke="#1C2024"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* GLOWING INDICATOR LEDs */}
        <g
          id="red-led"
          className="cursor-pointer"
          onClick={() => onSelectComponent('red-led')}
        >
          <circle
            cx="251"
            cy="222"
            r="42"
            fill="url(#red-halo-grad)"
            filter="url(#red-glow)"
            pointerEvents="none"
          />
          <circle
            cx="251"
            cy="222"
            r="22"
            fill="#FF002B"
            opacity={0.7 * redGlowOpacity}
            filter="url(#red-glow)"
            pointerEvents="none"
          />
          <circle cx="251" cy="222" r="11" fill="#1A1D20" stroke="#4A525D" strokeWidth="1.5" />
          <circle cx="251" cy="222" r="8.5" fill="#800014" />
          <circle
            cx="251"
            cy="222"
            r="7"
            fill="url(#red-led-grad)"
            stroke="#FF6680"
            strokeWidth="0.8"
          />
          <circle cx="250" cy="220" r="2.5" fill="#FFFFFF" opacity={0.9 * redGlowOpacity} />
        </g>

        <g
          id="amber-led"
          className="cursor-pointer"
          onClick={() => onSelectComponent('amber-led')}
        >
          <circle
            cx="251"
            cy="255"
            r="28"
            fill="url(#amber-halo-grad)"
            filter="url(#amber-glow)"
            pointerEvents="none"
          />
          <rect x="242" y="248" width="18" height="14" rx="2" fill="#1C2024" stroke="#455A64" strokeWidth="1" />
          <rect
            x="244"
            y="250"
            width="14"
            height="10"
            rx="1.5"
            fill="url(#amber-led-grad)"
            stroke="#FFE082"
            strokeWidth="0.5"
          />
          <ellipse cx="249" cy="253" rx="3" ry="1.5" fill="#FFFFFF" opacity={0.85 * amberGlowOpacity} />
        </g>

        {/* TRANSLUCENT PROTECTIVE FRONT COVER (LID) */}
        {activeMode !== 'xray' && (
          <g id="enclosure-lid" pointerEvents="none" style={{ opacity: lidOpacity }}>
            <rect
              x="116"
              y="96"
              width="268"
              height="338"
              rx="12"
              ry="12"
              fill="url(#glass-glare)"
              stroke="#E2E8F0"
              strokeWidth="2"
            />
            <path
              d="M 120 180 L 260 100 L 290 100 L 120 200 Z"
              fill="#FFFFFF"
              opacity="0.2"
            />
            <path
              d="M 120 320 L 370 175 L 380 185 L 120 340 Z"
              fill="#FFFFFF"
              opacity="0.12"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
