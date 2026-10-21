// 统一 fetch 封装：
// - baseURL 取构建期 env VITE_API_BASE_URL（空则同源相对路径）
// - 请求自动携带 JWT（localStorage: hiking_token）
// - 401 自动清除会话
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || '';
const GET_CACHE_TTL = 2 * 60 * 1000;
const GET_CACHE_MAX_AGE = 10 * 60 * 1000;
const GET_CACHE_PREFIX = 'hiking_get_cache:';

interface GetCacheEntry<T = unknown> {
  data: T;
  savedAt: number;
}

const getCache = new Map<string, GetCacheEntry>();
const inFlightGets = new Map<string, Promise<unknown>>();

function isCacheableGet(path: string): boolean {
  return path === '/api/posts'
    || path.startsWith('/api/posts?')
    || path.startsWith('/api/posts/batch?')
    || /^\/api\/posts\/\d+$/.test(path)
    || path === '/api/events'
    || path.startsWith('/api/events?')
    || /^\/api\/events\/\d+$/.test(path)
    || path.startsWith('/api/comments?post_id=')
    || /^\/api\/auth\/users\/\d+$/.test(path);
}

function readGetCache<T>(path: string): GetCacheEntry<T> | null {
  const memoryEntry = getCache.get(path) as GetCacheEntry<T> | undefined;
  if (memoryEntry && Date.now() - memoryEntry.savedAt < GET_CACHE_TTL) return memoryEntry;

  try {
    const raw = localStorage.getItem(`${GET_CACHE_PREFIX}${path}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GetCacheEntry<T>;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt >= GET_CACHE_MAX_AGE) {
      localStorage.removeItem(`${GET_CACHE_PREFIX}${path}`);
      return null;
    }
    getCache.set(path, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeGetCache<T>(path: string, data: T): void {
  const entry: GetCacheEntry<T> = { data, savedAt: Date.now() };
  getCache.set(path, entry);
  try {
    localStorage.setItem(`${GET_CACHE_PREFIX}${path}`, JSON.stringify(entry));
  } catch {
    // In-memory cache still avoids repeated requests in this tab.
  }
}

export function invalidateGetCache(prefix = ''): void {
  for (const key of [...getCache.keys()]) {
    if (key.startsWith(prefix)) getCache.delete(key);
  }
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(GET_CACHE_PREFIX)) continue;
      const path = key.slice(GET_CACHE_PREFIX.length);
      if (path.startsWith(prefix)) localStorage.removeItem(key);
    }
  } catch {
    // Cache invalidation is best effort when storage is unavailable.
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem('hiking_token');
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem('hiking_token', token);
    else localStorage.removeItem('hiking_token');
  } catch {
    /* storage unavailable */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem('hiking_token');
    localStorage.removeItem('hiking_session_user');
  } catch {
    /* storage unavailable */
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === 'string' && e) return e;
  }
  return fallback;
}

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

async function fetchWithRetry(path: string, options: RequestInit, attempts: number): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
      if (response.ok || !isRetryableStatus(response.status) || attempt === attempts) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    } finally {
      window.clearTimeout(timeout);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 800 * attempt));
  }
  throw lastError ?? new Error('请求失败');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token: string | null = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['Accept'] = 'application/json';

  let res: Response;
  try {
    const method = (options.method || 'GET').toUpperCase();
    res = await fetchWithRetry(
      path,
      { ...options, headers, credentials: 'same-origin' },
      method === 'GET' ? 3 : 1,
    );
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? '服务响应超时，请稍后重试'
      : '网络错误，请检查网络连接';
    throw new ApiError(0, message);
  }

  if (res.status === 401) {
    clearSession();
  }

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, getErrorMessage(data, `请求失败 (${res.status})`));
  }
  return data as T;
}

async function cachedGet<T>(path: string): Promise<T> {
  if (!isCacheableGet(path)) return request<T>(path);

  const cached = readGetCache<T>(path);
  if (cached) {
    if (Date.now() - cached.savedAt >= GET_CACHE_TTL && !inFlightGets.has(path)) {
      const revalidate = request<T>(path)
        .then((data) => writeGetCache(path, data))
        .catch(() => {})
        .finally(() => inFlightGets.delete(path));
      inFlightGets.set(path, revalidate);
    }
    return cached.data;
  }

  const inFlight = inFlightGets.get(path) as Promise<T> | undefined;
  if (inFlight) return inFlight;

  const promise = request<T>(path)
    .then((data) => {
      writeGetCache(path, data);
      return data;
    })
    .finally(() => {
      inFlightGets.delete(path);
    });
  inFlightGets.set(path, promise);
  return promise;
}

function jsonBody(method: string) {
  return <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
}

export const http = {
  get: <T>(path: string) => cachedGet<T>(path),
  post: jsonBody('POST'),
  put: jsonBody('PUT'),
  delete: jsonBody('DELETE'),
  upload: <T>(path: string, files: File[]): Promise<T> => {
    const form = new FormData();
    files.forEach((f: File) => form.append('files', f));
    return request<T>(path, { method: 'POST', body: form });
  },
};
