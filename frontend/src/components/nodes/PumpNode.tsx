import { Handle, Position } from 'reactflow';
import { Settings, Power } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export default function PumpNode({ data, id }: any) {
  const { nodeName, status } = data;
  
  const isRunning = status === 'Healthy' || status === 'Warning';
  
  const togglePump = async () => {
    try {
      const newStatus = isRunning ? 'Offline' : 'Healthy';
      await axios.patch(`${BACKEND_URL}/api/nodes/${id}/status`, { status: newStatus });
    } catch (e) {
      console.error("Failed to toggle pump", e);
    }
  };

  return (
    <div className="glass-card w-40 flex flex-col items-center justify-center p-4 transition-transform hover:scale-105 border-primary/40 relative">
      <div className={`p-3 rounded-full bg-surface-light mb-3 ${isRunning ? 'animate-[spin_3s_linear_infinite]' : ''}`}>
        <Settings size={24} className={isRunning ? 'text-primary' : 'text-text-muted'} />
      </div>
      <h3 className="font-semibold text-white text-center mb-1">{nodeName}</h3>
      <div className="flex items-center gap-1.5 mt-1 mb-3">
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-healthy animate-pulse' : 'bg-critical'}`} />
        <span className="text-[10px] uppercase tracking-wider text-text-muted">{isRunning ? 'Running' : 'Stopped'}</span>
      </div>

      <button 
        onClick={togglePump}
        className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-xs font-semibold transition-colors ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
      >
        <Power size={12} />
        {isRunning ? 'TURN OFF' : 'TURN ON'}
      </button>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-surface" />
    </div>
  );
}
