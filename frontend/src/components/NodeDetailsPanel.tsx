import { X, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NodeDetailsPanel({ node, history, onClose }: any) {
  if (!node) return null;

  // Mocking past data if history is short/empty just for visual completeness in Phase 1
  const chartData = history && history.length > 0 
    ? history 
    : Array.from({ length: 20 }).map((_, i) => ({
        createdAt: new Date(Date.now() - (20 - i) * 2000).toISOString(),
        waterLevel: node.waterLevel || 50 + Math.random() * 10 - 5,
        ph: node.ph || 7 + Math.random() - 0.5,
      }));

  const formatTime = (isoString: any) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute right-0 top-0 h-full w-96 glass-panel border-l border-white/10 p-6 flex flex-col z-40 transform transition-transform animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{node.nodeName}</h2>
            <p className="text-sm text-text-muted capitalize">{node.nodeType.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-full transition-colors text-text-muted hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Current Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Status</p>
            <p className={`font-semibold ${node.status === 'Healthy' ? 'text-healthy' : node.status === 'Warning' ? 'text-warning' : 'text-critical'}`}>
              {node.status || 'Unknown'}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Water Level</p>
            <p className="font-semibold text-white">{node.waterLevel != null && node.waterLevel != -999 ? Number(node.waterLevel).toFixed(1) : '--'}%</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">pH Level</p>
            <p className="font-semibold text-white">{node.ph != null && node.ph != -999 ? Number(node.ph).toFixed(2) : '--'}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Temperature</p>
            <p className="font-semibold text-white">{node.temperature != null && node.temperature != -999 ? Number(node.temperature).toFixed(1) : '--'}°C</p>
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card p-4 mt-6">
          <h3 className="text-sm font-medium text-white mb-4">Water Level History</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="createdAt" 
                  tickFormatter={formatTime} 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickMargin={10}
                />
                <YAxis stroke="#94a3b8" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  labelFormatter={formatTime}
                />
                <Line 
                  type="monotone" 
                  dataKey="waterLevel" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-card p-4 mt-4">
          <h3 className="text-sm font-medium text-white mb-4">pH History</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="createdAt" 
                  tickFormatter={formatTime} 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickMargin={10}
                />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 14]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  labelFormatter={formatTime}
                />
                <Line 
                  type="monotone" 
                  dataKey="ph" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
