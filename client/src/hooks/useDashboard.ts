import { useEffect, useState } from 'react';

export function useDashboard<T>(endpoint: string) {
  const [revision, setRevision] = useState(0);
  const key = `${endpoint}:${revision}`;
  const [result, setResult] = useState<{ key: string; data: T | null; error: string }>({ key: '', data: null, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json() as Promise<T>;
      })
      .then(data => { if (!controller.signal.aborted) setResult({ key, data, error: '' }); })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: 'Unable to load dashboard data. Please try again.' });
      });
    return () => controller.abort();
  }, [endpoint, key]);
  const loading = result.key !== key;
  return { data: loading ? null : result.data, error: loading ? '' : result.error, loading, refresh: () => setRevision(value => value + 1) };
}
