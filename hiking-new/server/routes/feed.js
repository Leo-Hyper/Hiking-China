const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { getPersonalizedFeed } = require("../models/feed");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await getPersonalizedFeed(req.userId, req.query.limit, req.query.offset);
    res.json({ posts });
  } catch (error) {
    console.error("[FEED] failed:", error);
    res.status(500).json({ error: "动态加载失败" });
  }
});

module.exports = router;
