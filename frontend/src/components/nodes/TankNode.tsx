import { Handle, Position } from 'reactflow';
import { Droplets, Thermometer, Power } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export default function TankNode({ data, id }: any) {
  const { nodeName, waterLevel, ph, temperature, status } = data;
  
  const statusColors: Record<string, string> = {
    'Healthy': 'bg-healthy',
    'Warning': 'bg-warning',
    'Critical': 'bg-critical',
    'Offline': 'bg-surface-light',
  };
  
  const statusColor = statusColors[status] || 'bg-surface-light';
  const isRunning = status !== 'Offline';

  const toggleNode = async () => {
    try {
      const newStatus = isRunning ? 'Offline' : 'Healthy';
      await axios.patch(`${BACKEND_URL}/api/nodes/${id}/status`, { status: newStatus });
    } catch (e) {
      console.error("Failed to toggle node", e);
    }
  };

  return (
    <div className="glass-card w-64 overflow-hidden shadow-lg transition-transform hover:scale-105 group">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary border-2 border-surface" />
      
      <div className="p-3 border-b border-white/10 flex justify-between items-center bg-surface/50">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleNode}
            className={`p-1.5 rounded-full transition-colors ${isRunning ? 'bg-green-500/20 text-green-400 hover:bg-green-500/40' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40'}`}
          >
            <Power size={12} />
          </button>
          <h3 className="font-semibold text-white truncate pr-2">{nodeName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{status}</span>
          <div className={`w-3 h-3 rounded-full ${statusColor} ${isRunning && status !== 'Healthy' ? 'animate-pulse' : ''} shadow-[0_0_8px_var(--color-${status.toLowerCase()})]`} />
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Water Level Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Water Level</span>
            <span className="font-medium">{waterLevel && waterLevel != -999 ? Number(waterLevel).toFixed(1) : '--'}%</span>
          </div>
          <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, waterLevel && waterLevel != -999 ? Number(waterLevel) : 0))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2 p-2 rounded-md bg-surface-light/30">
            <Droplets size={14} className="text-blue-400" />
            <div>
              <p className="text-[10px] text-text-muted uppercase">pH</p>
              <p className="text-sm font-medium">{ph && ph != -999 ? Number(ph).toFixed(2) : '--'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-md bg-surface-light/30">
            <Thermometer size={14} className="text-red-400" />
            <div>
              <p className="text-[10px] text-text-muted uppercase">Temp</p>
              <p className="text-sm font-medium">{temperature && temperature != -999 ? Number(temperature).toFixed(1) : '--'}°</p>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-surface" />
    </div>
  );
}
