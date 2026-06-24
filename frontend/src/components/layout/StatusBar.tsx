export default function StatusBar() {
  return (
    <div className="h-12 w-full border-t border-border bg-surface px-6 flex items-center justify-between text-[12px] font-medium text-text-muted shrink-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-healthy animate-pulse" />
          <span>MQTT Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-healthy animate-pulse" />
          <span>Socket.IO Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-healthy animate-pulse" />
          <span>Database Connected</span>
        </div>
      </div>

      <div className="flex items-center gap-6 font-mono">
        <span>Latency 12ms</span>
        <span>Last Update {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
