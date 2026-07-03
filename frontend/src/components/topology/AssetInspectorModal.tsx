import React, { useState } from 'react';
import { Sliders, X, Check, RefreshCw, Link2, Gauge } from 'lucide-react';

export interface AssetInspectorModalProps {
  node: any;
  allNodes: any[];
  onClose: () => void;
  onSave: (nodeId: string, updatedProps: {
    nodeName?: string;
    flipHorizontal?: boolean;
    maxCapacity?: number;
    parentAssetId?: string;
    customWidth?: number;
    customHeight?: number;
    waveHeightCalm?: number;
    waveHeightNormal?: number;
    waveHeightActive?: number;
    tempThreshold?: number;
    tempMaxThreshold?: number;
  }) => Promise<void>;
}

export const AssetInspectorModal: React.FC<AssetInspectorModalProps> = ({
  node,
  allNodes,
  onClose,
  onSave,
}) => {
  const isSensor = ['water_level', 'ph', 'tds', 'temperature'].includes(node.type);
  const isIndustrial = ['tank', 'central_tank', 'source_tank', 'pump'].includes(node.type);
  const isPump = node.type === 'pump';

  const defaultCapacity = isPump ? 3000 : node.type === 'source_tank' ? 15000 : node.type === 'central_tank' ? 10000 : 5000;
  const defaultDims = isPump ? { width: 200, height: 125 }
    : node.type?.includes('central') || node.type?.includes('source') || node.type === 'source' ? { width: 220, height: 259 }
    : isSensor ? { width: 170, height: 85 }
    : { width: 200, height: 255 };

  const [nodeName, setNodeName] = useState<string>(node.data?.nodeName || '');
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(!!node.data?.flipHorizontal);
  const [maxCapacity, setMaxCapacity] = useState<number>(node.data?.maxCapacity || defaultCapacity);
  const [parentAssetId, setParentAssetId] = useState<string>(node.data?.parentAssetId || '');
  const [customWidth] = useState<number>(
    node.data?.customWidth || Number(node.style?.width) || defaultDims.width
  );
  const [customHeight] = useState<number>(
    node.data?.customHeight || Number(node.style?.height) || defaultDims.height
  );
  const [waveHeightCalm, setWaveHeightCalm] = useState<number>(node.data?.waveHeightCalm ?? 4.5);
  const [waveHeightNormal, setWaveHeightNormal] = useState<number>(node.data?.waveHeightNormal ?? 11);
  const [waveHeightActive, setWaveHeightActive] = useState<number>(node.data?.waveHeightActive ?? 17);
  const [tempThreshold, setTempThreshold] = useState<number>(node.data?.tempThreshold ?? 55.0);
  const [tempMaxThreshold, setTempMaxThreshold] = useState<number>(node.data?.tempMaxThreshold ?? 75.0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const currentLiveSpeed = node.data?.status === 'Critical' ? 2450 : 2900;
  const currentFillPct = node.data?.waterLevel ?? 65;
  const currentLiveVolume = Math.round((currentFillPct / 100) * maxCapacity);

  const parentOptions = allNodes.filter(n => ['tank', 'central_tank', 'source_tank', 'source', 'pump'].includes(n.type));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(node.id, {
        nodeName: nodeName.trim() || 'Unnamed Asset',
        flipHorizontal,
        maxCapacity: Number(maxCapacity) || defaultCapacity,
        parentAssetId: parentAssetId || undefined,
        customWidth: Number(customWidth) || defaultDims.width,
        customHeight: Number(customHeight) || defaultDims.height,
        waveHeightCalm: Number(waveHeightCalm) || 4.5,
        waveHeightNormal: Number(waveHeightNormal) || 11,
        waveHeightActive: Number(waveHeightActive) || 17,
        tempThreshold: Number(tempThreshold) || 55.0,
        tempMaxThreshold: Number(tempMaxThreshold) || 75.0,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(6px)',
      fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{
        width: 420,
        maxWidth: '90vw',
        boxSizing: 'border-box',
        background: '#17181c',
        border: '1.5px solid rgba(0, 255, 255, 0.45)',
        borderRadius: 20,
        padding: '24px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: '#ffffff',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(0, 255, 255, 0.15)', color: '#00ffff',
              border: '1px solid rgba(0, 255, 255, 0.3)'
            }}>
              {isSensor ? <Gauge size={18} /> : <Sliders size={18} />}
            </span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#00ffff', letterSpacing: '0.08em' }}>
                {isSensor ? 'TELEMETRY SENSOR' : 'INDUSTRIAL ASSET'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Customize Properties
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* 1. Rename Asset / Sensor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em' }}>
              {isSensor ? 'SENSOR TAG NAME' : 'ASSET DISPLAY NAME'}
            </label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="Enter custom name..."
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#0e0f12',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#00ffff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* 2. Industrial Asset Options */}
          {isIndustrial && (
            <>
              {/* Flip Horizontally (Mirror) */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                    Flip Horizontally (Mirror)
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Reverse orientation of inlet & outlet pipes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlipHorizontal(!flipHorizontal)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                    background: flipHorizontal ? '#00ffff' : 'rgba(255,255,255,0.15)',
                    border: 'none', position: 'relative', transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: flipHorizontal ? '#17181c' : '#ffffff',
                    position: 'absolute', top: 3,
                    left: flipHorizontal ? 23 : 3,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </button>
              </div>

              {/* Adjust Capacity / Operating Speed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em' }}>
                  {isPump ? 'MAXIMUM OPERATING SPEED (RPM)' : 'MAXIMUM TANK CAPACITY (LITERS)'}
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 11, fontWeight: 700, color: '#00ffff',
                  background: 'rgba(0,255,255,0.08)', padding: '7px 12px', borderRadius: 8,
                  border: '1px solid rgba(0,255,255,0.25)'
                }}>
                  <span>Actual Live Operating Value:</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {isPump ? `${currentLiveSpeed} RPM` : `${currentLiveVolume.toLocaleString()} L (${currentFillPct}% Full)`}
                  </span>
                </div>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0e0f12',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00ffff'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>

              {/* Fluid Dynamics & Thermal Settings */}
              {!isPump && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#00ffff', letterSpacing: '0.04em' }}>
                    FLUID DYNAMICS & THERMAL SETTINGS
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Calm Wave (px)</span>
                      <input
                        type="number" step="0.5"
                        value={waveHeightCalm} onChange={(e) => setWaveHeightCalm(Number(e.target.value))}
                        style={{ width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', color: '#ffffff', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = '#00ffff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Normal Wave (px)</span>
                      <input
                        type="number" step="0.5"
                        value={waveHeightNormal} onChange={(e) => setWaveHeightNormal(Number(e.target.value))}
                        style={{ width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', color: '#ffffff', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = '#00ffff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Active Wave (px)</span>
                      <input
                        type="number" step="0.5"
                        value={waveHeightActive} onChange={(e) => setWaveHeightActive(Number(e.target.value))}
                        style={{ width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', color: '#ffffff', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = '#00ffff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Warm Temp Threshold (°C)</span>
                      <input
                        type="number" step="0.5"
                        value={tempThreshold} onChange={(e) => setTempThreshold(Number(e.target.value))}
                        style={{ width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', color: '#ffffff', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = '#00ffff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Max Boiling Temp (°C)</span>
                      <input
                        type="number" step="0.5"
                        value={tempMaxThreshold} onChange={(e) => setTempMaxThreshold(Number(e.target.value))}
                        style={{ width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', color: '#ffffff', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = '#00ffff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 3. Sensor Options */}
          {isSensor && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Link2 size={13} color="#00ffff" /> BIND TO PARENT INDUSTRIAL ASSET
              </label>
              <select
                value={parentAssetId}
                onChange={(e) => setParentAssetId(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#0e0f12',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: '#17181c' }}>-- None (Standalone Sensor) --</option>
                {parentOptions.map((opt, idx) => {
                  const typeName = opt.type === 'pump' ? 'Centrifugal Pump'
                    : opt.type === 'central_tank' ? 'Central Reservoir Tank'
                    : opt.type === 'source_tank' || opt.type === 'source' ? 'Source Intake Tank'
                    : 'Water Tank';
                  const displayName = opt.data?.nodeName || `${typeName} #${idx + 1}`;
                  return (
                    <option key={opt.id} value={opt.id} style={{ background: '#17181c' }}>
                      {displayName} — [{typeName}]
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: 'transparent', color: 'rgba(255,255,255,0.6)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: '#00ffff', color: '#17181c',
                border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(0,255,255,0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
