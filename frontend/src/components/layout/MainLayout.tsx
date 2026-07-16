import { Outlet } from 'react-router-dom';
import { useState, useMemo, memo, useEffect, createContext, useContext } from 'react';
const TopologyContext = createContext<{ globalTopologyId: string; setGlobalTopologyId: (id: string) => void; }>({ globalTopologyId: '1', setGlobalTopologyId: () => { } });
export const useGlobalTopology = () => useContext(TopologyContext);
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, Bell, LogOut,
  Activity, LayoutDashboard, BarChart2,
  Moon, Sun, Droplets,
  Wifi, Server, AlertTriangle, Users,
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../../hooks/useAuth';

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
    border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
    background: dark ? '#2a2b34' : '#e8e8e8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    color: dark ? '#9ca3af' : '#5a5f6b',
    transition: 'background 0.15s',
  };

  return (
    <header
      id="topbar"
      style={{
        height: 70, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        background: dark ? '#1c1d22' : '#ffffff',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
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
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
                  background: dark ? '#2a2b34' : '#e8e8e8',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: '#00ffff',
                  boxShadow: '0 0 7px rgba(0,255,255,0.6)',
                }} />
                <span style={{
                  fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.2px',
                  color: dark ? '#f0f0f2' : '#17181c',
                  fontFamily: 'var(--font)',
                }}>
                  {currentTopology ? currentTopology.name : 'Loading...'}
                </span>
                <ChevronDown size={13} strokeWidth={2.8} color={dark ? '#6b7280' : '#6b7280'} />
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
  return (
    <div
      id="analytics-strip"
      style={{
        height: 200, flexShrink: 0,
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* ── Col 1: Alerts ── */}
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(245,158,11,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={14} color="#f59e0b" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: '#9ca3af',
            fontFamily: 'var(--font)',
          }}>
            Recent Alerts
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            { time: '14:02', msg: 'T2 pH warning (6.4)', dot: '#f59e0b' },
            { time: '13:45', msg: 'P1 flow fluctuation', dot: '#9ca3af' },
          ].map(r => (
            <div key={r.time} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#17181c', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.1px' }}>
                {r.time}
              </span>
              <span style={{ fontSize: 12, color: dark ? '#9ca3af' : '#5a5f6b', letterSpacing: '-0.1px' }}>{r.msg}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9.5, color: dark ? '#4b5563' : '#d1d5db', marginTop: 'auto', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          blank · will update later
        </p>
      </div>

      {/* Divider */}
      <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', margin: '18px 0' }} />

      {/* ── Col 2: MQTT ── */}
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(0,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wifi size={14} color="#7fb200" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: '#9ca3af',
            fontFamily: 'var(--font)',
          }}>
            MQTT Status
          </span>
        </div>
        {[
          { label: 'Connection', value: 'Connected', color: '#22c55e', dot: true },
          { label: 'Message rate', value: '12 msg/s', color: dark ? '#f0f0f2' : '#17181c', dot: false },
          { label: 'Topics', value: '3 active', color: dark ? '#f0f0f2' : '#17181c', dot: false },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: dark ? '#9ca3af' : '#5a5f6b', letterSpacing: '-0.1px' }}>{r.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: r.color }}>
              {r.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />}
              {r.value}
            </span>
          </div>
        ))}
        <p style={{ fontSize: 9.5, color: dark ? '#4b5563' : '#d1d5db', marginTop: 'auto', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          blank · will update later
        </p>
      </div>

      {/* Divider */}
      <div style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', margin: '18px 0' }} />

      {/* ── Col 3: System ── */}
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(34,197,94,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Server size={14} color="#22c55e" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: '#9ca3af',
            fontFamily: 'var(--font)',
          }}>
            System Activity
          </span>
        </div>
        {[
          { label: 'PostgreSQL', value: 'Healthy', color: '#22c55e' },
          { label: 'Backend API', value: 'Healthy', color: '#22c55e' },
          { label: 'Node uptime', value: '99.9%', color: dark ? '#f0f0f2' : '#17181c' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: dark ? '#9ca3af' : '#5a5f6b', letterSpacing: '-0.1px' }}>{r.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: r.color }}>{r.value}</span>
          </div>
        ))}
        <p style={{ fontSize: 9.5, color: dark ? '#4b5563' : '#d1d5db', marginTop: 'auto', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          blank · will update later
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

        {/* Left blank panel — hide on full width pages */}
        {!isFullWidthPage && (
          <div style={{ width: 270, flexShrink: 0, display: 'flex' }}>
            <BlankPanel id="left-panel" />
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

        {/* Right blank panel — hide on full width pages */}
        {!isFullWidthPage && (
          <div style={{ width: 270, flexShrink: 0, display: 'flex' }}>
            <BlankPanel id="right-panel" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainLayout() {
  const [globalTopologyId, setGlobalTopologyId] = useState('1');
  return (
    <TopologyContext.Provider value={{ globalTopologyId, setGlobalTopologyId }}>
      <MainLayoutContent />
    </TopologyContext.Provider>
  );
}
