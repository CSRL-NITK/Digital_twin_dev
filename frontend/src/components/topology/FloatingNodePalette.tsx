import React from 'react';
import { Database, Droplet, Activity, Plus, Layers, Gauge, Zap, Thermometer, Radio } from 'lucide-react';

export interface PaletteItem {
  nodeType: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const NODE_PALETTE_ITEMS: PaletteItem[] = [
  {
    nodeType: 'tank',
    label: 'Water Tank',
    description: 'Standard cylindrical storage unit',
    icon: <Database size={18} />,
    color: '#38bdf8',
  },
  {
    nodeType: 'central_tank',
    label: 'Central Tank',
    description: 'Main distribution reservoir',
    icon: <Layers size={18} />,
    color: '#818cf8',
  },
  {
    nodeType: 'source_tank',
    label: 'Source Tank',
    description: 'Raw intake water supply',
    icon: <Droplet size={18} />,
    color: '#34d399',
  },
  {
    nodeType: 'pump',
    label: 'Centrifugal Pump',
    description: 'Motorized high-pressure pump',
    icon: <Activity size={18} />,
    color: '#f59e0b',
  },
  {
    nodeType: 'switch',
    label: 'Rocker Switch Control',
    description: 'Industrial 3D power rocker switch',
    icon: <Radio size={18} />,
    color: '#c8f135',
  },
];

const SENSOR_PALETTE_ITEMS: PaletteItem[] = [
  {
    nodeType: 'water_level',
    label: 'Water Level Sensor',
    description: 'Ultrasonic fluid level probe',
    icon: <Gauge size={18} />,
    color: '#38bdf8',
  },
  {
    nodeType: 'ph',
    label: 'pH Quality Sensor',
    description: 'Electrochemical acidity monitor',
    icon: <Activity size={18} />,
    color: '#10b981',
  },
  {
    nodeType: 'tds',
    label: 'TDS Sensor',
    description: 'Total dissolved solids monitor',
    icon: <Zap size={18} />,
    color: '#f59e0b',
  },
  {
    nodeType: 'temperature',
    label: 'Temperature Sensor',
    description: 'Thermal PT100 probe',
    icon: <Thermometer size={18} />,
    color: '#ef4444',
  },
];

export interface FloatingNodePaletteProps {
  showNodePalette?: boolean;
  showSensorPalette?: boolean;
  isMenuOpen?: boolean;
}

export const FloatingNodePalette: React.FC<FloatingNodePaletteProps> = ({
  showNodePalette = true,
  showSensorPalette = false,
  isMenuOpen = false,
}) => {
  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow/nodeType', item.nodeType);
    event.dataTransfer.setData('application/reactflow/nodeName', item.label);
    event.dataTransfer.setData('text/plain', JSON.stringify({ nodeType: item.nodeType, nodeName: item.label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!showNodePalette && !showSensorPalette) return null;

  const currentTop = isMenuOpen ? 224 : 70;

  return (
    <>
      <style>{`
        @keyframes fadeInSlideRight {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .palette-item {
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .palette-item:hover {
          transform: translateY(-2px) scale(1.02);
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(200, 241, 53, 0.5) !important;
        }
      `}</style>

      {/* Node Palette Drawer */}
      {showNodePalette && (
        <div
          style={{
            position: 'absolute',
            top: currentTop,
            left: 20,
            zIndex: 40,
            transition: 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            width: 235,
            background: 'rgba(23, 24, 28, 0.88)',
            border: '1px solid rgba(200, 241, 53, 0.35)',
            borderRadius: 16,
            padding: '16px 14px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
            animation: 'fadeInSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: 'rgba(200,241,53,0.18)', color: '#c8f135' }}>
                <Plus size={14} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#c8f135', letterSpacing: '0.08em' }}>
                NODE PALETTE
              </span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
              ASSETS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NODE_PALETTE_ITEMS.map((item) => (
              <div
                key={item.nodeType}
                className="palette-item"
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  cursor: 'grab',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensor Palette Drawer */}
      {showSensorPalette && (
        <div
          style={{
            position: 'absolute',
            top: currentTop,
            left: showNodePalette ? 268 : 20,
            zIndex: 40,
            transition: 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            width: 235,
            background: 'rgba(23, 24, 28, 0.88)',
            border: '1px solid rgba(200, 241, 53, 0.35)',
            borderRadius: 16,
            padding: '16px 14px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
            animation: 'fadeInSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: 'rgba(200,241,53,0.18)', color: '#c8f135' }}>
                <Radio size={14} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#c8f135', letterSpacing: '0.08em' }}>
                SENSOR PALETTE
              </span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
              TELEMETRY
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SENSOR_PALETTE_ITEMS.map((item) => (
              <div
                key={item.nodeType}
                className="palette-item"
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  cursor: 'grab',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
