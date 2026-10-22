const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

// 数据库初始化
const { initDb, get } = require("./models/db");
const { requestContext } = require("./middleware/request-context");
const { initObservability, captureException } = require("./services/observability");

const app = express();
const PORT = process.env.PORT || 3001;
initObservability();

// Render and Netlify terminate TLS/proxying before the Express process.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(requestContext);

// 中间件
app.use(compression({ threshold: 1024 }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// CORS：支持 FRONTEND_URL 逗号分隔多个域名（如 Netlify 站点 + 本地开发）
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FRONTEND_ORIGINS = [...new Set([
  "https://hiking-china.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  ...configuredOrigins,
])];
app.use(cors({ origin: FRONTEND_ORIGINS }));
app.use(express.json({ limit: "1mb" }));

// 静态文件 — 上传目录（仅本地存储模式；Cloudinary 模式图片由 CDN 托管）
const { UPLOADS_DIR } = require("./services/upload");
// Keep legacy /uploads URLs available after switching new uploads to Cloudinary.
app.use("/uploads", express.static(UPLOADS_DIR, { immutable: true, maxAge: "365d" }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "请求过于频繁，请稍后再试" },
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "登录或注册尝试过于频繁，请稍后再试" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "操作过于频繁，请稍后再试" },
});
app.use("/api/auth/forgot-password", accountActionLimiter);
app.use("/api/auth/reset-password", accountActionLimiter);
app.use("/api/auth/send-verification", accountActionLimiter);
app.use("/api/auth/verify-email", accountActionLimiter);

// API 路由
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/search", require("./routes/search"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/events", require("./routes/events"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/feed", require("./routes/feed"));
app.use("/api/messages", require("./routes/messages"));
app.use(require("./routes/sitemap"));

// 健康检查
app.get("/api/health", async (req, res) => {
  let database = "ok";
  try {
    await get("SELECT 1 AS ok");
  } catch (error) {
    database = "error";
    captureException(error, { requestId: req.requestId, check: "database" });
  }
  const healthy = database === "ok";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database,
    version: require("./package.json").version,
    commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || "dev",
    environment: process.env.NODE_ENV || "development",
  });
});

// 开发环境：允许前端跨域访问
if (process.env.NODE_ENV !== "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

app.use((error, req, res, next) => {
  captureException(error, { requestId: req.requestId, path: req.originalUrl });
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    request_id: req.requestId,
    message: error?.message || "unknown error",
    stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
  }));
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "服务器错误", request_id: req.requestId });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });

module.exports = app;
