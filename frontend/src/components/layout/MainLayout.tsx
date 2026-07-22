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
  Server, Users, Gauge,
  Zap, Sliders,
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import LiveChartsPanel from '../live/LiveChartsPanel';
import SystemHealthPanel from '../live/SystemHealthPanel';
import AlertsModal, { type AlertItem } from '../live/AlertsModal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

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

  // Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);

  const unreadCount = useMemo(() => alerts.filter(a => !a.isRead).length, [alerts]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/topologies')
      .then(res => setTopologies(res.data))
      .catch(err => console.error(err));
  }, [pathname]);

  // Initial Alert Fetching
  useEffect(() => {
    axios.get('http://localhost:3001/api/alerts')
      .then(res => {
        setAlerts(res.data);
      })
      .catch(err => console.error('Failed to fetch initial alerts:', err));
  }, []);

  // WebSockets for Real-Time Alerts
  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket'] });

    socket.on('alert:new', (newAlert: AlertItem) => {
      setAlerts(prev => [{ ...newAlert, isRead: false }, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  const handleOpenAlertsModal = () => {
    setIsAlertsModalOpen(true);
  };

  const handleClearAllAlerts = async () => {
    try {
      await axios.put('http://localhost:3001/api/alerts/clear');
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (err) {
      console.error('Failed to clear active alerts:', err);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await axios.patch(`http://localhost:3001/api/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  return (
    <>
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
            id="theme-toggle"
            className="modern-header-btn"
            style={iconBtn}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {dark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>

          {/* Bell button with Notification Badge */}
          <button
            id="alert-bell"
            className="modern-header-btn"
            onClick={handleOpenAlertsModal}
            style={{
              ...iconBtn,
              position: 'relative',
              borderColor: unreadCount > 0 ? (dark ? 'rgba(234, 179, 8, 0.45)' : 'rgba(234, 179, 8, 0.35)') : iconBtn.borderColor,
              background: unreadCount > 0 ? (dark ? 'rgba(234, 179, 8, 0.10)' : 'rgba(234, 179, 8, 0.05)') : iconBtn.background,
            }}
            title="System Alerts & Incident Log"
          >
            <Bell
              size={17}
              strokeWidth={2}
              className={unreadCount > 0 ? 'animate-bell-swing' : ''}
              color={unreadCount > 0 ? '#eab308' : (dark ? '#9ca3af' : '#5a5f6b')}
            />
            {unreadCount > 0 && (
              <span
                className="animate-badge-pulse"
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  minWidth: 19,
                  height: 19,
                  padding: '0 5px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${dark ? '#1c1d22' : '#ffffff'}`,
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.5)',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Modern System Alerts Center Center-Modal */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        unreadCount={unreadCount}
        onClearAll={handleClearAllAlerts}
        onDismissAlert={handleDeleteAlert}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
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

    socket.on('node:status_update', (data: { id: number; status: string }) => {
      setNodes(prev => prev.map(node => {
        if (node.id === data.id) {
          return { ...node, status: data.status };
        }
        return node;
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

  const [topology, setTopology] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodeMap, setNodeMap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, any[]>>({
    T1: [], T2: [], T3: [], T4: [], CENTRAL: [], PUMP: []
  });
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const idFromUrl = pathname.startsWith('/topology/') ? pathname.split('/')[2] : null;

  // Sync active topology details
  useEffect(() => {
    if (idFromUrl) {
      axios.get(`http://localhost:3001/api/topologies/${idFromUrl}`)
        .then(res => setTopology(res.data))
        .catch(err => console.error(err));
    } else {
      setTopology(null);
    }
  }, [idFromUrl]);

  // Fetch initial nodes for Hydroponic Topology
  useEffect(() => {
    if (topology && topology.name.toLowerCase().includes('hydroponic')) {
      const fetchInitialData = async () => {
        try {
          const nodesRes = await axios.get(`http://localhost:3001/api/nodes`);
          const hydroNodes = nodesRes.data.filter((n: any) => n.topologyId === topology.id);
          setNodes(hydroNodes);

          const mapping: Record<string, string> = {};
          const seededHistory: Record<string, any[]> = {};

          hydroNodes.forEach((node: any) => {
            let slug = node.nodeName.toUpperCase();
            if (slug.includes('PUMP')) slug = 'PUMP';
            else if (slug.includes('CENTRAL')) slug = 'CENTRAL';
            mapping[node.id] = slug;

            // Generate seed data
            const ph = node.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
            const tds = node.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 920;
            const turbidity = node.sensors?.find((s: any) => s.sensorType === 'turbidity')?.value ?? 12.0;
            const water_temp = node.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
            const air_temp = node.sensors?.find((s: any) => s.sensorType === 'air_temp')?.value ?? 28.7;
            const light_intensity = node.sensors?.find((s: any) => s.sensorType === 'light_intensity')?.value ?? 350;

            seededHistory[slug] = generateSeedData({ ph, tds, turbidity, water_temp, air_temp, light_intensity });
          });

          setNodeMap(mapping);
          setHistory(seededHistory);
        } catch (err) {
          console.error('Hydro initial fetch error:', err);
        }
      };

      fetchInitialData();
    }
  }, [topology]);

  // WebSocket listeners for Hydroponic Topology
  useEffect(() => {
    if (topology && topology.name.toLowerCase().includes('hydroponic') && Object.keys(nodeMap).length > 0) {
      const socket = io('http://localhost:3001');

      socket.on('sensor_update', (data) => {
        setNodes(prev => prev.map(node => {
          if (node.id === data.nodeId) {
            return { ...node, status: data.status, sensors: data.sensors };
          }
          return node;
        }));

        setHistory(prev => {
          const slug = nodeMap[data.nodeId] || data.nodeId;
          const prevList = prev[slug] || [];

          const ph = data.sensors.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
          const tds = data.sensors.find((s: any) => s.sensorType === 'tds')?.value ?? 920;
          const turbidity = data.sensors.find((s: any) => s.sensorType === 'turbidity')?.value ?? 12.0;
          const water_temp = data.sensors.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
          const air_temp = data.sensors.find((s: any) => s.sensorType === 'air_temp')?.value ?? 28.7;
          const light_intensity = data.sensors.find((s: any) => s.sensorType === 'light_intensity')?.value ?? 350;

          const nextList = [...prevList, {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            ph, tds, turbidity, water_temp, air_temp, light_intensity
          }].slice(-15);

          return { ...prev, [slug]: nextList };
        });

        // Update selectedNode state in real-time
        setSelectedNode((prev: any) => {
          if (prev && prev.id === data.nodeId) {
            const ph = data.sensors.find((s: any) => s.sensorType === 'ph')?.value;
            const tds = data.sensors.find((s: any) => s.sensorType === 'tds')?.value;
            const turbidity = data.sensors.find((s: any) => s.sensorType === 'turbidity')?.value;
            const water_temp = data.sensors.find((s: any) => s.sensorType === 'water_temp')?.value;
            const air_temp = data.sensors.find((s: any) => s.sensorType === 'air_temp')?.value;
            const light_intensity = data.sensors.find((s: any) => s.sensorType === 'light_intensity')?.value;
            return {
              ...prev,
              ph,
              tds,
              turbidity,
              water_temp,
              air_temp,
              light_intensity,
              status: data.status,
              sensors: data.sensors
            };
          }
          return prev;
        });

        setLiveLogs(prevLogs => {
          const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const slug = nodeMap[data.nodeId] || data.nodeId;
          
          const ph = data.sensors.find((s: any) => s.sensorType === 'ph')?.value;
          const tds = data.sensors.find((s: any) => s.sensorType === 'tds')?.value;
          
          let msg = `[${timeStr}] ${slug}:`;
          if (ph !== undefined) msg += ` pH=${Number(ph).toFixed(2)}`;
          if (tds !== undefined) msg += ` TDS=${Number(tds).toFixed(0)}ppm`;
          
          if (ph === undefined && tds === undefined) {
            msg += ` status=${data.status}`;
          }
          
          return [msg, ...prevLogs].slice(0, 5);
        });
      });

      socket.on('node:status_update', (data) => {
        setNodes(prev => prev.map(node => {
          if (node.id === data.id) {
            return { ...node, status: data.status };
          }
          return node;
        }));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [topology, nodeMap]);

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
            {topology?.name.toLowerCase().includes('hydroponic') ? (
              <TelemetryPanel
                selectedNode={selectedNode}
                history={history}
                dark={dark}
                nodes={nodes}
              />
            ) : pathname.startsWith('/topology') ? (
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
          {!isFullWidthPage && (
            topology?.name.toLowerCase().includes('hydroponic') ? (
              <HydroponicAnalyticsStrip
                dark={dark}
                history={history}
                selectedNode={selectedNode}
                nodeMap={nodeMap}
              />
            ) : (
              <AnalyticsStrip />
            )
          )}
        </div>

        {/* Right panel — hide on full width pages */}
        {!isFullWidthPage && (
          <div style={{ width: 290, flexShrink: 0, display: 'flex' }}>
            {topology?.name.toLowerCase().includes('hydroponic') ? (
              <KPIDashboardPanel
                selectedNode={selectedNode}
                nodes={nodes}
                dark={dark}
                liveLogs={liveLogs}
              />
            ) : (
              <SystemHealthPanel topologyId={globalTopologyId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HYDROPONICS TELEMETRY PANEL (Left panel)
   ════════════════════════════════════════════════════════════════ */
interface TelemetryPanelProps {
  selectedNode: any;
  history: Record<string, any[]>;
  dark: boolean;
  nodes: any[];
}

function TelemetryPanel({ selectedNode, history, dark, nodes }: TelemetryPanelProps) {
  const [valveOpen, setValveOpen] = useState(true);
  const [muted, setMuted] = useState(false);

  const activeNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    return nodes.find(n => n.nodeType === 'central_tank') || nodes[0] || null;
  }, [selectedNode, nodes]);

  const slug = useMemo(() => {
    if (!activeNode) return 'CENTRAL';
    let s = activeNode.nodeName.toUpperCase();
    if (s.includes('PUMP')) return 'PUMP';
    if (s.includes('CENTRAL')) return 'CENTRAL';
    return s;
  }, [activeNode]);

  const ph = activeNode?.ph ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
  const tds = activeNode?.tds ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 920;
  const turbidity = activeNode?.turbidity ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'turbidity')?.value ?? 12.0;
  const water_temp = activeNode?.water_temp ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
  const air_temp = activeNode?.air_temp ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'air_temp')?.value ?? 28.7;
  const light_intensity = activeNode?.light_intensity ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'light_intensity')?.value ?? 350;

  const chartData = history[slug] || [];

  const renderSparkline = (id: string, label: string, value: string | number, dataKey: string, color: string) => {
    return (
      <div
        key={id}
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: dark ? '#22232a' : '#f9f9f9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 70
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b' }}>{label}</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: dark ? '#ffffff' : '#17181c' }}>{value}</span>
        </div>
        <div style={{ height: 38, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={1.5}
                fillOpacity={1}
                fill={`url(#gradient-${id})`}
                isAnimationActive={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 12px',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
        <span style={{
          fontSize: 12, fontWeight: 850, letterSpacing: '-0.3px', color: dark ? '#f0f0f2' : '#17181c',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
        }} title={activeNode ? activeNode.nodeName : 'Hydroponic System'}>
          {activeNode ? activeNode.nodeName : 'Hydroponic System'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {renderSparkline('ph', 'pH Level', Number(ph).toFixed(2), 'ph', '#00e5a0')}
        {renderSparkline('tds', 'TDS Level', `${Number(tds).toFixed(0)} ppm`, 'tds', '#00aaff')}
        {renderSparkline('turbidity', 'Turbidity', `${Number(turbidity).toFixed(1)} NTU`, 'turbidity', '#00d4c8')}
        {renderSparkline('water_temp', 'Water Temp', `${Number(water_temp).toFixed(1)} °C`, 'water_temp', '#ffb347')}
        {renderSparkline('air_temp', 'Air Temp', `${Number(air_temp).toFixed(1)} °C`, 'air_temp', '#c08aff')}
        {renderSparkline('light_intensity', 'Light Intensity', `${Number(light_intensity).toFixed(0)} lux`, 'light_intensity', '#ffe066')}
      </div>

      {/* Bottom Node Diagnostics Card */}
      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 12,
          background: dark ? '#22232a' : '#f9f9f9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Node Diagnostics</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: dark ? '#9ca3af' : '#5a5f6b' }}>Type</span>
            <span style={{ fontWeight: 750, color: dark ? '#ffffff' : '#17181c', textTransform: 'capitalize' }}>{activeNode?.nodeType === 'pump' ? 'System Pump' : (activeNode?.nodeType === 'central_tank' ? 'Central Reservoir' : 'Sub-Tank')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: dark ? '#9ca3af' : '#5a5f6b' }}>Position</span>
            <span style={{ fontWeight: 750, color: dark ? '#ffffff' : '#17181c' }}>X: {activeNode?.positionX ?? 0}, Y: {activeNode?.positionY ?? 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: dark ? '#9ca3af' : '#5a5f6b' }}>Link Status</span>
            <span style={{ fontWeight: 750, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 5px #22c55e' }} />
              Active
            </span>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingTop: 6, marginTop: 2 }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Actuators</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setValveOpen(!valveOpen)}
              style={{
                flex: 1, fontSize: 8.5, fontWeight: 800, padding: '4px 0', borderRadius: 5, cursor: 'pointer',
                border: 'none', background: valveOpen ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: valveOpen ? '#22c55e' : '#ef4444', transition: 'all 0.12s'
              }}
            >
              Valve: {valveOpen ? 'OPEN' : 'CLOSE'}
            </button>
            <button
              onClick={() => setMuted(!muted)}
              style={{
                flex: 1, fontSize: 8.5, fontWeight: 800, padding: '4px 0', borderRadius: 5, cursor: 'pointer',
                border: 'none', background: muted ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)',
                color: muted ? '#f59e0b' : (dark ? '#9ca3af' : '#5a5f6b'), transition: 'all 0.12s'
              }}
            >
              Alerts: {muted ? 'MUTED' : 'LIVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HYDROPONICS KPI DASHBOARD PANEL (Right panel)
   ════════════════════════════════════════════════════════════════ */
interface KPIDashboardPanelProps {
  selectedNode: any;
  nodes: any[];
  dark: boolean;
  liveLogs: string[];
}

function KPIDashboardPanel({ selectedNode, nodes, dark, liveLogs }: KPIDashboardPanelProps) {
  const activeNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    return nodes.find(n => n.nodeType === 'central_tank') || nodes[0] || null;
  }, [selectedNode, nodes]);

  const pumpNode = useMemo(() => {
    return nodes.find(n => n.nodeType === 'pump') || null;
  }, [nodes]);

  const pumpStatus = pumpNode?.status || 'Healthy';

  const ph = activeNode?.ph ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
  const temp = activeNode?.water_temp ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
  const tds = activeNode?.tds ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 920;

  const avgMetrics = useMemo(() => {
    const tankNodes = nodes.filter(n => n.nodeType === 'tank' || n.nodeType === 'central_tank');
    if (tankNodes.length === 0) return { ph: 6.35, tds: 920, temp: 22.4 };
    
    let sumPh = 0, sumTds = 0, sumTemp = 0, count = 0;
    tankNodes.forEach(n => {
      const phVal = n.ph ?? n.sensors?.find((s: any) => s.sensorType === 'ph')?.value;
      const tdsVal = n.tds ?? n.sensors?.find((s: any) => s.sensorType === 'tds')?.value;
      const tempVal = n.water_temp ?? n.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value;
      
      if (phVal !== undefined) { sumPh += Number(phVal); count++; }
      if (tdsVal !== undefined) sumTds += Number(tdsVal);
      if (tempVal !== undefined) sumTemp += Number(tempVal);
    });

    return {
      ph: count > 0 ? (sumPh / count) : 6.35,
      tds: count > 0 ? (sumTds / count) : 920,
      temp: count > 0 ? (sumTemp / count) : 22.4
    };
  }, [nodes]);

  const waterQualityScore = useMemo(() => {
    if (!activeNode || activeNode.nodeType === 'pump') return 95;
    const phDiff = Math.abs(ph - 6.35);
    const phPenalty = phDiff * 30;

    const tdsDiff = Math.max(0, Math.abs(tds - 920) - 100);
    const tdsPenalty = tdsDiff * 0.1;

    const tempDiff = Math.max(0, Math.abs(temp - 22.4) - 2);
    const tempPenalty = tempDiff * 3;

    return Math.max(45, Math.round(100 - phPenalty - tdsPenalty - tempPenalty));
  }, [activeNode, ph, tds, temp]);

  const wqColor = waterQualityScore > 85 ? '#22c55e' : (waterQualityScore > 70 ? '#f59e0b' : '#ef4444');
  const wqText = waterQualityScore > 85 ? 'Excellent' : (waterQualityScore > 70 ? 'Warning' : 'Critical');

  const flowRate = useMemo(() => {
    if (pumpStatus.toLowerCase() === 'healthy' || pumpStatus.toLowerCase() === 'online') {
      return Number((14.6 + (Math.random() - 0.5) * 0.2).toFixed(1));
    } else if (pumpStatus.toLowerCase() === 'warning') {
      return Number((8.4 + (Math.random() - 0.5) * 0.3).toFixed(1));
    } else {
      return 0.0;
    }
  }, [pumpStatus]);

  const pressure = flowRate > 0 ? Number((1.8 * (flowRate / 14.6)).toFixed(1)) : 0.0;
  const efficiency = flowRate > 0 ? Math.round((flowRate / 14.6) * 83) : 0;
  const flowStatus = flowRate > 12 ? 'Normal' : (flowRate > 0 ? 'Low' : 'Zero');
  const flowColor = flowRate > 12 ? '#22c55e' : (flowRate > 0 ? '#f59e0b' : '#ef4444');

  const nutrientIndex = useMemo(() => {
    if (!activeNode || activeNode.nodeType === 'pump') return 92;
    const variance = Math.max(0, Math.min(15, Math.round(Math.abs(tds - 920) / 15)));
    return 95 - variance;
  }, [activeNode, tds]);

  const nutColor = nutrientIndex > 85 ? '#22c55e' : (nutrientIndex > 70 ? '#f59e0b' : '#ef4444');
  const nutText = nutrientIndex > 85 ? 'Excellent' : (nutrientIndex > 70 ? 'Warning' : 'Critical');

  const systemHealthMetrics = useMemo(() => {
    const total = nodes.length || 6;
    const healthy = nodes.filter(n => n.status?.toLowerCase() === 'healthy' || n.status?.toLowerCase() === 'online').length;
    const warning = nodes.filter(n => n.status?.toLowerCase() === 'warning').length;
    const critical = nodes.filter(n => n.status?.toLowerCase() === 'critical').length;
    const offline = nodes.filter(n => n.status?.toLowerCase() === 'offline' || n.status?.toLowerCase() === 'error').length;
    const score = Math.round((healthy / total) * 100);

    return { total, healthy, warning, critical, offline, score };
  }, [nodes]);

  const renderGauge = (title: string, score: number, color: string, statusText: string, items: Array<{ name: string; val: string | number }>) => {
    const radius = 18;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;

    return (
      <div
        key={title}
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: dark ? '#22232a' : '#f9f9f9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 80
        }}
      >
        <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, marginTop: 2 }}>
          {/* SVG Gauge */}
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r={radius} fill="transparent" stroke={dark ? '#1c1d22' : '#e6e6e6'} strokeWidth="4" />
              <circle cx="22" cy="22" r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 22 22)" style={{ transition: 'stroke-dashoffset 0.3s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.05 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: dark ? '#ffffff' : '#17181c' }}>{score}%</span>
              <span style={{ fontSize: 5.5, fontWeight: 600, textTransform: 'uppercase', color }}>{statusText}</span>
            </div>
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {items.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5 }}>
                <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span style={{ fontWeight: 750, color: dark ? '#f0f0f2' : '#17181c' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 12px',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 850, letterSpacing: '-0.3px', color: dark ? '#f0f0f2' : '#17181c' }}>KPI Dashboards</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {renderGauge('Water Quality Score', waterQualityScore, wqColor, wqText, [
          { name: 'pH Balance', val: `${Math.round(100 - Math.abs(ph - 6.35) * 30)}%` },
          { name: 'TDS Balance', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(tds - 920) - 100) * 0.15))}%` },
          { name: 'Temp Balance', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(temp - 22.4) - 2) * 2.5))}%` }
        ])}

        <div
          key="flow"
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: dark ? '#22232a' : '#f9f9f9',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            minHeight: 80
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Flow Analysis</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: flowColor }}>{flowRate} L/min</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 9.5, flex: 1, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', background: dark ? '#1c1d22' : '#ffffff', padding: '4px 6px', borderRadius: 6, alignItems: 'center' }}>
              <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', fontSize: 7.5 }}>Status</span>
              <span style={{ fontWeight: 800, color: flowColor, marginTop: 1 }}>{flowStatus}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', background: dark ? '#1c1d22' : '#ffffff', padding: '4px 6px', borderRadius: 6, alignItems: 'center' }}>
              <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', fontSize: 7.5 }}>Pressure</span>
              <span style={{ fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', marginTop: 1 }}>{pressure} bar</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', background: dark ? '#1c1d22' : '#ffffff', padding: '4px 6px', borderRadius: 6, alignItems: 'center' }}>
              <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', fontSize: 7.5 }}>Efficiency</span>
              <span style={{ fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', marginTop: 1 }}>{efficiency}%</span>
            </div>
          </div>
        </div>

        {renderGauge('Nutrient Quality Index', nutrientIndex, nutColor, nutText, [
          { name: 'pH Stability', val: `${Math.round(100 - Math.abs(ph - 6.35) * 15)}%` },
          { name: 'TDS Level', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(tds - 920) - 100) * 0.15))}%` },
          { name: 'Water Temp', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(temp - 22.4) - 2) * 2.5))}%` }
        ])}

        {renderGauge('System Health', systemHealthMetrics.score, systemHealthMetrics.score > 80 ? '#22c55e' : (systemHealthMetrics.score > 50 ? '#f59e0b' : '#ef4444'), systemHealthMetrics.score > 80 ? 'Healthy' : 'Warning', [
          { name: 'Healthy Nodes', val: `${systemHealthMetrics.healthy}/${systemHealthMetrics.total}` },
          { name: 'Warnings', val: systemHealthMetrics.warning },
          { name: 'Critical/Offline', val: systemHealthMetrics.critical + systemHealthMetrics.offline }
        ])}
      </div>

      {/* Bottom Live Logs Card */}
      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 12,
          background: dark ? '#22232a' : '#f9f9f9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0,
          minHeight: 120
        }}
      >
        <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Terminal Logs</span>
        <div
          style={{
            flex: 1,
            background: dark ? '#111215' : '#1e1e1e',
            borderRadius: 8,
            padding: '6px 8px',
            fontFamily: 'monospace',
            fontSize: 8.5,
            color: '#4ade80',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            lineHeight: 1.2,
            textAlign: 'left'
          }}
        >
          {liveLogs.length > 0 ? (
            liveLogs.map((log, idx) => (
              <div key={idx} style={{ wordBreak: 'break-all', opacity: Math.max(0.25, 1 - idx * 0.15) }}>
                {log}
              </div>
            ))
          ) : (
            <div style={{ color: '#888' }}>Waiting for MQTT logs...</div>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: dark ? '#9ca3af' : '#5a5f6b' }}>
          <span>Avg pH: <strong>{Number(avgMetrics.ph).toFixed(2)}</strong></span>
          <span>Avg TDS: <strong>{Math.round(avgMetrics.tds)}</strong></span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HYDROPONICS ANALYTICS STRIP
   ════════════════════════════════════════════════════════════════ */
interface HydroponicAnalyticsStripProps {
  dark: boolean;
  history: Record<string, any[]>;
  selectedNode: any;
  nodeMap: Record<string, string>;
}

function HydroponicAnalyticsStrip({
  dark,
  history,
  selectedNode,
  nodeMap
}: HydroponicAnalyticsStripProps) {
  const activeSlug = selectedNode ? nodeMap[selectedNode.id] || 'CENTRAL' : 'CENTRAL';
  const dataList = history[activeSlug] || [];
  
  const latest = dataList.length > 0 ? dataList[dataList.length - 1] : { ph: 6.35, tds: 920, water_temp: 22.4, light_intensity: 350, flow_rate: 14.5, pump_status: 'normal' };
  
  const waterConsumed = (latest.flow_rate || 14.5) * 1.1 + 2.5;
  const nutrientDosed = (latest.tds || 920) * 0.045 + 5.2;
  const powerUsed = (latest.light_intensity || 350) * 0.8 + 80;

  return (
    <div
      id="hydroponic-analytics-strip"
      style={{
        height: 180, flexShrink: 0,
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* ── Col 1: Water Resource Monitor ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Droplets size={13} color="#3b82f6" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#5a5f6b',
            fontFamily: 'var(--font)',
          }}>
            Water Resource Monitor
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Est. Daily Consumption</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {waterConsumed.toFixed(1)} L
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Telemetry Flow Rate</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {(latest.flow_rate || 14.5).toFixed(1)} L/m
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Supply Line Status</span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
              Optimal
            </span>
          </div>
        </div>

        <div style={{ height: 24, width: '100%', marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataList.slice(-10)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="water_temp" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#grad-water)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

      {/* ── Col 2: Auto-Dosing Telemetry ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sliders size={13} color="#10b981" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#5a5f6b',
            fontFamily: 'var(--font)',
          }}>
            Auto-Dosing Telemetry
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Nutrients Fed Today</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {nutrientDosed.toFixed(1)} g
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>pH Regulator Dosed</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {(Math.abs(latest.ph - 6.35) * 8 + 2.1).toFixed(1)} mL
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Dosing Pumps Status</span>
            <span style={{ color: latest.ph < 6.0 || latest.ph > 6.8 ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: latest.ph < 6.0 || latest.ph > 6.8 ? '#f59e0b' : '#10b981' }} />
              {latest.ph < 6.0 || latest.ph > 6.8 ? 'Adjusting pH' : 'Optimal pH'}
            </span>
          </div>
        </div>

        <div style={{ height: 24, width: '100%', marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataList.slice(-10)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-nutrient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="tds" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#grad-nutrient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

      {/* ── Col 3: Utility & Energy Grid ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(245,158,11,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={13} color="#f59e0b" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#5a5f6b',
            fontFamily: 'var(--font)',
          }}>
            Utility & Energy Grid
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Lighting Draw</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {powerUsed.toFixed(0)} W
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Pump Consumption</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {latest.pump_status !== 'off' ? '45 W' : '0 W'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Daily Power Usage</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {((powerUsed + (latest.pump_status !== 'off' ? 45 : 0)) * 0.024).toFixed(2)} kWh
            </span>
          </div>
        </div>

        <div style={{ height: 24, width: '100%', marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataList.slice(-10)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-power" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="light_intensity" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#grad-power)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const generateSeedData = (baseVal: { ph: number; tds: number; turbidity: number; water_temp: number; air_temp: number; light_intensity: number }) => {
  const data = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 2000);
    data.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ph: Number((baseVal.ph + (Math.random() - 0.5) * 0.05).toFixed(2)),
      tds: Number((baseVal.tds + (Math.random() - 0.5) * 10).toFixed(0)),
      turbidity: Number((baseVal.turbidity + (Math.random() - 0.5) * 1.0).toFixed(1)),
      water_temp: Number((baseVal.water_temp + (Math.random() - 0.5) * 0.15).toFixed(1)),
      air_temp: Number((baseVal.air_temp + (Math.random() - 0.5) * 0.2).toFixed(1)),
      light_intensity: Number((baseVal.light_intensity + (Math.random() - 0.5) * 15).toFixed(0))
    });
  }
  return data;
};

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
