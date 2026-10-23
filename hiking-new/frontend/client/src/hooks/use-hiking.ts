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
  deps: unknown[] = [],
  options: { keepPreviousData?: boolean } = {},
): { data: T | null; loading: boolean; refreshing: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);
  const dataRef = useRef<T | null>(null);
  const keepPreviousData = Boolean(options.keepPreviousData);

  useEffect(() => {
    let active = true;
    if (!keepPreviousData && dataRef.current !== null) {
      dataRef.current = null;
      setData(null);
    }
    setLoading(!keepPreviousData || dataRef.current === null);
    setRefreshing(keepPreviousData && dataRef.current !== null);
    setError(null);
    loader()
      .then((result: T) => {
        if (active) {
          dataRef.current = result;
          setData(result);
        }
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, keepPreviousData]);

  const reload = useCallback(() => setTick((t: number) => t + 1), []);
  return { data, loading, refreshing, error, reload };
}
