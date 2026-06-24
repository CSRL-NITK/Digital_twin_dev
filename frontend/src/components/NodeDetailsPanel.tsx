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
    <div className="absolute right-0 top-0 h-full w-[400px] bg-surface border-l border-border shadow-soft p-6 flex flex-col z-40 transform transition-transform animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-[24px] font-bold text-text">{node.nodeName}</h2>
            <p className="text-[14px] text-text-muted capitalize">{node.nodeType.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-border rounded-full transition-colors text-text-muted hover:text-text">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Sensors List (First-class entities) */}
        <div className="glass-card p-0 overflow-hidden mb-6">
          <div className="flex justify-between items-center p-4 border-b border-border bg-surface-light">
            <span className="text-text font-bold text-[16px]">Associated Sensors</span>
            <span className={`font-semibold text-[14px] ${node.status === 'Healthy' ? 'text-success' : node.status === 'Warning' ? 'text-warning' : node.status === 'Critical' ? 'text-danger' : 'text-text-muted'}`}>
              System: {node.status || 'Unknown'}
            </span>
          </div>
          
          <div className="flex flex-col">
            {node.sensors && node.sensors.length > 0 ? (
              node.sensors.map((sensor: any, idx: number) => {
                // Handle merged data between API and Socket
                const name = sensor.sensorName || sensor.sensorType?.replace('_', ' ').toUpperCase();
                const type = sensor.sensorType;
                
                // Get value from either the sensor object (if merged from socket) or from the aggregated node value
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
                  <div key={sensor.id || idx} className="p-4 border-b border-border last:border-0 hover:bg-surface-light/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-text text-[14px]">{name}</span>
                      <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${sensor.status === 'Online' || sensor.status === 'Healthy' ? 'bg-success/10 text-success' : sensor.status === 'Warning' ? 'bg-warning/10 text-warning' : sensor.status === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-border text-text-muted'}`}>
                        {sensor.status || 'Online'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[20px] font-bold text-primary tracking-tight">
                        {displayVal} <span className="text-[12px] font-normal text-text-muted">{unit}</span>
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Updated: {sensor.lastSeen ? formatTime(sensor.lastSeen) : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-text-muted text-[14px]">No sensors found.</div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card p-4 mt-6">
          <h3 className="text-[16px] font-medium text-text mb-4">Water Level History</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="createdAt" 
                  tickFormatter={formatTime} 
                  stroke="var(--color-text-muted)" 
                  fontSize={10}
                  tickMargin={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="var(--color-text-muted)" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', boxShadow: 'var(--shadow-soft)' }}
                  labelFormatter={formatTime}
                />
                <Line 
                  type="monotone" 
                  dataKey="waterLevel" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--color-primary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
