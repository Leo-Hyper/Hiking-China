const configuredBasePath = process.env.CLIENT_BASE_PATH || '';
const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || '';

// Netlify commonly uses "/" for a root deployment, but "//img/x.png" becomes a protocol-relative URL.
export const BASE_PATH: string = configuredBasePath === '/' ? '' : configuredBasePath;

const OPTIMIZED_IMAGES = new Set([
  '云蒙山', '其他装备', '喀纳斯', '四姑娘山', '墨脱', '导航', '张家界',
  '服装', '稻城亚丁', '背包', '虎跳峡', '贡嘎转山', '鞋履', '首页', '香山', '黄山',
  'hero-poster',
]);

const CARD_IMAGES = new Set([
  '云蒙山', '其他装备', '喀纳斯', '四姑娘山', '墨脱', '导航', '张家界',
  '徒步装备', '服装', '稻城亚丁', '背包', '虎跳峡', '贡嘎转山',
  '鞋履', '首页', '香山', '黄山', 'hero-poster',
  'routes/zhonghutiao', 'routes/yubeng-cun', 'routes/yubeng-binghu',
  'routes/yubeng-shenpu', 'routes/yubeng-ninong', 'routes/changchuanbi',
  'routes/huangshan', 'routes/yading-changxian', 'routes/yading-butu',
]);

export function optimizedImagePath(path: string): string {
  if (!path || path === '/img/logo.png') return path;
  const match = path.match(/^\/img\/(.+)\.(jpe?g|png|webp|avif)$/i);
  if (!match || !OPTIMIZED_IMAGES.has(match[1])) return path;
  return `/img/${match[1]}.opt.webp`;
}

export function withCardImage(path: string): string {
  const match = path.match(/^\/img\/(.+)\.(jpe?g|png|webp|avif)$/i);
  if (match && CARD_IMAGES.has(match[1])) return `${BASE_PATH}/img/${match[1]}.card.webp`;
  return withBasePath(path);
}

export function withBasePath(path: string): string {
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (configuredApiBase && path.startsWith('/uploads/')) {
    return `${configuredApiBase}${path}`;
  }
  const optimizedPath = optimizedImagePath(path);
  if (optimizedPath.startsWith('/')) return `${BASE_PATH}${optimizedPath}`;
  return `${BASE_PATH}/${optimizedPath}`;
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
