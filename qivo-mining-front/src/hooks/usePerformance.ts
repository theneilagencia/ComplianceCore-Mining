/**
 * React Performance Hooks
 * 
 * Hooks otimizados para performance no React:
 * - useDebounce: atrasa atualizações de estado
 * - useThrottle: limita frequência de atualizações
 * - useMemoizedCallback: memoiza callbacks com deps
 * - useAsyncMemo: memoização para valores assíncronos
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Debounce hook - atrasa atualizações de valor
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 *   
 *   useEffect(() => {
 *     // Only runs after 300ms of no changes
 *     performSearch(debouncedQuery);
 *   }, [debouncedQuery]);
 *   
 *   return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Throttle hook - limita frequência de atualizações
 * 
 * @example
 * ```tsx
 * function ScrollTracker() {
 *   const [scrollY, setScrollY] = useState(0);
 *   const throttledScrollY = useThrottle(scrollY, 100);
 *   
 *   useEffect(() => {
 *     const handleScroll = () => setScrollY(window.scrollY);
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, []);
 *   
 *   return <div>Scroll: {throttledScrollY}</div>;
 * }
 * ```
 */
export function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      const now = Date.now();
      if (now >= lastRun.current + intervalMs) {
        setThrottledValue(value);
        lastRun.current = now;
      }
    }, intervalMs - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, intervalMs]);

  return throttledValue;
}

/**
 * Async memo hook - memoização para valores assíncronos
 * 
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const user = useAsyncMemo(
 *     async () => {
 *       return await fetchUser(userId);
 *     },
 *     [userId],
 *     null // initial value
 *   );
 *   
 *   if (!user) return <Loading />;
 *   return <div>{user.name}</div>;
 * }
 * ```
 */
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
  initialValue: T
): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    let cancelled = false;

    factory().then((result) => {
      if (!cancelled) {
        setValue(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

/**
 * Previous value hook - mantém valor anterior
 * 
 * @example
 * ```tsx
 * function Counter({ count }: { count: number }) {
 *   const prevCount = usePrevious(count);
 *   
 *   return (
 *     <div>
 *       Current: {count}, Previous: {prevCount}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Mounted hook - verifica se componente está montado
 * Útil para evitar atualizações de estado em componentes desmontados
 * 
 * @example
 * ```tsx
 * function AsyncComponent() {
 *   const isMounted = useIsMounted();
 *   const [data, setData] = useState(null);
 *   
 *   useEffect(() => {
 *     fetchData().then((result) => {
 *       if (isMounted()) {
 *         setData(result);
 *       }
 *     });
 *   }, [isMounted]);
 * }
 * ```
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Stable callback hook - callback que não muda referência
 * Similar ao useCallback mas sem precisar declarar deps
 * 
 * @example
 * ```tsx
 * function Form() {
 *   const [value, setValue] = useState('');
 *   
 *   // This callback never changes reference
 *   const handleSubmit = useStableCallback(() => {
 *     console.log(value);
 *   });
 *   
 *   return <ExpensiveChild onSubmit={handleSubmit} />;
 * }
 * ```
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Lazy ref hook - inicialização lazy de ref
 * 
 * @example
 * ```tsx
 * function ExpensiveComponent() {
 *   const expensive = useLazyRef(() => {
 *     // Only runs once, on first render
 *     return new ExpensiveClass();
 *   });
 *   
 *   return <div>{expensive.current.getValue()}</div>;
 * }
 * ```
 */
export function useLazyRef<T>(init: () => T): React.MutableRefObject<T> {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = init();
  }

  return ref as React.MutableRefObject<T>;
}

/**
 * Update effect hook - useEffect que não roda no mount
 * 
 * @example
 * ```tsx
 * function Component({ value }: { value: string }) {
 *   useUpdateEffect(() => {
 *     // Only runs when value changes, not on mount
 *     console.log('Value updated:', value);
 *   }, [value]);
 * }
 * ```
 */
export function useUpdateEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    return effect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Render counter hook - conta quantas vezes o componente renderizou
 * Útil para debugging de performance
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const renderCount = useRenderCount();
 *   console.log(`Rendered ${renderCount} times`);
 * }
 * ```
 */
export function useRenderCount(): number {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;
  });

  return count.current;
}

/**
 * Performance logger hook - loga tempo de render
 * 
 * @example
 * ```tsx
 * function ExpensiveComponent() {
 *   usePerformanceLogger('ExpensiveComponent');
 *   
 *   // Component implementation
 * }
 * ```
 */
export function usePerformanceLogger(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
): void {
  const renderStart = useRef(0);
  const renderCount = useRef(0);

  if (enabled) {
    renderStart.current = performance.now();
  }

  useEffect(() => {
    if (enabled) {
      const duration = performance.now() - renderStart.current;
      renderCount.current += 1;
      
      if (duration > 16) {
        // Warn if render takes more than 1 frame (16ms)
        console.warn(
          `[PERF] ${componentName} render #${renderCount.current} took ${duration.toFixed(2)}ms`
        );
      }
    }
  });
}

/**
 * Async state hook - gerencia estado assíncrono
 * 
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, loading, error, execute } = useAsyncState(
 *     () => fetchUser(userId),
 *     [userId]
 *   );
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error error={error} />;
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */
export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useIsMounted();

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (isMounted()) {
        setData(result);
      }
    } catch (err) {
      if (isMounted()) {
        setError(err as Error);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [asyncFn, isMounted]);

  useEffect(() => {
    execute();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute };
}
