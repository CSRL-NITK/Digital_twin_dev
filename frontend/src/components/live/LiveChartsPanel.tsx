import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ChevronDown, Activity, Droplets, Thermometer, Waves, Zap } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface LiveChartsPanelProps {
  topologyId: string;
  selectedNode?: any;
}

interface TankNode {
  id: string;
  nodeName: string;
  nodeType: string;
}

interface ChartDataPoint {
  time: string;
  ph: number;
  tds: number;
  temp: number;
  level: number;
  flowRate: number;
}

interface DbReading {
  id: number;
  sensorId: number;
  value: number;
  createdAt: string;
  sensor: {
    id: number;
    nodeId: number;
    sensorType: string;
  };
}

type MetricKey = 'level' | 'ph' | 'temp' | 'tds' | 'flowRate';

const CHARTS_CONFIG: {
  key: MetricKey;
  title: string;
  unit: string;
  decimals: number;
  color: string;
  tintBg: (dark: boolean) => string;
  icon: typeof Waves;
}[] = [
  {
    key: 'level',
    title: 'Water Level',
    unit: '%',
    decimals: 1,
    color: '#4A90D9',
    tintBg: (dark: boolean) => dark ? 'rgba(74,144,217,0.12)' : 'rgba(74,144,217,0.08)',
    icon: Waves,
  },
  {
    key: 'ph',
    title: 'pH Level',
    unit: '',
    decimals: 2,
    color: '#7C5CFC',
    tintBg: (dark: boolean) => dark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.08)',
    icon: Droplets,
  },
  {
    key: 'temp',
    title: 'Temperature',
    unit: '°C',
    decimals: 1,
    color: '#E8634A',
    tintBg: (dark: boolean) => dark ? 'rgba(232,99,74,0.12)' : 'rgba(232,99,74,0.08)',
    icon: Thermometer,
  },
  {
    key: 'tds',
    title: 'TDS',
    unit: ' ppm',
    decimals: 0,
    color: '#2ECC71',
    tintBg: (dark: boolean) => dark ? 'rgba(46,204,113,0.12)' : 'rgba(46,204,113,0.08)',
    icon: Zap,
  },
  {
    key: 'flowRate',
    title: 'Flow Rate',
    unit: ' L/s',
    decimals: 1,
    color: '#0891b2',
    tintBg: (dark: boolean) => dark ? 'rgba(8,145,178,0.12)' : 'rgba(8,145,178,0.08)',
    icon: Activity,
  },
];

interface TrendInfo {
  arrow: string;
  color: string;
}

/** Compute trend arrow (no percentages) */
function getTrendInfo(data: ChartDataPoint[], key: MetricKey): TrendInfo {
  if (data.length < 2) return { arrow: '—', color: '#9ca3af' };
  const prev = data[data.length - 2][key];
  const curr = data[data.length - 1][key];
  const diff = curr - prev;
  if (Math.abs(diff) < 0.001) {
    return { arrow: '—', color: '#9ca3af' };
  }
  const arrow = diff > 0 ? '↑' : '↓';
  const color = diff > 0 ? '#22c55e' : '#ef4444';
  return { arrow, color };
}

