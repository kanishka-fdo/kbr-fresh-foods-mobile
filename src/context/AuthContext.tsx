import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../lib/services';
import { session } from '../lib/api';
import type { User } from '../lib/types';

const key = 'kbr_mobile_token';
const storage = {
  get: async () => Platform.OS === 'web' ? sessionStorage.getItem(key) : SecureStore.getItemAsync(key),
  set: async (token: string) => { if (Platform.OS === 'web') sessionStorage.setItem(key, token); else await SecureStore.setItemAsync(key, token); },
  clear: async () => { if (Platform.OS === 'web') sessionStorage.removeItem(key); else await SecureStore.deleteItemAsync(key); },
};
type Auth = { user: User | null; loading: boolean; error: string; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void>; refresh: () => Promise<void>; retry: () => Promise<void> };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  async function signOut() {
    generation.current++;
    session.setToken(null);
    setUser(null); setError('');
    await storage.clear();
  }
  async function restore() {
    const current = ++generation.current;
    try {
      const token = await storage.get();
      if (current !== generation.current) return;
      setLoading(true); setError('');
      session.setToken(token);
      if (token) {
        const res = await authApi.me();
        if (current === generation.current) setUser(res.data.user);
      }
    } catch (e) {
      // Retain a valid stored token on network failure; let the user retry.
      if (current === generation.current) setError(e instanceof Error ? e.message : 'Could not restore your session.');
    } finally { setLoading(false); }
  }
  useEffect(() => {
    const unsubscribe = session.onUnauthorized(async (failedToken) => {
      if (session.getToken() === failedToken) await signOut();
    });
    const restoreTimer = setTimeout(() => { void restore(); }, 0);
    return () => { clearTimeout(restoreTimer); unsubscribe(); };
  }, []);
  async function signIn(email: string, password: string) {
    const res = await authApi.login({ email: email.trim(), password });
    await storage.set(res.data.token);
    generation.current++;
    session.setToken(res.data.token); setUser(res.data.user); setError('');
  }
  async function refresh() {
    const token = session.getToken();
    const res = await authApi.me();
    if (token === session.getToken()) setUser(res.data.user);
  }
  return <Context.Provider value={{ user, loading, error, signIn, signOut, refresh, retry: restore }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider is missing'); return value; }
