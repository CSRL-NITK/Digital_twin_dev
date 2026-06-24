import React from 'react';
import { BarChart2, Activity, Filter } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-text flex items-center gap-2">
            <BarChart2 className="text-primary" size={32} />
            Analytics Hub
          </h1>
          <p className="text-text-muted mt-1">Deep dive into historical telemetry and performance trends.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-light border border-border rounded-lg text-text hover:bg-border transition-colors">
            <Filter size={18} />
            Filter Data
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="glass-card p-12 text-center text-text-muted flex flex-col items-center justify-center border-dashed">
          <Activity size={48} className="text-border mb-4" />
          <h2 className="text-[20px] font-semibold text-text mb-2">Analytics Module Coming Soon</h2>
          <p className="max-w-md">Historical trend analysis, predictive maintenance models, and custom reports will be available here.</p>
        </div>
      </div>
    </div>
  );
}
