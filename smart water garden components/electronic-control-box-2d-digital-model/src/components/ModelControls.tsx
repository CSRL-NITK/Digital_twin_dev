import React from 'react';
import { ModelViewState } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Layers, Sun, Moon, Maximize2, Download, Sliders, ShieldCheck } from 'lucide-react';

interface ModelControlsProps {
  viewState: ModelViewState;
  onUpdateViewState: (updates: Partial<ModelViewState>) => void;
  onResetView: () => void;
  onExportSvg: () => void;
}

export const ModelControls: React.FC<ModelControlsProps> = ({
  viewState,
  onUpdateViewState,
  onResetView,
  onExportSvg,
}) => {
  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-slate-200 shadow-xl">
      {/* View Mode Selector */}
      <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onUpdateViewState({ activeMode: 'model' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
            viewState.activeMode === 'model'
              ? 'bg-cyan-500 text-slate-950 shadow font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D Digital Model</span>
        </button>

        <button
          onClick={() => onUpdateViewState({ activeMode: 'xray' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
            viewState.activeMode === 'xray'
              ? 'bg-cyan-500 text-slate-950 shadow font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>X-Ray PCB View</span>
        </button>

        <button
          onClick={() => onUpdateViewState({ activeMode: 'schematic' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
            viewState.activeMode === 'schematic'
              ? 'bg-cyan-500 text-slate-950 shadow font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Schematic Trace</span>
        </button>
      </div>

      {/* Background Palette Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">Canvas:</span>
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onUpdateViewState({ backgroundColor: 'white' })}
            title="Clean White (Reference Standard)"
            className={`w-6 h-6 rounded-md border transition ${
              viewState.backgroundColor === 'white'
                ? 'bg-white border-cyan-400 ring-2 ring-cyan-500/50'
                : 'bg-white/80 border-slate-600 hover:scale-105'
            }`}
          />
          <button
            onClick={() => onUpdateViewState({ backgroundColor: 'neutral' })}
            title="Soft Gray Neutral"
            className={`w-6 h-6 rounded-md border transition ${
              viewState.backgroundColor === 'neutral'
                ? 'bg-slate-200 border-cyan-400 ring-2 ring-cyan-500/50'
                : 'bg-slate-300 border-slate-600 hover:scale-105'
            }`}
          />
          <button
            onClick={() => onUpdateViewState({ backgroundColor: 'blueprint' })}
            title="Engineering Blueprint Blue"
            className={`w-6 h-6 rounded-md border transition ${
              viewState.backgroundColor === 'blueprint'
                ? 'bg-blue-900 border-cyan-400 ring-2 ring-cyan-500/50'
                : 'bg-blue-950 border-slate-600 hover:scale-105'
            }`}
          />
          <button
            onClick={() => onUpdateViewState({ backgroundColor: 'dark' })}
            title="Dark Studio Grid"
            className={`w-6 h-6 rounded-md border transition ${
              viewState.backgroundColor === 'dark'
                ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/50'
                : 'bg-slate-950 border-slate-600 hover:scale-105'
            }`}
          />
        </div>
      </div>

      {/* Zoom / Reset Controls */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onUpdateViewState({ zoom: Math.max(0.6, viewState.zoom - 0.15) })}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-12 text-center text-cyan-300">
          {Math.round(viewState.zoom * 100)}%
        </span>
        <button
          onClick={() => onUpdateViewState({ zoom: Math.min(2.5, viewState.zoom + 0.15) })}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onResetView}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onExportSvg}
          className="ml-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition flex items-center space-x-1.5 shadow"
          title="Download Vector Model"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export Vector</span>
        </button>
      </div>
    </div>
  );
};
