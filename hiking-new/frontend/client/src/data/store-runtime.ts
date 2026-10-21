export const SESSION_USER_KEY = 'hiking_session_user';
export const RECENT_VIEWS_KEY = 'hiking_recent_views';

let storeVersion = 0;
const listeners = new Set<() => void>();

export function subscribeStore(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getStoreVersion(): number {
  return storeVersion;
}

export function notify(): void {
  storeVersion += 1;
  listeners.forEach((callback) => callback());
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('存储空间不足，请减少图片数量或尺寸后重试');
  }
}
