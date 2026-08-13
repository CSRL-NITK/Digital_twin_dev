import React from 'react';
import { ComponentDetail, ModelViewState } from '../types';
import { COMPONENT_DETAILS } from '../data/componentsData';
import { Cpu, Zap, Eye, Sliders, Shield, Layers, HelpCircle, CheckCircle, Info } from 'lucide-react';

interface ComponentDetailsPanelProps {
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  viewState: ModelViewState;
  onUpdateViewState: (updates: Partial<ModelViewState>) => void;
}

export const ComponentDetailsPanel: React.FC<ComponentDetailsPanelProps> = ({
  selectedComponentId,
  onSelectComponent,
  viewState,
  onUpdateViewState,
}) => {
  const selectedDetail = COMPONENT_DETAILS.find((c) => c.id === selectedComponentId);

  return (
    <div className="w-full lg:w-96 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex flex-col text-slate-200 shadow-2xl space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold tracking-wide text-white">Digital Twin Telemetry</h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/50">
          2D Vector Model
        </span>
      </div>

      {/* Component Inspector Section */}
      {selectedDetail ? (
        <div className="space-y-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/60 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                {selectedDetail.category}
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">{selectedDetail.name}</h3>
            </div>
            <button
              onClick={() => onSelectComponent(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            >
              Clear
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{selectedDetail.description}</p>

          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Technical Specifications
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries(selectedDetail.specifications).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60">
                  <span className="text-slate-400">{key}:</span>
                  <span className="font-mono text-cyan-200 font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 text-center space-y-2">
          <Info className="w-6 h-6 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">
            Click on any component (Red LED, Amber LED, PCB, Relays, Wiring, Cover, Conduit, or Bracket) in the 2D model to view detailed circuit specs.
          </p>
        </div>
      )}

      {/* Quick Component Selector Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Inspect Structure</span>
          <span className="text-[10px] text-slate-500">10 Components</span>
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {COMPONENT_DETAILS.map((comp) => {
            const isSelected = comp.id === selectedComponentId;
            return (
              <button
                key={comp.id}
                onClick={() => onSelectComponent(comp.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition text-left flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-medium'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    comp.category === 'LED'
                      ? 'bg-red-400'
                      : comp.category === 'Relay'
                      ? 'bg-blue-400'
                      : comp.category === 'Wiring'
                      ? 'bg-yellow-400'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="truncate max-w-[120px]">{comp.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LED & Power Controls */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Power & Indicator State</span>
          </label>
          <button
            onClick={() => onUpdateViewState({ ledPower: !viewState.ledPower })}
            className={`text-xs px-3 py-1 rounded-full font-medium transition flex items-center space-x-1.5 ${
              viewState.ledPower
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${viewState.ledPower ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{viewState.ledPower ? 'Power ON' : 'Power OFF'}</span>
          </button>
        </div>

        {/* LED Glow Sliders */}
        <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-red-400 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                <span>Red Status LED Glow</span>
              </span>
              <span className="font-mono text-slate-400">{viewState.redLedBrightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={viewState.redLedBrightness}
              disabled={!viewState.ledPower}
              onChange={(e) => onUpdateViewState({ redLedBrightness: Number(e.target.value) })}
              className="w-full accent-red-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-30"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-amber-400 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(255,193,7,0.8)]" />
                <span>Amber Indicator Glow</span>
              </span>
              <span className="font-mono text-slate-400">{viewState.amberLedBrightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={viewState.amberLedBrightness}
              disabled={!viewState.ledPower}
              onChange={(e) => onUpdateViewState({ amberLedBrightness: Number(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>
      </div>

      {/* Enclosure Translucency / Lid Control */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Polycarbonate Lid Opacity</span>
          </span>
          <span className="font-mono text-cyan-300">{Math.round(viewState.lidOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={viewState.lidOpacity}
          onChange={(e) => onUpdateViewState({ lidOpacity: Number(e.target.value) })}
          className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
        />
        <p className="text-[11px] text-slate-500">
          Slide to 0% for X-ray PCB circuit view, or 35% for realistic translucent plastic cover as shown in reference.
        </p>
      </div>
    </div>
  );
};
