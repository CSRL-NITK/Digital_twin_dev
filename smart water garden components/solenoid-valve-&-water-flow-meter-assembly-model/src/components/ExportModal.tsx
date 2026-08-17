import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, FileText } from 'lucide-react';
import { ASSEMBLY_SPECS } from '../data/assemblyData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSvg = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Solenoid_Valve_Flow_Meter_Assembly_2D_Model.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySpecSheet = () => {
    const text = Object.values(ASSEMBLY_SPECS)
      .map(
        (s) =>
          `[${s.name}]\nCategory: ${s.category}\nMaterial: ${s.material}\nDimensions: ${s.dimensions}\nPressure: ${s.pressureRating}\n----------------------------`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Export Engineering Assets</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <h3 className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Download className="h-4 w-4 text-emerald-500" /> Vector SVG Model Download
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Download the 2D digital twin engineering vector model as a clean, resolution-independent SVG file.
            </p>
            <button
              onClick={handleDownloadSvg}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" /> DOWNLOAD VECTOR SVG MODEL (.SVG)
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <h3 className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-blue-500" /> Assembly Specification Sheet
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Copy complete engineering materials, dimensions, and electrical pinouts for CAD documentation.
            </p>
            <button
              onClick={handleCopySpecSheet}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500"
            >
              {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
              {copied ? 'SPECIFICATIONS COPIED TO CLIPBOARD' : 'COPY ENGINEERING SPEC SHEET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
