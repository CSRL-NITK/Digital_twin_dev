import { Handle, Position } from 'reactflow';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

const STATUS: Record<string, { color: string; bg: string; bar: string }> = {
  Healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  bar: '#22c55e' },
  Warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', bar: '#f59e0b' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  bar: '#ef4444' },
  Offline:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',bar: '#9ca3af' },
};

export default function PumpNode({ data, id }: any) {
  const { nodeName, status } = data;
  const s = STATUS[status] ?? STATUS.Offline;
  const isOnline = status !== 'Offline';

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
        width: 152,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: s.bar }} />

      <Handle type="target" position={Position.Top}
        style={{ background: '#e9eeea', border: '1px solid rgba(0,0,0,0.10)', width: 8, height: 8 }} />

      <div style={{ padding: '13px 14px 13px 17px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#17181c', letterSpacing: '-0.4px' }}>
            {nodeName}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#5a5f6b' }}>State</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: isOnline ? '#22c55e' : '#9ca3af' }}>
            {isOnline ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#5a5f6b' }}>Status</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: s.bg, color: s.color,
          }}>
            {status}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: '#e9eeea', border: '1px solid rgba(0,0,0,0.10)', width: 8, height: 8 }} />
    </div>
  );
}
