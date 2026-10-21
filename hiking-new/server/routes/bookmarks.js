const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { toggleBookmark, isBookmarked, listBookmarkedPosts } = require("../models/bookmark");
const { pageLimit } = require("../utils/validation");

const router = express.Router();

router.post("/toggle/:postId", authMiddleware, async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: "帖子 ID 无效" });
    }
    const result = await toggleBookmark(req.userId, postId);
    res.json({
      ...result,
      message: result.bookmarked ? "已收藏" : "已取消收藏",
    });
  } catch (error) {
    if (error.message === "帖子不存在") {
      return res.status(404).json({ error: error.message });
    }
    console.error("[BOOKMARKS] toggle failed:", error);
    res.status(500).json({ error: "操作失败" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await listBookmarkedPosts(req.userId, pageLimit(req.query.limit, 50));
    res.json({ bookmarks: posts });
  } catch (error) {
    console.error("[BOOKMARKS] list failed:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

router.get("/check/:postId", authMiddleware, async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: "帖子 ID 无效" });
    }
    res.json({ bookmarked: await isBookmarked(req.userId, postId) });
  } catch (error) {
    console.error("[BOOKMARKS] check failed:", error);
    res.status(500).json({ error: "操作失败" });
  }
});

module.exports = router;
