import { Database, AlertTriangle, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function LeftPanel() {
  const [stats] = useState({ totalTanks: 5, activePumps: 1, flowRate: 140, health: 98 });
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial stats and alerts
    axios.get('http://localhost:3001/api/alerts').then(res => setAlerts(res.data.slice(0, 3))).catch(console.error);
  }, []);

  return (
    <div className="w-[320px] h-full border-r border-border bg-surface p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
      
      {/* System Overview */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Database size={20} className="text-primary" />
          System Overview
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3">
            <span className="text-[12px] text-text-muted">Total Tanks</span>
            <div className="text-xl font-bold">{stats.totalTanks}</div>
          </div>
          <div className="glass-card p-3">
            <span className="text-[12px] text-text-muted">Active Pumps</span>
            <div className="text-xl font-bold">{stats.activePumps}</div>
          </div>
          <div className="glass-card p-3">
            <span className="text-[12px] text-text-muted">Flow Rate</span>
            <div className="text-xl font-bold text-secondary">{stats.flowRate}L/m</div>
          </div>
          <div className="glass-card p-3">
            <span className="text-[12px] text-text-muted">System Health</span>
            <div className="text-xl font-bold text-healthy">{stats.health}%</div>
          </div>
        </div>
      </section>

      {/* Current Alerts */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-warning" />
          Current Alerts
        </h2>
        <div className="flex flex-col gap-3">
          {alerts.length > 0 ? alerts.map((alert, i) => (
            <div key={i} className="glass-card p-3 border-l-4 border-l-warning">
              <span className="text-sm font-semibold text-warning">{alert.alertType}</span>
              <p className="text-[12px] text-text-muted mt-1">{alert.message}</p>
            </div>
          )) : (
            <div className="glass-card p-4 text-center text-text-muted text-sm border-dashed">
              No Active Alerts
            </div>
          )}
        </div>
      </section>

      {/* Connection Status */}
      <section className="mt-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Wifi size={20} className="text-secondary" />
          Connection Status
        </h2>
        <div className="glass-card p-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">MQTT</span>
            <span className="text-healthy font-semibold">Connected</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Socket.IO</span>
            <span className="text-healthy font-semibold">Connected</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Database</span>
            <span className="text-healthy font-semibold">Connected</span>
          </div>
        </div>
      </section>

    </div>
  );
}
