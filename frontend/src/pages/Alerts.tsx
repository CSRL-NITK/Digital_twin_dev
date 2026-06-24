import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Bell, CheckCircle, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch historical alerts
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/alerts');
        setAlerts(res.data);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();

    // Listen for real-time alerts
    const socket: Socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    socket.on('alert:new', (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-text flex items-center gap-2">
            <Bell className="text-warning" size={32} />
            System Alerts
          </h1>
          <p className="text-text-muted mt-1">Real-time anomaly detection and critical events log.</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-12 text-text-muted">Loading alerts...</div>
        ) : alerts.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {alerts.map((alert, idx) => (
              <div 
                key={alert.id || idx} 
                className={`glass-card p-5 border-l-4 ${alert.severity === 'Critical' ? 'border-l-danger' : 'border-l-warning'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full ${alert.severity === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-text">{alert.alertType}</h3>
                      <p className="text-[14px] text-text-muted mt-1">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-muted text-[12px] bg-surface-light px-3 py-1.5 rounded-full">
                    <Clock size={12} />
                    {formatTime(alert.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-text-muted flex flex-col items-center justify-center border-dashed">
            <CheckCircle size={48} className="text-success mb-4" />
            <h2 className="text-[20px] font-semibold text-text mb-2">No active alerts</h2>
            <p className="max-w-md">Your water network is running smoothly. All sensors are reporting healthy values.</p>
          </div>
        )}
      </div>
    </div>
  );
}
