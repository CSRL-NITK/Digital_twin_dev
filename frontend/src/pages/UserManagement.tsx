import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Users, Trash2, Shield, ChevronDown, RefreshCw, AlertCircle,
  CheckCircle2, Crown, Wrench, Eye, Search, X, UserCheck, MoreHorizontal
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

const BACKEND_URL = 'http://localhost:3001';
const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const ROLES = ['admin', 'operator', 'viewer'] as const;
type Role = typeof ROLES[number];

interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
  createdAt: string;
}

const getRoleConfig = (role: string, dark: boolean) => {
  if (role === 'admin') {
    return dark ? {
      label: 'Admin', color: '#00ffff', bg: 'rgba(0,255,255,0.12)', border: 'rgba(0,255,255,0.28)', Icon: Crown, avatarBg: '#00ffff', avatarColor: '#17181c', accent: '#00ffff'
    } : {
      label: 'Admin', color: '#15803d', bg: '#ecfdf5', border: '#86efac', Icon: Crown, avatarBg: '#dcfce7', avatarColor: '#15803d', accent: '#22c55e'
    };
  }
  if (role === 'operator') {
    return dark ? {
      label: 'Operator', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', Icon: Wrench, avatarBg: 'rgba(245,158,11,0.20)', avatarColor: '#f59e0b', accent: '#f59e0b'
    } : {
      label: 'Operator', color: '#b45309', bg: '#fffbeb', border: '#fde68a', Icon: Wrench, avatarBg: '#fef3c7', avatarColor: '#b45309', accent: '#f59e0b'
    };
  }
  return dark ? {
    label: 'Viewer', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)', Icon: Eye, avatarBg: 'rgba(96,165,250,0.20)', avatarColor: '#60a5fa', accent: '#60a5fa'
  } : {
    label: 'Viewer', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', Icon: Eye, avatarBg: '#dbeafe', avatarColor: '#1d4ed8', accent: '#3b82f6'
  };
};

/* ── Gradient Avatar ─────────────────────────────────────────── */
const gradients: Record<string, string> = {
  admin: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
  operator: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  viewer: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
};
const gradientsDark: Record<string, string> = {
  admin: 'linear-gradient(135deg, #00ffff 0%, #06b6d4 100%)',
  operator: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  viewer: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
};

