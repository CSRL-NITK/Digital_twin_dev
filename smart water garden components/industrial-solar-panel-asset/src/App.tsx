import React, { useState } from 'react';
import { LayerId, LayerConfig, MaterialCustomization, TelemetryData, ScadaTheme } from './types';
import { Header } from './components/Header';
import { IndustrialSolarPanelSVG } from './components/IndustrialSolarPanelSVG';
import { LayerExplorer } from './components/LayerExplorer';
import { DigitalTwinDashboard } from './components/DigitalTwinDashboard';
import { TechSpecs } from './components/TechSpecs';
import { ExportModal } from './components/ExportModal';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Sparkles, Layers, Shield, Monitor } from 'lucide-react';

const INITIAL_LAYERS: Record<LayerId, LayerConfig> = {
  'solar-panel': {
    id: 'solar-panel',
    name: 'Solar Panel Module',
    description: '410W Monocrystalline PERC Module Enclosure',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'photovoltaic',
  },
  'solar-cells': {
    id: 'solar-cells',
    name: 'Solar Cells Grid (6×10)',
    description: '60 Photovoltaic Cells with Silver Busbars',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'photovoltaic',
  },
  'aluminum-frame': {
    id: 'aluminum-frame',
    name: 'Anodized Aluminum Frame',
    description: '35mm Beveled Brushed Extruded Frame',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'structure',
  },
  'junction-box': {
    id: 'junction-box',
    name: 'IP67 Rear Junction Box',
    description: 'Weatherproof Box with Bypass Diodes & Glands',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'electrical',
  },
  'pivot-hinge': {
    id: 'pivot-hinge',
    name: 'Stationary Pivot Hinge Pin',
    description: 'Central Ø 24mm Alloy Steel Hinge Axis & Bearing Block',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'mounting',
  },
  'cables': {
    id: 'cables',
    name: 'UV Cables & MC4 Plugs',
    description: 'Tinned Copper Cables + MC4 Connectors',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'electrical',
  },
  'mounting-bracket': {
    id: 'mounting-bracket',
    name: 'Single-Axis Tilt Bracket',
    description: 'Adjustable Quadrant Arc Plate & Tracker Saddle',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'mounting',
  },
  'support-arms': {
    id: 'support-arms',
    name: 'Triangular Support Arms',
    description: 'Diagonal Strut Reinforcements Under Panel',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'mounting',
  },
  'u-bolts': {
    id: 'u-bolts',
    name: 'Stainless Steel U-Bolts',
    description: 'M12 Heavy-Duty Pole Clamping Bolts',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'mounting',
  },
  'support-pole': {
    id: 'support-pole',
    name: 'Galvanized Steel Pole',
    description: 'Ø 89mm Heavy Cylindrical Pillar (ISO 1461)',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'structure',
  },
  'base-plate': {
    id: 'base-plate',
    name: 'Welded Base Flange',
    description: '16mm Steel Octagonal Base Plate with Gussets',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'structure',
  },
  'anchor-bolts': {
    id: 'anchor-bolts',
    name: 'Concrete Anchor Bolts',
    description: '4× M16 Foundation Bolts with Double Nuts',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'mounting',
  },
  'grounding-wire': {
    id: 'grounding-wire',
    name: 'Earth Grounding Conductor',
    description: 'Green/Yellow Striped Copper Grounding Cable',
    visible: true,
    opacity: 1,
    highlighted: false,
    category: 'electrical',
  },
};

const INITIAL_MATERIALS: MaterialCustomization = {
  cellType: 'mono-blue',
  frameFinish: 'brushed-silver',
  poleFinish: 'galvanized-silver',
  wireColor: 'standard-green-yellow',
};

const INITIAL_TELEMETRY: TelemetryData = {
  irradiance: 850,
  powerOutput: 348,
  voltage: 38.5,
  current: 9.04,
  cellTemperature: 42.5,
  efficiency: 21.3,
  dailyEnergy: 2.85,
  sunAngle: 90,
  tiltAngle: 30,
  hydroponicsLoadPumps: 120,
  hydroponicsLoadFans: 60,
  hydroponicsLoadDosing: 35,
  batterySoc: 92,
};

