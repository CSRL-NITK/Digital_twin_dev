import { useState } from 'react';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle2,
  X, Search, CheckCheck, Clock, ExternalLink,
  MapPin, Radio
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { useGlobalTopology } from '../layout/MainLayout';

export interface AlertItem {
  id: number;
  nodeId: number;
  nodeName?: string;
  nodeType?: string;
  topologyId?: number;
  topologyName?: string;
  alertType: string;
  severity: 'Critical' | 'Warning' | 'Info' | string;
  message: string;
  isRead?: boolean;
  createdAt: string;
  isNew?: boolean;
}

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  unreadCount: number;
  onClearAll: () => Promise<void> | void;
  onDismissAlert: (id: number) => Promise<void> | void;
  onMarkAllRead: () => void;
}

export default function AlertsModal({
  isOpen,
  onClose,
  alerts,
  unreadCount,
  onClearAll,
  onDismissAlert,
  onMarkAllRead: _onMarkAllRead,
}: AlertsModalProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();
  const { setGlobalTopologyId } = useGlobalTopology();

  const [viewScope, setViewScope] = useState<'active' | 'history'>('active');
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  // Filter alerts based on active vs history scope
  const scopedAlerts = alerts.filter((item) => {
    if (viewScope === 'active') {
      return !item.isRead;
    }
    return true;
  });

  const filteredAlerts = scopedAlerts.filter((item) => {
    const sev = item.severity?.toLowerCase() || '';
    if (activeTab === 'critical' && sev !== 'critical') return false;
    if (activeTab === 'warning' && sev !== 'warning') return false;
    if (activeTab === 'info' && (sev === 'critical' || sev === 'warning')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.nodeName?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchType = item.alertType?.toLowerCase().includes(q);
      const matchTopo = item.topologyName?.toLowerCase().includes(q);
      return matchName || matchMsg || matchType || matchTopo;
    }
    return true;
  });

  const criticalCount = scopedAlerts.filter((a) => a.severity?.toLowerCase() === 'critical').length;
  const warningCount = scopedAlerts.filter((a) => a.severity?.toLowerCase() === 'warning').length;
  const infoCount = scopedAlerts.length - criticalCount - warningCount;

  const handleInspectNode = (topologyId?: number, nodeId?: number) => {
    if (topologyId) {
      setGlobalTopologyId(topologyId.toString());
      navigate(`/topology/${topologyId}?highlight=${nodeId || ''}`);
    } else {
      navigate('/dashboard');
    }
    onClose();
  };

  const handleClearAllClick = async () => {
    setIsClearing(true);
    await onClearAll();
    setIsClearing(false);
  };

  const formatTimeAgo = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  const formatExactDate = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate().toString().padStart(2, '0');
    const time = d.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return `${month} ${day}, ${time}`;
  };

  const cleanAlertMessage = (msg: string) => {
    if (!msg) return '';
    return msg
      .replace(/Hydroponic Node\s+[A-Za-z0-9_-]+\s+/gi, 'System ')
      .replace(/Node\s+[A-Za-z0-9_-]+\s+transitioned to/gi, 'System status transitioned to')
      .replace(/Node\s+#?\d+\s+transitioned to/gi, 'System status transitioned to')
      .replace(/Node\s+[A-Za-z0-9_-]+\s+/gi, '');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dark ? 'rgba(5, 7, 12, 0.75)' : 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          height: '88vh',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: dark ? '#15171d' : '#ffffff',
          borderRadius: 20,
          border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)'}`,
          boxShadow: dark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 255, 255, 0.08)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'}`,
            background: dark
              ? 'linear-gradient(180deg, rgba(28, 30, 38, 0.9) 0%, rgba(21, 23, 29, 0.9) 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                position: 'relative',
                width: 44,
                height: 44,
                borderRadius: 14,
                background: unreadCount > 0
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: unreadCount > 0 ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none',
              }}
            >
              <Bell size={22} color={unreadCount > 0 ? '#ffffff' : dark ? '#9ca3af' : '#475569'} strokeWidth={2.2} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid ' + (dark ? '#15171d' : '#ffffff'),
                  }}
                />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: dark ? '#f8fafc' : '#0f172a',
                    letterSpacing: '-0.3px',
                    margin: 0,
                  }}
                >
                  System Alerts & Incident Log
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <Radio size={10} className="animate-pulse" /> LIVE SOCKET
                </span>
              </div>
              <p style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b', margin: '3px 0 0 0' }}>
                Real-time anomaly monitoring, warning logs, and system safety alerts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)'}`,
                backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                color: dark ? '#94a3b8' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {/* ── TOOLBAR & FILTERS ── */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
            backgroundColor: dark ? '#1a1c23' : '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Row 1: Switcher Capsule (Left) & Clear Button (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            {/* View Scope Segment Switcher Capsule */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 14,
                backgroundColor: dark ? '#12141a' : '#e2e8f0',
                border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                gap: 4,
              }}
            >
              <button
                onClick={() => setViewScope('active')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 16px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewScope === 'active' ? (dark ? '#252834' : '#ffffff') : 'transparent',
                  color: viewScope === 'active' ? (dark ? '#00ffff' : '#0284c7') : (dark ? '#8e96a4' : '#64748b'),
                  boxShadow: viewScope === 'active' ? (dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.08)') : 'none',
                  transition: 'all 0.18s ease-in-out',
                }}
              >
                <span>Active Alerts</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: 99,
                    backgroundColor: viewScope === 'active' ? (dark ? 'rgba(0, 255, 255, 0.2)' : 'rgba(2, 132, 199, 0.12)') : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                    color: viewScope === 'active' ? (dark ? '#00ffff' : '#0284c7') : (dark ? '#8e96a4' : '#64748b'),
                  }}
                >
                  {unreadCount}
                </span>
              </button>

              <button
                onClick={() => setViewScope('history')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 16px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewScope === 'history' ? (dark ? '#252834' : '#ffffff') : 'transparent',
                  color: viewScope === 'history' ? (dark ? '#f8fafc' : '#0f172a') : (dark ? '#8e96a4' : '#64748b'),
                  boxShadow: viewScope === 'history' ? (dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.08)') : 'none',
                  transition: 'all 0.18s ease-in-out',
                }}
              >
                <span>History alerts</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 99,
                    backgroundColor: viewScope === 'history' ? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                    color: viewScope === 'history' ? (dark ? '#f8fafc' : '#0f172a') : (dark ? '#8e96a4' : '#64748b'),
                  }}
                >
                  {alerts.length}
                </span>
              </button>
            </div>

            {/* Clear Active Log Button right-aligned on the switcher row */}
            {viewScope === 'active' && unreadCount > 0 && (
              <button
                onClick={handleClearAllClick}
                disabled={isClearing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: dark ? '#00ffff' : '#0284c7',
                  backgroundColor: dark ? 'rgba(0, 255, 255, 0.10)' : 'rgba(2, 132, 199, 0.08)',
                  border: `1px solid ${dark ? 'rgba(0, 255, 255, 0.25)' : 'rgba(2, 132, 199, 0.2)'}`,
                  padding: '8px 16px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  opacity: isClearing ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                  boxShadow: dark ? '0 4px 12px rgba(0,255,255,0.15)' : '0 2px 8px rgba(2,132,199,0.1)',
                }}
                title="Clear active alerts"
              >
                <CheckCheck size={14} /> {isClearing ? 'Clearing...' : 'Clear Active Log'}
              </button>
            )}
          </div>

          {/* Row 2: Severity Tabs (Left) & Search Input (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            {/* Left: Severity Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[
                { id: 'all', label: 'All', count: scopedAlerts.length, color: '#3b82f6' },
                { id: 'critical', label: 'Critical', count: criticalCount, color: '#ef4444' },
                { id: 'warning', label: 'Warnings', count: warningCount, color: '#f59e0b' },
                { id: 'info', label: 'Info', count: infoCount, color: '#06b6d4' },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: active ? 700 : 600,
                      border: active
                        ? `1.5px solid ${tab.color}`
                        : `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                      backgroundColor: active
                        ? dark ? `${tab.color}20` : `${tab.color}15`
                        : dark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                      color: active ? (dark ? '#ffffff' : tab.color) : dark ? '#94a3b8' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 99,
                        backgroundColor: active ? tab.color : dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        color: active ? '#ffffff' : dark ? '#cbd5e1' : '#475569',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Search bar */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: 220,
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  color: dark ? '#64748b' : '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search node or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 30px',
                  fontSize: 12,
                  borderRadius: 10,
                  border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}`,
                  backgroundColor: dark ? '#121318' : '#ffffff',
                  color: dark ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <X
                  size={13}
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    cursor: 'pointer',
                    color: dark ? '#94a3b8' : '#64748b',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── ALERTS LIST BODY ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundColor: dark ? '#15171d' : '#f8fafc',
          }}
        >
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((item) => {
              const isCrit = item.severity?.toLowerCase() === 'critical';
              const isWarn = item.severity?.toLowerCase() === 'warning';

              const accentColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#06b6d4';
              const bgBadge = isCrit
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : isWarn
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, #06b6d4, #0891b2)';

              return (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    padding: '12px 16px',
                    borderRadius: 14,
                    backgroundColor: dark ? '#1c1e26' : '#ffffff',
                    border: `1.5px solid ${dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                    borderLeft: `5px solid ${accentColor}`,
                    boxShadow: dark
                      ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                      : '0 2px 6px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top Bar: Badges + Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {/* Severity Badge */}
                      <span
                        style={{
                          background: bgBadge,
                          color: '#ffffff',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 999,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3.5,
                          boxShadow: `0 2px 6px ${accentColor}30`,
                        }}
                      >
                        {isCrit && <AlertTriangle size={10} />}
                        {isWarn && <AlertCircle size={10} />}
                        {!isCrit && !isWarn && <Info size={10} />}
                        {item.severity || 'Notice'}
                      </span>

                      {/* Node Name Tag */}
                      <span
                        style={{
                          backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                          color: dark ? '#f8fafc' : '#0f172a',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MapPin size={11.5} color={accentColor} />
                        {item.nodeName || `Node #${item.nodeId}`}
                      </span>

                      {/* Dedicated Node ID Tech Badge */}
                      <span
                        style={{
                          backgroundColor: dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                          color: dark ? '#94a3b8' : '#64748b',
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          padding: '1.5px 6px',
                          borderRadius: 5,
                          border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                          letterSpacing: '0.04em',
                        }}
                      >
                        NODE ID: {item.nodeId}
                      </span>

                      {/* Topology Tag */}
                      {item.topologyName && (
                        <span
                          style={{
                            backgroundColor: dark ? 'rgba(0, 255, 255, 0.08)' : 'rgba(8, 145, 178, 0.08)',
                            color: dark ? '#00ffff' : '#0891b2',
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: `1px solid ${dark ? 'rgba(0, 255, 255, 0.15)' : 'rgba(8, 145, 178, 0.15)'}`,
                          }}
                        >
                          {item.topologyName}
                        </span>
                      )}
                    </div>

                    {/* Vibrant Crisp Timestamp Badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: dark ? 'rgba(56, 189, 248, 0.10)' : 'rgba(2, 132, 199, 0.08)',
                        border: `1px solid ${dark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.20)'}`,
                      }}
                    >
                      <Clock size={11} color={dark ? '#38bdf8' : '#0284c7'} strokeWidth={2.2} />
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: dark ? '#38bdf8' : '#0369a1',
                          letterSpacing: '0.01em',
                        }}
                      >
                        ({formatExactDate(item.createdAt)})
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: dark ? '#94a3b8' : '#64748b',
                        }}
                      >
                        • {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Content: Clean Alert Message */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', marginBottom: 1 }}>
                      {item.alertType}
                    </div>
                    <p style={{ fontSize: 12, color: dark ? '#cbd5e1' : '#334155', lineHeight: 1.45, margin: 0 }}>
                      {cleanAlertMessage(item.message)}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 6,
                      borderTop: `1px solid ${dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'}`,
                      marginTop: 1,
                    }}
                  >
                    <button
                      onClick={() => handleInspectNode(item.topologyId, item.nodeId)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: dark ? '#00ffff' : '#0891b2',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <ExternalLink size={11.5} /> View Topology Node
                    </button>

                    {/* Acknowledge/Dismiss Button - Only rendered for Active (unread) alerts */}
                    {!item.isRead && (
                      <button
                        onClick={() => onDismissAlert(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4.5,
                          fontSize: 11,
                          fontWeight: 700,
                          color: dark ? '#22c55e' : '#16a34a',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: 6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = dark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(22, 163, 74, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                        title="Acknowledge alert and send to history log"
                      >
                        <CheckCircle2 size={12} /> Dismiss
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                flex: 1,
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                borderRadius: 16,
                backgroundColor: dark ? '#1c1e26' : '#ffffff',
                border: `1px dashed ${dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: dark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={32} color="#22c55e" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>
                {searchQuery ? 'No matching alerts found' : 'All Systems Operational'}
              </h3>
              <p style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b', maxWidth: 360, margin: 0 }}>
                {searchQuery
                  ? `No alert entries match "${searchQuery}". Try clearing your search query.`
                  : 'Zero anomalies or critical events recorded. All network nodes are operating within optimal parameters.'}
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            backgroundColor: dark ? '#1c1e26' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: dark ? '#94a3b8' : '#64748b',
          }}
        >
          <div>
            Showing <strong style={{ color: dark ? '#f8fafc' : '#0f172a' }}>{filteredAlerts.length}</strong> of{' '}
            <strong style={{ color: dark ? '#f8fafc' : '#0f172a' }}>{alerts.length}</strong> total alerts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span>Digital Twin Engine Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
