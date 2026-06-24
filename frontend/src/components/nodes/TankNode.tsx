import { Handle, Position } from 'reactflow';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export default function TankNode({ data, id }: any) {
  const { nodeName, waterLevel, ph, tds, temperature, status } = data;
  
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
      className="bg-surface border border-border rounded-[20px] w-48 shadow-soft overflow-hidden group cursor-pointer relative"
      onClick={toggleNode}
    >
      {/* Status left border indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor}`} />
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-border border-0" />
      
      <div className="p-4 pl-5">
        <h3 className="text-[18px] font-bold text-text mb-3">{nodeName}</h3>
        
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Level</span>
            <span className="font-semibold text-text">{waterLevel && waterLevel != -999 ? Number(waterLevel).toFixed(1) : '--'}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-muted">pH</span>
            <span className="font-semibold text-text">{ph && ph != -999 ? Number(ph).toFixed(2) : '--'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-muted">TDS</span>
            <span className="font-semibold text-text">{tds && tds != -999 ? Number(tds).toFixed(0) : '--'} ppm</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-muted">Temp</span>
            <span className="font-semibold text-text">{temperature && temperature != -999 ? Number(temperature).toFixed(1) : '--'}°C</span>
          </div>
          
          <div className="flex justify-between mt-1 pt-2 border-t border-border">
            <span className="text-text-muted">Status</span>
            <span className={`font-semibold ${status === 'Healthy' ? 'text-success' : status === 'Warning' ? 'text-warning' : status === 'Critical' ? 'text-danger' : 'text-text-muted'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-border border-0" />
    </div>
  );
}
