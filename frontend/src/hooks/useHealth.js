import { useEffect, useState } from 'react';
import { healthApi } from '../api/services';

/** Polls the API readiness endpoint so the UI can show a live system status. */
export function useHealth(intervalMs = 30000) {
  const [status, setStatus] = useState('checking'); // checking | healthy | degraded | offline

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await healthApi.ready();
        if (!cancelled) setStatus('healthy');
      } catch (err) {
        if (cancelled) return;
        // 503 = API is up but the database isn't; no response = API unreachable.
        setStatus(err.response ? 'degraded' : 'offline');
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
