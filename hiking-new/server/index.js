const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// 数据库初始化
const { initDb } = require("./models/db");
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "50mb" }));

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
app.use("/api/comments", require("./routes/comments"))
app.use("/api/search", require("./routes/search"));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
