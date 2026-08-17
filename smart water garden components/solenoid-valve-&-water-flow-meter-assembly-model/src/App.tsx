import React, { useState, useEffect } from 'react';
import { ViewMode, TelemetryData, AssemblyComponentId } from './types';
import { AssemblyCanvas } from './components/AssemblyCanvas';
import { ComponentInspector } from './components/ComponentInspector';
import { DigitalTwinControls } from './components/DigitalTwinControls';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { ExportModal } from './components/ExportModal';
import { Cpu, Download, Info, RefreshCw, Eye, Sparkles } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('twin');
  const [selectedComponent, setSelectedComponent] = useState<AssemblyComponentId | null>(null);
  const [showCrossSection, setShowCrossSection] = useState(false);
  const [showFlowParticles, setShowFlowParticles] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    valveState: true,
    flowRateLmin: 12.5,
    inletPressureBar: 2.5,
    pulseFrequencyHz: 93.8, // ~450 pulses/liter => 12.5 L/min = 93.75 Hz
    totalVolumeLiters: 148.60,
    solenoidCurrentmA: 450,
    waterTempC: 18.5,
    turbineRpm: 420
  });

  // Flow rate sparkline history buffer
  const [flowHistory, setFlowHistory] = useState<number[]>(() => 
    Array.from({ length: 30 }, () => 12.5 + (Math.random() * 0.4 - 0.2))
  );

  // Live Telemetry Stream Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const { valveState, flowRateLmin, inletPressureBar } = prev;

        if (!valveState || flowRateLmin === 0) {
          return {
            ...prev,
            pulseFrequencyHz: 0,
            solenoidCurrentmA: 0,
            turbineRpm: 0
          };
        }

        // Add small organic flow ripple (hydraulic fluctuation)
        const jitter = (Math.random() - 0.5) * 0.3;
        const currentFlow = Math.max(0, flowRateLmin + jitter);

        // Calculate Hall effect frequency: 450 pulses / liter => Hz = (L/min / 60) * 450
        const pulseHz = (currentFlow / 60) * 450;
        
        // Volume increment per second (100ms tick => 0.1s)
        const volumeDeltaLiters = (currentFlow / 60) * 0.1;

        // Turbine RPM estimation
        const rpm = currentFlow * 33.6;

        return {
          ...prev,
          pulseFrequencyHz: pulseHz,
          totalVolumeLiters: prev.totalVolumeLiters + volumeDeltaLiters,
          solenoidCurrentmA: 450 + Math.floor(Math.random() * 6 - 3),
          turbineRpm: rpm
        };
      });

      // Update history buffer
      setFlowHistory((prev) => {
        const nextVal = telemetry.valveState ? telemetry.flowRateLmin : 0;
        return [...prev.slice(1), nextVal];
      });
    }, 100);

    return () => clearInterval(interval);
  }, [telemetry.valveState, telemetry.flowRateLmin]);

  const handleUpdateTelemetry = (updated: Partial<TelemetryData>) => {
    setTelemetry((prev) => ({ ...prev, ...updated }));
  };

  const handleResetTotals = () => {
    setTelemetry((prev) => ({ ...prev, totalVolumeLiters: 0 }));
  };

  const handleApplyPreset = (preset: 'normal' | 'high_pressure' | 'drip' | 'closed') => {
    switch (preset) {
      case 'normal':
        setTelemetry((prev) => ({
          ...prev,
          valveState: true,
          flowRateLmin: 12.5,
          inletPressureBar: 2.5
        }));
        break;
      case 'high_pressure':
        setTelemetry((prev) => ({
          ...prev,
          valveState: true,
          flowRateLmin: 24.0,
          inletPressureBar: 5.5
        }));
        break;
      case 'drip':
        setTelemetry((prev) => ({
          ...prev,
          valveState: true,
          flowRateLmin: 2.5,
          inletPressureBar: 1.2
        }));
        break;
      case 'closed':
        setTelemetry((prev) => ({
          ...prev,
          valveState: false,
          flowRateLmin: 0.0,
          inletPressureBar: 2.5
        }));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Top Engineering Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  Solenoid Valve & Flow Meter Assembly
                </h1>
                <span className="hidden rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 sm:inline-block">
                  2D Digital Twin Model
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-fidelity 2D digital engineering model & hydraulic simulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export SVG / CAD</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
        {/* Assembly Interactive Canvas */}
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <AssemblyCanvas
            viewMode={viewMode}
            telemetry={telemetry}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            showCrossSection={showCrossSection}
            showFlowParticles={showFlowParticles}
          />
        </section>

        {/* Digital Twin Controls */}
        <section>
          <DigitalTwinControls
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
            showFlowParticles={showFlowParticles}
            onToggleFlowParticles={() => setShowFlowParticles(!showFlowParticles)}
            onResetTotals={handleResetTotals}
          />
        </section>

        {/* Real-time Telemetry Dashboard */}
        <section>
          <TelemetryDashboard
            telemetry={telemetry}
            history={flowHistory}
            onResetTotals={handleResetTotals}
            onApplyPreset={handleApplyPreset}
          />
        </section>

        {/* Component Inspector Modal/Drawer */}
        <ComponentInspector
          componentId={selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p>
          2D Digital Engineering Model — Water Flow Control Assembly (Solenoid Valve → Coupling → Transparent Turbine Meter → 90° Elbow Outlet)
        </p>
      </footer>
    </div>
  );
}
