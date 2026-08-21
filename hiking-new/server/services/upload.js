const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
// 本地开发：local（写入 server/uploads/，URL /uploads/xxx）
// 生产（Render 免费档无持久磁盘）：cloudinary（上传到 Cloudinary，返回 https 直链）
const PROVIDER = process.env.UPLOAD_PROVIDER || "local";

function makeUniqueName(originalName) {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

function saveLocal(file) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const filename = makeUniqueName(file.originalname);
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

async function saveCloudinary(file) {
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "hiking-china", resource_type: "image", overwrite: false },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });
}

async function saveUpload(file) {
  if (PROVIDER === "cloudinary") return saveCloudinary(file);
  return saveLocal(file);
}

module.exports = { saveUpload, PROVIDER, UPLOADS_DIR };