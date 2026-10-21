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

function jsonBody(method: string) {
  return <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: jsonBody('POST'),
  put: jsonBody('PUT'),
  delete: jsonBody('DELETE'),
  upload: <T>(path: string, files: File[]): Promise<T> => {
    const form = new FormData();
    files.forEach((f: File) => form.append('files', f));
    return request<T>(path, { method: 'POST', body: form });
  },
};
