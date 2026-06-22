const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 9;
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function parseMultipart(req, res, next) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) return next();

  const m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!m) return res.status(400).json({ error: "无效的请求格式" });

  const boundary = Buffer.from("--" + (m[1] || m[2]));
  const endBoundary = Buffer.concat([boundary, Buffer.from("--")]);
  const crlf = Buffer.from("\r\n");
  const doubleCrlf = Buffer.from("\r\n\r\n");

  const chunks = [];
  let totalSize = 0;
  req.on("data", (chunk) => {
    totalSize += chunk.length;
    if (totalSize > MAX_SIZE * MAX_FILES + 1024 * 100) {
      req.destroy();
      return res.status(413).json({ error: "请求体过大" });
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    try {
      const buffer = Buffer.concat(chunks);
      const files = [];
      const fields = {};

      // 查找所有 boundary 分隔位置
      let pos = buffer.indexOf(boundary);
      if (pos !== 0) pos = buffer.indexOf(boundary, 0);

      while (pos !== -1) {
        const partStart = pos + boundary.length;
        // 每个 boundary 后紧跟 \r\n
        const effectiveStart = partStart + 2;

        // 找下一个 boundary
        pos = buffer.indexOf(boundary, effectiveStart);
        if (pos === -1) break;

        // 提取这一部分（去掉结尾的 \r\n）
        let partEnd = pos - 2;
        if (partEnd <= effectiveStart) continue;

        const partBuffer = buffer.slice(effectiveStart, partEnd);

        // 找头部和内容的分隔点
        const headerEnd = partBuffer.indexOf(doubleCrlf);
        if (headerEnd === -1) continue;

        const headerStr = partBuffer.slice(0, headerEnd).toString("utf-8");
        const contentBuffer = partBuffer.slice(headerEnd + 4);

        // 解析 Content-Disposition
        const nameM = headerStr.match(/name="([^"]+)"/);
        const filenameM = headerStr.match(/filename="([^"]+)"/);
        const name = nameM ? nameM[1] : null;
        if (!name) continue;

        if (filenameM) {
          const originalName = filenameM[1];
          const ext = path.extname(originalName).toLowerCase();
          if (!ALLOWED_EXTS.includes(ext)) continue;
          if (contentBuffer.length > MAX_SIZE) {
            return res.status(413).json({ error: `文件 ${originalName} 超过 5MB 限制` });
          }
          if (files.length >= MAX_FILES) {
            return res.status(400).json({ error: `最多上传 ${MAX_FILES} 张图片` });
          }
          const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
          const filePath = path.join(UPLOADS_DIR, uniqueName);
          fs.writeFileSync(filePath, contentBuffer);
          files.push({ fieldname: name, originalname: originalName, filename: uniqueName, size: contentBuffer.length });
        } else {
          fields[name] = contentBuffer.toString("utf-8").trim();
        }
      }

      if (files.length === 0) {
        return res.status(400).json({ error: "请选择图片文件" });
      }

      req.files = files;
      req.body = fields;
      next();
    } catch (err) {
      console.error("[UPLOAD PARSE]", err);
      res.status(500).json({ error: "文件解析失败" });
    }
  });

  req.on("error", () => {
    if (!res.headersSent) res.status(500).json({ error: "上传错误" });
  });
}

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");

router.post("/", authMiddleware, parseMultipart, (req, res) => {
  const urls = req.files.map((f) => `/uploads/${f.filename}`);
  res.json({ urls, message: "上传成功" });
});

module.exports = router;
