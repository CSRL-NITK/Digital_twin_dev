import React from 'react';
import { AssemblyComponentId } from '../types';
import { ASSEMBLY_SPECS } from '../data/assemblyData';
import { X, Cpu, Layers, Gauge, Zap, Info, ShieldCheck, ArrowRight } from 'lucide-react';

interface ComponentInspectorProps {
  componentId: AssemblyComponentId | null;
  onClose: () => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({ componentId, onClose }) => {
  if (!componentId) return null;

  const spec = ASSEMBLY_SPECS[componentId];
  if (!spec) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all dark:bg-slate-900/95 sm:rounded-l-3xl border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <span className="inline-block rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {spec.category} SPECIFICATION
          </span>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{spec.name}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{spec.shortDesc}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Specs List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Core Properties Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Layers className="h-3.5 w-3.5 text-blue-500" /> Material
            </div>
            <div className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">{spec.material}</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-emerald-500" /> Max Pressure
            </div>
            <div className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">{spec.pressureRating}</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-amber-500" /> Dimensions
            </div>
            <div className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">{spec.dimensions}</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Zap className="h-3.5 w-3.5 text-purple-500" /> Operating Temp
            </div>
            <div className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">{spec.operatingTemp}</div>
          </div>
        </div>

        {/* Electrical Output / Signal if present */}
        {spec.voltageOrOutput && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 dark:border-amber-500/30">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Zap className="h-4 w-4" /> Electrical & Signal Rating
            </div>
            <div className="mt-1 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
              {spec.voltageOrOutput}
            </div>
          </div>
        )}

        {/* Key Features Bullet List */}
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Info className="h-4 w-4 text-blue-500" /> Design & Mechanical Features
          </h3>
          <ul className="mt-2 space-y-2">
            {spec.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pinout Wiring Chart if present */}
        {spec.pinout && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Electrical Wiring Pinout
            </h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="p-2 font-semibold">Conductor / Pin</th>
                    <th className="p-2 font-semibold">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {spec.pinout.map((pin, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">{pin.pin}</td>
                      <td className="p-2 text-slate-700 dark:text-slate-300">{pin.function}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CAD Certification Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Verified 2D CAD Digital-Twin model parameter matching physical assembly specification.</span>
        </div>
      </div>
    </div>
  );
};
