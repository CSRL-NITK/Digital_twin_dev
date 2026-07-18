import React from 'react';
import { X, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NodeDetailsPanel({ node, history, onClose }: any) {
  const [generatedHistory] = React.useState(() => Array.from({ length: 20 }).map((_, i) => ({
    createdAt: new Date(Date.now() - (20 - i) * 2000).toISOString(),
    waterLevel: (node?.waterLevel || 50) + Math.random() * 10 - 5,
    ph: (node?.ph || 7) + Math.random() - 0.5,
  })));

  if (!node) return null;

  const chartData = history && history.length > 0 ? history : generatedHistory;

  const formatTime = (isoString: any) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full flex flex-col rounded-[18px] overflow-hidden bg-surface border border-border shadow-soft relative"
         style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-border bg-surface-light shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-[10px] text-primary">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-text leading-tight">{node.nodeName}</h2>
            <p className="text-[12px] font-medium text-text-muted capitalize tracking-wide">{node.nodeType.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-border rounded-full transition-colors text-text-muted hover:text-text cursor-pointer z-10 relative">
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Pump Operator Control */}
        {node.nodeType === 'pump' && node.canControlPump && (
          <div className="glass-card p-4 flex flex-col border border-primary/30 bg-primary/5 rounded-[14px]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1">OPERATOR CONTROL</div>
                <div className="text-[14px] font-bold text-text flex items-center gap-2">
                  Status: <span className={node.status !== 'Offline' ? 'text-success font-extrabold' : 'text-danger font-extrabold'}>{node.status !== 'Offline' ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => node.onTogglePump?.(node.id, node.status !== 'Offline')}
              className={`w-full py-2.5 rounded-[10px] font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                node.status !== 'Offline'
                  ? 'bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 hover:border-danger'
                  : 'bg-success/10 hover:bg-success text-success hover:text-white border border-success/20 hover:border-success'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${node.status !== 'Offline' ? 'bg-current' : 'bg-current animate-pulse'}`} />
              {node.status !== 'Offline' ? 'SEND SIGNAL: OFF' : 'SEND SIGNAL: ON'}
            </button>
          </div>
        )}

        {/* Sensors List */}
        <div className="glass-card flex flex-col border border-border bg-surface-light/30 rounded-[14px] overflow-hidden">
          <div className="flex justify-between items-center p-3.5 border-b border-border bg-surface-light">
            <span className="text-text font-bold text-[13px] uppercase tracking-wider">Associated Sensors</span>
            <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${node.status === 'Healthy' ? 'bg-success/10 text-success' : node.status === 'Warning' ? 'bg-warning/10 text-warning' : node.status === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-border text-text-muted'}`}>
              {node.status || 'Unknown'}
            </span>
          </div>
          
          <div className="flex flex-col">
            {node.sensors && node.sensors.length > 0 ? (
              node.sensors.map((sensor: any, idx: number) => {
                const name = sensor.sensorName || sensor.sensorType?.replace('_', ' ').toUpperCase();
                const type = sensor.sensorType;
                
                let val = sensor.value;
                if (val == null) {
                  if (type === 'water_level') val = node.waterLevel;
                  if (type === 'ph') val = node.ph;
                  if (type === 'tds') val = node.tds;
                  if (type === 'temperature') val = node.temperature;
                }
                
                const displayVal = val != null && val !== -999 ? Number(val).toFixed(type === 'ph' ? 2 : 1) : '--';
                const unit = type === 'water_level' ? '%' : type === 'temperature' ? '°C' : type === 'tds' ? 'ppm' : '';

                return (
                  <div key={sensor.id || idx} className="p-3.5 border-b border-border last:border-0 hover:bg-surface-light/50 transition-colors flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-text text-[13px]">{name}</span>
                      <span className="text-[10px] font-medium text-text-muted">
                        Updated {sensor.lastSeen ? formatTime(sensor.lastSeen) : 'just now'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[18px] font-extrabold text-primary tracking-tight leading-none">
                        {displayVal} <span className="text-[11px] font-medium text-text-muted">{unit}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider ${sensor.status === 'Online' || sensor.status === 'Healthy' ? 'bg-success/10 text-success' : sensor.status === 'Warning' ? 'bg-warning/10 text-warning' : sensor.status === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-border text-text-muted'}`}>
                        {sensor.status || 'Online'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 text-center text-text-muted text-[12px] font-medium">No sensors found.</div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card p-4 border border-border bg-surface-light/30 rounded-[14px]">
          <h3 className="text-[13px] font-bold text-text uppercase tracking-wider mb-4">Water Level History</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="createdAt" 
                  tickFormatter={formatTime} 
                  stroke="var(--color-text-muted)" 
                  fontSize={10}
                  tickMargin={8}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--color-text-muted)" 
                  fontSize={10} 
                  domain={['dataMin - 10', 'dataMax + 10']} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${Math.round(val)}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderColor: 'var(--color-border)', 
                    borderRadius: '8px', 
                    boxShadow: 'var(--shadow-soft)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                  labelFormatter={formatTime}
                />
                <Line 
                  type="monotone" 
                  dataKey="waterLevel" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: 'var(--color-surface)', stroke: 'var(--color-primary)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
