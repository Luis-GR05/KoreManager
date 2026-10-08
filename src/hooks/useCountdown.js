import { useCallback, useEffect, useState } from 'react';

/**
 * Cuenta atrás en segundos.
 * @param {number} [initial=0]
 * @returns {[number, (seconds: number) => void]}
 */
export default function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(Math.max(0, initial));

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const start = useCallback((s) => setSeconds(Math.max(0, Math.ceil(s))), []);
  return [seconds, start];
}
