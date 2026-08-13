import React from 'react';
import { Sun, Sprout, Cpu, Gauge, Droplet, Plus } from 'lucide-react';

export interface SmartGardenPaletteItem {
  nodeType: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SMART_GARDEN_PALETTE_ITEMS: SmartGardenPaletteItem[] = [
  {
    nodeType: 'solar_panel',
    label: 'Industrial Solar Panel',
    description: 'Monocrystalline PV module with tracking',
    icon: <Sun size={18} />,
    color: '#f59e0b',
  },
  {
    nodeType: 'control_box',
    label: 'Electronic Control Box',
    description: 'IP65 Enclosure with Arduino & Relays',
    icon: <Cpu size={18} />,
    color: '#38bdf8',
  },
  {
    nodeType: 'solenoid_valve',
    label: 'Solenoid Valve & Meter',
    description: '12VDC Solenoid with Turbine Flow Meter',
    icon: <Droplet size={18} />,
    color: '#10b981',
  },
];

export interface SmartGardenPaletteProps {
  showSmartGardenPalette?: boolean;
  showNodePalette?: boolean;
  showSensorPalette?: boolean;
  isMenuOpen?: boolean;
}

export const SmartGardenPalette: React.FC<SmartGardenPaletteProps> = ({
  showSmartGardenPalette = false,
  showNodePalette = false,
  showSensorPalette = false,
  isMenuOpen = false,
}) => {
  if (!showSmartGardenPalette) return null;

  const handleDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow/nodeType', nodeType);
    event.dataTransfer.setData('application/reactflow/nodeName', label);
    event.dataTransfer.setData('text/plain', JSON.stringify({ nodeType, nodeName: label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const currentTop = isMenuOpen ? 260 : 70;
  let leftPos = 20;
  if (showNodePalette && showSensorPalette) {
    leftPos = 516;
  } else if (showNodePalette || showSensorPalette) {
    leftPos = 268;
  }

  return (
    <>
      <style>{`
        @keyframes fadeInSlideRight {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .smart-garden-palette-item {
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .smart-garden-palette-item:hover {
          transform: translateY(-2px) scale(1.02);
          background: rgba(245, 158, 11, 0.12) !important;
          border-color: rgba(245, 158, 11, 0.5) !important;
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: currentTop,
          left: leftPos,
          zIndex: 40,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          width: 235,
          background: 'rgba(23, 24, 28, 0.88)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
              <Sprout size={14} strokeWidth={2.5} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em' }}>
              SMART GARDEN PALETTE
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
            SOLAR & IOT
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SMART_GARDEN_PALETTE_ITEMS.map((item) => (
            <div
              key={item.nodeType}
              className="smart-garden-palette-item"
              draggable
              onDragStart={(e) => handleDragStart(e, item.nodeType, item.label)}
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
    </>
  );
};
