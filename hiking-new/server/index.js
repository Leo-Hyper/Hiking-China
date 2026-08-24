const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// 数据库初始化
const { initDb } = require("./models/db");

const app = express();
const PORT = process.env.PORT || 3001;

// Render and Netlify terminate TLS/proxying before the Express process.
app.set("trust proxy", 1);

// 中间件
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// CORS：支持 FRONTEND_URL 逗号分隔多个域名（如 Netlify 站点 + 本地开发）
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: FRONTEND_ORIGINS }));
app.use(express.json({ limit: "50mb" }));

// 静态文件 — 上传目录（仅本地存储模式；Cloudinary 模式图片由 CDN 托管）
const { UPLOADS_DIR } = require("./services/upload");
// Keep legacy /uploads URLs available after switching new uploads to Cloudinary.
app.use("/uploads", express.static(UPLOADS_DIR));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "请求过于频繁，请稍后再试" },
});
app.use("/api/", limiter);

// API 路由
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/search", require("./routes/search"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/events", require("./routes/events"));

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 开发环境：允许前端跨域访问
if (process.env.NODE_ENV !== "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

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
