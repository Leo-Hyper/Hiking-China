const MAX_ENTRIES = 200;
const cache = new Map();

function publicCache(ttlMs = 30000) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();

    const key = req.originalUrl;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && now - hit.createdAt < ttlMs) {
      res.set("X-Cache", "HIT");
      res.set("Age", String(Math.floor((now - hit.createdAt) / 1000)));
      res.set("Cache-Control", `public, max-age=${Math.floor(ttlMs / 1000)}, stale-while-revalidate=120`);
      res.set("Netlify-CDN-Cache-Control", "public, max-age=120, stale-while-revalidate=600");
      return res.json(hit.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (cache.size >= MAX_ENTRIES) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey) cache.delete(oldestKey);
        }
        cache.set(key, { body, createdAt: now });
        res.set("X-Cache", "MISS");
        res.set("Cache-Control", `public, max-age=${Math.floor(ttlMs / 1000)}, stale-while-revalidate=120`);
        res.set("Netlify-CDN-Cache-Control", "public, max-age=120, stale-while-revalidate=600");
      }
      return originalJson(body);
    };
    return next();
  };
}

function clearPublicCache() {
  cache.clear();
}

module.exports = { publicCache, clearPublicCache };
