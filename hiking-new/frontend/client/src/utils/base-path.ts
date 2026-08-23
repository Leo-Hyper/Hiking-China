const configuredBasePath = process.env.CLIENT_BASE_PATH || '';

// Netlify commonly uses "/" for a root deployment, but "//img/x.png" becomes a protocol-relative URL.
export const BASE_PATH: string = configuredBasePath === '/' ? '' : configuredBasePath;

export function withBasePath(path: string): string {
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (path.startsWith('/spark/')) return path;
  if (path.startsWith('/')) return `${BASE_PATH}${path}`;
  return `${BASE_PATH}/${path}`;
}

const DEFAULT_IMAGE: string = '/img/徒步装备.avif';

export function resolveImageUrl(url: string | undefined, fallback?: string): string {
  if (!url || url.trim() === '') return withBasePath(fallback || DEFAULT_IMAGE);
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return withBasePath(url);
}

export function resolveFirstImage(images: string[] | undefined, fallback?: string): string {
  if (!Array.isArray(images) || images.length === 0) {
    return withBasePath(fallback || DEFAULT_IMAGE);
  }
  return resolveImageUrl(images[0], fallback);
}

export function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}
