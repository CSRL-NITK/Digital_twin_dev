import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import {
  Droplets, Loader2, AlertCircle, CheckCircle2, Moon, Sun,
  User, AtSign, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

axios.defaults.withCredentials = true;

const BACKEND_URL = 'http://localhost:3001';
const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  username: z.string()
    .min(3, 'Min 3 characters')
    .max(30, 'Max 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const usernameValue = watch('username');

  useEffect(() => {
    if (!usernameValue || usernameValue.length < 3 || !/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/check-username`, { params: { username: usernameValue } });
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch { setUsernameStatus('idle'); }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [usernameValue]);

  const onSubmit = async (values: FormData) => {
    if (usernameStatus === 'taken') { setError('Username already taken.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        firstName: values.firstName, lastName: values.lastName,
        username: values.username, email: values.email, password: values.password,
      });
      if (res.status === 201) { setSuccess(true); setTimeout(() => { window.location.href = '/star-topology'; }, 1500); }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inp = (hasError: boolean, extraPad?: { left?: number; right?: number }): React.CSSProperties => ({
    height: 40, borderRadius: 9, width: '100%',
    paddingLeft: extraPad?.left ?? 34,
    paddingRight: extraPad?.right ?? 14,
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.50)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
    background: dark ? '#22232a' : '#f5f5f5',
    fontSize: 13.5, color: dark ? '#f0f0f2' : '#17181c',
    outline: 'none', fontFamily: FONT,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  });

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,255,255,0.65)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,255,255,0.12)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>, hasError: boolean) => {
    e.currentTarget.style.borderColor = hasError ? 'rgba(239,68,68,0.50)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 700, color: dark ? '#d1d5db' : '#374151',
    letterSpacing: '-0.1px', marginBottom: 4, display: 'block',
  };

  const errStyle: React.CSSProperties = { fontSize: 11.5, color: '#ef4444', marginTop: 3 };

  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
  };

  const usernameStatusEl = () => {
    if (usernameStatus === 'checking') return <span style={{ fontSize: 11.5, color: '#9ca3af' }}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />Checking…</span>;
    if (usernameStatus === 'available') return <span style={{ fontSize: 11.5, color: '#22c55e' }}><CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />Available</span>;
    if (usernameStatus === 'taken') return <span style={{ fontSize: 11.5, color: '#ef4444' }}><XCircle size={11} style={{ display: 'inline', marginRight: 4 }} />Already taken</span>;
    return null;
  };

  const disabled = loading || usernameStatus === 'taken' || usernameStatus === 'checking';

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: dark ? '#111215' : '#f3f3f3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT,
    }}>
      {/* Theme toggle */}
      <button onClick={() => setTheme(dark ? 'light' : 'dark')} style={{
        position: 'fixed', top: 20, right: 20,
        width: 36, height: 36, borderRadius: '50%',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        background: dark ? '#22232a' : '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: dark ? '#6b7280' : '#5a5f6b', cursor: 'pointer', zIndex: 10,
      }}>
        {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
      </button>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 600,
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 22,
        boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.40)' : '0 4px 24px rgba(0,0,0,0.08)',
        padding: '32px 40px 28px',
      }}>
        {/* Logo + heading row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: '#17181c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
            }}>
              <Droplets size={19} color="#00ffff" strokeWidth={2.3} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', letterSpacing: '-0.4px', lineHeight: 1.2 }}>AquaTwin</p>
              <p style={{ fontSize: 10.5, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Digital Twin Platform</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', letterSpacing: '-0.5px', textAlign: 'right' }}>Create account</p>
            <p style={{ fontSize: 12.5, color: '#9ca3af', textAlign: 'right' }}>Sign up to access the dashboard</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginBottom: 20 }} />

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 9,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
            marginBottom: 14,
          }}>
            <AlertCircle size={14} color="#ef4444" />
            <p style={{ fontSize: 12.5, color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* Success */}
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} color="#22c55e" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: dark ? '#f0f0f2' : '#17181c' }}>Account created!</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Redirecting to dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Row 1: First name + Last name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={13} color="#9ca3af" style={iconStyle} />
                  <input {...register('firstName')} placeholder="John" autoComplete="given-name"
                    style={inp(!!errors.firstName)} onFocus={onFocus} onBlur={e => onBlur(e, !!errors.firstName)} />
                </div>
                {errors.firstName && <p style={errStyle}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={13} color="#9ca3af" style={iconStyle} />
                  <input {...register('lastName')} placeholder="Doe" autoComplete="family-name"
                    style={inp(!!errors.lastName)} onFocus={onFocus} onBlur={e => onBlur(e, !!errors.lastName)} />
                </div>
                {errors.lastName && <p style={errStyle}>{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Row 2: Username */}
            <div>
              <label style={labelStyle}>Username</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={13} color="#9ca3af" style={iconStyle} />
                <input {...register('username')} placeholder="john_doe" autoComplete="username"
                  style={{
                    ...inp(!!errors.username || usernameStatus === 'taken', { left: 34, right: 34 }),
                    borderColor: usernameStatus === 'available' ? 'rgba(34,197,94,0.50)'
                      : usernameStatus === 'taken' ? 'rgba(239,68,68,0.50)' : undefined,
                  }}
                  onFocus={onFocus} onBlur={e => onBlur(e, !!errors.username || usernameStatus === 'taken')} />
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  {usernameStatus === 'checking' && <Clock size={13} color="#9ca3af" />}
                  {usernameStatus === 'available' && <CheckCircle size={13} color="#22c55e" />}
                  {usernameStatus === 'taken' && <XCircle size={13} color="#ef4444" />}
                </div>
              </div>
              {errors.username
                ? <p style={errStyle}>{errors.username.message}</p>
                : <div style={{ marginTop: 3 }}>{usernameStatusEl()}</div>
              }
            </div>

            {/* Row 3: Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="#9ca3af" style={iconStyle} />
                <input {...register('email')} type="email" placeholder="john@example.com" autoComplete="email"
                  style={inp(!!errors.email)} onFocus={onFocus} onBlur={e => onBlur(e, !!errors.email)} />
              </div>
              {errors.email && <p style={errStyle}>{errors.email.message}</p>}
            </div>

            {/* Row 3: Password + Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} color="#9ca3af" style={iconStyle} />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                    style={inp(!!errors.password, { left: 34, right: 36 })} onFocus={onFocus} onBlur={e => onBlur(e, !!errors.password)} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex',
                  }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p style={errStyle}>{errors.password.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} color="#9ca3af" style={iconStyle} />
                  <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                    style={inp(!!errors.confirmPassword, { left: 34, right: 36 })} onFocus={onFocus} onBlur={e => onBlur(e, !!errors.confirmPassword)} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex',
                  }}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPassword && <p style={errStyle}>{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Role note */}
            <p style={{
              fontSize: 11.5, color: '#9ca3af', margin: '2px 0',
              padding: '7px 11px', borderRadius: 8,
              background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            }}>
              🔒 New accounts receive <strong style={{ color: dark ? '#d1d5db' : '#374151' }}>Viewer</strong> access. Contact an admin to upgrade.
            </p>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
              <button type="submit" disabled={disabled}
                style={{
                  height: 44, borderRadius: 11, border: 'none',
                  background: disabled ? (dark ? '#2a2b31' : '#e5e7eb') : '#17181c',
                  color: disabled ? '#6b7280' : '#00ffff',
                  fontSize: 14, fontWeight: 800, letterSpacing: '-0.2px',
                  cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.16s ease',
                  boxShadow: disabled ? 'none' : '0 2px 14px rgba(23,24,28,0.22)',
                  padding: '0 48px', minWidth: 200,
                }}
                onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#22242a'; }}
                onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#17181c'; }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create Account'}
              </button>
            </div>

            {/* Sign in link */}
            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#9ca3af' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: dark ? '#00ffff' : '#17181c', fontWeight: 700, textDecoration: 'none' }}>Sign in</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
