import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';

/**
 * Loads data while the screen is focused. Focus, resume and polling reloads are silent;
 * only `refresh()` (pull-to-refresh / retry) drives the `refreshing` spinner.
 */
export function useResource<T>(loader: () => Promise<T>, key: string, poll = 0) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState('');
  const focused = useIsFocused(); const latest = useRef(loader); const request = useRef(0);
  const [dataKey, setDataKey] = useState('');
  useEffect(() => { latest.current = loader; }, [loader]);
  const load = useCallback(async (visible: boolean) => {
    const current = ++request.current; setLoading(true); if (visible) setRefreshing(true);
    try { const result = await latest.current(); if (current === request.current) { setData(result); setDataKey(key); setError(''); } }
    catch (e) { if (current === request.current) setError(e instanceof Error ? e.message : 'Could not load data.'); }
    finally { if (current === request.current) { setLoading(false); setRefreshing(false); } }
  }, [key]);
  const refresh = useCallback(() => load(true), [load]);
  useEffect(() => {
    if (!focused) return;
    const initialFetch = setTimeout(() => { void load(false); }, 0);
    const requestCounter = request;
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void load(false); });
    const timer = poll ? setInterval(() => { if (AppState.currentState === 'active') void load(false); }, poll) : undefined;
    return () => { requestCounter.current++; setRefreshing(false); clearTimeout(initialFetch); subscription.remove(); if (timer) clearInterval(timer); };
  }, [key, focused, poll, load]);
  const current = dataKey === key ? data : null;
  return { data: current, loading: loading && current === null, refreshing, error, refresh };
}
