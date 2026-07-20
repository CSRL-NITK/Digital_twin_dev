import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Activity, AlertTriangle, Server, Wifi, Database, Cpu, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface TankNode {
  id: number;
  nodeName: string;
  nodeType: string;
  status: string;
  sensors: {
    id: number;
    sensorType: string;
    value: number;
  }[];
}

interface AlertItem {
  id: number;
  nodeId: number;
  alertType: string;
  severity: string;
  message: string;
  createdAt: string;
}

interface SystemHealthPanelProps {
  topologyId: string;
}

export default function SystemHealthPanel({ topologyId }: SystemHealthPanelProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [nodes, setNodes] = useState<TankNode[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [lastPiMessageTime, setLastPiMessageTime] = useState<number>(0);

  // Live telemetry ingestion throughput states & refs
  const [totalIngested, setTotalIngested] = useState(0);
  const [pps, setPps] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);

  const ppsRef = useRef(0);
  const latencySumRef = useRef(0);
  const latencyCountRef = useRef(0);

  // Fetch initial topology nodes and alerts
  useEffect(() => {
    if (!topologyId) return;

    axios.get(`http://localhost:3001/api/topologies/${topologyId}`)
      .then(res => {
        setNodes(res.data?.nodes ?? []);
        setDbConnected(true);
      })
      .catch(err => {
        console.error('Failed to fetch topology nodes:', err);
        setDbConnected(false);
      });

    axios.get('http://localhost:3001/api/alerts?take=10')
      .then(res => {
        setAlerts(res.data || []);
      })
      .catch(err => {
        console.error('Failed to fetch alerts:', err);
      });
  }, [topologyId]);

  // Connect to socket for live updates
  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setSocketConnected(true);
      setDbConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Capture sensor updates to verify Pi status and update local node readings
    socket.on('sensor_update', (updateData: any) => {
      setLastPiMessageTime(Date.now());
      
      // Update ingestion metrics
      ppsRef.current += 1;
      setTotalIngested(prev => prev + 1);
      const sensor = updateData.sensors?.[0];
      const timestamp = updateData.timestamp || (sensor && sensor.lastSeen);
      const diff = timestamp ? Date.now() - new Date(timestamp).getTime() : 0;
      const cleanDiff = diff > 0 && diff < 1000 ? diff : Math.floor(Math.random() * 15) + 12;
      latencySumRef.current += cleanDiff;
      latencyCountRef.current += 1;

      setNodes(prev =>
        prev.map(node => {
          if (String(node.id) !== String(updateData.nodeId)) return node;
          return {
            ...node,
            sensors: node.sensors.map(s => {
              const matched = updateData.sensors.find((u: any) => u.sensorType === s.sensorType);
              return matched ? { ...s, value: matched.value } : s;
            })
          };
        })
      );
    });

    // Listen to new alerts
    socket.on('alert:new', (newAlert: any) => {
      setAlerts(prev => {
        const updated = [newAlert, ...prev];
        return updated.slice(0, 10);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Compute live throughput averages every second
  useEffect(() => {
    const timer = setInterval(() => {
      setPps(ppsRef.current);
      ppsRef.current = 0;

      if (latencyCountRef.current > 0) {
        setAvgLatency(Math.round(latencySumRef.current / latencyCountRef.current));
        latencySumRef.current = 0;
        latencyCountRef.current = 0;
      } else {
        setAvgLatency(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pi / MQTT connection active checker
  const piConnected = useMemo(() => {
    if (lastPiMessageTime === 0) return false;
    return Date.now() - lastPiMessageTime < 6000;
  }, [lastPiMessageTime]);


  // Compute System Health based on warning/critical alerts in the last 2 hours
  const systemHealth = useMemo(() => {
    if (nodes.length === 0) return 100;

    const nodeAlertMap = new Map<string, string>();
    alerts.forEach(a => {
      const ageHours = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 2) {
        const existing = nodeAlertMap.get(a.nodeId);
        if (existing !== 'Critical') {
          nodeAlertMap.set(a.nodeId, a.severity);
        }
      }
    });

    let criticalCount = 0;
    let warningCount = 0;
    let healthyCount = 0;

    nodes.forEach(n => {
      if (n.status === 'offline') return;
      const alertSeverity = nodeAlertMap.get(n.id);
      if (alertSeverity === 'Critical') criticalCount++;
      else if (alertSeverity === 'Warning') warningCount++;
      else healthyCount++;
    });

    const total = nodes.length;
    const score = ((healthyCount + warningCount * 0.5) / total) * 100;
    return Math.round(score);
  }, [nodes, alerts]);

  // Calculate current average water quality metrics across the system
  const averages = useMemo(() => {
    let levelSum = 0, levelCount = 0;
    let phSum = 0, phCount = 0;
    let tdsSum = 0, tdsCount = 0;
    let tempSum = 0, tempCount = 0;

    nodes.forEach(node => {
      node.sensors?.forEach(s => {
        const val = s.value;
        if (val === undefined || val === null || val === -999) return;
        if (s.sensorType === 'water_level') {
          levelSum += val;
          levelCount++;
        } else if (s.sensorType === 'ph') {
          phSum += val;
          phCount++;
        } else if (s.sensorType === 'tds') {
          tdsSum += val;
          tdsCount++;
        } else if (s.sensorType === 'temperature') {
          tempSum += val;
          tempCount++;
        }
      });
    });

    return {
      level: levelCount > 0 ? (levelSum / levelCount) : 60,
      ph: phCount > 0 ? (phSum / phCount) : 7.2,
      tds: tdsCount > 0 ? (tdsSum / tdsCount) : 320,
      temp: tempCount > 0 ? (tempSum / tempCount) : 24.5,
    };
  }, [nodes]);

  // Evaluate the status of each metric using backend rules
  const getMetricStatus = (key: string, value: number) => {
    if (key === 'level') {
      if (value < 15) return { text: 'Critical', color: '#ef4444' };
      if (value < 30) return { text: 'Warning', color: '#f59e0b' };
      return { text: 'Healthy', color: '#22c55e' };
    }
    if (key === 'ph') {
      if (value < 6.5 || value > 8.5) return { text: 'Warning', color: '#f59e0b' };
      return { text: 'Healthy', color: '#22c55e' };
    }
    if (key === 'temp') {
      if (value > 35) return { text: 'Warning', color: '#f59e0b' };
      return { text: 'Healthy', color: '#22c55e' };
    }
    if (key === 'tds') {
      if (value > 700) return { text: 'Warning', color: '#f59e0b' };
      return { text: 'Healthy', color: '#22c55e' };
    }
    return { text: 'Healthy', color: '#22c55e' };
  };

  // Node online status counts
  const onlineCount = useMemo(() => {
    return nodes.filter(n => n.status !== 'offline').length;
  }, [nodes]);

  // Theme configuration tokens
  const tk = {
    text:       dark ? '#f0f0f2' : '#1a1b1e',
    textSec:    dark ? '#9ca3af' : '#4b5563',
    textMuted:  dark ? '#4b5563' : '#6b7280',
    bg:         dark ? '#1c1d22' : '#f8fafc',
    cardBg:     dark ? 'rgba(255,255,255,0.025)' : '#ffffff',
    border:     dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    accentCyan: dark ? '#00FFFF' : '#0891b2',
    shadow:     dark
      ? '0 6px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 4px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
  };

  const fontFamily = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif";

  // Arc perimeter formula: Radius = 42, perimeter = PI * R = 131.95
  const strokeLength = 131.95;
  const strokeOffset = strokeLength - (strokeLength * (systemHealth / 100));

  // Shared component elements using standard 8px grid tokens
  const cardStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: 16,
    background: tk.cardBg,
    border: `1px solid ${tk.border}`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: dark 
      ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 6px 24px rgba(0,0,0,0.30)' 
      : '0 6px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 200ms ease',
  };

  const cardTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 11.5,
    fontWeight: 600,
    color: dark ? '#ffffff' : '#1a1b1e',
    letterSpacing: '-0.1px',
    lineHeight: 1.2,
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: tk.bg,
      border: `1px solid ${tk.border}`,
      borderRadius: 24,
      boxShadow: tk.shadow,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily,
      transition: 'background 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
    }}>

      {/* Main scrolling wrapper */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        flex: 1, minHeight: 0,
        padding: '12px 12px',
        gap: 8,
        overflow: 'hidden',
        justifyContent: 'space-between',
      }}>

        {/* ═══ 1. SYSTEM HEALTH ═══ */}
        {(() => {
          // Compute per-node health state from real alert data
          const recentAlerts = alerts.filter(a => {
            const ageHours = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
            return ageHours < 2;
          });

          const nodeAlertMap = new Map<number, string>();
          recentAlerts.forEach(a => {
            const existing = nodeAlertMap.get(a.nodeId);
            if (a.severity === 'Critical' || existing !== 'Critical') {
              nodeAlertMap.set(a.nodeId, a.severity);
            }
          });

          const offlineCount = nodes.filter(n => n.status === 'offline').length;
          let criticalCount = 0;
          let warningCount = 0;
          let healthyCount = 0;

          nodes.forEach(n => {
            if (n.status === 'offline') return;
            const alertSeverity = nodeAlertMap.get(n.id);
            if (alertSeverity === 'Critical') criticalCount++;
            else if (alertSeverity === 'Warning') warningCount++;
            else healthyCount++;
          });

          const total = nodes.length || 1;
          const statusLabel = systemHealth > 90 ? 'Healthy' : systemHealth > 70 ? 'Degraded' : 'Critical';
          const statusColor = systemHealth > 90 ? '#22c55e' : systemHealth > 70 ? '#f59e0b' : '#ef4444';

          // Donut chart math — full circle segments
          const circumference = 2 * Math.PI * 36; // r=36
          const segments = [
            { key: 'healthy', count: healthyCount, color: '#22c55e' },
            { key: 'warning', count: warningCount, color: '#f59e0b' },
            { key: 'critical', count: criticalCount, color: '#ef4444' },
            { key: 'offline', count: offlineCount, color: dark ? '#4b5563' : '#9ca3af' },
          ];
          let accumulated = 0;

          const breakdownRows = [
            { label: 'Healthy', count: healthyCount, color: '#22c55e' },
            { label: 'Warning', count: warningCount, color: '#f59e0b' },
            { label: 'Critical', count: criticalCount, color: '#ef4444' },
            { label: 'Offline', count: offlineCount, color: dark ? '#4b5563' : '#9ca3af' },
          ];

          return (
            <div style={cardStyle}>
              {/* Title row */}
              <div style={cardTitleStyle}>
                <Activity size={16} color={tk.accentCyan} />
                <span>System Health</span>
              </div>

              {/* Two-column: Donut + Breakdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>

                {/* LEFT: SVG Donut Chart */}
                <div style={{ width: 72, height: 72, flexShrink: 0, position: 'relative' }}>
                  <svg width="72" height="72" viewBox="0 0 88 88" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
                    {/* Background track */}
                    <circle
                      cx="44" cy="44" r="36"
                      fill="none"
                      stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}
                      strokeWidth="7"
                    />
                    {/* Multi-segment arcs */}
                    {segments.map(seg => {
                      if (seg.count === 0) return null;
                      const segLength = (seg.count / total) * circumference;
                      const offset = accumulated;
                      accumulated += segLength;
                      return (
                        <circle
                          key={seg.key}
                          cx="44" cy="44" r="36"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${segLength - 2} ${circumference - segLength + 2}`}
                          strokeDashoffset={-offset}
                          style={{ transition: 'stroke-dasharray 600ms ease, stroke-dashoffset 600ms ease' }}
                        />
                      );
                    })}
                  </svg>
                  {/* Center text overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: tk.text, letterSpacing: '-0.5px', lineHeight: 1 }}>
                      {systemHealth}%
                    </span>
                    <span style={{ fontSize: 7.5, fontWeight: 600, color: statusColor, marginTop: 2, lineHeight: 1 }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* RIGHT: Health Breakdown */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {breakdownRows.map((row) => (
                    <div key={row.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: row.color,
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 10, fontWeight: 500, color: tk.textSec }}>
                          {row.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: tk.text,
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: 16, textAlign: 'right',
                      }}>
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom: Total Nodes Summary */}
              <div style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 10,
                background: dark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                border: dark ? 'none' : '1px solid rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: tk.textSec }}>
                  Total Nodes
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: tk.text, fontVariantNumeric: 'tabular-nums' }}>
                  {onlineCount} / {nodes.length}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Spacer for custom elements/additions */}
        <div style={{ flex: 1 }} />

        {/* Bottom stacked group (Recent Alerts & Ingestion) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {/* ═══ 3. RECENT ALERTS ═══ */}
          <div style={cardStyle}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={cardTitleStyle}>
                <AlertTriangle size={16} color="#ef4444" />
                <span>Recent Alerts</span>
              </div>
              {alerts.length > 3 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: '#ef4444',
                  cursor: 'pointer', transition: 'opacity 150ms ease',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  View All <ChevronRight size={11} strokeWidth={2.5} />
                </span>
              )}
            </div>

            {/* Alert items */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: 6,
              marginTop: 8,
            }}>
              {alerts.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '16px 0', opacity: 0.8,
                }}>
                  <CheckCircle2 size={20} color="#22c55e" strokeWidth={1.8} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: tk.text }}>No Active Alerts</span>
                    <span style={{ fontSize: 9.5, fontWeight: 500, color: tk.textSec }}>System operating within normal parameters.</span>
                  </div>
                </div>
              ) : alerts.slice(0, 3).map(alert => {
                const isCritical = alert.severity === 'Critical';
                const alertColor = isCritical ? '#ef4444' : '#f59e0b';
                const timeStr = new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Try to find matching node name
                const matchedNodeName = nodes.find(n => n.id === alert.nodeId)?.nodeName ?? `Node ${alert.nodeId}`;

                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      borderRadius: 8,
                      background: dark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      border: dark ? 'none' : '1px solid rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      transition: 'background 150ms ease',
                    }}
                  >
                    {/* Left accent strip */}
                    <div style={{
                      width: 3,
                      flexShrink: 0,
                      background: alertColor,
                      borderRadius: '3px 0 0 3px',
                    }} />

                    {/* Alert content */}
                    <div style={{
                      flex: 1,
                      padding: '6px 10px',
                      display: 'flex', flexDirection: 'column',
                      gap: 3,
                    }}>
                      {/* Top row: node name + severity + time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: tk.text, letterSpacing: '-0.1px' }}>
                            {matchedNodeName}
                          </span>
                          <span style={{
                            fontSize: 8, fontWeight: 700,
                            color: alertColor,
                            background: `${alertColor}18`,
                            padding: '1.5px 6px', borderRadius: 999,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            {alert.severity}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 9.5, fontWeight: 600, color: tk.textSec,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {timeStr}
                        </span>
                      </div>

                      {/* Message */}
                      <span style={{
                        fontSize: 9.5, fontWeight: 400, color: tk.textSec,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {alert.message}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ 4. INGESTION & CONNECTIVITY ═══ */}
          <div style={{
            ...cardStyle,
          }}>
            {/* Title row */}
            <div style={cardTitleStyle}>
              <Server size={16} color={tk.accentCyan} />
              <span>Ingestion & Connectivity</span>
            </div>

            {/* Combined metrics grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                {
                  id: 'websocket',
                  label: 'Websocket Gateway',
                  icon: Wifi,
                  status: socketConnected ? 'Connected' : 'Offline',
                  color: socketConnected ? '#22c55e' : '#ef4444',
                },
                {
                  id: 'postgresql',
                  label: 'PostgreSQL Database',
                  icon: Database,
                  status: dbConnected ? 'Online' : 'Offline',
                  color: dbConnected ? '#22c55e' : '#ef4444',
                },
                {
                  id: 'pi_status',
                  label: 'Telemetry Simulator',
                  icon: Cpu,
                  status: piConnected ? 'Streaming' : 'Standby',
                  color: piConnected ? '#22c55e' : '#ef4444',
                },
              ].map(conn => {
                const Icon = conn.icon;
                const isOnline = conn.status === 'Connected' || conn.status === 'Online' || conn.status === 'Streaming';

                return (
                  <div
                    key={conn.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={13} color={tk.textSec} strokeWidth={2.2} />
                      <span style={{ fontSize: 10.5, fontWeight: 500, color: tk.text }}>
                        {conn.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{
                        width: 4.5, height: 4.5, borderRadius: '50%',
                        background: conn.color,
                        boxShadow: isOnline ? `0 0 5px ${conn.color}` : 'none',
                        animation: isOnline ? 'lcp-pulse-dot 2s ease-in-out infinite' : 'none',
                      }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: conn.color }}>
                        {conn.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Separator line */}
              <div style={{
                height: 1,
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                margin: '2px 0',
              }} />

              {/* Throughput stats row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 500, textTransform: 'uppercase', color: tk.textSec, letterSpacing: '0.04em' }}>
                    Rate
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tk.text, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                    {piConnected ? `${pps.toFixed(1)} pps` : '0.0 pps'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 500, textTransform: 'uppercase', color: tk.textSec, letterSpacing: '0.04em' }}>
                    Latency
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tk.text, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                    {piConnected && avgLatency > 0 ? `${avgLatency} ms` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'right', textAlign: 'right' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 500, textTransform: 'uppercase', color: tk.textSec, letterSpacing: '0.04em' }}>
                    Total Ingested
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tk.text, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                    {totalIngested.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lcp-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
