import { Handle, Position } from 'reactflow';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

const STATUS: Record<string, { color: string; bg: string }> = {
  Healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)'  },
  Warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)'  },
  Offline:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)'},
};

export default function CentralTankNode({ data, id }: any) {
  const { nodeName, waterLevel, status } = data;
  const s = STATUS[status] ?? STATUS.Offline;
  const isOnline = status !== 'Offline';
  const lvl = waterLevel != null && waterLevel !== -999 ? Number(waterLevel) : null;

  const toggle = async () => {
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${id}/status`, {
        status: isOnline ? 'Offline' : 'Healthy',
      });
    } catch (e) { console.error(e); }
  };

  const barColor = lvl != null && lvl < 20 ? '#ef4444' : lvl != null && lvl < 40 ? '#f59e0b' : '#c8f135';

  return (
    <div
      onClick={toggle}
      style={{
        width: 204,
        background: '#ffffff',
        border: '2px solid #c8f135',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(200,241,53,0.20), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Lime left bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c8f135' }} />

      <Handle type="target" position={Position.Top}
        style={{ background: '#c8f135', border: '2px solid #ffffff', width: 10, height: 10 }} />

      <div style={{ padding: '14px 15px 14px 19px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#17181c', letterSpacing: '-0.5px' }}>
            {nodeName}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: s.bg, color: s.color,
          }}>
            {status}
          </span>
        </div>

        {/* Level + bar */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#5a5f6b' }}>Water Level</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#17181c', fontVariantNumeric: 'tabular-nums' }}>
              {lvl != null ? `${lvl.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: '#e9eeea', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${Math.min(lvl ?? 0, 100)}%`,
              background: barColor,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#c8f135', border: '2px solid #ffffff', width: 10, height: 10 }} />
    </div>
  );
}
