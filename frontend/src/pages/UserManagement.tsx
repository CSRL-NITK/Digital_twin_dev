import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, Trash2, Shield, ChevronDown, RefreshCw, AlertCircle,
  CheckCircle2, Crown, Wrench, Eye, Search, X, UserCheck
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
      label: 'Admin', color: '#c8f135', bg: 'rgba(200,241,53,0.12)', border: 'rgba(200,241,53,0.28)', Icon: Crown, avatarBg: '#c8f135', avatarColor: '#17181c'
    } : {
      label: 'Admin', color: '#15803d', bg: '#ecfdf5', border: '#86efac', Icon: Crown, avatarBg: '#dcfce7', avatarColor: '#15803d'
    };
  }
  if (role === 'operator') {
    return dark ? {
      label: 'Operator', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', Icon: Wrench, avatarBg: 'rgba(245,158,11,0.20)', avatarColor: '#f59e0b'
    } : {
      label: 'Operator', color: '#b45309', bg: '#fffbeb', border: '#fde68a', Icon: Wrench, avatarBg: '#fef3c7', avatarColor: '#b45309'
    };
  }
  return dark ? {
    label: 'Viewer', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)', Icon: Eye, avatarBg: 'rgba(96,165,250,0.20)', avatarColor: '#60a5fa'
  } : {
    label: 'Viewer', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', Icon: Eye, avatarBg: '#dbeafe', avatarColor: '#1d4ed8'
  };
};

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
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          background: dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#d1d5db'}`,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 12.5, fontWeight: 600, color: dark ? '#e5e7eb' : '#374151',
          fontFamily: FONT, transition: 'all 0.14s',
        }}
      >
        {saving ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
        Change role
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
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

  // High contrast theme colors
  const textTitle = dark ? '#f0f0f2' : '#111827';
  const textSub = dark ? '#9ca3af' : '#4b5563';
  const textHeader = dark ? '#9ca3af' : '#374151';
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

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: 18,
    boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.30)' : '0 4px 16px rgba(0,0,0,0.05)',
  };

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
          padding: '12px 18px', borderRadius: 12,
          background: toast.ok ? '#17181c' : 'rgba(239,68,68,0.95)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
          color: toast.ok ? '#c8f135' : '#fff',
          fontSize: 13, fontWeight: 600,
          animation: 'slideUp 0.2s ease',
        }}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: dark ? 'rgba(200,241,53,0.12)' : '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          }}>
            <Users size={24} color="#c8f135" strokeWidth={2.2} />
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color={textSub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, role or @handle…"
              style={{
                height: 42, paddingLeft: 38, paddingRight: search ? 34 : 16, borderRadius: 10,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                background: cardBg,
                fontSize: 13.5, fontWeight: 500, color: textTitle,
                outline: 'none', fontFamily: FONT, width: 280,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: textSub }}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button onClick={fetchUsers} disabled={loading} title="Refresh directory" style={{
            width: 42, height: 42, borderRadius: 10,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
            background: cardBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: textSub,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: textSub, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Users</span>
            <div style={{ fontSize: 26, fontWeight: 800, color: textTitle, marginTop: 4 }}>{users.length}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} color={dark ? '#e5e7eb' : '#374151'} />
          </div>
        </div>

        {ROLES.map(role => {
          const cfg = getRoleConfig(role, dark);
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: textSub, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{cfg.label}s</span>
                <div style={{ fontSize: 26, fontWeight: 800, color: cfg.color, marginTop: 4 }}>{count}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Table card using strict HTML <table> for 100% pixel-perfect column alignment */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              background: dark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
            }}>
              <th style={{ padding: '15px 24px', fontSize: 12, fontWeight: 700, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '24%' }}>User Account</th>
              <th style={{ padding: '15px 20px', fontSize: 12, fontWeight: 700, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '22%' }}>Email Address</th>
              <th style={{ padding: '15px 20px', fontSize: 12, fontWeight: 700, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '14%' }}>Username Handle</th>
              <th style={{ padding: '15px 20px', fontSize: 12, fontWeight: 700, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '13%' }}>Access Role</th>
              <th style={{ padding: '15px 20px', fontSize: 12, fontWeight: 700, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', width: '12%' }}>Registration Date</th>
              <th style={{ padding: '15px 24px', fontSize: 12, fontWeight: 700, color: textHeader, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right', width: '15%' }}>Management Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 64, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <RefreshCw size={18} color={textSub} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 14, color: textSub, fontWeight: 600 }}>Loading active accounts…</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 64, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Users size={36} color={dark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'} />
                    <span style={{ fontSize: 14, color: textSub, fontWeight: 600 }}>No users matched your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => {
                const isMe = u.id === (me as any)?.id;
                const isDeleting = deletingId === u.id;
                const cfg = getRoleConfig(u.role, dark);
                return (
                  <tr key={u.id} style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` : 'none',
                    background: isMe ? (dark ? 'rgba(200,241,53,0.05)' : '#f0fdf4') : 'transparent',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => { if (!isMe) (e.currentTarget as any).style.background = dark ? 'rgba(255,255,255,0.03)' : '#f8fafc'; }}
                    onMouseLeave={e => { if (!isMe) (e.currentTarget as any).style.background = isMe ? (dark ? 'rgba(200,241,53,0.05)' : '#f0fdf4') : 'transparent'; }}
                  >
                    {/* Name */}
                    <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: cfg.avatarBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14.5, fontWeight: 800, color: cfg.avatarColor,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 700, color: textTitle }}>{u.name}</span>
                            {isMe && (
                              <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: dark ? '#c8f135' : '#15803d',
                                background: dark ? 'rgba(200,241,53,0.15)' : '#dcfce7',
                                border: `1px solid ${dark ? 'rgba(200,241,53,0.3)' : '#86efac'}`,
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
                      <span style={{ fontSize: 13.5, color: textSub, fontWeight: 500 }}>
                        {u.email || `${u.username}@digitaltwin.io`}
                      </span>
                    </td>

                    {/* Username */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 13.5, color: textSub, fontFamily: 'monospace', fontWeight: 600 }}>@{u.username}</span>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <RoleBadge role={u.role} dark={dark} />
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 13.5, color: textSub, fontWeight: 600 }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        {isMe ? (
                          <>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px', borderRadius: 8,
                              background: dark ? 'rgba(200,241,53,0.08)' : '#ecfdf5',
                              border: `1px solid ${dark ? 'rgba(200,241,53,0.25)' : '#86efac'}`,
                              fontSize: 12, fontWeight: 700,
                              color: dark ? '#c8f135' : '#15803d'
                            }}>
                              <Shield size={13} color={dark ? '#c8f135' : '#15803d'} />
                              Active Admin Session
                            </span>
                            <button
                              disabled
                              title="Cannot delete your active session"
                              style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none',
                                background: 'transparent',
                                color: dark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                                cursor: 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <RoleDropdown userId={u.id} currentRole={u.role} onChanged={handleRoleChange} dark={dark} />
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={isDeleting}
                              title={`Delete ${u.username}`}
                              style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none',
                                background: dark ? 'rgba(239,68,68,0.10)' : '#fee2e2',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.14s',
                              }}
                              onMouseEnter={e => { (e.currentTarget as any).style.background = dark ? 'rgba(239,68,68,0.20)' : '#fecaca'; }}
                              onMouseLeave={e => { (e.currentTarget as any).style.background = dark ? 'rgba(239,68,68,0.10)' : '#fee2e2'; }}
                            >
                              {isDeleting ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={15} />}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
