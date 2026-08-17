import React from 'react';
import { TelemetryData } from '../types';
import { Activity, Gauge, Droplets, Zap, RotateCcw, Play } from 'lucide-react';

interface TelemetryDashboardProps {
  telemetry: TelemetryData;
  history: number[]; // Flow rate history buffer
  onResetTotals: () => void;
  onApplyPreset: (preset: 'normal' | 'high_pressure' | 'drip' | 'closed') => void;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  telemetry,
  history,
  onResetTotals,
  onApplyPreset
}) => {
  const {
    valveState,
    flowRateLmin,
    inletPressureBar,
    pulseFrequencyHz,
    totalVolumeLiters,
    solenoidCurrentmA,
    turbineRpm
  } = telemetry;

  // Calculate flow velocity through 3/4" pipe (~20mm internal diameter)
  const pipeAreaM2 = Math.PI * Math.pow(0.010, 2); // 20mm diameter => 10mm radius
  const flowM3s = (flowRateLmin / 1000) / 60;
  const flowVelocityMs = valveState && flowRateLmin > 0 ? flowM3s / pipeAreaM2 : 0;

  // Render SVG Sparkline graph
  const svgWidth = 320;
  const svgHeight = 60;
  const maxVal = 35; // max 35 L/min scale
  const points = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1 || 1)) * svgWidth;
      const y = svgHeight - (Math.min(val, maxVal) / maxVal) * (svgHeight - 10) - 5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      {/* Quick Scenario Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Smart Garden Operating Presets:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onApplyPreset('normal')}
            className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
          >
            <Play className="h-3 w-3" /> Standard Irrigation (12.5 L/min)
          </button>
          <button
            onClick={() => onApplyPreset('high_pressure')}
            className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
          >
            <Play className="h-3 w-3" /> High Pressure Surge (24.0 L/min @ 5.5 Bar)
          </button>
          <button
            onClick={() => onApplyPreset('drip')}
            className="flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-500/20 dark:text-purple-400"
          >
            <Play className="h-3 w-3" /> Micro-Drip Line (2.5 L/min)
          </button>
          <button
            onClick={() => onApplyPreset('closed')}
            className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
          >
            <Play className="h-3 w-3" /> Shutdown / Off (0.0 L/min)
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {/* Total Volume */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-blue-500" /> Total Volume</span>
            <button onClick={onResetTotals} title="Reset total counter" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {totalVolumeLiters.toFixed(2)} <span className="text-xs font-normal text-slate-500">Liters</span>
          </div>
        </div>

        {/* Pulse Frequency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-500" /> Pulse Output
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {pulseFrequencyHz.toFixed(1)} <span className="text-xs font-normal text-slate-500">Hz</span>
          </div>
          <div className="text-[10px] text-slate-400">Hall-Effect Signal</div>
        </div>

        {/* Flow Velocity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Gauge className="h-3.5 w-3.5 text-purple-500" /> Flow Velocity
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {flowVelocityMs.toFixed(2)} <span className="text-xs font-normal text-slate-500">m/s</span>
          </div>
          <div className="text-[10px] text-slate-400">Inside 3/4" Conduit</div>
        </div>

        {/* Solenoid Power Draw */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Actuator Coil
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {solenoidCurrentmA} <span className="text-xs font-normal text-slate-500">mA</span>
          </div>
          <div className="text-[10px] text-slate-400">{valveState ? '5.4 W @ 12V DC' : '0 W (Standby)'}</div>
        </div>

        {/* Turbine Speed */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <RotateCcw className="h-3.5 w-3.5 text-sky-500" /> Meter Rotor
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {Math.round(turbineRpm)} <span className="text-xs font-normal text-slate-500">RPM</span>
          </div>
          <div className="text-[10px] text-slate-400">Optical Sight Dome</div>
        </div>
      </div>

      {/* Real-time Flow Rate Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Flow Telemetry Stream</span>
          </div>
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
            CURRENT: {flowRateLmin.toFixed(1)} L/min
          </span>
        </div>

        <div className="relative h-16 w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950 p-1">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="h-full w-full">
            {/* Grid line */}
            <line x1="0" y1="30" x2={svgWidth} y2="30" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4,4" />
            
            {/* Fill under graph */}
            <polygon
              points={`0,${svgHeight} ${points} ${svgWidth},${svgHeight}`}
              fill="rgba(56, 189, 248, 0.15)"
            />

            {/* Line graph */}
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
