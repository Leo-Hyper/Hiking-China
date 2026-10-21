const path = require("path");

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 9;
const MAX_TOTAL_SIZE = MAX_SIZE * MAX_FILES + 100 * 1024;
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const IMAGE_TYPES = [
  {
    ext: "jpg",
    match: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    ext: "png",
    match: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "gif",
    match: (buffer) => buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii")),
  },
  {
    ext: "webp",
    match: (buffer) => buffer.length >= 12
      && buffer.subarray(0, 4).toString("ascii") === "RIFF"
      && buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

function detectImageType(buffer) {
  return IMAGE_TYPES.find((type) => type.match(buffer)) || null;
}

function parseMultipartImages(req, res, next) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return res.status(415).json({ error: "请使用 multipart/form-data 上传图片" });
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) return res.status(400).json({ error: "无效的请求格式" });

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const doubleCrlf = Buffer.from("\r\n\r\n");
  const chunks = [];
  let totalSize = 0;
  let tooLarge = false;

  req.on("data", (chunk) => {
    if (tooLarge) return;
    totalSize += chunk.length;
    if (totalSize > MAX_TOTAL_SIZE) {
      tooLarge = true;
      chunks.length = 0;
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (tooLarge) return res.status(413).json({ error: "请求体过大" });

    try {
      const buffer = Buffer.concat(chunks);
      const files = [];
      const invalidFiles = [];
      const fields = {};

      let position = buffer.indexOf(boundary);
      while (position !== -1) {
        const effectiveStart = position + boundary.length + 2;
        position = buffer.indexOf(boundary, effectiveStart);
        if (position === -1) break;

        const partEnd = position - 2;
        if (partEnd <= effectiveStart) continue;

        const partBuffer = buffer.slice(effectiveStart, partEnd);
        const headerEnd = partBuffer.indexOf(doubleCrlf);
        if (headerEnd === -1) continue;

        const header = partBuffer.subarray(0, headerEnd).toString("utf-8");
        const content = partBuffer.subarray(headerEnd + 4);
        const nameMatch = header.match(/name="([^"]+)"/);
        const filenameMatch = header.match(/filename="([^"]+)"/);
        const fieldName = nameMatch ? nameMatch[1] : null;
        if (!fieldName) continue;

        if (!filenameMatch) {
          fields[fieldName] = content.toString("utf-8").trim();
          continue;
        }

        const originalName = filenameMatch[1];
        const extension = path.extname(originalName).toLowerCase();
        const detectedType = detectImageType(content);
        const extensionMatches = detectedType
          && (detectedType.ext === "jpg"
            ? [".jpg", ".jpeg"].includes(extension)
            : extension === `.${detectedType.ext}`);

        if (!ALLOWED_EXTS.includes(extension) || !detectedType || !extensionMatches) {
          invalidFiles.push(originalName);
          continue;
        }
        if (content.length > MAX_SIZE) {
          return res.status(413).json({ error: `文件 ${originalName} 超过 5MB 限制` });
        }
        if (files.length >= MAX_FILES) {
          return res.status(400).json({ error: `最多上传 ${MAX_FILES} 张图片` });
        }

        files.push({
          fieldname: fieldName,
          originalname: originalName,
          buffer: content,
          size: content.length,
        });
      }

      if (invalidFiles.length > 0) {
        return res.status(400).json({ error: "部分文件内容与图片格式不匹配" });
      }
      if (files.length === 0) {
        return res.status(400).json({ error: "请选择图片文件" });
      }

      req.files = files;
      req.body = fields;
      return next();
    } catch (error) {
      console.error("[UPLOAD PARSE]", error);
      return res.status(500).json({ error: "文件解析失败" });
    }
  });

  req.on("error", () => {
    if (!res.headersSent) res.status(500).json({ error: "上传错误" });
  });
}

module.exports = { detectImageType, parseMultipartImages };
