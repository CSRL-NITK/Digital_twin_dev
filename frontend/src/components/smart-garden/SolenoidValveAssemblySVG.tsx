import React from 'react';

interface SolenoidValveAssemblySVGProps {
  valveState?: boolean;
  flowRateLmin?: number;
  turbineRpm?: number;
  isFlowing?: boolean;
  className?: string;
}

export const SolenoidValveAssemblySVG: React.FC<SolenoidValveAssemblySVGProps> = ({
  valveState = true,
  flowRateLmin = 15,
  turbineRpm = 1200,
  isFlowing = true,
  className = '',
}) => {
  const activeFlow = valveState && isFlowing && flowRateLmin > 0;
  const rotationDuration = activeFlow ? Math.max(0.2, 4 / (flowRateLmin / 5 + 0.1)) : 0;

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 1000 480"
        className="w-full h-full max-h-[85vh] drop-shadow-xl transition-transform duration-200 ease-out object-contain"
      >
        <defs>
          {/* Glow filter for selection */}
          <filter id="glow-selection" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComponentTransfer in="blur" result="glow1">
              <feFuncA type="linear" slope="1.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow for 2.5D visual depth */}
          <filter id="shadow-2.5d" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>

          {/* Gradients */}
          <linearGradient id="brass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="35%" stopColor="#f3e5ab" />
            <stop offset="70%" stopColor="#aa820a" />
            <stop offset="100%" stopColor="#664d03" />
          </linearGradient>

          <linearGradient id="silver-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="30%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="solenoid-black" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b4252" />
            <stop offset="25%" stopColor="#2e3440" />
            <stop offset="75%" stopColor="#1a1e24" />
            <stop offset="100%" stopColor="#0f1216" />
          </linearGradient>

          <linearGradient id="pvc-gray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="20%" stopColor="#cbd5e1" />
            <stop offset="60%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="dark-pvc-ring" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="glass-chamber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="20%" stopColor="rgba(224,242,254,0.35)" />
            <stop offset="50%" stopColor="rgba(186,230,253,0.15)" />
            <stop offset="80%" stopColor="rgba(224,242,254,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
          </linearGradient>

          <linearGradient id="glass-specular" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b47833" />
            <stop offset="35%" stopColor="#e2aa63" />
            <stop offset="70%" stopColor="#8c531b" />
            <stop offset="100%" stopColor="#4e2c07" />
          </linearGradient>

          <linearGradient id="turbine-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e7d32" />
            <stop offset="50%" stopColor="#1b5e20" />
            <stop offset="100%" stopColor="#0d3b11" />
          </linearGradient>

          <linearGradient id="water-stream" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.85)" />
            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.95)" />
            <stop offset="100%" stopColor="rgba(2, 132, 199, 0.85)" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes turbine-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes flow-pulse {
            0% { stroke-dashoffset: 40; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes cable-signal {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          .spinning-rotor {
            transform-box: fill-box;
            transform-origin: center;
            animation: turbine-spin ${rotationDuration > 0 ? rotationDuration + 's' : '0s'} linear infinite;
          }
          .animated-flow {
            stroke-dasharray: 14, 8;
            animation: flow-pulse ${activeFlow ? '0.7s' : '0s'} linear infinite;
          }
          .cable-pulse {
            stroke-dasharray: 4, 6;
            animation: cable-signal 1.2s linear infinite;
          }
        `}</style>

        <g filter="url(#shadow-2.5d)">
          {/* WATER FLOW PIPELINE PATHWAY */}
          {activeFlow && (
            <g className="opacity-95">
              <path
                d="M 80 250 L 884 250 L 884 410"
                fill="none"
                stroke="url(#water-stream)"
                strokeWidth={20}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animated-flow"
              />
              
              <circle cx="640" cy="155" r="42" fill="rgba(56, 189, 248, 0.25)" stroke="rgba(14, 165, 233, 0.6)" strokeWidth="2.5" />
              <path d="M 610 155 Q 640 130 670 155 Q 640 180 610 155" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" className="animated-flow" />
              
              <path
                d="M 869 410 Q 884 450 874 470 M 884 410 L 884 475 M 899 410 Q 884 450 894 470"
                fill="none"
                stroke="rgba(56, 189, 248, 0.85)"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                className="animated-flow"
              />
            </g>
          )}

          {/* 1. INLET NOZZLE */}
          <g id="component-inlet">
            <rect x="80" y="232" width="12" height="36" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
            <rect x="92" y="230" width="10" height="40" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
            <rect x="102" y="228" width="10" height="44" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
            <rect x="112" y="226" width="14" height="48" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
            <polygon points="126,222 144,222 148,250 144,278 126,278 122,250" fill="url(#brass-grad)" stroke="#3e3005" strokeWidth="1.5" />
            <rect x="148" y="224" width="42" height="52" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* 2. SOLENOID VALVE ASSEMBLY */}
          <g id="component-solenoid_body">
            <rect x="190" y="228" width="28" height="44" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="218" y="195" width="118" height="110" rx="12" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="2" />
            <rect x="224" y="201" width="106" height="98" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            
            <rect x="242" y="235" width="70" height="34" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
            <rect x="248" y="240" width="38" height="4" fill="#0284c7" />
            <text x="248" y="254" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="#0f172a">SOLENOID VALVE</text>
            <text x="248" y="262" fontSize="5" fontFamily="monospace" fill="#475569">12VDC 0.02-0.8MPa</text>
            <path d="M 240 282 L 260 282 L 260 279 L 268 284 L 260 289 L 260 286 L 240 286 Z" fill="#64748b" />

            <rect x="336" y="228" width="28" height="44" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* Solenoid Top Coil Housing */}
          <g id="component-solenoid_coil">
            <rect x="252" y="185" width="50" height="12" rx="2" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
            <rect x="255" y="132" width="44" height="55" rx="6" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="1.5" />
            
            {valveState && (
              <rect x="255" y="132" width="44" height="55" rx="6" fill="none" stroke="#10b981" strokeWidth="2.5" className="animate-pulse" />
            )}
            <rect x="267" y="120" width="20" height="14" rx="3" fill="url(#silver-grad)" stroke="#0f172a" strokeWidth="1" />
            <circle cx="277" cy="122" r="4" fill="#0f172a" />
          </g>

          {/* 3. PVC CONNECTOR */}
          <g id="component-pvc_connector">
            <rect x="364" y="214" width="86" height="72" rx="6" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <rect x="376" y="210" width="14" height="80" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
            <rect x="424" y="210" width="14" height="80" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
            <rect x="450" y="225" width="98" height="50" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1" />
            <rect x="522" y="218" width="22" height="64" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
          </g>

          {/* 4. TRANSPARENT WATER FLOW METER */}
          <g id="component-flow_meter_housing">
            <rect x="544" y="222" width="168" height="56" rx="4" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <rect x="558" y="218" width="18" height="64" rx="2" fill="url(#dark-pvc-ring)" />
            <rect x="680" y="218" width="18" height="64" rx="2" fill="url(#dark-pvc-ring)" />

            <ellipse cx="640" cy="70" rx="58" ry="14" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <ellipse cx="640" cy="67" rx="52" ry="11" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
            
            <rect x="582" y="70" width="116" height="152" rx="8" fill="url(#glass-chamber)" stroke="rgba(148, 163, 184, 0.7)" strokeWidth="2" />
            <path d="M 588 74 L 596 74 L 596 218 L 588 218 Z" fill="url(#glass-specular)" />
            <ellipse cx="640" cy="115" rx="58" ry="8" fill="none" stroke="rgba(100, 116, 139, 0.6)" strokeWidth="3" />
            <ellipse cx="640" cy="175" rx="58" ry="8" fill="none" stroke="rgba(100, 116, 139, 0.6)" strokeWidth="3" />
          </g>

          {/* Turbine Rotor Assembly */}
          <g id="component-flow_meter_turbine">
            <circle cx="640" cy="150" r="10" fill="url(#silver-grad)" stroke="#0f172a" strokeWidth="1.5" />
            <g className={activeFlow ? "spinning-rotor" : ""}>
              <path d="M 640 150 C 640 120, 660 110, 675 115 C 660 130, 645 145, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
              <path d="M 640 150 C 665 135, 680 150, 675 168 C 655 160, 645 152, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
              <path d="M 640 150 C 655 170, 645 188, 628 185 C 632 165, 638 155, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
              <path d="M 640 150 C 640 180, 620 190, 605 185 C 620 170, 635 155, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
              <path d="M 640 150 C 615 165, 600 150, 605 132 C 625 140, 635 148, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
              <path d="M 640 150 C 625 130, 635 112, 652 115 C 648 135, 642 145, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
              <circle cx="670" cy="118" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            </g>
            <circle cx="640" cy="150" r="5" fill="#f8fafc" />
          </g>

          {/* 5. RIGHT PIPE EXTENSION & 90° BRONZE ELBOW */}
          <g id="component-pipe_extension">
            <rect x="712" y="222" width="56" height="56" rx="4" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <rect x="720" y="218" width="12" height="64" rx="2" fill="url(#dark-pvc-ring)" />
            <rect x="768" y="228" width="76" height="44" fill="url(#bronze-grad)" stroke="#4e2c07" strokeWidth="1.5" />
          </g>

          <g id="component-bronze_elbow">
            <path
              d="M 844 220 L 895 220 Q 910 220 910 235 L 910 292 L 858 292 L 858 272 Q 858 262 844 262 Z"
              fill="url(#bronze-grad)"
              stroke="#3e2305"
              strokeWidth="2"
            />
            <rect x="840" y="220" width="12" height="52" rx="2" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1" />
            <rect x="854" y="284" width="60" height="12" rx="2" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1" />
          </g>

          <g id="component-outlet">
            <rect x="862" y="296" width="44" height="110" fill="url(#bronze-grad)" stroke="#3e2305" strokeWidth="1.5" />
            <rect x="854" y="406" width="60" height="14" rx="3" fill="url(#brass-grad)" stroke="#3e3005" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
};
