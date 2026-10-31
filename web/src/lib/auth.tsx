import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';

export type User = {
  id: number; username: string; email: string; bio: string;
  avatar_hue: number; points: number; created_at: string;
};

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); return; }
    try { setUser(await api.get<User>('/auth/me')); }
    catch { setUser(null); }
  }, []);

  useEffect(() => {
    (async () => { await refresh(); setReady(true); })();
    const onLogout = () => setUser(null);
    window.addEventListener('banshan:logout', onLogout);
    return () => window.removeEventListener('banshan:logout', onLogout);
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ user, ready, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