/** Compute min / max / avg stats */
function getStats(data: ChartDataPoint[], key: MetricKey, decimals: number) {
  if (data.length === 0) return { min: '—', max: '—', avg: '—' };
  const vals = data.map(d => d[key]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return {
    min: min.toFixed(decimals),
    max: max.toFixed(decimals),
    avg: avg.toFixed(decimals),
  };
}

/** Process DB history readings into ChartDataPoint schema */
function processDbHistory(readings: DbReading[]): ChartDataPoint[] {
  const groups: Record<string, Partial<ChartDataPoint>> = {};
  
  readings.forEach(r => {
    if (!r.createdAt || !r.sensor) return;
    const dateObj = new Date(r.createdAt);
    const timeStr = dateObj.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    
    if (!groups[timeStr]) {
      groups[timeStr] = { time: timeStr };
    }
    
    const sType = r.sensor.sensorType;
    if (sType === 'water_level') groups[timeStr].level = r.value;
    else if (sType === 'ph') groups[timeStr].ph = r.value;
    else if (sType === 'temperature') groups[timeStr].temp = r.value;
    else if (sType === 'tds') groups[timeStr].tds = r.value;
  });
  
  const result: ChartDataPoint[] = [];
  const sortedTimes = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  
  let lastLevel = 60;
  let lastPh = 7.0;
  let lastTemp = 25.0;
  let lastTds = 300;
  
  sortedTimes.forEach(time => {
    const g = groups[time];
    const prevLevel = lastLevel;
    if (g.level !== undefined) lastLevel = g.level;
    if (g.ph !== undefined) lastPh = g.ph;
    if (g.temp !== undefined) lastTemp = g.temp;
    if (g.tds !== undefined) lastTds = g.tds;
    
    // Smooth flowRate calculation based on level changes, clamping to standard ranges
    const delta = Math.abs(lastLevel - prevLevel);
    const flowRate = Math.max(0.4, Math.min(6.5, delta * 3.5 + 1.2 + (Math.sin(result.length * 0.5) * 0.2)));
    
    result.push({
      time,
      level: lastLevel,
      ph: lastPh,
      temp: lastTemp,
      tds: lastTds,
      flowRate: parseFloat(flowRate.toFixed(1))
    });
  });
  
  return result.slice(-15);
}

/** Generate fallback seed data if DB is empty */
function generateSeedData(): ChartDataPoint[] {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(now - (11 - i) * 1000).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
    ph: 7.0 + (Math.random() - 0.5) * 0.1,
    tds: 300 + (Math.random() - 0.5) * 10,
    temp: 25 + (Math.random() - 0.5) * 0.8,
    level: 60 + (Math.random() - 0.5) * 1.5,
    flowRate: parseFloat((1.8 + (Math.random() - 0.5) * 0.4).toFixed(1)),
  }));
}

/** Last active glowing dot */
function LastActiveDot(props: any) {
  const { cx, cy, index, dataLength, color } = props;
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.25} stroke="none" />
      <circle cx={cx} cy={cy} r={2.5} fill={color} stroke="#ffffff" strokeWidth={1} />
    </g>
  );
}

