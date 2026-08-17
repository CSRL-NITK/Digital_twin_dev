import React from 'react';

interface SolenoidValveAssemblySVGProps {
  valveState?: boolean;
  manualValveOpen?: boolean;
  flowRateLmin?: number;
  turbineRpm?: number;
  isFlowing?: boolean;
  className?: string;
}

export const SolenoidValveAssemblySVG: React.FC<SolenoidValveAssemblySVGProps> = ({
  valveState = true,
  manualValveOpen = true,
  flowRateLmin = 15,
  // turbineRpm = 1200,
  isFlowing = true,
  className = '',
}) => {
  const activeFlow = valveState && manualValveOpen && isFlowing && flowRateLmin > 0;
  const rotationDuration = activeFlow ? Math.max(0.2, 4 / (flowRateLmin / 5 + 0.1)) : 0;

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}>
      <svg
        viewBox="-40 40 970 635"
        className="w-full h-full max-h-[85vh] drop-shadow-xl transition-transform duration-200 ease-out object-contain"
      >
        <defs>
          <linearGradient id="burst-water-grad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.95)" />
            <stop offset="30%" stopColor="rgba(14, 165, 233, 0.9)" />
            <stop offset="70%" stopColor="rgba(2, 132, 199, 0.85)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
          </linearGradient>
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

          <linearGradient id="gold-impeller" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="switch-green-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="40%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>

          <linearGradient id="switch-red-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          <linearGradient id="water-stream" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.85)" />
            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.95)" />
            <stop offset="100%" stopColor="rgba(2, 132, 199, 0.85)" />
          </linearGradient>

          {/* Garden Soil Ground Gradients */}
          <linearGradient id="soil-surface-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a3525" />
            <stop offset="35%" stopColor="#382618" />
            <stop offset="70%" stopColor="#291a0e" />
            <stop offset="100%" stopColor="#1a1008" />
          </linearGradient>

          <linearGradient id="grass-blade-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="85%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
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
          @keyframes flow-pulse-up {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 40; }
          }
          @keyframes flow-pulse-left {
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
          .animated-flow-up {
            stroke-dasharray: 6, 4;
            animation: flow-pulse-up ${activeFlow ? '0.7s' : '0s'} linear infinite;
          }
          .animated-flow-left {
            stroke-dasharray: 6, 4;
            animation: flow-pulse-left ${activeFlow ? '0.6s' : '0s'} linear infinite;
          }
          .cable-pulse {
            stroke-dasharray: 4, 6;
            animation: cable-signal 1.2s linear infinite;
          }
        `}</style>

        <g filter="url(#shadow-2.5d)">
          {/* WATER FLOW PIPELINE PATHWAY & LEFT INLET NOZZLE SPRAY */}
          {activeFlow && (
            <g className="opacity-95">
              {/* Main Internal Pipeline Water Flow */}
              <path
                d="M 80 250 L 884 250 L 884 586"
                fill="none"
                stroke="url(#water-stream)"
                strokeWidth={20}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animated-flow"
              />

              {/* High-Pressure Main Pipe Water Burst from Left Brass Nozzle */}
              <g id="left-main-pipe-water-burst">
                {/* Pressurized Expanding Water Burst Cone Plume */}
                <path
                  d="M 80 236 Q 30 215 -35 195 L -35 305 Q 30 285 80 264 Z"
                  fill="url(#burst-water-grad)"
                  opacity="0.82"
                />

                {/* Main Heavy Burst Water Jet Body */}
                <path
                  d="M 80 250 L -30 250"
                  fill="none"
                  stroke="url(#water-stream)"
                  strokeWidth="28"
                  strokeLinecap="round"
                  className="animated-flow"
                />

                {/* Pressurized High-Velocity Water Core Stream */}
                <path
                  d="M 80 250 L -25 250"
                  fill="none"
                  stroke="rgba(224, 242, 254, 0.95)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* High-Pressure Surge Wave Lines */}
                <path
                  d="M 80 250 Q 20 212 -35 190 M 80 250 L -38 250 M 80 250 Q 20 288 -35 310"
                  fill="none"
                  stroke="rgba(186, 230, 253, 0.95)"
                  strokeWidth="5"
                  strokeDasharray="10,6"
                  className="animated-flow-left"
                />

                {/* Turbulent Outer Burst Splashes */}
                <path
                  d="M 75 238 C 30 205 -20 185 -38 180 M 75 262 C 30 295 -20 315 -38 320"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.85)"
                  strokeWidth="3.5"
                  strokeDasharray="8,5"
                  className="animated-flow-left"
                />

                {/* High Pressure Nozzle Ring Exit Glow */}
                <ellipse cx="80" cy="250" rx="4" ry="18" fill="#e0f2fe" opacity="0.9" />
              </g>
              
              <circle cx="640" cy="155" r="42" fill="rgba(56, 189, 248, 0.25)" stroke="rgba(14, 165, 233, 0.6)" strokeWidth="2.5" />
              <path d="M 610 155 Q 640 130 670 155 Q 640 180 610 155" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" className="animated-flow" />
              
              <path
                d="M 869 586 Q 884 626 874 646 M 884 586 L 884 651 M 899 586 Q 884 626 894 646"
                fill="none"
                stroke="rgba(56, 189, 248, 0.85)"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                className="animated-flow-up"
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

          {/* 2. BUS TOPOLOGY REFERENCE SOLENOID VALVE ASSEMBLY */}
          <g id="component-solenoid_body">
            {/* Side Connectors */}
            <rect x="190" y="228" width="28" height="44" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="336" y="228" width="28" height="44" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />

            {/* Main Dark Body Enclosure */}
            <rect x="218" y="195" width="118" height="110" rx="14" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="2.5" />
            <rect x="224" y="201" width="106" height="98" rx="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

            {/* Corner Mounting Tabs (4 Screws) */}
            <g id="solenoid-screw-tabs">
              <circle cx="234" cy="211" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <circle cx="234" cy="211" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />

              <circle cx="320" cy="211" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <circle cx="320" cy="211" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />

              <circle cx="234" cy="289" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <circle cx="234" cy="289" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />

              <circle cx="320" cy="289" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <circle cx="320" cy="289" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            </g>

            {/* Outer Dark Circular Bezel */}
            <circle cx="277" cy="250" r="38" fill="#111827" stroke="#374151" strokeWidth="2.5" />
            <circle cx="277" cy="250" r="32" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
            <circle cx="277" cy="250" r="27" fill="#0f172a" stroke="#0f172a" strokeWidth="1.5" />

            {/* Cable Gland Connector at Bottom */}
            <rect x="270" y="305" width="14" height="12" rx="2" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
            <rect x="272" y="317" width="10" height="10" rx="1" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          </g>


          {/* Amber/Gold 4-Blade Turbine Impeller Cross (Bus Topology Reference) */}
          <g id="component-bus_solenoid_turbine">
            <circle cx="277" cy="250" r="8" fill="url(#silver-grad)" stroke="#0f172a" strokeWidth="1.5" />
            <g className={activeFlow ? "spinning-rotor" : ""}>
              <path d="M 277 250 C 277 225, 292 218, 300 225 C 290 236, 282 245, 277 250 Z" fill="url(#gold-impeller)" stroke="#78350f" strokeWidth="1" />
              <path d="M 277 250 C 302 250, 309 265, 302 273 C 291 263, 282 255, 277 250 Z" fill="url(#gold-impeller)" stroke="#78350f" strokeWidth="1" />
              <path d="M 277 250 C 277 275, 262 282, 254 275 C 264 264, 272 255, 277 250 Z" fill="url(#gold-impeller)" stroke="#78350f" strokeWidth="1" />
              <path d="M 277 250 C 252 250, 245 235, 252 227 C 263 237, 272 245, 277 250 Z" fill="url(#gold-impeller)" stroke="#78350f" strokeWidth="1" />
              <circle cx="295" cy="228" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
            </g>
            <circle cx="277" cy="250" r="4" fill="#f8fafc" />
          </g>

          {/* 3. PVC CONNECTOR WITH DOWNWARD T-SOCKET */}
          <g id="component-pvc_connector">
            <rect x="364" y="214" width="86" height="72" rx="6" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <rect x="376" y="210" width="14" height="80" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
            <rect x="424" y="210" width="14" height="80" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
            <rect x="450" y="225" width="98" height="50" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1" />
            <rect x="522" y="218" width="22" height="64" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />

            {/* Downward PVC T-Socket Branch for Conduit Loop */}
            <rect x="395" y="275" width="22" height="24" rx="3" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <rect x="393" y="295" width="26" height="10" rx="2" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
          </g>



          {/* 4. BLACK FLEXIBLE CORRUGATED CONDUIT LOOP (REAL PHOTO MATCH) */}
          <g id="corrugated-conduit-loop">
            {/* Outer Flexible Conduit Pipe */}
            <path
              d="M 406 303 C 406 430, 640 430, 640 338"
              fill="none"
              stroke="#11161d"
              strokeWidth="15"
              strokeLinecap="round"
            />
            {/* Corrugated Outer Ribbed Texture */}
            <path
              d="M 406 303 C 406 430, 640 430, 640 338"
              fill="none"
              stroke="#334155"
              strokeWidth="5"
              strokeDasharray="5,6"
              strokeLinecap="round"
            />
            {/* Inner Core Accent */}
            <path
              d="M 406 303 C 406 430, 640 430, 640 338"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            />

          </g>

          {/* WHITE CABLE ZIP TIES (REAL PHOTO MATCH) */}
          <g id="zip-ties">
            {/* Left Zip Tie */}
            <rect x="442" y="218" width="5" height="64" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="441" y="214" width="7" height="6" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <line x1="444.5" y1="195" x2="444.5" y2="214" stroke="#f8fafc" strokeWidth="2.5" />
            
            {/* Right Zip Tie */}
            <rect x="702" y="216" width="5" height="68" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="701" y="212" width="7" height="6" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <line x1="704.5" y1="195" x2="704.5" y2="212" stroke="#f8fafc" strokeWidth="2.5" />
          </g>

          {/* 5. TRANSPARENT WATER FLOW METER */}
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

          {/* Flow Meter Lower Transducer Base */}
          <g id="component-flow_meter_base">
            <rect x="620" y="278" width="40" height="20" rx="3" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="1.5" />
            <rect x="628" y="298" width="24" height="42" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
            <line x1="628" y1="310" x2="652" y2="310" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="628" y1="324" x2="652" y2="324" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>

          {/* 6. RIGHT PIPE EXTENSION & 90° BRONZE ELBOW */}
          <g id="component-pipe_extension">
            <rect x="712" y="222" width="56" height="56" rx="4" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
            <rect x="720" y="218" width="12" height="64" rx="2" fill="url(#dark-pvc-ring)" />
            <rect x="768" y="228" width="76" height="44" fill="url(#bronze-grad)" stroke="#4e2c07" strokeWidth="1.5" />
          {/* 3D ILLUMINATED ROCKER POWER SWITCH (EXACT MARKED RED BOX LOCATION) */}
          <g id="component-rocker_switch" transform="translate(718, 146)">
            {/* Outer Mounting Frame Bezel */}
            <rect x="0" y="0" width="44" height="68" rx="6" fill="#1e1e24" stroke="#0f172a" strokeWidth="2" />
            <rect x="3" y="3" width="38" height="62" rx="4" fill="#0f1217" stroke="#334155" strokeWidth="1" />

            {/* Rocker Switch Button (Dynamic ON/OFF State) */}
            {valveState ? (
              <g id="rocker-on">
                <rect x="6" y="6" width="32" height="56" rx="3" fill="url(#switch-green-grad)" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M 6 6 L 38 6 L 34 18 L 10 18 Z" fill="rgba(255,255,255,0.35)" />
                <rect x="6" y="6" width="32" height="56" rx="3" fill="none" stroke="#4ade80" strokeWidth="1.5" className="animate-pulse" />
                {/* 'I' ON Symbol */}
                <line x1="22" y1="16" x2="22" y2="28" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                {/* 'O' OFF Symbol */}
                <circle cx="22" cy="44" r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              </g>
            ) : (
              <g id="rocker-off">
                <rect x="6" y="6" width="32" height="56" rx="3" fill="url(#switch-red-grad)" stroke="#dc2626" strokeWidth="1.5" />
                <path d="M 6 50 L 38 50 L 34 62 L 10 62 Z" fill="rgba(0,0,0,0.4)" />
                {/* 'I' ON Symbol */}
                <line x1="22" y1="18" x2="22" y2="26" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
                {/* 'O' OFF Symbol */}
                <circle cx="22" cy="42" r="6.5" fill="none" stroke="#ffffff" strokeWidth="3" />
              </g>
            )}
          </g>
            <path
              d="M 844 220 L 895 220 Q 910 220 910 235 L 910 292 L 858 292 L 858 272 Q 858 262 844 262 Z"
              fill="url(#bronze-grad)"
              stroke="#3e2305"
              strokeWidth="2"
            />
            <rect x="840" y="220" width="12" height="52" rx="2" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1" />
            <rect x="854" y="284" width="60" height="12" rx="2" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1" />
          </g>

          {/* 7. VERTICAL DOWNWARD BRONZE PIPE WITH INTEGRATED MANUAL LEVER BALL VALVE */}
          <g id="component-outlet">
            {/* Top Section of Extended Vertical Bronze Pipe */}
            <rect x="862" y="296" width="44" height="202" fill="url(#bronze-grad)" stroke="#3e2305" strokeWidth="1.5" />
            
            {/* Intermediate Brass Coupling Rings for Manufactured Long Pipe Appearance */}
            <rect x="854" y="360" width="60" height="10" rx="2" fill="url(#brass-grad)" stroke="#3e3005" strokeWidth="1" />
            <rect x="854" y="428" width="60" height="10" rx="2" fill="url(#brass-grad)" stroke="#3e3005" strokeWidth="1" />

            {/* MANUAL LEVER-OPERATED IRRIGATION BALL VALVE (RELOCATED DOWNWARD ON EXTENDED PIPE) */}
            <g id="component-vertical_manual_ball_valve" transform="translate(856, 498)">
              {/* Upper Threaded Coupling */}
              <rect x="0" y="0" width="56" height="10" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
              {/* Hex Valve Body */}
              <polygon points="4,10 52,10 56,18 56,42 52,50 4,50 0,42 0,18" fill="url(#bronze-grad)" stroke="#3e2305" strokeWidth="1.5" />
              <rect x="8" y="14" width="40" height="32" rx="4" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
              {/* Lower Threaded Coupling */}
              <rect x="0" y="50" width="56" height="10" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />

              {/* Side Stem Pivot Bolt Assembly */}
              <rect x="-8" y="21" width="10" height="18" rx="2" fill="url(#silver-grad)" stroke="#0f172a" strokeWidth="1" />
              <circle cx="-3" cy="30" r="5.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
              <polygon points="-3,26 0.5,28 0.5,32 -3,34 -6.5,32 -6.5,28" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
              <circle cx="-3" cy="30" r="1.8" fill="#1e293b" />

              {/* Long Metallic Lever Handle with Red Vinyl Grip (Interactive Up/Down Movement) */}
              <g
                style={{
                  transformOrigin: '-3px 30px',
                  transform: manualValveOpen ? 'rotate(0deg)' : 'rotate(-75deg)',
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Metallic Lever Arm */}
                <path d="M -3 30 L -3 56 L -9 56 L -9 30 Z" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
                
                {/* Main Metallic Handle */}
                <rect x="-14" y="54" width="10" height="66" rx="4" fill="url(#silver-grad)" stroke="#334155" strokeWidth="1" />
                
                {/* Weathered Red Vinyl/Rubber Grip Sleeve (Reference Photo Match) */}
                <rect x="-15" y="64" width="12" height="52" rx="5" fill="url(#switch-red-grad)" stroke="#991b1b" strokeWidth="1" />
                <rect x="-13" y="66" width="4" height="48" rx="2" fill="rgba(255,255,255,0.3)" />
              </g>
            </g>

            {/* Bottom Section of Extended Vertical Pipe */}
            <rect x="862" y="558" width="44" height="24" fill="url(#bronze-grad)" stroke="#3e2305" strokeWidth="1.5" />
            <rect x="854" y="582" width="60" height="14" rx="3" fill="url(#brass-grad)" stroke="#3e3005" strokeWidth="1.5" />

            {/* Outdoor Garden Soil Ground Base under Nozzle */}
            <g id="component-garden-ground-nozzle">
              <ellipse cx="884" cy="625" rx="55" ry="8" fill="#000000" opacity="0.22" />
              <path
                d="M 824 624 Q 854 620 884 619 Q 914 620 944 624 L 944 632 Q 884 635 824 632 Z"
                fill="url(#soil-surface-grad)"
                stroke="#26170d"
                strokeWidth="1.2"
              />
              <g opacity="0.6">
                <circle cx="840" cy="626" r="1.5" fill="#60432c" />
                <circle cx="870" cy="628" r="1.8" fill="#24160a" />
                <circle cx="900" cy="625" r="1.4" fill="#523924" />
                <circle cx="930" cy="627" r="1.6" fill="#1b1007" />
              </g>
              <g id="nozzle-grass-tufts">
                <path d="M 830 624 Q 827 614 824 610 Q 830 616 834 624 Z" fill="url(#grass-blade-grad)" stroke="#14532d" strokeWidth="0.7" />
                <path d="M 834 624 Q 835 611 839 606 Q 840 615 838 624 Z" fill="url(#grass-blade-grad)" stroke="#14532d" strokeWidth="0.7" />
                <path d="M 930 624 Q 933 612 938 607 Q 936 616 934 624 Z" fill="url(#grass-blade-grad)" stroke="#14532d" strokeWidth="0.7" />
              </g>
            </g>
          </g>

          {/* Cable loop connection port cap replica at x=640, y=332 (permanently drawn on top) */}
          <rect x="628" y="326" width="24" height="12" rx="2" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
          <circle cx="640" cy="332" r="5" fill="#091017" />
          <circle cx="640" cy="332" r="2.5" fill="#00ffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};
