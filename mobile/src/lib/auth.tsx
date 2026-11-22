import { router } from 'expo-router';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthResponse, CurrentUser } from '@/shared';
import { api, clearToken, getToken, saveToken, setUnauthorizedHandler } from './api';

export interface RegisterInput {
  fullName: string;
  phone: string;
  password: string;
  locale: 'ar' | 'en';
  whatsappOptIn: boolean;
}

interface AuthState {
  user: CurrentUser | null;
  ready: boolean;
  /** Signs in and returns the user; staff roles are signed out again by the login screen. */
  login: (phone: string, password: string) => Promise<CurrentUser>;
  register: (input: RegisterInput) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 401 anywhere → token already cleared by api(); drop the user and show the login screen.
    setUnauthorizedHandler(() => {
      setUser(null);
      router.replace('/login');
    });
    void (async () => {
      try {
        if (await getToken()) setUser(await api<CurrentUser>('/auth/me'));
      } catch {
        await clearToken();
      } finally {
        setReady(true);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, []);

  const finish = useCallback(async (res: AuthResponse) => {
    await saveToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login: async (phone, password) =>
        finish(
          await api<AuthResponse>('/auth/login', {
            method: 'POST',
            body: { phone, password },
            auth: false,
          }),
        ),
      register: async (input) =>
        finish(
          await api<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false }),
        ),
      // Stateless JWT, no server logout: forgetting the token ends the session on this phone.
      logout: async () => {
        await clearToken();
        setUser(null);
      },
    }),
    [user, ready, finish],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
