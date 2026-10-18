import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';

export function useResource<T>(loader: () => Promise<T>, key: string, poll = 0) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const focused = useIsFocused(); const latest = useRef(loader); const request = useRef(0);
  const [dataKey, setDataKey] = useState('');
  useEffect(() => { latest.current = loader; }, [loader]);
  const refresh = useCallback(async () => {
    const current = ++request.current; setLoading(true); setError('');
    try { const result = await latest.current(); if (current === request.current) { setData(result); setDataKey(key); } }
    catch (e) { if (current === request.current) setError(e instanceof Error ? e.message : 'Could not load data.'); }
    finally { if (current === request.current) setLoading(false); }
  }, [key]);
  useEffect(() => {
    if (!focused) return;
    const initialFetch = setTimeout(() => { void refresh(); }, 0);
    const requestCounter = request;
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const timer = poll ? setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, poll) : undefined;
    return () => { requestCounter.current++; clearTimeout(initialFetch); subscription.remove(); if (timer) clearInterval(timer); };
  }, [key, focused, poll, refresh]);
  return { data: dataKey === key ? data : null, loading, error, refresh };
}
