const express = require("express");
const router = express.Router();
const { authMiddleware, requireVerifiedEmail } = require("../middleware/auth");
const { createComment, getAllCommentsByPostId, likeComment, isCommentLiked, updateComment, deleteComment } = require("../models/comment");
const { get } = require("../models/db");
const { clearPublicCache } = require("../middleware/public-cache");
const { safeImageUrl } = require("../utils/validation");

// 二级扁平嵌套树：
// 顶级评论 parent_id=NULL，子回复的 parent_id 指向所属顶级评论（而非直接父评论）
// 所有回复平铺在 replies[] 中，通过 reply_to_username 标注具体回复对象
function buildCommentTree(comments) {
  const commentMap = new Map();
  const roots = [];

  // 第一遍：建立映射
  for (const c of comments) {
    commentMap.set(c.id, { ...c, replies: [] });
  }

  // 第二遍：挂载
  for (const c of comments) {
    const node = commentMap.get(c.id);
    if (c.parent_id) {
      const parent = commentMap.get(c.parent_id);
      if (parent) {
        parent.replies.push(node);
      } else {
        // 父评论已被删除，作为顶级评论展示
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// GET /api/comments?post_id=X
router.get("/", async (req, res) => {
  try {
    const { post_id } = req.query;
    if (!post_id) return res.status(400).json({ error: "缺少 post_id" });

    const postId = Number.parseInt(post_id, 10);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: "post_id 无效" });
    }
    const allComments = await getAllCommentsByPostId(postId, 500);
    const tree = buildCommentTree(allComments);

    res.json({ comments: tree });
  } catch (err) {
    console.error("[COMMENTS] GET error:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/comments - 创建评论
router.post("/", authMiddleware, requireVerifiedEmail, async (req, res) => {
  try {
    const post_id = Number.parseInt(req.body.post_id, 10);
    const content = String(req.body.content || "").trim();
    const parent_id = req.body.parent_id ? Number.parseInt(req.body.parent_id, 10) : null;
    const reply_to_user_id = req.body.reply_to_user_id ? Number.parseInt(req.body.reply_to_user_id, 10) : null;
    const image_url = safeImageUrl(req.body.image_url) || null;
    if (!post_id || !content) {
      return res.status(400).json({ error: "缺少必要字段" });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: "评论不能超过2000字" });
    }

    // 如果是回复（有 parent_id 且 parent_id 的父评论有 parent_id），保持 parent_id 指向顶级评论
    const post = await get("SELECT id FROM posts WHERE id = ? AND status = 1", [post_id]);
    if (!post) return res.status(404).json({ error: "帖子不存在" });

    let finalParentId = parent_id;
    let replyToUsername = null;

    if (reply_to_user_id) {
      const replyUser = await get("SELECT username FROM users WHERE id = ?", [reply_to_user_id]);
      if (!replyUser) {
        return res.status(400).json({ error: "回复用户不存在" });
      }
      replyToUsername = replyUser.username;
    }

    // 如果 parent_id 本身是子回复（它的 parent_id 非空），则提升到顶级评论
    if (finalParentId) {
      const parentComment = await get("SELECT parent_id, post_id FROM comments WHERE id = ?", [finalParentId]);
      if (!parentComment || Number(parentComment.post_id) !== post_id) {
        return res.status(400).json({ error: "父评论无效" });
      }
      if (parentComment && parentComment.parent_id) {
        // parent_id 指向的是一条子回复 → 提升到该子回复所属的顶级评论
        finalParentId = parentComment.parent_id;
      }
    }

    const result = await createComment({
      post_id,
      user_id: req.userId,
      content: content.trim(),
      parent_id: finalParentId,
      reply_to_user_id,
      reply_to_username: replyToUsername,
      image_url,
    });

    const sql = `SELECT c.*, u.username, u.avatar
                 FROM comments c
                 LEFT JOIN users u ON c.user_id = u.id
                 WHERE c.id = ?`;
    const comment = await get(sql, [result.id]);

    clearPublicCache();
    res.status(201).json({ comment });
  } catch (err) {
    console.error("[COMMENTS] POST error:", err);
    res.status(500).json({ error: "评论失败" });
  }
});

// POST /api/comments/:id/like
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const result = await likeComment(parseInt(req.params.id), req.userId);
    res.json(result);
  } catch (err) {
    if (err.message === "评论不存在") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "操作失败" });
  }
});

// GET /api/comments/:id/like/check - 检查是否已点赞（需登录）
router.get("/:id/like/check", authMiddleware, async (req, res) => {
  try {
    const liked = await isCommentLiked(parseInt(req.params.id), req.userId);
    res.json({ liked });
  } catch (err) {
    res.status(500).json({ error: "操作失败" });
  }
});

// GET /api/comments/my - 获取我的评论
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { all } = require("../models/db");
    const comments = await all(
      'SELECT c.*, p.title as post_title FROM comments c LEFT JOIN posts p ON c.post_id = p.id WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ comments });
  } catch (err) {
      res.status(500).json({ error: "服务器错误" });
  }
});


// PUT /api/comments/:id - 编辑评论（仅作者）
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "内容不能为空" });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: "评论不能超过2000字" });
    }
    await updateComment(parseInt(req.params.id), req.userId, { content: content.trim() });
    res.json({ message: "更新成功" });
  } catch (err) {
    const known = err.message === "评论不存在或无权编辑";
    res.status(known ? 403 : 500).json({ error: known ? err.message : "编辑失败" });
  }
});

// DELETE /api/comments/:id - 删除评论（仅作者）
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await deleteComment(parseInt(req.params.id), req.userId);
    clearPublicCache();
    res.json({ message: "删除成功" });
  } catch (err) {
    const known = err.message === "评论不存在" || err.message === "无权删除";
    res.status(known ? 403 : 500).json({ error: known ? err.message : "删除失败" });
  }
});

module.exports = router;
