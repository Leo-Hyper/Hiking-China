const SAFE_IMAGE_PATTERN = /^(https?:\/\/|\/img\/|\/uploads\/)/;

function pageLimit(value, fallback = 20, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function pageOffset(value, max = 10000) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, max);
}

function safeImageUrl(value) {
  const url = String(value || "").trim();
  return SAFE_IMAGE_PATTERN.test(url) && url.length <= 1000 ? url : "";
}

function safeImageUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((url) => typeof url === "string" && url.length <= 1000)
    .filter((url) => SAFE_IMAGE_PATTERN.test(url))
    .slice(0, 9);
}

module.exports = { pageLimit, pageOffset, safeImageUrl, safeImageUrls };
