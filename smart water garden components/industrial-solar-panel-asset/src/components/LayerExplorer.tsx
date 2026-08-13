import React from 'react';
import { LayerId, LayerConfig, MaterialCustomization } from '../types';
import { Eye, EyeOff, Layers, Sparkles, Sliders, Palette, Info } from 'lucide-react';

interface LayerExplorerProps {
  layers: Record<LayerId, LayerConfig>;
  materials: MaterialCustomization;
  activeHoverLayer: LayerId | null;
  selectedLayerId: LayerId | null;
  onToggleVisibility: (id: LayerId) => void;
  onOpacityChange: (id: LayerId, opacity: number) => void;
  onLayerHover: (id: LayerId | null) => void;
  onLayerSelect: (id: LayerId) => void;
  onUpdateMaterials: (materials: Partial<MaterialCustomization>) => void;
  onResetLayers: () => void;
}

export const LayerExplorer: React.FC<LayerExplorerProps> = ({
  layers,
  materials,
  activeHoverLayer,
  selectedLayerId,
  onToggleVisibility,
  onOpacityChange,
  onLayerHover,
  onLayerSelect,
  onUpdateMaterials,
  onResetLayers,
}) => {
  const layerList: LayerConfig[] = Object.values(layers);

  const getCategoryColor = (category: LayerConfig['category']) => {
    switch (category) {
      case 'photovoltaic':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'electrical':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'mounting':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'structure':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">SVG Layer Hierarchy</h3>
            <p className="text-xs text-slate-400">Inspect & toggle component layers</p>
          </div>
        </div>
        <button
          onClick={onResetLayers}
          className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-all"
        >
          Reset All
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layerList.map((layer) => {
          const isSelected = selectedLayerId === layer.id;
          const isHovered = activeHoverLayer === layer.id;

          return (
            <div
              key={layer.id}
              onMouseEnter={() => onLayerHover(layer.id)}
              onMouseLeave={() => onLayerHover(null)}
              onClick={() => onLayerSelect(layer.id)}
              className={`group p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500/30'
                  : isHovered
                  ? 'bg-slate-800/80 border-slate-700'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    className={`p-1.5 rounded-md border transition-all ${
                      layer.visible
                        ? 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-950 text-slate-600 border-slate-850 hover:text-slate-400'
                    }`}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium truncate ${
                          layer.visible ? 'text-slate-200' : 'text-slate-500 line-through'
                        }`}
                      >
                        {layer.name}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold border rounded ${getCategoryColor(layer.category)}`}>
                        {layer.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{layer.description}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                  #{layer.id}
                </span>
              </div>

              {/* Opacity Slider for Selected/Hovered Layer */}
              {(isSelected || isHovered) && (
                <div
                  className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sliders className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-mono w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[11px] text-slate-300 font-mono w-8 text-right">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Material Finishes Customizer */}
      <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Palette className="w-4 h-4 text-emerald-400" />
          <span>Industrial Material Finishes</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Cell Type */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">PV Cells</label>
            <select
              value={materials.cellType}
              onChange={(e) => onUpdateMaterials({ cellType: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="mono-blue">Mono Dark Blue PERC</option>
              <option value="obsidian-black">Full Black Monocrystalline</option>
              <option value="poly-cyan">Poly Cyan Shimmer</option>
            </select>
          </div>

          {/* Frame Finish */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Frame Finish</label>
            <select
              value={materials.frameFinish}
              onChange={(e) => onUpdateMaterials({ frameFinish: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="brushed-silver">Brushed Aluminum</option>
              <option value="anodized-black">Anodized Black</option>
              <option value="raw-zinc">Raw Zinc Coat</option>
            </select>
          </div>

          {/* Pole Finish */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Support Pole</label>
            <select
              value={materials.poleFinish}
              onChange={(e) => onUpdateMaterials({ poleFinish: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="galvanized-silver">Galvanized Steel ISO1461</option>
              <option value="matte-black">Powder Coated Black</option>
              <option value="industrial-yellow">Safety Yellow SCADA</option>
            </select>
          </div>

          {/* Ground Wire */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Grounding Cable</label>
            <select
              value={materials.wireColor}
              onChange={(e) => onUpdateMaterials({ wireColor: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="standard-green-yellow">Green/Yellow Earth</option>
              <option value="industrial-orange">High Voltage Orange</option>
              <option value="all-black">All Black Conduit</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
