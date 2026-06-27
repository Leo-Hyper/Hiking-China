const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

/**
 * 解析帖子/评论的图片 URL 数组，返回首图
 *   /uploads/xxx → 拼接 API 域名（用户上传，后端托管）
 *   /img/xxx    → 相对路径（前端静态资源）
 *   http(s)://  → 原样返回
 */
export function resolveFirstImage(images, fallback) {
  if (!Array.isArray(images)) images = []
  if (images.length === 0) return fallback || '/img/徒步装备.avif'
  return resolveImageUrl(images[0], fallback)
}

export function resolveImageUrl(url, fallback) {
  if (!url || url.trim() === '') return fallback || '/img/徒步装备.avif'
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) return API_URL + url
  return url
}

/**
 * 解析 post.image_urls (JSON 字符串或数组)，返回调整后的数组
 */
export function parseImageUrls(post) {
  let images = []
  try {
    images = typeof post.image_urls === 'string' ? JSON.parse(post.image_urls) : (Array.isArray(post.image_urls) ? post.image_urls : [])
  } catch { images = [] }
  if (!Array.isArray(images)) images = []
  return images.map(img => resolveImageUrl(img))
}

export function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}