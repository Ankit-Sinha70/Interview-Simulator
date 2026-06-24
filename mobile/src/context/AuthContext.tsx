import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, getToken, setToken, removeToken, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount — check for existing token and restore session
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await getToken();
        if (token) {
          const res = await authApi.me();
          setUser(res.data);
        }
      } catch {
        // Token expired or invalid — clear it
        await removeToken();
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    await setToken(res.token);
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await authApi.register(name, email, password);
    await setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    await removeToken();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
