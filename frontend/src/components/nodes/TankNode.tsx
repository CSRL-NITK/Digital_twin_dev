import { Handle, Position } from 'reactflow';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

const STATUS: Record<string, { color: string; bg: string; bar: string }> = {
  Healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  bar: '#22c55e' },
  Warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', bar: '#f59e0b' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  bar: '#ef4444' },
  Offline:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',bar: '#9ca3af' },
};

export default function TankNode({ data, id }: any) {
  const { nodeName, waterLevel, ph, tds, temperature, status } = data;
  const s = STATUS[status] ?? STATUS.Offline;
  const isOnline = status !== 'Offline';
  const fmt = (v: any, d = 1) => v != null && v !== -999 ? Number(v).toFixed(d) : '--';

  const toggle = async () => {
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${id}/status`, {
        status: isOnline ? 'Offline' : 'Healthy',
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div
      onClick={toggle}
      style={{
        width: 178,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Status left bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: s.bar }} />

      <Handle type="target" position={Position.Top}
        style={{ background: '#e9eeea', border: '1px solid rgba(0,0,0,0.10)', width: 8, height: 8 }} />

      <div style={{ padding: '13px 14px 13px 17px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#17181c', letterSpacing: '-0.4px' }}>
            {nodeName}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: s.bg, color: s.color, letterSpacing: '0.04em',
          }}>
            {status}
          </span>
        </div>

        {/* Metrics */}
        {[
          { label: 'Level', value: `${fmt(waterLevel)}%` },
          { label: 'pH',    value: fmt(ph, 2) },
          { label: 'TDS',   value: `${fmt(tds, 0)} ppm` },
          { label: 'Temp',  value: `${fmt(temperature)}°C` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: '#5a5f6b' }}>{label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#17181c', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#e9eeea', border: '1px solid rgba(0,0,0,0.10)', width: 8, height: 8 }} />
    </div>
  );
}
