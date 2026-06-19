const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { createComment, getCommentsByPostId, getChildComments, likeComment } = require("../models/comment");

// GET /api/comments?post_id=X - 获取帖子评论
router.get("/", async (req, res) => {
  try {
    const { post_id } = req.query;
    if (!post_id) return res.status(400).json({ error: "缺少 post_id" });

    const comments = await getCommentsByPostId(parseInt(post_id));
    // 为每个顶级评论加载子评论
    const withChildren = await Promise.all(comments.map(async (c) => {
      const children = await getChildComments(c.id);
      return { ...c, replies: children };
    }));

    res.json({ comments: withChildren });
  } catch (err) {
    console.error("[COMMENTS] GET error:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/comments - 创建评论（需登录）
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;
    if (!post_id || !content) {
      return res.status(400).json({ error: "缺少必要字段" });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: "评论不能超过2000字" });
    }

    const result = await createComment({
      post_id: parseInt(post_id),
      user_id: req.userId,
      content: content.trim(),
      parent_id: parent_id ? parseInt(parent_id) : null,
    });

    // 返回新评论
    const { getDb } = require("../models/db");
    const db = getDb();
    const comment = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, u.username FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
        [result.id],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });

    res.status(201).json({ comment });
  } catch (err) {
    console.error("[COMMENTS] POST error:", err);
    res.status(500).json({ error: "评论失败" });
  }
});

// POST /api/comments/:id/like - 点赞评论
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const result = await likeComment(parseInt(req.params.id), req.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "操作失败" });
  }
});

module.exports = router;
