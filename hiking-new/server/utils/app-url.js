const DEFAULT_APP_BASE_URL = "https://hiking-china.onrender.com";
const DEPRECATED_ORIGINS = new Set(["https://hiking-china.netlify.app"]);

function getAppBaseUrl() {
  const configured = String(process.env.APP_BASE_URL || "").trim();
  let baseUrl = configured || DEFAULT_APP_BASE_URL;

  try {
    const parsed = new URL(baseUrl);
    if (DEPRECATED_ORIGINS.has(parsed.origin)) baseUrl = DEFAULT_APP_BASE_URL;
  } catch {
    baseUrl = DEFAULT_APP_BASE_URL;
  }

  return baseUrl.replace(/\/+$/, "");
}

module.exports = { getAppBaseUrl };
