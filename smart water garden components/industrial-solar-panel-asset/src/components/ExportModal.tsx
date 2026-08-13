import React, { useState } from 'react';
import { LayerId, LayerConfig, MaterialCustomization } from '../types';
import { Copy, Check, Download, Code, FileText, X, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Record<LayerId, LayerConfig>;
  materials: MaterialCustomization;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  materials,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [tab, setTab] = useState<'svg' | 'react' | 'json'>('svg');

  if (!isOpen) return null;

  // Generate Raw Standalone SVG code with Digital Twin separated layers and pivot group
  const generateRawSvg = () => {
    return `<svg viewBox="0 0 1000 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pv-cell-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1b2a" />
      <stop offset="50%" stop-color="#12253a" />
      <stop offset="100%" stop-color="#1b263b" />
    </linearGradient>
    <linearGradient id="frame-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    <linearGradient id="pole-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4b5563" />
      <stop offset="30%" stop-color="#e5e7eb" />
      <stop offset="70%" stop-color="#9ca3af" />
      <stop offset="100%" stop-color="#4b5563" />
    </linearGradient>
  </defs>

  <!-- ============================================================== -->
  <!-- 1. FIXED / STATIONARY STRUCTURE (Pole, Base, Hinge) -->
  <!-- ============================================================== -->

  <!-- Group: Support Pole (Fixed) -->
  <g id="support-pole">
    <rect x="475" y="470" width="50" height="610" rx="2" fill="url(#pole-gradient)" />
    <line x1="475" y1="470" x2="475" y2="1080" stroke="#334155" stroke-width="1.5" />
    <line x1="525" y1="470" x2="525" y2="1080" stroke="#1e293b" stroke-width="2" />
    <ellipse cx="500" cy="470" rx="25" ry="8" fill="#e5e7eb" stroke="#475569" stroke-width="1.5" />
  </g>

  <!-- Group: Base Plate (Fixed) -->
  <g id="base-plate">
    <polygon points="390,1095 410,1075 590,1075 610,1095 610,1105 590,1115 410,1115 390,1105" fill="url(#pole-gradient)" stroke="#334155" stroke-width="2" />
    <polygon points="440,1075 475,1075 475,1020" fill="#9ca3af" stroke="#334155" stroke-width="1.2" />
    <polygon points="560,1075 525,1075 525,1020" fill="#4b5563" stroke="#334155" stroke-width="1.2" />
  </g>

  <!-- Group: Anchor Bolts (Fixed) -->
  <g id="anchor-bolts">
    <rect x="417" y="1067" width="6" height="22" fill="#e2e8f0" stroke="#475569" stroke-width="1" />
    <polygon points="413,1081 416,1077 424,1077 427,1081 424,1085 416,1085" fill="#cbd5e1" stroke="#1e293b" stroke-width="1" />
  </g>

  <!-- Group: Grounding Wire (Fixed) -->
  <g id="grounding-wire">
    <path d="M 465,490 Q 460,540 462,700 Q 464,900 462,1015 Q 460,1070 435,1082" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="12,12" />
    <path d="M 465,490 Q 460,540 462,700 Q 464,900 462,1015 Q 460,1070 435,1082" fill="none" stroke="#22c55e" stroke-width="4" stroke-dasharray="0,12,12,0" />
  </g>

  <!-- Group: Pivot Hinge (Stationary Hinge Axis Assembly) -->
  <g id="pivot-hinge">
    <rect x="465" y="460" width="70" height="85" rx="4" fill="url(#pole-gradient)" stroke="#334155" stroke-width="2" />
    <circle cx="500" cy="500" r="15" fill="#334155" stroke="#0f172a" stroke-width="1.5" />
    <circle cx="500" cy="500" r="7" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
  </g>

  <!-- ============================================================== -->
  <!-- 2. ROTATING TRACKER ASSEMBLY (Tilt angle transform around 500,500) -->
  <!-- ============================================================== -->
  <g id="rotating-tracker-assembly" transform="rotate(0, 500, 500)">
    <!-- Group: Tilt Bracket -->
    <g id="tilt-bracket">
      <path d="M 515,480 L 595,420 A 75 75 0 0 1 615,525 L 535,525 Z" fill="#94a3b8" stroke="#334155" stroke-width="1.5" />
    </g>

    <!-- Group: Support Arms -->
    <g id="support-arms">
      <polygon points="330,270 670,270 675,285 325,285" fill="#64748b" stroke="#1e293b" stroke-width="1.5" />
      <polygon points="500,500 350,280 360,275 508,495" fill="#94a3b8" stroke="#334155" stroke-width="1.2" />
      <polygon points="500,500 650,280 640,275 492,495" fill="#64748b" stroke="#334155" stroke-width="1.2" />
    </g>

    <!-- Group: Junction Box -->
    <g id="junction-box">
      <rect x="460" y="290" width="80" height="55" rx="6" fill="#1e293b" stroke="#475569" stroke-width="2" />
    </g>

    <!-- Group: Cables -->
    <g id="cables">
      <path d="M 486,364 Q 480,410 460,430 Q 440,460 480,500" fill="none" stroke="#1a1c20" stroke-width="6" stroke-linecap="round" />
    </g>

    <!-- Group: Aluminum Frame -->
    <g id="aluminum-frame">
      <polygon points="250,200 750,200 810,480 190,480" fill="url(#frame-gradient)" stroke="#94a3b8" stroke-width="2" />
    </g>

    <!-- Group: Solar Panel -->
    <g id="solar-panel">
      <polygon points="260,202 740,202 798,473 202,473" fill="#080e18" stroke="#1e293b" stroke-width="1" />
      <g id="solar-cells">
        <!-- 6x10 Photovoltaic Monocrystalline Cells Grid -->
      </g>
    </g>
  </g>
</svg>`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSvg = () => {
    const svgContent = generateRawSvg();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'digital-twin-single-axis-solar-panel.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Export Digital Twin SVG Asset</h3>
              <p className="text-xs text-slate-400">
                Single-axis tracker vector code with separated layers & pivot axis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 pt-2 gap-2">
          <button
            onClick={() => setTab('svg')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-all ${
              tab === 'svg'
                ? 'bg-slate-900 border-slate-800 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Standalone SVG
          </button>
          <button
            onClick={() => setTab('react')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-all ${
              tab === 'react'
                ? 'bg-slate-900 border-slate-800 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            React Component Snippet
          </button>
          <button
            onClick={() => setTab('json')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-all ${
              tab === 'json'
                ? 'bg-slate-900 border-slate-800 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Layer Config JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs">
          {tab === 'svg' && (
            <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {generateRawSvg()}
            </pre>
          )}

          {tab === 'react' && (
            <pre className="text-purple-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {`// Digital Twin Solar Tracker React Integration
import React from 'react';
import { IndustrialSolarPanelSVG } from './components/IndustrialSolarPanelSVG';

export function SolarPanelAsset() {
  return (
    <div className="w-full max-w-xl">
      <IndustrialSolarPanelSVG
        showDimensions={true}
        layers={{/* Layer config */}}
      />
    </div>
  );
}`}
            </pre>
          )}

          {tab === 'json' && (
            <pre className="text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify({ layers, materials }, null, 2)}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Ready for SCADA / HMI Digital Twin Integration</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(tab === 'svg' ? generateRawSvg() : JSON.stringify(layers), tab)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              {copiedType === tab ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === tab ? 'Copied!' : 'Copy Snippet'}</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download .SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