export default function App() {
  const [layers, setLayers] = useState<Record<LayerId, LayerConfig>>(INITIAL_LAYERS);
  const [materials, setMaterials] = useState<MaterialCustomization>(INITIAL_MATERIALS);
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [theme, setTheme] = useState<ScadaTheme>('schneider-dark');
  
  const [activeTab, setActiveTab] = useState<'asset' | 'dashboard' | 'specs'>('asset');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId | null>('solar-panel');
  const [activeHoverLayer, setActiveHoverLayer] = useState<LayerId | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Layer handlers
  const handleToggleVisibility = (id: LayerId) => {
    setLayers((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible },
    }));
  };

  const handleOpacityChange = (id: LayerId, opacity: number) => {
    setLayers((prev) => ({
      ...prev,
      [id]: { ...prev[id], opacity },
    }));
  };

  const handleResetLayers = () => {
    setLayers(INITIAL_LAYERS);
    setMaterials(INITIAL_MATERIALS);
    setZoomLevel(1);
  };

  // Canvas Theme background styling
  const getThemeBg = () => {
    switch (theme) {
      case 'siemens-light':
        return 'bg-slate-100 border-slate-300 text-slate-900';
      case 'victron-navy':
        return 'bg-blue-950/90 border-blue-900 text-slate-100';
      case 'abb-slate':
        return 'bg-slate-800 border-slate-700 text-slate-100';
      case 'cad-blueprint':
        return 'bg-blue-900/95 border-cyan-500/40 text-cyan-100';
      case 'schneider-dark':
      default:
        return 'bg-slate-950 border-slate-900 text-slate-100';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-slate-950 text-slate-100 transition-colors duration-300`}>
      {/* SCADA Top Header Navigation */}
      <Header
        theme={theme}
        onThemeChange={setTheme}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions(!showDimensions)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-5 overflow-hidden">
        {/* Left Side: Interactive SVG Asset Viewing Stage */}
        <div className="flex-1 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-h-[550px] relative">
          {/* Canvas Control Toolbar Overlay */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom In Asset"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom Out Asset"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
              title="Reset Zoom View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-2 border-l border-slate-800">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          {/* Active Layer Badge Banner */}
          {activeHoverLayer && (
            <div className="absolute top-4 right-4 z-10 bg-blue-950/90 border border-blue-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in duration-150">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-xs font-mono font-semibold text-blue-200">
                Layer: #{activeHoverLayer}
              </span>
            </div>
          )}

          {/* Grid Background Pattern */}
          <div
            className={`flex-1 relative flex items-center justify-center p-6 overflow-hidden transition-all duration-300 ${getThemeBg()}`}
            style={{
              backgroundImage:
                theme === 'cad-blueprint'
                  ? 'radial-gradient(circle, rgba(6,182,212,0.15) 1px, transparent 1px)'
                  : 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Solar Panel Vector Component Container */}
            <div
              className="w-full max-w-xl transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <IndustrialSolarPanelSVG
                layers={layers}
                materials={materials}
                showDimensions={showDimensions}
                activeHoverLayer={activeHoverLayer}
                onLayerHover={setActiveHoverLayer}
                onLayerClick={(id) => setSelectedLayerId(id)}
                sunPosition={telemetry.sunAngle}
              />
            </div>
          </div>

          {/* Bottom Asset Footer Stats Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SVG Component Standard: Industrial SCADA HMI Asset</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>60 Cells (6x10)</span>
              <span>•</span>
              <span>30° Standard Tilt</span>
              <span>•</span>
              <span>ISO 1461 Galvanized Steel</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Controls (Layer Explorer / Digital Twin SCADA / Tech Specs) */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          {activeTab === 'asset' && (
            <LayerExplorer
              layers={layers}
              materials={materials}
              activeHoverLayer={activeHoverLayer}
              selectedLayerId={selectedLayerId}
              onToggleVisibility={handleToggleVisibility}
              onOpacityChange={handleOpacityChange}
              onLayerHover={setActiveHoverLayer}
              onLayerSelect={(id) => setSelectedLayerId(id)}
              onUpdateMaterials={(mat) => setMaterials((prev) => ({ ...prev, ...mat }))}
              onResetLayers={handleResetLayers}
            />
          )}

          {activeTab === 'dashboard' && (
            <DigitalTwinDashboard
              telemetry={telemetry}
              onUpdateTelemetry={(data) => setTelemetry((prev) => ({ ...prev, ...data }))}
            />
          )}

          {activeTab === 'specs' && (
            <TechSpecs
              selectedLayerId={selectedLayerId}
              onSelectLayer={(id) => setSelectedLayerId(id)}
            />
          )}

          {/* Quick Tab Switcher Cards at Bottom of Sidebar */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab(activeTab === 'specs' ? 'asset' : 'specs')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                activeTab === 'specs'
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Datasheet Specs</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'asset' : 'dashboard')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4 text-blue-400" />
              <span>SCADA Telemetry</span>
            </button>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        layers={layers}
        materials={materials}
      />
    </div>
  );
}
