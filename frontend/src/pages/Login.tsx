import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Droplets, Loader2, AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

axios.defaults.withCredentials = true;

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

export default function Login() {
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState('');
  const [success, setSuccess]  = useState(false);
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true); setError('');
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', values);
      if (res.status === 200) {
        setSuccess(true);
        setTimeout(() => { window.location.href = '/'; }, 1000);
      }
    } catch (err: any) {
      if (err.response?.status === 429) setError('Too many attempts. Try again later.');
      else setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: dark ? '#111215' : '#f3f3f3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, position: 'relative',
    }}>
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(dark ? 'light' : 'dark')}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 38, height: 38, borderRadius: '50%',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          background: dark ? '#22232a' : '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dark ? '#6b7280' : '#5a5f6b', cursor: 'pointer',
        }}
      >
        {dark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      </button>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 22,
        boxShadow: dark
          ? '0 8px 40px rgba(0,0,0,0.40)'
          : '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        padding: '40px 36px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#17181c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.20)',
          }}>
            <Droplets size={21} color="#c8f135" strokeWidth={2.3} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', letterSpacing: '-0.5px', lineHeight: 1.2 }}>AquaTwin</p>
            <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              Digital Twin Platform
            </p>
          </div>
        </div>

        <p style={{ fontSize: 22, fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', letterSpacing: '-0.6px', marginBottom: 4 }}>
          Welcome back
        </p>
        <p style={{ fontSize: 13.5, color: '#9ca3af', marginBottom: 28 }}>
          Sign in to access the monitoring dashboard.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '11px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.18)',
            marginBottom: 20,
          }}>
            <AlertCircle size={15} color="#ef4444" />
            <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* Success */}
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(34,197,94,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={28} color="#22c55e" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: dark ? '#f0f0f2' : '#17181c' }}>Authentication successful</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Redirecting to dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f0f0f2' : '#17181c', letterSpacing: '-0.2px' }}>
                Username
              </label>
              <input
                {...register('username')}
                placeholder="admin"
                autoComplete="username"
                style={{
                  height: 44, padding: '0 14px', borderRadius: 10, width: '100%',
                  border: `1px solid ${errors.username ? 'rgba(239,68,68,0.45)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
                  background: dark ? '#22232a' : '#f3f3f3',
                  fontSize: 14, color: dark ? '#f0f0f2' : '#17181c',
                  outline: 'none', fontFamily: FONT,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(200,241,53,0.65)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,241,53,0.14)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = errors.username ? 'rgba(239,68,68,0.45)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {errors.username && <p style={{ fontSize: 12, color: '#ef4444' }}>{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f0f0f2' : '#17181c', letterSpacing: '-0.2px' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: 12.5, color: '#9ca3af', textDecoration: 'none' }}>Forgot?</a>
              </div>
              <input
                {...register('password')}
                type="password" placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  height: 44, padding: '0 14px', borderRadius: 10, width: '100%',
                  border: `1px solid ${errors.password ? 'rgba(239,68,68,0.45)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
                  background: dark ? '#22232a' : '#f3f3f3',
                  fontSize: 14, color: dark ? '#f0f0f2' : '#17181c',
                  outline: 'none', fontFamily: FONT,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(200,241,53,0.65)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,241,53,0.14)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = errors.password ? 'rgba(239,68,68,0.45)' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {errors.password && <p style={{ fontSize: 12, color: '#ef4444' }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                height: 46, borderRadius: 12, border: 'none',
                background: loading ? '#e9eeea' : '#17181c',
                color: loading ? '#9ca3af' : '#c8f135',
                fontSize: 14.5, fontWeight: 800, letterSpacing: '-0.2px',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 8, transition: 'all 0.16s ease',
                boxShadow: loading ? 'none' : '0 2px 14px rgba(23,24,28,0.22)',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#22242a'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#17181c'; }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Authenticating…</>
                : 'Sign In'
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
