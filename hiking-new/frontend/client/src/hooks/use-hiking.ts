import { useCallback, useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import {
  getCurrentUser,
  getStoreVersion,
  subscribeStore,
} from '@client/src/data/hiking-store';
import type { HikingUser } from '@client/src/data/hiking-types';

export function useStoreVersion(): number {
  return useSyncExternalStore(subscribeStore, getStoreVersion);
}

export function useAuth(): { isLoggedIn: boolean; user: HikingUser | null } {
  useStoreVersion();
  const user: HikingUser | null = getCurrentUser();
  return { isLoggedIn: user !== null, user };
}

// 通用异步数据加载：loader 返回 Promise，自动管理 loading/error/reload
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);
  const mounted = useRef<boolean>(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    setError(null);
    loader()
      .then((result: T) => {
        if (mounted.current) setData(result);
      })
      .catch((e: unknown) => {
        if (mounted.current) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t: number) => t + 1), []);
  return { data, loading, error, reload };
}