export default function LiveChartsPanel({ topologyId, selectedNode }: LiveChartsPanelProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [tanks, setTanks] = useState<TankNode[]>([]);
  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMetric, setHoveredMetric] = useState<MetricKey | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync dropdown with canvas tank click
  useEffect(() => {
    if (selectedNode?.id) {
      const isTank = selectedNode.nodeType?.includes('tank') || selectedNode.nodeType?.includes('source');
      if (isTank) {
        setSelectedTankId(selectedNode.id.toString());
      }
    }
  }, [selectedNode]);

  // Fetch tanks
  useEffect(() => {
    if (!topologyId) return;
    axios.get(`http://localhost:3001/api/topologies/${topologyId}`)
      .then(res => {
        const tankNodes = (res.data?.nodes ?? []).filter((n: any) =>
          n.nodeType?.includes('tank') || n.nodeType?.includes('source')
        );
        setTanks(tankNodes);
        if (tankNodes.length > 0 && !selectedTankId) setSelectedTankId(tankNodes[0].id.toString());
      })
      .catch(console.error);
  }, [topologyId]);

  // Fetch initial database history when selectedTankId changes
  useEffect(() => {
    if (!selectedTankId) return;

    axios.get(`http://localhost:3001/api/readings/history/${selectedTankId}`)
      .then(res => {
        const dbHistory = res.data;
        if (Array.isArray(dbHistory) && dbHistory.length >= 2) {
          setData(processDbHistory(dbHistory));
        } else {
          setData(generateSeedData());
        }
      })
      .catch(err => {
        console.error('Failed to fetch node history:', err);
        setData(generateSeedData());
      });
  }, [selectedTankId]);

  // Listen for real-time socket sensor updates
  useEffect(() => {
    if (!selectedTankId) return;
    const socket = io('http://localhost:3001');

    socket.on('sensor_update', (updateData: any) => {
      if (String(updateData.nodeId) === String(selectedTankId)) {
        const wl = updateData.sensors?.find((s: any) => s.sensorType === 'water_level')?.value;
        const ph = updateData.sensors?.find((s: any) => s.sensorType === 'ph')?.value;
        const tds = updateData.sensors?.find((s: any) => s.sensorType === 'tds')?.value;
        const temp = updateData.sensors?.find((s: any) => s.sensorType === 'temperature')?.value;

        setData(prev => {
          const lastPoint = prev[prev.length - 1];
          const nextLevel = wl !== undefined ? wl : (lastPoint?.level ?? 60.0);
          const prevLevel = lastPoint?.level ?? 60.0;
          const delta = Math.abs(nextLevel - prevLevel);
          const simulatedFlow = Math.max(0.4, Math.min(6.5, delta * 4.5 + 1.2 + (Math.random() - 0.5) * 0.3));

          const nextPoint: ChartDataPoint = {
            time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
            ph: ph !== undefined ? ph : (lastPoint?.ph ?? 7.0),
            tds: tds !== undefined ? tds : (lastPoint?.tds ?? 300),
            temp: temp !== undefined ? temp : (lastPoint?.temp ?? 25.0),
            level: nextLevel,
            flowRate: parseFloat(simulatedFlow.toFixed(1)),
          };
          const updated = [...prev, nextPoint];
          if (updated.length > 15) updated.shift();
          return updated;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedTankId]);

  const selectedTank = useMemo(() => tanks.find(t => t.id.toString() === selectedTankId), [tanks, selectedTankId]);

  /* ── theme tokens ── */
  const tk = {
    text:       dark ? '#f0f0f2' : '#1a1b1e',
    textSec:    dark ? '#9ca3af' : '#4b5563',
    textMuted:  dark ? '#4b5563' : '#6b7280',
    bg:         dark ? '#1c1d22' : '#f8fafc',
    cardBg:     dark ? 'rgba(255,255,255,0.025)' : '#ffffff',
    border:     dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    borderHover: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    hoverBg:    dark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
    shadow:     dark
      ? '0 6px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 4px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
    dropdownShadow: dark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)',
  };

  const fontFamily = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif";

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

      {/* ═══ HEADER (Compact & Optimized) ═══ */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: `1px solid ${tk.border}`,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Title and Real-time Status Inline Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 20 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px',
            color: tk.text,
          }}>
            Live Node Metrics
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 5px rgba(34,197,94,0.6)',
              animation: 'lcp-pulse-dot 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#22c55e',
              letterSpacing: '0.01em',
            }}>
              Real-time
            </span>
          </div>
        </div>

        {/* Dropdown Selector (Modern Premium Enterprise Select) */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(v => !v)}
            style={{
              width: '100%',
              height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 14px', borderRadius: 14, cursor: 'pointer',
              background: tk.cardBg,
              border: `1px solid ${isOpen ? '#4A90D9' : tk.border}`,
              boxShadow: isOpen ? `0 0 0 3px ${dark ? 'rgba(74,144,217,0.15)' : 'rgba(74,144,217,0.08)'}` : 'none',
              transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (!isOpen) e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              if (!isOpen) e.currentTarget.style.borderColor = tk.border;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 4px rgba(34,197,94,0.4)',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: tk.text }}>
                {selectedTank?.nodeName ?? 'Select a Tank'}
              </span>
            </div>
            <ChevronDown
              size={14} strokeWidth={2.5} color={tk.textSec}
              style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
            />
          </button>

          {isOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: dark ? 'rgba(30, 31, 37, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${tk.border}`,
              borderRadius: 16, overflow: 'hidden', zIndex: 100,
              boxShadow: tk.dropdownShadow,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              animation: 'lcp-dropdown-fade 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {tanks.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: 11.5, color: tk.textMuted }}>No tanks found</div>
              ) : tanks.map((tank, i) => {
                const active = selectedTankId === tank.id.toString();
                return (
                  <div
                    key={tank.id}
                    onClick={() => { setSelectedTankId(tank.id.toString()); setIsOpen(false); setData([]); }}
                    style={{
                      padding: '9px 12px', fontSize: 12, fontWeight: active ? 600 : 500,
                      borderRadius: 10,
                      cursor: 'pointer',
                      color: active ? '#4A90D9' : tk.text,
                      background: active
                        ? (dark ? 'rgba(74, 144, 217, 0.12)' : 'rgba(74, 144, 217, 0.06)')
                        : 'transparent',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{tank.nodeName}</span>
                    {active && (
                      <span style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: '#4A90D9',
                        boxShadow: '0 0 4px #4A90D9',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 600, color: dark ? '#ffffff' : '#1a1b1e',
          opacity: 0.9, letterSpacing: '-0.1px',
          display: 'block', marginTop: 2, paddingLeft: 2
        }}>
          Tip: Click a tank node to select
        </span>
      </div>

      {/* ═══ CHARTS GRID (Unified card widgets) ═══ */}
      <div 
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          padding: '10px 10px',
          gap: 8,
        }}
      >
        {CHARTS_CONFIG.map((cfg) => {
          const Icon = cfg.icon;
          const lastVal = data.length > 0 ? data[data.length - 1][cfg.key] : null;
          const display = lastVal !== null
            ? `${lastVal.toFixed(cfg.decimals)}${cfg.unit}`
            : '—';
          const trend = getTrendInfo(data, cfg.key);
          const stats = getStats(data, cfg.key, cfg.decimals);
          const isHovered = hoveredMetric === cfg.key;

          return (
            <div
              key={cfg.key}
              onMouseEnter={() => setHoveredMetric(cfg.key)}
              onMouseLeave={() => setHoveredMetric(null)}
              style={{
                flex: 1, minHeight: 0,
                display: 'flex', flexDirection: 'column',
                borderRadius: 12,
                padding: '8px 10px',
                background: tk.cardBg,
                border: `1px solid ${isHovered ? tk.borderHover : tk.border}`,
                boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 200ms ease',
              }}
            >
              {/* Label row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                height: 20,
              }}>
                {/* Left Side: Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: cfg.tintBg(dark),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 200ms ease',
                  }}>
                    <Icon size={11} strokeWidth={2.2} color={cfg.color} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: tk.textSec,
                    letterSpacing: '-0.1px',
                  }}>
                    {cfg.title}
                  </span>
                </div>

                {/* Right Side: Current Value & Trend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 13.5, fontWeight: 700, color: cfg.color,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.3px',
                  }}>
                    {display}
                  </span>
                  {trend.arrow !== '—' && (
                    <span style={{
                      fontSize: 14, fontWeight: 800, color: trend.color,
                      display: 'inline-flex', alignItems: 'center',
                      lineHeight: 1,
                      marginLeft: 3,
                    }}>
                      {trend.arrow}
                    </span>
                  )}
                </div>
              </div>

              {/* Sparkline Chart */}
              <div style={{ flex: 1, minHeight: 38, width: '100%', margin: '2px 0', outline: 'none' }}>
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                  <AreaChart data={data} margin={{ top: 2, right: 1, left: 1, bottom: 2 }} style={{ outline: 'none' }}>
                    <defs>
                      <linearGradient id={`grad-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={cfg.color} stopOpacity={dark ? 0.28 : 0.20} />
                        <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}
                      vertical={false}
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={cfg.key === 'level' ? [0, 100] : ['auto', 'auto']} />
                    {cfg.key === 'level' && (
                      <>
                        <ReferenceLine y={25} stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeDasharray="2 2" />
                        <ReferenceLine y={50} stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeDasharray="2 2" />
                        <ReferenceLine y={75} stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeDasharray="2 2" />
                      </>
                    )}
                    <Tooltip
                      contentStyle={{
                        background: dark ? '#222329' : '#ffffff',
                        border: `1px solid ${tk.border}`,
                        borderRadius: 8, fontSize: 10,
                        padding: '4px 6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontFamily,
                      }}
                      itemStyle={{ color: tk.text, fontWeight: 700, padding: 0 }}
                      labelStyle={{ color: tk.textSec, marginBottom: 2, fontSize: 8.5 }}
                      animationDuration={80}
                    />
                    <Area
                      type="monotone"
                      dataKey={cfg.key}
                      stroke={cfg.color}
                      strokeWidth={isHovered ? 2.5 : 1.8}
                      fillOpacity={1}
                      fill={`url(#grad-${cfg.key})`}
                      isAnimationActive={false}
                      dot={false}
                      activeDot={(dotProps: any) => (
                        <LastActiveDot {...dotProps} dataLength={data.length} color={cfg.color} />
                      )}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Statistics row */}
              <div style={{
                display: 'flex', gap: 10, flexShrink: 0,
                height: 12,
                alignItems: 'center',
                paddingLeft: 26,
              }}>
                {[
                  { label: 'Min', value: stats.min },
                  { label: 'Max', value: stats.max },
                  { label: 'Avg', value: stats.avg },
                ].map(s => (
                  <span key={s.label} style={{
                    fontSize: 9, fontWeight: 500, color: tk.textMuted,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.01em',
                  }}>
                    {s.label}{' '}
                    <span style={{ fontWeight: 600, color: tk.textSec }}>{s.value}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        @keyframes lcp-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.8); }
        }
        @keyframes lcp-dropdown-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
