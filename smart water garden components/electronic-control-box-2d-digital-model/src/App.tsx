import React, { useState, useRef } from 'react';
import { ModelViewState } from './types';
import { ControllerModelSvg } from './components/ControllerModelSvg';
import { ComponentDetailsPanel } from './components/ComponentDetailsPanel';
import { ModelControls } from './components/ModelControls';
import { Cpu, CheckCircle2, ShieldCheck, Activity, Info, Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [viewState, setViewState] = useState<ModelViewState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    lidOpacity: 0.35,
    ledPower: true,
    redLedBrightness: 90,
    amberLedBrightness: 80,
    highlightedComponentId: null,
    showTraceOverlays: false,
    activeMode: 'model',
    backgroundColor: 'white',
  });

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('red-led');
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  const updateViewState = (updates: Partial<ModelViewState>) => {
    setViewState((prev) => ({ ...prev, ...updates }));
  };

  const handleResetView = () => {
    setViewState((prev) => ({
      ...prev,
      zoom: 1,
      pan: { x: 0, y: 0 },
      lidOpacity: 0.35,
      activeMode: 'model',
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - viewState.pan.x, y: e.clientY - viewState.pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewState((prev) => ({
        ...prev,
        pan: {
          x: e.clientX - startPanRef.current.x,
          y: e.clientY - startPanRef.current.y,
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleExportSvg = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'electronic_controller_2d_model.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Canvas background styling based on user selection
  const getCanvasBackgroundClass = () => {
    switch (viewState.backgroundColor) {
      case 'white':
        return 'bg-white text-slate-900 border-slate-200';
      case 'neutral':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'blueprint':
        return 'bg-blue-950 text-blue-100 border-blue-800';
      case 'dark':
      default:
        return 'bg-slate-950 text-slate-100 border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Electronic Controller 2D Model</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                100% Vector Precision
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              High-Fidelity Engineering Model & Telemetry Digital Twin
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="hidden md:flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
            <span className="text-slate-300">Red LED: <span className="text-red-400 font-mono font-semibold">GLOWING</span></span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(255,193,7,0.8)]" />
            <span className="text-slate-300">Amber LED: <span className="text-amber-400 font-mono font-semibold">GLOWING</span></span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 max-w-[1700px] w-full mx-auto overflow-hidden">
        {/* Central Canvas Area */}
        <div className="flex-1 flex flex-col space-y-4 min-h-[550px]">
          {/* Controls Bar */}
          <ModelControls
            viewState={viewState}
            onUpdateViewState={updateViewState}
            onResetView={handleResetView}
            onExportSvg={handleExportSvg}
          />

          {/* Model Render Stage */}
          <div
            className={`flex-1 rounded-2xl border relative overflow-hidden transition-colors duration-300 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner ${getCanvasBackgroundClass()}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Lines Pattern for Blueprint / Dark Backgrounds */}
            {(viewState.backgroundColor === 'dark' || viewState.backgroundColor === 'blueprint') && (
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle, #00E5FF 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />
            )}

            {/* Rendered SVG Digital Twin */}
            <ControllerModelSvg
              viewState={{
                ...viewState,
                highlightedComponentId: selectedComponentId,
              }}
              onSelectComponent={(id) => setSelectedComponentId(id)}
            />

            {/* Quick Canvas Overlay Info Badges */}
            <div className="absolute top-4 left-4 pointer-events-none flex flex-col space-y-1.5">
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-900/80 text-cyan-300 border border-slate-700 backdrop-blur shadow">
                Reference Model: IP67 Controller Enclosure
              </span>
              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 backdrop-blur">
                Drag to Pan • Zoom: {Math.round(viewState.zoom * 100)}%
              </span>
            </div>

            {/* Verification Checklist Overlay (Collapsible) */}
            <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 max-w-xs text-xs space-y-2 shadow-2xl hidden sm:block">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold border-b border-slate-800 pb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reference Fidelity Checklist</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Translucent enclosure & 4 corner screws</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Dark blue PCB with dense SMD components</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Glowing Red LED with halo & light bloom</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Glowing Amber LED directly underneath</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Blue relay blocks & routed wiring loops</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Top gray conduit & bottom black cable</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Off-white lower mounting bracket</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side Telemetry & Component Details Panel */}
        <ComponentDetailsPanel
          selectedComponentId={selectedComponentId}
          onSelectComponent={(id) => setSelectedComponentId(id)}
          viewState={viewState}
          onUpdateViewState={updateViewState}
        />
      </main>
    </div>
  );
}
