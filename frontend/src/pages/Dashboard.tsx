import { Activity } from 'lucide-react';

export default function Dashboard() {
  // Placeholder URL for Grafana. The user can update this later.
  const GRAFANA_URL = "http://localhost:3000/d-solo/placeholder/smart-water-analytics?orgId=1&panelId=1&theme=light";

  return (
    <div className="h-full flex flex-col gap-6">
      <header>
        <h1 className="text-[32px] font-bold text-text tracking-tight">Analytics Dashboard</h1>
        <p className="text-text-muted mt-1 text-[14px]">Historical telemetry analysis powered by Grafana.</p>
      </header>

      <div className="glass-card flex-1 flex flex-col overflow-hidden relative">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-light/50">
          <div className="flex items-center gap-2 text-text">
            <Activity size={20} className="text-primary" />
            <h2 className="font-semibold text-[16px]">Grafana Integration</h2>
          </div>
        </div>
        
        {/* If Grafana is not running, this iframe will just fail to load gracefully, 
            which is fine for a placeholder until the user sets it up. */}
        <div className="flex-1 bg-surface-light relative">
          <iframe 
            src={GRAFANA_URL}
            className="w-full h-full border-0"
            title="Grafana Analytics"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
