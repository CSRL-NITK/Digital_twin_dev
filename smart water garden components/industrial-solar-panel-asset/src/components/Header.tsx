import React from 'react';
import { ScadaTheme } from '../types';
import { Sun, Download, Sliders, Layers, Monitor, Ruler } from 'lucide-react';

interface HeaderProps {
  theme: ScadaTheme;
  onThemeChange: (theme: ScadaTheme) => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  activeTab: 'asset' | 'dashboard' | 'specs';
  onTabChange: (tab: 'asset' | 'dashboard' | 'specs') => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  showDimensions,
  onToggleDimensions,
  activeTab,
  onTabChange,
  onOpenExport,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Asset Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-blue-600 p-0.5 shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Industrial Standalone Solar Panel SCADA Asset
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                SVG Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              30° Tilted Monocrystalline PERC (6×10 Cells) on Galvanized Steel Pole
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => onTabChange('asset')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'asset'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SVG Asset Inspector</span>
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Hydroponics SCADA</span>
          </button>
        </div>

        {/* Utility Controls & Themes */}
        <div className="flex items-center gap-2">
          {/* CAD Dimensions Toggle */}
          <button
            onClick={onToggleDimensions}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showDimensions
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle CAD Dimension Overlay Lines"
          >
            <Ruler className="w-3.5 h-3.5 text-cyan-400" />
            <span>CAD Specs</span>
          </button>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ScadaTheme)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="schneider-dark">Schneider EcoStruxure Dark</option>
            <option value="siemens-light">Siemens WinCC Light</option>
            <option value="victron-navy">Victron Energy Marine</option>
            <option value="abb-slate">ABB Automation Slate</option>
            <option value="cad-blueprint">CAD Blueprint Mode</option>
          </select>

          {/* Export SVG Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>
    </header>
  );
};