function GradientAvatar({ name, role, dark, size = 40 }: { name: string; role: string; dark: boolean; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, flexShrink: 0,
      background: dark ? (gradientsDark[role] || gradientsDark.viewer) : (gradients[role] || gradients.viewer),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 800, color: '#ffffff',
      fontFamily: FONT, letterSpacing: '-0.02em',
      boxShadow: `0 2px 8px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.10)'}`,
      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
    }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role, dark }: { role: string; dark: boolean }) {
  const cfg = getRoleConfig(role, dark);
  const { Icon } = cfg;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 99,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 12, fontWeight: 700, color: cfg.color,
      fontFamily: FONT, letterSpacing: '0.02em',
    }}>
      <Icon size={13} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function RoleDropdown({ userId, currentRole, onChanged, dark }: { userId: string; currentRole: string; onChanged: (id: string, role: string) => void; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  const MENU_HEIGHT = 132; // approx height of 3 role items

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < MENU_HEIGHT + 12;
      setPos({
        top: openUp ? rect.top : rect.bottom + 6,
        left: rect.right - 155,
        openUp,
      });
    }
    setOpen(true);
  };

  const select = async (role: Role) => {
    if (role === currentRole) { setOpen(false); return; }
    setSaving(true); setOpen(false);
    try {
      await axios.patch(`${BACKEND_URL}/api/auth/users/${userId}/role`, { role });
      onChanged(userId, role);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to update role');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={saving}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10,
          background: dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#d1d5db'}`,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 12.5, fontWeight: 600, color: dark ? '#e5e7eb' : '#374151',
          fontFamily: FONT, transition: 'all 0.14s',
        }}
        onMouseEnter={e => { if (!saving) { (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.10)' : '#e5e7eb'; (e.currentTarget as any).style.borderColor = dark ? 'rgba(255,255,255,0.18)' : '#9ca3af'; } }}
        onMouseLeave={e => { (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'; (e.currentTarget as any).style.borderColor = dark ? 'rgba(255,255,255,0.10)' : '#d1d5db'; }}
      >
        {saving ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
        Change role
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'fixed',
            left: pos.left,
            ...(pos.openUp ? { bottom: window.innerHeight - pos.top + 6 } : { top: pos.top }),
            zIndex: 9999,
            background: dark ? '#1c1d22' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 10px 28px rgba(0,0,0,0.20)',
            minWidth: 155,
          }}>
            {ROLES.map(role => {
              const cfg = getRoleConfig(role, dark);
              return (
                <button key={role} onClick={() => select(role)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  color: role === currentRole ? cfg.color : (dark ? '#e5e7eb' : '#374151'),
                  fontFamily: FONT, fontSize: 13, fontWeight: role === currentRole ? 700 : 500,
                  background: role === currentRole ? cfg.bg : 'transparent',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => { if (role !== currentRole) (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.05)' : '#f8fafc'; }}
                  onMouseLeave={e => { if (role !== currentRole) (e.currentTarget as any).style.background = role === currentRole ? cfg.bg : 'transparent'; }}
                >
                  <cfg.Icon size={14} strokeWidth={2.2} />
                  {cfg.label}
                  {role === currentRole && <CheckCircle2 size={13} style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Actions More Menu ─────────────────────────────────────────── */
function ActionsMenu({ user, onDelete, isDeleting, dark }: { user: User; onDelete: (u: User) => void; isDeleting: boolean; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  const MENU_HEIGHT = 42; // single item menu height

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < MENU_HEIGHT + 12;
      setPos({
        top: openUp ? rect.top : rect.bottom + 4,
        left: rect.right - 160,
        openUp,
      });
    }
    setOpen(true);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width: 34, height: 34, borderRadius: 8, border: 'none',
          background: open ? (dark ? 'rgba(255,255,255,0.10)' : '#e5e7eb') : 'transparent',
          color: dark ? '#9ca3af' : '#6b7280',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.14s',
        }}
        onMouseEnter={e => { (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as any).style.background = 'transparent'; }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'fixed',
            left: pos.left,
            ...(pos.openUp ? { bottom: window.innerHeight - pos.top + 4 } : { top: pos.top }),
            zIndex: 9999,
            background: dark ? '#1c1d22' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#e5e7eb'}`,
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            minWidth: 160,
          }}>
            <button
              onClick={() => { setOpen(false); onDelete(user); }}
              disabled={isDeleting}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', border: 'none',
                cursor: isDeleting ? 'not-allowed' : 'pointer', textAlign: 'left',
                color: '#ef4444',
                fontFamily: FONT, fontSize: 13, fontWeight: 600,
                background: 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as any).style.background = dark ? 'rgba(239,68,68,0.10)' : '#fef2f2'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.background = 'transparent'; }}
            >
              {isDeleting ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
              Delete user
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const { theme } = useTheme();
  const { user: me } = useAuth();
  const dark = theme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | Role>('all');

  // High contrast theme colors
  const textTitle = dark ? '#f0f0f2' : '#111827';
  const textSub = dark ? '#9ca3af' : '#4b5563';
  const textHeader = dark ? '#6b7280' : '#6b7280';
  const cardBg = dark ? '#1c1d22' : '#ffffff';
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/users`);
      setUsers(res.data.users);
    } catch {
      setError('Failed to load users.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      await axios.delete(`${BACKEND_URL}/api/auth/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showToast(`User "${u.username}" deleted.`);
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Failed to delete user.', false);
    } finally { setDeletingId(null); }
  };

  const handleRoleChange = (id: string, role: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    showToast('Role updated successfully.');
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || u.role === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const cardStyle: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: 16,
    boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 2px 12px rgba(0,0,0,0.04)',
  };

  const filterTabs: { key: 'all' | Role; label: string; count: number }[] = [
    { key: 'all', label: 'All Users', count: users.length },
    { key: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length },
    { key: 'operator', label: 'Operators', count: users.filter(u => u.role === 'operator').length },
    { key: 'viewer', label: 'Viewers', count: users.filter(u => u.role === 'viewer').length },
  ];

  return (
    <div style={{
      height: '100%', width: '100%', overflow: 'auto',
      padding: '8px 16px 32px', boxSizing: 'border-box',
      fontFamily: FONT,
      background: 'transparent',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderRadius: 14,
          background: toast.ok ? '#17181c' : 'rgba(239,68,68,0.95)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
          border: toast.ok ? '1px solid rgba(0,255,255,0.20)' : '1px solid rgba(239,68,68,0.40)',
          color: toast.ok ? '#00ffff' : '#fff',
          fontSize: 13, fontWeight: 600,
          animation: 'slideUp 0.25s ease',
          backdropFilter: 'blur(12px)',
        }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: dark ? 'rgba(0,255,255,0.12)' : '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          }}>
            <Users size={24} color="#00ffff" strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: textTitle, letterSpacing: '-0.5px', margin: 0 }}>
              User Directory & Access Control
            </h1>
            <p style={{ fontSize: 13.5, color: textSub, fontWeight: 500, margin: 0, marginTop: 3 }}>
              Manage system users, assign role privileges, and maintain platform security
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color={textSub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, role or @handle…"
              style={{
                height: 42, paddingLeft: 38, paddingRight: search ? 34 : 16, borderRadius: 12,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#cbd5e1'}`,
                background: dark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                fontSize: 13.5, fontWeight: 500, color: textTitle,
                outline: 'none', fontFamily: FONT, width: 290,
                boxShadow: 'none',
                transition: 'border-color 0.14s, box-shadow 0.14s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = dark ? 'rgba(0,255,255,0.30)' : '#94a3b8'; e.currentTarget.style.boxShadow = dark ? '0 0 0 3px rgba(0,255,255,0.08)' : '0 0 0 3px rgba(59,130,246,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.10)' : '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: textSub }}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button onClick={fetchUsers} disabled={loading} title="Refresh directory" style={{
            width: 42, height: 42, borderRadius: 12,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#cbd5e1'}`,
            background: dark ? 'rgba(255,255,255,0.04)' : '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: textSub,
            transition: 'all 0.14s',
          }}
            onMouseEnter={e => { (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'; (e.currentTarget as any).style.borderColor = dark ? 'rgba(255,255,255,0.18)' : '#94a3b8'; }}
            onMouseLeave={e => { (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.04)' : '#ffffff'; (e.currentTarget as any).style.borderColor = dark ? 'rgba(255,255,255,0.10)' : '#cbd5e1'; }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {/* Total Users Card */}
        <div
          style={{
            ...cardStyle,
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderLeft: `3px solid ${dark ? 'rgba(255,255,255,0.20)' : '#6b7280'}`,
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            cursor: 'default',
          }}
          onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-2px)'; (e.currentTarget as any).style.boxShadow = dark ? '0 8px 32px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; (e.currentTarget as any).style.boxShadow = dark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 2px 12px rgba(0,0,0,0.04)'; }}
        >
          <div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: textSub, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total Users</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: textTitle, marginTop: 4, letterSpacing: '-1px' }}>{users.length}</div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserCheck size={22} color={dark ? '#e5e7eb' : '#374151'} />
          </div>
        </div>

        {ROLES.map(role => {
          const cfg = getRoleConfig(role, dark);
          const count = users.filter(u => u.role === role).length;
          return (
            <div
              key={role}
              style={{
                ...cardStyle,
                padding: '18px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderLeft: `3px solid ${cfg.accent}`,
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-2px)'; (e.currentTarget as any).style.boxShadow = dark ? '0 8px 32px rgba(0,0,0,0.40)' : '0 8px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; (e.currentTarget as any).style.boxShadow = dark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 2px 12px rgba(0,0,0,0.04)'; }}
            >
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: textSub, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{cfg.label}s</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color, marginTop: 4, letterSpacing: '-1px' }}>{count}</div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <cfg.Icon size={22} color={cfg.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', marginBottom: 18 }}>
          <AlertCircle size={15} color="#ef4444" />
          <span style={{ fontSize: 13.5, color: '#ef4444', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* ── Filter tabs + result count ────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {filterTabs.map(tab => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10,
                  border: isActive
                    ? `1px solid ${dark ? 'rgba(0,255,255,0.30)' : '#c7d2fe'}`
                    : `1px solid transparent`,
                  background: isActive
                    ? (dark ? 'rgba(0,255,255,0.08)' : '#eef2ff')
                    : 'transparent',
                  cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? (dark ? '#00ffff' : '#4338ca') : textSub,
                  fontFamily: FONT,
                  transition: 'all 0.14s',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.04)' : '#f8fafc'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as any).style.background = 'transparent'; } }}
              >
                {tab.label}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 99,
                  background: isActive ? (dark ? 'rgba(0,255,255,0.15)' : '#c7d2fe') : (dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'),
                  color: isActive ? (dark ? '#00ffff' : '#4338ca') : textSub,
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 12.5, color: textSub, fontWeight: 500 }}>
          Showing {filtered.length} of {users.length} users
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              background: dark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
            }}>
              <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '24%' }}>User account</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '22%' }}>Email address</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '14%' }}>Handle</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '12%' }}>Role</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '13%' }}>Joined</th>
              <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right', width: '15%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 72, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: dark ? 'rgba(0,255,255,0.08)' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <RefreshCw size={18} color={dark ? '#00ffff' : '#64748b'} style={{ animation: 'spin 0.8s linear infinite' }} />
                    </div>
                    <span style={{ fontSize: 14, color: textSub, fontWeight: 600 }}>Loading active accounts…</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 72, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: dark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Users size={24} color={dark ? 'rgba(255,255,255,0.18)' : '#94a3b8'} />
                    </div>
                    <span style={{ fontSize: 14, color: textSub, fontWeight: 600 }}>No users matched your search criteria</span>
                    <span style={{ fontSize: 12.5, color: dark ? '#4b5563' : '#9ca3af', fontWeight: 500 }}>Try adjusting your search or filter</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => {
                const isMe = u.id === (me as any)?.id;
                const isDeleting = deletingId === u.id;
                return (
                  <tr key={u.id} style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${dark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}` : 'none',
                    background: isMe
                      ? (dark ? 'rgba(0,255,255,0.04)' : '#f0fdf4')
                      : i % 2 === 1 ? (dark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)') : 'transparent',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => { if (!isMe) (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.04)' : '#f8fafc'; }}
                    onMouseLeave={e => { if (!isMe) (e.currentTarget as any).style.background = isMe ? (dark ? 'rgba(0,255,255,0.04)' : '#f0fdf4') : (i % 2 === 1 ? (dark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)') : 'transparent'); }}
                  >
                    {/* Name */}
                    <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <GradientAvatar name={u.name} role={u.role} dark={dark} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: textTitle }}>{u.name}</span>
                            {isMe && (
                              <span style={{
                                fontSize: 10.5, fontWeight: 700,
                                color: dark ? '#00ffff' : '#15803d',
                                background: dark ? 'rgba(0,255,255,0.12)' : '#dcfce7',
                                border: `1px solid ${dark ? 'rgba(0,255,255,0.25)' : '#86efac'}`,
                                padding: '2px 8px', borderRadius: 99, letterSpacing: '0.03em'
                              }}>
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', fontWeight: 500 }}>
                        {u.email || `${u.username}@digitaltwin.io`}
                      </span>
                    </td>

                    {/* Username */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{
                        fontSize: 12.5, color: dark ? '#6b7280' : '#9ca3af',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontWeight: 500,
                        background: dark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                        padding: '3px 8px', borderRadius: 6,
                      }}>@{u.username}</span>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <RoleBadge role={u.role} dark={dark} />
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 13, color: textSub, fontWeight: 500 }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {isMe ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8,
                            background: dark ? 'rgba(0,255,255,0.08)' : '#ecfdf5',
                            border: `1px solid ${dark ? 'rgba(0,255,255,0.20)' : '#86efac'}`,
                            fontSize: 12, fontWeight: 700,
                            color: dark ? '#00ffff' : '#15803d'
                          }}>
                            <Shield size={13} color={dark ? '#00ffff' : '#15803d'} />
                            Active Session
                          </span>
                        ) : (
                          <>
                            <RoleDropdown userId={u.id} currentRole={u.role} onChanged={handleRoleChange} dark={dark} />
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={isDeleting}
                              title={`Delete ${u.username}`}
                              style={{
                                width: 34, height: 34, borderRadius: 10,
                                border: `1px solid ${dark ? 'rgba(239,68,68,0.20)' : '#fecaca'}`,
                                background: dark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
                                color: '#ef4444',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.16s ease',
                                opacity: isDeleting ? 0.6 : 1,
                              }}
                              onMouseEnter={e => { if (!isDeleting) { (e.currentTarget as any).style.background = dark ? 'rgba(239,68,68,0.18)' : '#fee2e2'; (e.currentTarget as any).style.borderColor = dark ? 'rgba(239,68,68,0.35)' : '#fca5a5'; (e.currentTarget as any).style.transform = 'scale(1.08)'; } }}
                              onMouseLeave={e => { (e.currentTarget as any).style.background = dark ? 'rgba(239,68,68,0.08)' : '#fef2f2'; (e.currentTarget as any).style.borderColor = dark ? 'rgba(239,68,68,0.20)' : '#fecaca'; (e.currentTarget as any).style.transform = 'scale(1)'; }}
                            >
                              {isDeleting ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 0 0',
        }}>
          <span style={{ fontSize: 12, color: dark ? '#4b5563' : '#9ca3af', fontWeight: 500 }}>
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'} displayed · Last refreshed just now
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
