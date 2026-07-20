import { Outlet } from 'react-router-dom';
import { useState, useMemo, memo, useEffect, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
const TopologyContext = createContext<{ globalTopologyId: string; setGlobalTopologyId: (id: string) => void; }>({ globalTopologyId: '1', setGlobalTopologyId: () => { } });
export const useGlobalTopology = () => useContext(TopologyContext);
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, Bell, LogOut,
  Activity, LayoutDashboard, BarChart2,
  Moon, Sun, Droplets,
  Wifi, Server, AlertTriangle, Users, Gauge,
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import LiveChartsPanel from '../live/LiveChartsPanel';
import SystemHealthPanel from '../live/SystemHealthPanel';

/* ════════════════════════════════════════════════════════════════
   SIDEBAR
   bg: #17181c  |  active: lime  |  inactive: white-26
════════════════════════════════════════════════════════════════ */
const Sidebar = memo(function Sidebar() {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  const { globalTopologyId } = useGlobalTopology();

  const nav = [
    { label: 'Live', to: `/topology/${globalTopologyId}`, Icon: Activity },
    { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
    { label: 'Simulation', to: '/analytics', Icon: BarChart2 },
  ];

  const adminNav = [
    { label: 'Topologies', to: '/topologies', Icon: Server },
    { label: 'Users', to: '/user-management', Icon: Users },
  ];

  const logout = async () => {
    try { await axios.post('http://localhost:3001/api/auth/logout'); } catch (err) { console.error(err); }
    window.location.href = '/login';
  };

  return (
    <aside
      id="sidebar"
      style={{
        width: 64, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        height: '100%', paddingTop: 20, paddingBottom: 20,
        background: '#17181c',
        borderRadius: 18,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >


      {/* Nav */}
      <nav style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4, flex: 1, width: '100%', padding: '0 10px',
      }}>
        {nav.map(({ label, to, Icon }) => {
          const active = to === '/topology/1' ? pathname.startsWith('/topology') : pathname.startsWith(to);
          return (
            <Link
              key={label} to={to} title={label}
              style={{
                width: '100%', height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, textDecoration: 'none',
                position: 'relative',
                color: active ? '#00ffff' : 'rgba(255,255,255,0.28)',
                background: active ? 'rgba(0,255,255,0.12)' : 'transparent',
                border: active ? '1px solid rgba(0,255,255,0.18)' : '1px solid transparent',
                transition: 'all 0.16s ease',
              }}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              {active && (
                <span style={{
                  position: 'absolute', left: -11, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, borderRadius: 99,
                  background: '#00ffff',
                  boxShadow: '0 0 8px rgba(0,255,255,0.5)',
                }} />
              )}
            </Link>
          );
        })}

        {/* Admin-only divider + user management */}
        {isAdmin && (
          <>
            <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
            {adminNav.map(({ label, to, Icon }) => {
              const active = to === '/topology/1' ? pathname.startsWith('/topology') : pathname.startsWith(to);
              return (
                <Link
                  key={label} to={to} title={label}
                  style={{
                    width: '100%', height: 42,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12, textDecoration: 'none',
                    position: 'relative',
                    color: active ? '#00ffff' : 'rgba(255,255,255,0.28)',
                    background: active ? 'rgba(0,255,255,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(0,255,255,0.18)' : '1px solid transparent',
                    transition: 'all 0.16s ease',
                  }}
                >
                  <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                  {active && (
                    <span style={{
                      position: 'absolute', left: -11, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: 99,
                      background: '#00ffff',
                      boxShadow: '0 0 8px rgba(0,255,255,0.5)',
                    }} />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <button
        id="logout-btn" onClick={logout} title="Logout"
        style={{
          width: 40, height: 40, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.28)',
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.16s ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = 'rgba(239,68,68,0.35)';
          b.style.color = '#f87171';
          b.style.background = 'rgba(239,68,68,0.10)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = 'rgba(255,255,255,0.08)';
          b.style.color = 'rgba(255,255,255,0.28)';
          b.style.background = 'transparent';
        }}
      >
        <LogOut size={16} strokeWidth={2} />
      </button>
    </aside>
  );
});

/* ════════════════════════════════════════════════════════════════
   TOP BAR  — 70px
   bg: #ffffff (card)  |  border-bottom: rgba(0,0,0,0.07)
════════════════════════════════════════════════════════════════ */
const TopBar = memo(function TopBar() {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  const isUserManagement = pathname.startsWith('/user-management');
  const { globalTopologyId, setGlobalTopologyId } = useGlobalTopology();

  const [topologies, setTopologies] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:3001/api/topologies')
      .then(res => setTopologies(res.data))
      .catch(err => console.error(err));
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/topology/')) {
      const idFromUrl = pathname.split('/')[2];
      if (idFromUrl && idFromUrl !== globalTopologyId) {
        setGlobalTopologyId(idFromUrl);
      }
    }
  }, [pathname, globalTopologyId, setGlobalTopologyId]);

  const currentTopology = topologies.find(t => t.id.toString() === globalTopologyId);

  const iconBtn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 10,
    border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`,
    background: dark ? '#2a2b34' : '#ffffff',
    boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.02)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    color: dark ? '#9ca3af' : '#5a5f6b',
    transition: 'all 0.15s ease',
  };

  return (
    <header
      id="topbar"
      style={{
        height: 70, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        background: dark ? '#1c1d22' : '#ffffff',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.02)',
        gap: 0,
      }}
    >

      {/* ══ LEFT — Logo badge + wordmark ══════════════════════════════ */}
      <div id="logo" style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
        {/* Icon badge */}
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: '#17181c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(23,24,28,0.18)',
        }}>
          <Droplets size={18} color="#00ffff" strokeWidth={2.3} />
        </div>
        {/* Brand text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.1,
            color: dark ? '#f0f0f2' : '#17181c',
            fontFamily: 'var(--font)',
          }}>
            BrandName
          </span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', lineHeight: 1,
            color: dark ? '#374151' : '#00ffff',
            fontFamily: 'var(--font)',
            background: dark ? 'transparent' : '#17181c',
            padding: dark ? '0' : '1px 5px',
            borderRadius: 4,
          }}>
            Digital Twin
          </span>
        </div>
      </div>

      {/* ══ CENTRE divider ════════════════════════════════════════════ */}
      <div style={{
        width: 1, height: 32, flexShrink: 0,
        background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        margin: '0 22px',
      }} />

      {/* ══ CENTRE — Title block ══════════════════════════════════════ */}
      <div id="title-block" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 18, fontWeight: 800, letterSpacing: '-0.55px', lineHeight: 1.15,
          color: dark ? '#f0f0f2' : '#17181c',
          fontFamily: 'var(--font)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {isUserManagement ? 'System Administration & User Access Control' : 'Smart Water Distribution Testbed'}
        </span>

      </div>

      {/* ══ RIGHT — Topology selector + actions ═══════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

        {/* Topology pill — hide on user management */}
        {!isUserManagement && (
          <>
            <div style={{ position: 'relative' }}>
              <div
                id="topology-selector"
                onClick={() => {
                  if (!menuOpen) {
                    axios.get('http://localhost:3001/api/topologies')
                      .then(res => setTopologies(res.data))
                      .catch(err => console.error(err));
                  }
                  setMenuOpen(!menuOpen);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`,
                  background: dark ? '#2a2b34' : '#ffffff',
                  boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: dark ? '#00ffff' : '#0891b2',
                  boxShadow: dark ? '0 0 7px rgba(0,255,255,0.6)' : '0 0 5px rgba(8,145,178,0.4)',
                }} />
                <span style={{
                  fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.2px',
                  color: dark ? '#f0f0f2' : '#17181c',
                  fontFamily: 'var(--font)',
                }}>
                  {currentTopology ? currentTopology.name : 'Loading...'}
                </span>
                <ChevronDown size={13} strokeWidth={2.8} color={dark ? '#6b7280' : '#5a5f6b'} />
              </div>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  width: 200, borderRadius: 12, overflow: 'hidden',
                  background: dark ? '#2a2b34' : '#ffffff',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  zIndex: 100, display: 'flex', flexDirection: 'column'
                }}>
                  {topologies.map(t => {
                    const isTopologyPage = pathname.startsWith('/topology/');
                    return (
                      <Link
                        key={t.id}
                        to={isTopologyPage ? `/topology/${t.id}` : pathname}
                        onClick={(e) => {
                          if (!isTopologyPage) {
                            e.preventDefault();
                            setGlobalTopologyId(t.id.toString());
                          }
                          setMenuOpen(false);
                        }}
                        style={{
                          padding: '12px 16px', textDecoration: 'none',
                          color: dark ? '#f0f0f2' : '#17181c',
                          fontSize: 13.5, fontWeight: 600,
                          borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                          background: globalTopologyId === t.id.toString() ? (dark ? 'rgba(0,255,255,0.1)' : 'rgba(0,255,255,0.15)') : 'transparent'
                        }}
                      >
                        {t.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{
              width: 1, height: 28,
              background: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
            }} />
          </>
        )}

        {/* Theme toggle */}
        <button
          id="theme-toggle" style={iconBtn}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {dark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>

        {/* Bell */}
        <button id="alert-bell" style={{ ...iconBtn, position: 'relative' }} title="Alerts">
          <Bell size={16} strokeWidth={2} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid ' + (dark ? '#1c1d22' : '#ffffff'),
            boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
          }} />
        </button>
      </div>
    </header>
  );
});


/* ════════════════════════════════════════════════════════════════
   BLANK PANEL
   bg: #e9eeea  |  border: rgba(0,0,0,0.06)
════════════════════════════════════════════════════════════════ */
const BlankPanel = memo(function BlankPanel({ id }: { id: string }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return (
    <div
      id={id}
      style={{
        width: '100%', height: '100%',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18,
        boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* Inner dashed inset */}
      <div style={{
        position: 'absolute', inset: 10, borderRadius: 12,
        border: `1.5px dashed ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
        pointerEvents: 'none',
      }} />
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
        writingMode: 'vertical-rl', transform: 'rotate(180deg)',
        userSelect: 'none', fontFamily: 'var(--font)',
      }}>
        blank yet to integrate grafana
      </span>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   ANALYTICS STRIP  — 160px · 3 columns
   bg: #ffffff  |  dividers: rgba(0,0,0,0.06)
   col icons: tinted pill bg (amber/lime/green)
════════════════════════════════════════════════════════════════ */
const AnalyticsStrip = memo(function AnalyticsStrip() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const { globalTopologyId } = useGlobalTopology();

  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!globalTopologyId) return;

    // Fetch initial topology nodes and their sensor values
    axios.get(`http://localhost:3001/api/topologies/${globalTopologyId}`)
      .then(res => {
        setNodes(res.data?.nodes ?? []);
      })
      .catch(console.error);

    // Dynamic updates via websocket
    const socket = io('http://localhost:3001');

    socket.on('sensor_update', (data: any) => {
      setNodes(prev => prev.map(node => {
        if (node.id.toString() !== data.nodeId.toString()) return node;
        
        // Update the sensor values inside the node
        const updatedSensors = node.sensors?.map((s: any) => {
          const match = data.sensors?.find((x: any) => x.sensorType === s.sensorType);
          if (match) {
            return { ...s, value: match.value };
          }
          return s;
        });
        return { ...node, sensors: updatedSensors };
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [globalTopologyId]);

  // Calculate current average water quality metrics across the system
  const averages = useMemo(() => {
    let levelSum = 0, levelCount = 0;
    let phSum = 0, phCount = 0;
    let tdsSum = 0, tdsCount = 0;
    let tempSum = 0, tempCount = 0;

    nodes.forEach(node => {
      node.sensors?.forEach((s: any) => {
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
      level: levelCount > 0 ? (levelSum / levelCount) : 0,
      ph: phCount > 0 ? (phSum / phCount) : 0,
      tds: tdsCount > 0 ? (tdsSum / tdsCount) : 0,
      temp: tempCount > 0 ? (tempSum / tempCount) : 0,
      hasData: levelCount > 0 || phCount > 0 || tdsCount > 0 || tempCount > 0
    };
  }, [nodes]);

  // Water Quality score logic
  const waterQualityScore = useMemo(() => {
    if (!averages.hasData) return 0;
    
    let score = 100;
    if (averages.ph > 0) {
      const phDiff = Math.abs(averages.ph - 7.2);
      if (phDiff > 0.4) score -= Math.min(30, (phDiff - 0.4) * 20);
    }
    if (averages.temp > 0) {
      const tempDiff = Math.abs(averages.temp - 23);
      if (tempDiff > 3) score -= Math.min(25, (tempDiff - 3) * 5);
    }
    if (averages.tds > 0 && averages.tds > 300) {
      score -= Math.min(30, (averages.tds - 300) * 0.1);
    }
    if (averages.level > 0 && averages.level < 20) {
      score -= (20 - averages.level) * 1.5;
    }
    return Math.max(10, Math.round(score));
  }, [averages]);

  // Flow & Throughput metrics logic
  const flowMetrics = useMemo(() => {
    const hasNodes = nodes.length > 0;
    const pumps = nodes.filter(n => n.nodeType === 'pump');
    const activePumpsCount = pumps.filter(n => n.status === 'Healthy' || n.status === 'Online').length;
    const totalPumpsCount = pumps.length;

    let flowRate = 0;
    let pressure = 0;
    let powerLoad = 0;
    let distribution = 0;

    if (hasNodes) {
      if (totalPumpsCount === 0) {
        pressure = 0.5; // Gravity flow
      } else {
        const factor = totalPumpsCount > 0 ? (activePumpsCount / totalPumpsCount) : 1;
        flowRate = 14.8 * factor;
        pressure = 3.4 * factor;
        powerLoad = 4.8 * factor;
        distribution = 1280 * factor;
      }
    }

    return { flowRate, pressure, powerLoad, distribution, hasNodes };
  }, [nodes]);

  const colCardStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 16px',
    borderRadius: 12,
    background: dark ? 'rgba(255,255,255,0.025)' : '#ffffff',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    boxShadow: dark ? 'none' : '0 6px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
    overflow: 'hidden',
  };

  return (
    <div
      id="analytics-strip"
      style={{
        height: 230, flexShrink: 0,
        display: 'flex', gap: 10, padding: 10,
        background: dark ? '#1c1d22' : '#f8fafc',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: 18, overflow: 'hidden',
      }}
    >
      {/* ── Col 1: Water Quality ── */}
      <div style={{ ...colCardStyle, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: dark ? 'rgba(0,255,255,0.10)' : 'rgba(8,145,178,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Droplets size={12} color={dark ? '#00FFFF' : '#0891b2'} strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
            color: dark ? '#f0f0f2' : '#1a1b1e',
            fontFamily: 'var(--font)',
          }}>
            Water Quality
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, height: '100%', minHeight: 0 }}>
          {/* LEFT: SVG Donut/Circle for Water Quality Score (30% width) */}
          <div style={{ width: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, position: 'relative' }}>
              <svg width="80" height="80" viewBox="0 0 88 88" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
                {/* Background track */}
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}
                  strokeWidth="7"
                />
                {/* Foreground progress path */}
                {averages.hasData && (
                  <circle
                    cx="44" cy="44" r="36"
                    fill="none"
                    stroke={dark ? '#00FFFF' : '#0891b2'}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${226.2 * (waterQualityScore / 100)} ${226.2 * (1 - waterQualityScore / 100)}`}
                    style={{ transition: 'stroke-dasharray 600ms ease' }}
                  />
                )}
              </svg>
              {/* Center text overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: averages.hasData ? 16 : 13.5, fontWeight: 800, color: dark ? '#f0f0f2' : '#1a1b1e', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {averages.hasData ? `${waterQualityScore}%` : 'N/A'}
                </span>
                <span style={{ fontSize: 7.5, fontWeight: 700, color: dark ? '#00FFFF' : '#0891b2', marginTop: 2, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {averages.hasData ? 'Optimal' : 'No Data'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: The 4 Metrics Progress Bars (70% width) */}
          <div style={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            {[
              { label: 'Avg Water Level', value: averages.hasData ? `${averages.level.toFixed(1)}%` : '0.0%', pct: averages.level, color: '#4A90D9' },
              { label: 'Avg pH Index', value: averages.hasData ? averages.ph.toFixed(2) : '0.00', pct: averages.ph > 0 ? (averages.ph / 14) * 100 : 0, color: '#7C5CFC' },
              { label: 'Avg Temperature', value: averages.hasData ? `${averages.temp.toFixed(1)}°C` : '0.0°C', pct: averages.temp > 0 ? (averages.temp / 50) * 100 : 0, color: '#E8634A' },
              { label: 'Avg TDS (Solids)', value: averages.hasData ? `${Math.round(averages.tds)} ppm` : '0 ppm', pct: averages.tds > 0 ? (averages.tds / 1000) * 100 : 0, color: '#2ECC71' },
            ].map(m => (
              <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: dark ? '#9ca3af' : '#4b5563', letterSpacing: '-0.1px' }}>{m.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#f0f0f2' : '#1a1b1e', fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
                </div>
                <div style={{ height: 3.5, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${m.pct}%`, height: '100%', borderRadius: 999, background: m.color, transition: 'width 600ms ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Col 2: Flow & Throughput ── */}
      <div style={colCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: dark ? 'rgba(0,255,255,0.10)' : 'rgba(8,145,178,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Gauge size={12} color={dark ? '#00ffff' : '#0891b2'} strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#4b5563',
            fontFamily: 'var(--font)',
          }}>
            Flow & Throughput
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          {[
            { label: 'Total Flow Rate', value: flowMetrics.hasNodes ? `${flowMetrics.flowRate.toFixed(1)} L/s` : '0.0 L/s', pct: (flowMetrics.flowRate / 30) * 100, color: '#4A90D9' },
            { label: 'System Avg Pressure', value: flowMetrics.hasNodes ? `${flowMetrics.pressure.toFixed(1)} bar` : '0.0 bar', pct: (flowMetrics.pressure / 6) * 100, color: '#7C5CFC' },
            { label: 'Active Power Load', value: flowMetrics.hasNodes ? `${flowMetrics.powerLoad.toFixed(1)} kW` : '0.0 kW', pct: (flowMetrics.powerLoad / 8) * 100, color: '#E8634A' },
            { label: 'Daily Distribution', value: flowMetrics.hasNodes ? `${Math.round(flowMetrics.distribution).toLocaleString()} m³` : '0 m³', pct: (flowMetrics.distribution / 2000) * 100, color: '#2ECC71' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, color: dark ? '#9ca3af' : '#4b5563', letterSpacing: '-0.1px' }}>{m.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#f0f0f2' : '#1a1b1e', fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
              </div>
              <div style={{ height: 3, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${m.pct}%`, height: '100%', borderRadius: 999, background: m.color, transition: 'width 600ms ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Col 3: System Activity ── */}
      <div style={colCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'rgba(34,197,94,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Server size={12} color="#22c55e" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#4b5563',
            fontFamily: 'var(--font)',
          }}>
            System Activity
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          {[
            { label: 'PostgreSQL Database', value: 'Healthy', color: '#22c55e' },
            { label: 'Backend API Service', value: 'Healthy', color: '#22c55e' },
            { label: 'Active Node Uptime', value: '99.9%', color: dark ? '#f0f0f2' : '#1a1b1e' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 2 }}>
              <span style={{ fontSize: 10.5, color: dark ? '#9ca3af' : '#4b5563', letterSpacing: '-0.1px' }}>{r.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9, color: dark ? '#4b5563' : '#9ca3af', marginTop: 'auto', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Platform Engine Online
        </p>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   ROOT LAYOUT
════════════════════════════════════════════════════════════════ */
function MainLayoutContent() {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const { globalTopologyId } = useGlobalTopology();
  const dark = theme === 'dark';
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const isFullWidthPage = pathname.startsWith('/user-management') || pathname.startsWith('/topologies');

  const outletContext = useMemo(() => ({ selectedNode, setSelectedNode }), [selectedNode]);

  return (
    <div
      id="app-root"
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', width: '100vw', overflow: 'hidden',
        background: dark ? '#111215' : '#f3f3f3',
        fontFamily: 'var(--font)',
        color: dark ? '#f0f0f2' : '#17181c',
      }}
    >
      <TopBar />

      <div
        id="body"
        style={{
          display: 'flex', flex: 1, overflow: 'hidden',
          padding: '12px 14px 14px', gap: 12, minHeight: 0,
        }}
      >
        <Sidebar />

        {/* Left panel — hide on full width pages */}
        {!isFullWidthPage && (
          <div style={{ width: 290, flexShrink: 0, display: 'flex' }}>
            {pathname.startsWith('/topology') ? (
              <LiveChartsPanel topologyId={globalTopologyId} selectedNode={selectedNode} />
            ) : (
              <BlankPanel id="left-panel" />
            )}
          </div>
        )}

        {/* Center column */}
        <div
          id="center-col"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0 }}
        >
          {/* Main visualization / page content */}
          <div
            id="visualization-panel"
            style={{
              flex: 1, minHeight: 0,
              background: isFullWidthPage ? 'transparent' : (dark ? '#1c1d22' : '#ffffff'),
              border: isFullWidthPage ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: isFullWidthPage ? 0 : 18, overflow: 'hidden', position: 'relative',
              boxShadow: isFullWidthPage ? 'none' : (dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)'),
            }}
          >
            <Outlet context={outletContext} />
          </div>

          {/* Analytics strip — hide on full width pages */}
          {!isFullWidthPage && <AnalyticsStrip />}
        </div>

        {/* Right panel — hide on full width pages */}
        {!isFullWidthPage && (
          <div style={{ width: 290, flexShrink: 0, display: 'flex' }}>
            <SystemHealthPanel topologyId={globalTopologyId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainLayout() {
  const [globalTopologyId, setGlobalTopologyId] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/topology/')) {
        const parts = path.split('/');
        const id = parts[parts.indexOf('topology') + 1];
        if (id) return id;
      }
    }
    return '1';
  });
  return (
    <TopologyContext.Provider value={{ globalTopologyId, setGlobalTopologyId }}>
      <MainLayoutContent />
    </TopologyContext.Provider>
  );
}
