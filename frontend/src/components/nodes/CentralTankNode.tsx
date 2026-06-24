import { Handle, Position } from 'reactflow';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export default function CentralTankNode({ data, id }: any) {
  const { nodeName, waterLevel, status } = data;
  
  const statusColors: Record<string, string> = {
    'Healthy': 'bg-success',
    'Warning': 'bg-warning',
    'Critical': 'bg-danger',
    'Offline': 'bg-border',
  };
  
  const statusColor = statusColors[status] || 'bg-border';
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
    <div 
      className="bg-surface border-2 border-primary/50 rounded-[20px] w-56 shadow-soft overflow-hidden group cursor-pointer relative"
      onClick={toggleNode}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${statusColor}`} />
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-2 border-surface" />
      
      <div className="p-4 pl-6">
        <h3 className="text-[20px] font-bold text-primary mb-3">{nodeName}</h3>
        
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Level</span>
            <span className="font-semibold text-text">{waterLevel && waterLevel != -999 ? Number(waterLevel).toFixed(1) : '--'}%</span>
          </div>
          
          <div className="flex justify-between mt-1 pt-2 border-t border-border">
            <span className="text-text-muted">Status</span>
            <span className={`font-semibold ${status === 'Healthy' ? 'text-success' : status === 'Warning' ? 'text-warning' : status === 'Critical' ? 'text-danger' : 'text-text-muted'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-surface" />
    </div>
  );
}
