const express = require("express");
const rateLimit = require("express-rate-limit");
const { authMiddleware } = require("../middleware/auth");
const { parseMultipartImages } = require("../middleware/image-upload");
const { saveUpload } = require("../services/upload");

const router = express.Router();
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "上传过于频繁，请稍后再试" },
});

router.post("/", authMiddleware, uploadLimiter, parseMultipartImages, async (req, res) => {
  try {
    const urls = await Promise.all(req.files.map((file) => saveUpload(file)));
    res.json({ urls, message: "上传成功" });
  } catch (error) {
    console.error("[UPLOAD SAVE]", error);
    res.status(500).json({ error: "图片保存失败" });
  }
});

module.exports = router;
