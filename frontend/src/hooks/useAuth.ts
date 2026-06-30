import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

type Role = 'admin' | 'operator' | 'viewer';

interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

interface UseAuthReturn {
  user: AuthUser | null;
  role: Role | null;
  isAdmin: boolean;
  loading: boolean;
}

let _cachedUser: AuthUser | null = null;

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(_cachedUser);
  const [loading, setLoading] = useState(!_cachedUser);

  useEffect(() => {
    if (_cachedUser) return;
    axios
      .get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true })
      .then((res) => {
        _cachedUser = res.data.user;
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    loading,
  };
}
