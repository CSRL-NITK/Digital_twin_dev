import React from 'react';
import { AssemblyComponentId, ViewMode, TelemetryData } from '../types';
import { ASSEMBLY_SPECS } from '../data/assemblyData';

interface AssemblyCanvasProps {
  viewMode: ViewMode;
  telemetry: TelemetryData;
  selectedComponent: AssemblyComponentId | null;
  onSelectComponent: (id: AssemblyComponentId) => void;
  showCrossSection: boolean;
  showFlowParticles: boolean;
}

export const AssemblyCanvas: React.FC<AssemblyCanvasProps> = ({
  viewMode,
  telemetry,
  selectedComponent,
  onSelectComponent,
  showCrossSection,
  showFlowParticles
}) => {
  const { valveState, flowRateLmin, turbineRpm } = telemetry;

  // Calculate rotation speed duration based on flow rate (faster flow = shorter animation duration)
  const rotationDuration = valveState && flowRateLmin > 0 
    ? Math.max(0.2, 4 / (flowRateLmin / 5 + 0.1)) 
    : 0;

  // Offset positions for exploded view
  const offsetMultiplier = viewMode === 'exploded' ? 1 : 0;
  
  const offsets = {
    inlet: -80 * offsetMultiplier,
    solenoid: -40 * offsetMultiplier,
    solenoidTop: -30 * offsetMultiplier,
    solenoidBottom: 40 * offsetMultiplier,
    pvc: 0,
    meter: 40 * offsetMultiplier,
    meterTop: -40 * offsetMultiplier,
    meterBottom: 45 * offsetMultiplier,
    pipeRight: 80 * offsetMultiplier,
    elbow: 120 * offsetMultiplier
  };

  const isSelected = (id: AssemblyComponentId) => selectedComponent === id;

  const getSelectionFilter = (id: AssemblyComponentId) => {
    return isSelected(id) ? 'url(#glow-selection)' : undefined;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/50">
      {/* Background CAD grid for blueprint / technical feel */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          viewMode === 'cad' 
            ? 'opacity-100 bg-[#09182a]' 
            : viewMode === 'fluid' 
            ? 'opacity-100 bg-[#060a12]' 
            : 'opacity-100 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'
        }`}
        style={{
          backgroundImage: viewMode === 'cad' 
            ? 'radial-gradient(#1e3a8a 1px, transparent 1px), linear-gradient(to right, #0f2b48 1px, transparent 1px), linear-gradient(to bottom, #0f2b48 1px, transparent 1px)' 
            : viewMode === 'fluid'
            ? 'linear-gradient(to right, rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.05) 1px, transparent 1px)'
            : 'linear-gradient(to right, rgba(203, 213, 225, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.25) 1px, transparent 1px)',
          backgroundSize: '20px 20px, 40px 40px, 40px 40px'
        }}
      />

      {/* Top Banner Status */}
      <div className="relative z-10 mb-2 flex flex-wrap items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur-md dark:bg-slate-100/10">
            <span className={`h-2 w-2 rounded-full ${valveState ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            VALVE: {valveState ? 'OPEN (ENERGIZED)' : 'CLOSED (OFF)'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            FLOW: {flowRateLmin.toFixed(1)} L/min
          </span>
          {valveState && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-medium text-amber-700 dark:text-amber-400">
              TURBINE: {Math.round(turbineRpm)} RPM
            </span>
          )}
        </div>

        {selectedComponent && (
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Selected: <span className="font-bold text-blue-600 dark:text-blue-400">{ASSEMBLY_SPECS[selectedComponent]?.name}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas Area */}
      <div className="relative z-10 w-full overflow-x-auto">
        <svg
          viewBox="0 0 1200 480"
          className="mx-auto h-auto min-w-[800px] max-w-full select-none transition-all duration-500"
          style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.08))' }}
        >
          <defs>
            {/* Glow effect for selected component */}
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
            {/* Brass Metallic Barbed Inlet */}
            <linearGradient id="brass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="35%" stopColor="#f3e5ab" />
              <stop offset="70%" stopColor="#aa820a" />
              <stop offset="100%" stopColor="#664d03" />
            </linearGradient>

            {/* Silver Metal Fittings */}
            <linearGradient id="silver-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="30%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Solenoid Matte Black Housing */}
            <linearGradient id="solenoid-black" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b4252" />
              <stop offset="25%" stopColor="#2e3440" />
              <stop offset="75%" stopColor="#1a1e24" />
              <stop offset="100%" stopColor="#0f1216" />
            </linearGradient>

            {/* Gray PVC Pipe Gradient */}
            <linearGradient id="pvc-gray" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="20%" stopColor="#cbd5e1" />
              <stop offset="60%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Dark PVC Lock Rings */}
            <linearGradient id="dark-pvc-ring" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Translucent Glass Cylinder Housing */}
            <linearGradient id="glass-chamber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
              <stop offset="20%" stopColor="rgba(224,242,254,0.35)" />
              <stop offset="50%" stopColor="rgba(186,230,253,0.15)" />
              <stop offset="80%" stopColor="rgba(224,242,254,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
            </linearGradient>

            {/* Glass Sheen Specular Highlight */}
            <linearGradient id="glass-specular" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Bronze/Brass 90 Degree Elbow */}
            <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b47833" />
              <stop offset="35%" stopColor="#e2aa63" />
              <stop offset="70%" stopColor="#8c531b" />
              <stop offset="100%" stopColor="#4e2c07" />
            </linearGradient>

            {/* Dark Green Turbine Blade Gradient */}
            <linearGradient id="turbine-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2e7d32" />
              <stop offset="50%" stopColor="#1b5e20" />
              <stop offset="100%" stopColor="#0d3b11" />
            </linearGradient>

            {/* Water Flow Stream Gradient */}
            <linearGradient id="water-stream" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.7)" />
              <stop offset="50%" stopColor="rgba(56, 189, 248, 0.85)" />
              <stop offset="100%" stopColor="rgba(2, 132, 199, 0.7)" />
            </linearGradient>

            {/* Fluid Thermal Heatmap Gradient */}
            <linearGradient id="thermal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="25%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Keyframe animation for rotating turbine */}
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
              stroke-dasharray: 12, 8;
              animation: flow-pulse ${valveState ? '0.8s' : '0s'} linear infinite;
            }
            .cable-pulse {
              stroke-dasharray: 4, 6;
              animation: cable-signal 1.2s linear infinite;
            }
          `}</style>

          {/* Main Group with 2.5D Shadow */}
          <g filter={viewMode === 'twin' ? 'url(#shadow-2.5d)' : undefined}>

            {/* ========================================== */}
            {/* WATER FLOW PIPELINE PATHWAY (UNDERNEATH)   */}
            {/* ========================================== */}
            {valveState && showFlowParticles && (
              <g className="opacity-90">
                {/* Horizontal flow line through assembly */}
                <path
                  d="M 80 250 L 860 250 L 860 410"
                  fill="none"
                  stroke={viewMode === 'fluid' ? 'url(#thermal-grad)' : 'url(#water-stream)'}
                  strokeWidth={viewMode === 'fluid' ? 24 : 18}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animated-flow"
                />
                
                {/* Internal water turbulence inside flow meter chamber */}
                <circle cx="640" cy="155" r="42" fill="rgba(56, 189, 248, 0.15)" stroke="rgba(14, 165, 233, 0.4)" strokeWidth="2" />
                <path d="M 610 155 Q 640 130 670 155 Q 640 180 610 155" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" className="animated-flow" />
                
                {/* Downward outlet discharge spray */}
                <path
                  d="M 845 410 Q 860 450 850 470 M 860 410 L 860 475 M 875 410 Q 860 450 870 470"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.7)"
                  strokeWidth="3"
                  strokeDasharray="6,4"
                  className="animated-flow"
                />
              </g>
            )}

            {/* ========================================== */}
            {/* 1. INLET NOZZLE (FAR LEFT)                 */}
            {/* ========================================== */}
            <g
              id="component-inlet"
              transform={`translate(${offsets.inlet}, 0)`}
              onClick={() => onSelectComponent('inlet')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('inlet')}
            >
              {/* Metallic Barbed Ridges */}
              <rect x="80" y="232" width="12" height="36" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
              <rect x="92" y="230" width="10" height="40" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
              <rect x="102" y="228" width="10" height="44" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
              <rect x="112" y="226" width="14" height="48" rx="2" fill="url(#brass-grad)" stroke="#4e3d08" strokeWidth="1" />
              
              {/* Hex Nut Wrench Collar */}
              <polygon points="126,222 144,222 148,250 144,278 126,278 122,250" fill="url(#brass-grad)" stroke="#3e3005" strokeWidth="1.5" />
              <line x1="126" y1="222" x2="126" y2="278" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              
              {/* Silver Threaded Fitting Adapter into Solenoid */}
              <rect x="148" y="224" width="42" height="52" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="158" y1="224" x2="158" y2="276" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="168" y1="224" x2="168" y2="276" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="178" y1="224" x2="178" y2="276" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
            </g>

            {/* ========================================== */}
            {/* 2. SOLENOID VALVE ASSEMBLY                */}
            {/* ========================================== */}
            
            {/* 2A. Solenoid Main Body */}
            <g
              id="component-solenoid_body"
              transform={`translate(${offsets.solenoid}, 0)`}
              onClick={() => onSelectComponent('solenoid_body')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('solenoid_body')}
            >
              {/* Left Metallic Inlet Connection Pipe Stub */}
              <rect x="190" y="228" width="28" height="44" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
              
              {/* Main Rectangular Valve Body */}
              <rect x="218" y="195" width="118" height="110" rx="12" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="2" />
              <rect x="224" y="201" width="106" height="98" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              
              {/* Dimensional Shading / Bevel Lines */}
              <path d="M 218 207 L 235 220 L 319 220 L 336 207" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <path d="M 218 293 L 235 280 L 319 280 L 336 293" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
              
              {/* Central Spec Label Plate */}
              <rect x="242" y="235" width="70" height="34" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
              {/* Label text graphics */}
              <rect x="248" y="240" width="38" height="4" fill="#0284c7" />
              <text x="248" y="254" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="#0f172a">SOLENOID VALVE</text>
              <text x="248" y="262" fontSize="5" fontFamily="monospace" fill="#475569">12VDC 0.02-0.8MPa</text>

              {/* Directional Flow Arrow Graphic on Valve */}
              <path d="M 240 282 L 260 282 L 260 279 L 268 284 L 260 289 L 260 286 L 240 286 Z" fill="#64748b" />

              {/* Right Metallic Outlet Connection Pipe Stub */}
              <rect x="336" y="228" width="28" height="44" rx="3" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1.5" />
            </g>

            {/* 2B. Solenoid Top Coil Housing */}
            <g
              id="component-solenoid_coil"
              transform={`translate(${offsets.solenoid}, ${offsets.solenoidTop})`}
              onClick={() => onSelectComponent('solenoid_coil')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('solenoid_coil')}
            >
              {/* Coil Cylinder Base Collar */}
              <rect x="252" y="185" width="50" height="12" rx="2" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
              
              {/* Black Solenoid Electromagnetic Cylinder */}
              <rect x="255" y="132" width="44" height="55" rx="6" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="1.5" />
              
              {/* Energized Glow Indicator Rim */}
              {valveState && (
                <rect x="255" y="132" width="44" height="55" rx="6" fill="none" stroke="#10b981" strokeWidth="2.5" className="animate-pulse" />
              )}

              {/* Top Cap with Wire Strain Relief Gland */}
              <rect x="267" y="120" width="20" height="14" rx="3" fill="url(#silver-grad)" stroke="#0f172a" strokeWidth="1" />
              <circle cx="277" cy="122" r="4" fill="#0f172a" />
            </g>

            {/* 2C. Solenoid Lower Electrical / Water Fitting */}
            <g
              id="component-solenoid_lower"
              transform={`translate(${offsets.solenoid}, ${offsets.solenoidBottom})`}
              onClick={() => onSelectComponent('solenoid_lower')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('solenoid_lower')}
            >
              {/* Lower Metallic Adapter Ring */}
              <rect x="256" y="305" width="42" height="16" rx="2" fill="url(#silver-grad)" stroke="#1e293b" strokeWidth="1" />
              {/* White Cylindrical Conduit Collar */}
              <rect x="263" y="321" width="28" height="28" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
              <line x1="263" y1="330" x2="291" y2="330" stroke="#94a3b8" strokeWidth="1" />
              {/* Lower White Extension Tube */}
              <rect x="270" y="349" width="14" height="22" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            </g>

            {/* ========================================== */}
            {/* 3. MID-ASSEMBLY GRAY PVC CONNECTOR & PIPE  */}
            {/* ========================================== */}
            <g
              id="component-pvc_connector"
              transform={`translate(${offsets.pvc}, 0)`}
              onClick={() => onSelectComponent('pvc_connector')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('pvc_connector')}
            >
              {/* Outer Gray PVC Coupling Body */}
              <rect x="364" y="214" width="86" height="72" rx="6" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
              
              {/* Dark Lock Rings */}
              <rect x="376" y="210" width="14" height="80" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
              <rect x="424" y="210" width="14" height="80" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
              
              {/* Horizontal Gray Pipe Segment */}
              <rect x="450" y="225" width="98" height="50" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1" />
              <line x1="450" y1="235" x2="548" y2="235" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <line x1="450" y1="265" x2="548" y2="265" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />

              {/* Secondary Locking Ring Collar before flow meter */}
              <rect x="522" y="218" width="22" height="64" rx="3" fill="url(#dark-pvc-ring)" stroke="#0f172a" strokeWidth="1" />
            </g>

            {/* ========================================== */}
            {/* 4. TRANSPARENT WATER FLOW METER            */}
            {/* ========================================== */}
            <g
              transform={`translate(${offsets.meter}, 0)`}
            >
              {/* Flow Meter Horizontal Mounting Base & T-Junction Pipe */}
              <g
                id="component-pipe_extension-mid"
                onClick={() => onSelectComponent('flow_meter_housing')}
                className="cursor-pointer"
              >
                <rect x="544" y="222" width="168" height="56" rx="4" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
                <rect x="558" y="218" width="18" height="64" rx="2" fill="url(#dark-pvc-ring)" />
                <rect x="680" y="218" width="18" height="64" rx="2" fill="url(#dark-pvc-ring)" />
              </g>

              {/* 4A. Transparent Flow Meter Chamber & Top Cap */}
              <g
                id="component-flow_meter_housing"
                transform={`translate(0, ${offsets.meterTop})`}
                onClick={() => onSelectComponent('flow_meter_housing')}
                className="cursor-pointer transition-transform duration-300 hover:opacity-95"
                filter={getSelectionFilter('flow_meter_housing')}
              >
                {/* Circular Top Structural Cap */}
                <ellipse cx="640" cy="70" rx="58" ry="14" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
                <ellipse cx="640" cy="67" rx="52" ry="11" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                
                {/* Top Cap Radial Ribs */}
                <line x1="640" y1="56" x2="640" y2="78" stroke="#475569" strokeWidth="2" />
                <line x1="600" y1="67" x2="680" y2="67" stroke="#475569" strokeWidth="2" />
                <line x1="610" y1="60" x2="670" y2="74" stroke="#475569" strokeWidth="1.5" />
                <line x1="610" y1="74" x2="670" y2="60" stroke="#475569" strokeWidth="1.5" />

                {/* Outer Transparent Acrylic Cylinder */}
                <rect x="582" y="70" width="116" height="152" rx="8" fill="url(#glass-chamber)" stroke="rgba(148, 163, 184, 0.7)" strokeWidth="2" />

                {/* Glass Chamber Specular Reflections & Curvature Highlights */}
                <path d="M 588 74 L 596 74 L 596 218 L 588 218 Z" fill="url(#glass-specular)" />
                <path d="M 684 74 L 690 74 L 690 218 L 684 218 Z" fill="rgba(255,255,255,0.4)" />
                <line x1="582" y1="120" x2="698" y2="120" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="4,2" />
                <line x1="582" y1="170" x2="698" y2="170" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="4,2" />

                {/* Metallic Support Band Ring around Chamber */}
                <ellipse cx="640" cy="115" rx="58" ry="8" fill="none" stroke="rgba(100, 116, 139, 0.6)" strokeWidth="3" />
                <ellipse cx="640" cy="175" rx="58" ry="8" fill="none" stroke="rgba(100, 116, 139, 0.6)" strokeWidth="3" />
              </g>

              {/* 4B. Internal Dark Green Turbine Rotor Assembly */}
              <g
                id="component-flow_meter_turbine"
                transform={`translate(0, ${offsets.meterTop})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComponent('flow_meter_turbine');
                }}
                className="cursor-pointer"
                filter={getSelectionFilter('flow_meter_turbine')}
              >
                {/* Center Pivot Shaft */}
                <circle cx="640" cy="150" r="10" fill="url(#silver-grad)" stroke="#0f172a" strokeWidth="1.5" />
                
                {/* ROTATING TURBINE VANE GROUP */}
                <g className={valveState && flowRateLmin > 0 ? "spinning-rotor" : ""}>
                  {/* 6 Curved Dark Green Vanes */}
                  <path d="M 640 150 C 640 120, 660 110, 675 115 C 660 130, 645 145, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
                  <path d="M 640 150 C 665 135, 680 150, 675 168 C 655 160, 645 152, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
                  <path d="M 640 150 C 655 170, 645 188, 628 185 C 632 165, 638 155, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
                  <path d="M 640 150 C 640 180, 620 190, 605 185 C 620 170, 635 155, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
                  <path d="M 640 150 C 615 165, 600 150, 605 132 C 625 140, 635 148, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
                  <path d="M 640 150 C 625 130, 635 112, 652 115 C 648 135, 642 145, 640 150 Z" fill="url(#turbine-green)" stroke="#0d3b11" strokeWidth="1" />
                  
                  {/* Magnet Tip Indicator Dot on one blade */}
                  <circle cx="670" cy="118" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                </g>
                <circle cx="640" cy="150" r="5" fill="#f8fafc" />
              </g>

              {/* 4C. Flow Meter Lower Transducer Base */}
              <g
                id="component-flow_meter_base"
                transform={`translate(0, ${offsets.meterBottom})`}
                onClick={() => onSelectComponent('flow_meter_base')}
                className="cursor-pointer transition-transform duration-300 hover:opacity-95"
                filter={getSelectionFilter('flow_meter_base')}
              >
                {/* Black Lower Connection Collar */}
                <rect x="620" y="278" width="40" height="28" rx="3" fill="url(#solenoid-black)" stroke="#0f172a" strokeWidth="1.5" />
                {/* White Cylindrical Sensor Connector */}
                <rect x="628" y="306" width="24" height="42" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                <line x1="628" y1="318" x2="652" y2="318" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="628" y1="332" x2="652" y2="332" stroke="#cbd5e1" strokeWidth="1.5" />
              </g>
            </g>

            {/* ========================================== */}
            {/* 5. RIGHT PIPE EXTENSION & 90° BRONZE ELBOW  */}
            {/* ========================================== */}
            <g
              id="component-pipe_extension"
              transform={`translate(${offsets.pipeRight}, 0)`}
              onClick={() => onSelectComponent('pipe_extension')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('pipe_extension')}
            >
              {/* Gray PVC Coupling right of meter */}
              <rect x="712" y="222" width="56" height="56" rx="4" fill="url(#pvc-gray)" stroke="#334155" strokeWidth="1.5" />
              <rect x="720" y="218" width="12" height="64" rx="2" fill="url(#dark-pvc-ring)" />

              {/* Brown / Bronze Horizontal Extension Pipe */}
              <rect x="768" y="228" width="76" height="44" fill="url(#bronze-grad)" stroke="#4e2c07" strokeWidth="1.5" />
              <line x1="768" y1="236" x2="844" y2="236" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="768" y1="262" x2="844" y2="262" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
            </g>

            {/* 5B. Heavy 90° Bronze Elbow Fitting */}
            <g
              id="component-bronze_elbow"
              transform={`translate(${offsets.elbow}, 0)`}
              onClick={() => onSelectComponent('bronze_elbow')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('bronze_elbow')}
            >
              {/* Curved 90 Degree Bronze Outer Shell */}
              <path
                d="M 844 220 L 895 220 Q 910 220 910 235 L 910 292 L 858 292 L 858 272 Q 858 262 844 262 Z"
                fill="url(#bronze-grad)"
                stroke="#3e2305"
                strokeWidth="2"
              />
              {/* Threaded Ridge Collar */}
              <rect x="840" y="220" width="12" height="52" rx="2" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1" />
              <rect x="854" y="284" width="60" height="12" rx="2" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1" />
            </g>

            {/* 5C. Downward Pipe Outlet */}
            <g
              id="component-outlet"
              transform={`translate(${offsets.elbow}, 0)`}
              onClick={() => onSelectComponent('outlet')}
              className="cursor-pointer transition-transform duration-300 hover:opacity-95"
              filter={getSelectionFilter('outlet')}
            >
              {/* Vertical Bronze Downward Outlet Pipe */}
              <rect x="862" y="296" width="44" height="110" fill="url(#bronze-grad)" stroke="#3e2305" strokeWidth="1.5" />
              <line x1="870" y1="296" x2="870" y2="406" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="896" y1="296" x2="896" y2="406" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
              
              {/* Lower Flanged Exit Rim */}
              <rect x="854" y="406" width="60" height="14" rx="3" fill="url(#brass-grad)" stroke="#3e2305" strokeWidth="1.5" />
            </g>

            {/* ========================================== */}
            {/* 6. ELECTRICAL CABLE WIRING PATHWAYS        */}
            {/* ========================================== */}
            <g id="cables-group" pointerEvents="none">
              {/* Cable 1: From Top of Solenoid Housing (Black Cable) */}
              <path
                d={`M ${277 + offsets.solenoid} ${120 + offsets.solenoidTop} Q ${320 + offsets.solenoid} 60, 480 50 L 520 50`}
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d={`M ${277 + offsets.solenoid} ${120 + offsets.solenoidTop} Q ${320 + offsets.solenoid} 60, 480 50 L 520 50`}
                fill="none"
                stroke={valveState ? "#10b981" : "#64748b"}
                strokeWidth="1.5"
                className={valveState ? "cable-pulse" : ""}
              />

              {/* Cable 2: From Bottom of Solenoid (White/Gray Cable) */}
              <path
                d={`M ${277 + offsets.solenoid} ${371 + offsets.solenoidBottom} C ${277 + offsets.solenoid} 420, 310 450, 340 460`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d={`M ${277 + offsets.solenoid} ${371 + offsets.solenoidBottom} C ${277 + offsets.solenoid} 420, 310 450, 340 460`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* Cable 3: From Bottom of Flow Meter Sensor (Black Cable) */}
              <path
                d={`M ${640 + offsets.meter} ${348 + offsets.meterBottom} C ${640 + offsets.meter} 420, 680 450, 710 460`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d={`M ${640 + offsets.meter} ${348 + offsets.meterBottom} C ${640 + offsets.meter} 420, 680 450, 710 460`}
                fill="none"
                stroke={valveState && flowRateLmin > 0 ? "#38bdf8" : "#475569"}
                strokeWidth="1.5"
                className={valveState && flowRateLmin > 0 ? "cable-pulse" : ""}
              />
            </g>

            {/* ========================================== */}
            {/* 7. CAD DIMENSION CALLOUT OVERLAYS          */}
            {/* ========================================== */}
            {viewMode === 'cad' && (
              <g id="cad-annotations" stroke="#00f0ff" strokeWidth="1" fill="#00f0ff" fontSize="10" fontFamily="monospace">
                {/* Horizontal Dimension Line */}
                <line x1="80" y1="30" x2="910" y2="30" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="80" y1="20" x2="80" y2="40" stroke="#00f0ff" strokeWidth="1.5" />
                <line x1="910" y1="20" x2="910" y2="40" stroke="#00f0ff" strokeWidth="1.5" />
                <text x="450" y="24" textAnchor="middle" fill="#00f0ff">TOTAL LENGTH: 485 mm</text>

                {/* Solenoid Centerline */}
                <line x1="277" y1="90" x2="277" y2="390" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6,4" />
                <text x="277" y="410" textAnchor="middle" fill="#38bdf8">E-VALVE AXIS</text>

                {/* Flow Meter Centerline */}
                <line x1="640" y1="40" x2="640" y2="380" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6,4" />
                <text x="640" y="400" textAnchor="middle" fill="#38bdf8">TURBINE SENSOR</text>

                {/* Component labels */}
                <text x="120" y="190" textAnchor="middle">1. INLET</text>
                <text x="277" y="110" textAnchor="middle">2. SOLENOID VALVE</text>
                <text x="450" y="190" textAnchor="middle">3. uPVC UNION</text>
                <text x="640" y="48" textAnchor="middle">4. FLOW METER</text>
                <text x="880" y="190" textAnchor="middle">5. BRONZE ELBOW</text>
              </g>
            )}

            {/* Exploded View Offset Guide Lines */}
            {viewMode === 'exploded' && (
              <g stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" opacity="0.6">
                <line x1={80 + offsets.inlet} y1="250" x2="80" y2="250" />
                <line x1={277 + offsets.solenoid} y1="250" x2="277" y2="250" />
                <line x1={640 + offsets.meter} y1="250" x2="640" y2="250" />
                <line x1={860 + offsets.elbow} y1="250" x2="860" y2="250" />
              </g>
            )}

          </g>
        </svg>
      </div>

      {/* Interactive Legend Bar */}
      <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">ASSEMBLY PATHWAY:</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 1. Inlet</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-800 dark:bg-slate-300" /> 2. Solenoid Valve</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> 3. PVC Coupling</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> 4. Transparent Meter</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-700" /> 5. Bronze 90° Elbow</span>
        </div>
        <div className="text-slate-500">
          💡 <span className="italic">Click any component to open Engineering Inspector</span>
        </div>
      </div>
    </div>
  );
};
