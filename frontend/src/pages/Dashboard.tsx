import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, AlertTriangle, Activity, Droplets } from 'lucide-react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalNodes: 0,
    activeNodes: 0,
    criticalAlerts: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [latestReadings, setLatestReadings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, alertsRes, readingsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/nodes`),
          axios.get(`${BACKEND_URL}/api/alerts`),
          axios.get(`${BACKEND_URL}/api/readings/latest`),
        ]);

        const nodes = nodesRes.data;
        const active = nodes.filter((n: any) => n.status !== 'Offline').length;
        
        setStats({
          totalNodes: nodes.length,
          activeNodes: active,
          criticalAlerts: alertsRes.data.filter((a: any) => a.severity === 'Critical').length,
        });

        setAlerts(alertsRes.data.slice(0, 5)); // top 5 recent alerts
        
        // combine nodes and readings for display
        const combined = nodes.filter((n: any) => n.nodeType === 'tank' || n.nodeType === 'central_tank')
          .map((node: any) => {
             const r = readingsRes.data.find((r: any) => r.nodeId === node.id);
             return { ...node, latest: r };
          });
        setLatestReadings(combined);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    
    const socket = io(BACKEND_URL);

    socket.on('reading:update', (data) => {
      setLatestReadings((prev) => 
        prev.map(node => {
          if (node.id === data.nodeId) {
            return {
              ...node,
              status: data.status,
              latest: {
                waterLevel: data.waterLevel,
                ph: data.ph,
                tds: data.tds,
                temperature: data.temperature
              }
            };
          }
          return node;
        })
      );
      // Quickly refresh alerts and stats without full node reload
      axios.get(`${BACKEND_URL}/api/alerts`).then(res => setAlerts(res.data.slice(0, 5)));
    });

    socket.on('node:status_update', (data) => {
      setLatestReadings((prev) => 
        prev.map(node => node.id === data.id ? { ...node, status: data.status } : node)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-text-muted mt-1">Live metrics from your Smart Water Digital Twin.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="p-4 rounded-xl bg-blue-500/20 text-blue-400">
            <Database size={28} />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Total Nodes</p>
            <p className="text-3xl font-bold text-white">{stats.totalNodes}</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="p-4 rounded-xl bg-green-500/20 text-green-400">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Active Nodes</p>
            <p className="text-3xl font-bold text-white">{stats.activeNodes}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="p-4 rounded-xl bg-red-500/20 text-red-400">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Critical Alerts</p>
            <p className="text-3xl font-bold text-white">{stats.criticalAlerts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Readings Table */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Droplets size={20} className="text-primary" />
              Live Tank Status
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3 px-4 font-medium">Node Name</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium text-right">Water Level</th>
                  <th className="pb-3 px-4 font-medium text-right">pH</th>
                  <th className="pb-3 px-4 font-medium text-right">Temp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {latestReadings.map((node) => (
                  <tr key={node.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-medium text-white">{node.nodeName}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        node.status === 'Healthy' ? 'bg-healthy/20 text-healthy' : 
                        node.status === 'Warning' ? 'bg-warning/20 text-warning' : 
                        'bg-critical/20 text-critical'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-white">
                      {node.latest?.waterLevel && node.latest.waterLevel != -999 ? `${Number(node.latest.waterLevel).toFixed(1)}%` : '--'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-white">
                      {node.latest?.ph && node.latest.ph != -999 ? Number(node.latest.ph).toFixed(2) : '--'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-white">
                      {node.latest?.temperature && node.latest.temperature != -999 ? `${Number(node.latest.temperature).toFixed(1)}°` : '--'}
                    </td>
                  </tr>
                ))}
                {latestReadings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      No telemetry data available yet. Please run the data generator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle size={20} className="text-warning" />
              Recent Alerts
            </h2>
          </div>
          
          <div className="space-y-4">
            {alerts.length > 0 ? alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'Critical' ? 'border-critical bg-critical/10' : 'border-warning bg-warning/10'
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-semibold text-sm ${
                    alert.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {alert.alertType}
                  </h4>
                  <span className="text-[10px] text-text-muted">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{alert.message}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-text-muted border border-dashed border-white/10 rounded-lg">
                <Activity size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No alerts triggered.</p>
                <p className="text-xs mt-1">System is running normally.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
