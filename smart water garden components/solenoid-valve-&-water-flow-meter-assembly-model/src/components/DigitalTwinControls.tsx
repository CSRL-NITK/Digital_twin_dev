import React from 'react';
import { ViewMode, TelemetryData } from '../types';
import { Power, Sliders, Eye, Layers, Activity, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react';

interface DigitalTwinControlsProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  telemetry: TelemetryData;
  onUpdateTelemetry: (updated: Partial<TelemetryData>) => void;
  showFlowParticles: boolean;
  onToggleFlowParticles: () => void;
  onResetTotals: () => void;
}

export const DigitalTwinControls: React.FC<DigitalTwinControlsProps> = ({
  viewMode,
  onSetViewMode,
  telemetry,
  onUpdateTelemetry,
  showFlowParticles,
  onToggleFlowParticles,
  onResetTotals
}) => {
  const { valveState, flowRateLmin, inletPressureBar } = telemetry;

  const handleToggleValve = () => {
    const newState = !valveState;
    onUpdateTelemetry({
      valveState: newState,
      // If closing valve, flow rate drops to 0
      flowRateLmin: newState ? (flowRateLmin === 0 ? 12.5 : flowRateLmin) : 0
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Solenoid Actuator Primary Power Button Card */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className={`h-5 w-5 ${valveState ? 'text-emerald-500' : 'text-slate-400'}`} />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Solenoid Actuator</h3>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${valveState ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
            {valveState ? 'ENERGIZED (12V DC)' : 'DE-ENERGIZED (OFF)'}
          </span>
        </div>

        <button
          onClick={handleToggleValve}
          className={`mt-4 flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
            valveState
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 shadow-slate-900/10'
          }`}
        >
          <Power className={`h-5 w-5 ${valveState ? 'animate-pulse' : ''}`} />
          {valveState ? 'CLOSE SOLENOID VALVE' : 'ACTUATE / OPEN SOLENOID VALVE'}
        </button>

        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {valveState
            ? '⚡ 12V DC Coil energized @ 450mA (5.4W). Armature plunger raised.'
            : '🔒 Valve closed. Diaphragm sealed against zero-leak seat.'}
        </p>
      </div>

      {/* Hydraulic Flow & Pressure Sliders */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hydraulic Parameters</h3>
        </div>

        {/* Flow Rate Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Target Flow Rate:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">{flowRateLmin.toFixed(1)} L/min</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={flowRateLmin}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateTelemetry({
                flowRateLmin: val,
                // Automatically open valve if user increases flow above 0
                valveState: val > 0 ? true : valveState
              });
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
          />
        </div>

        {/* Inlet Pressure Slider */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Inlet Line Pressure:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{inletPressureBar.toFixed(1)} Bar</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="8.0"
            step="0.1"
            value={inletPressureBar}
            onChange={(e) => onUpdateTelemetry({ inletPressureBar: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:bg-slate-700"
          />
        </div>
      </div>

      {/* View Mode & Visual Overlays */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">View Mode</h3>
          </div>
          <button
            onClick={onToggleFlowParticles}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              showFlowParticles 
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Stream Particles: {showFlowParticles ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSetViewMode('twin')}
            className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${
              viewMode === 'twin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Layers className="h-4 w-4" /> 2.5D Digital Twin
          </button>

          <button
            onClick={() => onSetViewMode('cad')}
            className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${
              viewMode === 'cad'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Activity className="h-4 w-4" /> CAD Blueprint
          </button>

          <button
            onClick={() => onSetViewMode('fluid')}
            className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${
              viewMode === 'fluid'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Thermal / Pressure
          </button>

          <button
            onClick={() => onSetViewMode('exploded')}
            className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${
              viewMode === 'exploded'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <RefreshCw className="h-4 w-4" /> Exploded View
          </button>
        </div>
      </div>
    </div>
  );
};
