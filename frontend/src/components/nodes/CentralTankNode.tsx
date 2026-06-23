import { Handle, Position } from 'reactflow';
import { Database, Power, Activity } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export default function CentralTankNode({ data, id }: any) {
  const { nodeName, waterLevel, ph, tds, status } = data;
  
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
    <div className="glass-panel w-72 border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] overflow-hidden transition-transform hover:scale-105">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary border-2 border-surface" />
      
      <div className="p-4 border-b border-primary/20 flex justify-between items-center bg-primary/10">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleNode}
            className={`p-1.5 rounded-full transition-colors ${isRunning ? 'bg-green-500/20 text-green-400 hover:bg-green-500/40' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40'}`}
          >
            <Power size={14} />
          </button>
          <Database size={18} className="text-primary" />
          <h3 className="font-bold text-white tracking-wide">{nodeName}</h3>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor} text-white`}>
          {status || 'Unknown'}
        </div>
      </div>
      
      <div className="p-5 flex gap-4 items-center">
        {/* Large Water Level Indicator */}
        <div className="relative w-16 h-24 bg-surface-light rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
          <div 
            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 ease-in-out flex items-start justify-center pt-2"
            style={{ height: `${Math.min(100, Math.max(0, waterLevel || 0))}%` }}
          >
             <div className="w-full h-1 bg-white/30 mb-1 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-1">Total Capacity Level</p>
            <p className="text-3xl font-light text-white">{waterLevel && waterLevel != -999 ? Number(waterLevel).toFixed(1) : '--'}%</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-light/30 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Database size={12} className="text-blue-400" />
                <span className="text-[10px] text-text-muted uppercase tracking-wider">pH Level</span>
              </div>
              <p className="text-sm font-medium">{ph && ph != -999 ? Number(ph).toFixed(2) : '--'}</p>
            </div>
            
            <div className="bg-surface-light/30 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={12} className="text-purple-400" />
                <span className="text-[10px] text-text-muted uppercase tracking-wider">TDS (ppm)</span>
              </div>
              <p className="text-sm font-medium">{tds && tds != -999 ? Number(tds).toFixed(0) : '--'}</p>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="a" style={{ top: 30 }} className="w-3 h-3 bg-primary border-2 border-surface" />
      <Handle type="source" position={Position.Right} id="b" style={{ top: 60 }} className="w-3 h-3 bg-primary border-2 border-surface" />
      <Handle type="source" position={Position.Right} id="c" style={{ top: 90 }} className="w-3 h-3 bg-primary border-2 border-surface" />
      <Handle type="source" position={Position.Right} id="d" style={{ top: 120 }} className="w-3 h-3 bg-primary border-2 border-surface" />
    </div>
  );
}
