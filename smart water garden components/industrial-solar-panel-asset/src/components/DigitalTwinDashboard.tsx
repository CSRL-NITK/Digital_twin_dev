import React from 'react';
import { TelemetryData } from '../types';
import {
  Sun,
  Zap,
  Thermometer,
  Battery,
  Activity,
  Droplets,
  Wind,
  Compass,
  ShieldCheck,
} from 'lucide-react';

interface DigitalTwinDashboardProps {
  telemetry: TelemetryData;
  onUpdateTelemetry: (data: Partial<TelemetryData>) => void;
}

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100 tracking-wide uppercase">
              Digital Twin SCADA Control & Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Single-Axis Tracker Unit #PV-408 • Live Mechanical & Electrical Feeds
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Status: ONLINE</span>
        </div>
      </div>

      {/* Sun Orbit & Irradiance Simulator Control */}
      <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="text-xs font-semibold text-slate-200">Sun Orbit & Solar Irradiance Simulator</span>
          </div>
          <span className="text-xs font-mono text-amber-400">
            Sun: {telemetry.sunAngle}° | Irradiance: {Math.round(telemetry.irradiance)} W/m²
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="180"
          value={telemetry.sunAngle}
          onChange={(e) => {
            const angle = parseInt(e.target.value, 10);
            const rad = (angle * Math.PI) / 180;
            const irrad = Math.max(0, Math.sin(rad) * 1050);
            const pwr = (irrad / 1000) * 410 * (telemetry.efficiency / 100);
            const v = 38.5 + (irrad > 100 ? 3.5 : 0);
            const a = pwr / v;

            onUpdateTelemetry({
              sunAngle: angle,
              irradiance: irrad,
              powerOutput: Math.max(0, pwr),
              voltage: Math.max(0, v),
              current: Math.max(0, a),
            });
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>06:00 (Sunrise)</span>
          <span>12:00 (Solar Noon Peak)</span>
          <span>18:00 (Sunset)</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Power Output */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Instant Power</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {Math.round(telemetry.powerOutput)}{' '}
            <span className="text-xs font-normal text-slate-400">W</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">
            Vmp: {telemetry.voltage.toFixed(1)}V | Imp: {telemetry.current.toFixed(1)}A
          </p>
        </div>

        {/* Temperature */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Cell Temp</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {telemetry.cellTemperature.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">NOCT Coeff: -0.35%/°C</p>
        </div>

        {/* Battery Bank */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">LiFePO4 Storage</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {telemetry.batterySoc}{' '}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">48V 200Ah Bank Charging</p>
        </div>

        {/* Daily Yield */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Daily Yield</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {telemetry.dailyEnergy.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <p className="text-[10px] text-purple-400 mt-1 font-mono">Efficiency: {telemetry.efficiency}% PERC</p>
        </div>
      </div>

      {/* Hydroponic System Load Distribution */}
      <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Off-Grid Hydroponics System Power Allocation
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">Water Pumps (pH/EC)</span>
            </div>
            <span className="font-mono text-cyan-400 font-bold">{telemetry.hydroponicsLoadPumps} W</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300">Greenhouse Fans</span>
            </div>
            <span className="font-mono text-indigo-400 font-bold">{telemetry.hydroponicsLoadFans} W</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Nutrient Dosing</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">{telemetry.hydroponicsLoadDosing} W</span>
          </div>
        </div>
      </div>
    </div>
  );
};
