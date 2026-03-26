import { useEffect, useState } from 'react';

/**
 * Debounces a value by the given delay.
 *
 * Returns the latest value only after `delay` ms of inactivity.
 * Used internally by AsyncComboboxField to throttle search queries.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
