const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { createPost, getAllPosts, getPostsByCategory, getPostById, searchPosts, deletePost, updatePost, getMyPosts, getMyPostCount } = require("../models/post");

console.log("[POSTS] Routes loaded");

// GET /api/posts/my - 获取我的帖子（需登录）
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const lim = parseInt(limit) || 50;
    const off = parseInt(offset) || 0;
    const posts = await getMyPosts(req.userId, lim, off);
    const total = await getMyPostCount(req.userId);
    res.json({ posts, total });
  } catch (err) {
    console.error("[ERROR] GET /api/posts/my:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// GET /api/posts - 获取所有帖子
router.get("/", async (req, res) => {
  try {
    const { category, q, limit, offset } = req.query;
    const lim = parseInt(limit) || 50;
    const off = parseInt(offset) || 0;

    let posts;
    if (category) {
      posts = await getPostsByCategory(category, lim);
    } else if (q) {
      posts = await searchPosts(q, lim);
    } else {
      posts = await getAllPosts(lim, off);
    }

    res.json({ posts });
  } catch (err) {
    console.error("[ERROR] GET /api/posts:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// GET /api/posts/:id - 获取单个帖子
router.get("/:id", async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "帖子不存在" });
    res.json({ post });
  } catch (err) {
    console.error("[ERROR] GET /api/posts/:id:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// PUT /api/posts/:id - 编辑帖子（需登录，只能编辑自己的）
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags, imageUrls, extrainfo } = req.body;

    if (title && title.length > 100) {
      return res.status(400).json({ error: "标题不能超过100个字符" });
    }
    if (content && content.length > 10000) {
      return res.status(400).json({ error: "内容不能超过10000个字符" });
    }

    await updatePost(req.params.id, req.userId, {
      title,
      content,
      category,
      tags,
      imageUrls,
      extrainfo: extrainfo || undefined,
    });

    res.json({ message: "更新成功" });
  } catch (err) {
    console.error("[ERROR] PUT /api/posts/:id:", err);
    res.status(403).json({ error: err.message || "编辑失败" });
  }
});

// POST /api/posts - 创建帖子（需登录）
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags, imageUrls, extrainfo } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "标题和内容不能为空" });
    }
    if (title.length > 100) {
      return res.status(400).json({ error: "标题不能超过100个字符" });
    }
    if (content.length > 10000) {
      return res.status(400).json({ error: "内容不能超过10000个字符" });
    }

    const result = await createPost(req.userId, {
      title,
      content,
      category: category || "其他",
      tags: tags || [],
      imageUrls: imageUrls || [],
      extrainfo: extrainfo || undefined,
    });

    res.status(201).json({
      message: "发布成功",
      postId: result.id,
    });
  } catch (err) {
    console.error("[ERROR] POST /api/posts:", err);
    res.status(500).json({ error: "发布失败: " + err.message });
  }
});

// DELETE /api/posts/:id - 删除帖子（需登录，只能删自己的）
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await deletePost(req.params.id, req.userId);
    res.json({ message: "删除成功" });
  } catch (err) {
    console.error("[ERROR] DELETE /api/posts/:id:", err);
    res.status(403).json({ error: err.message || "删除失败" });
  }
});

// GET /api/posts/user/:userId - 获取某用户的公开帖子
router.get("/user/:userId", async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const lim = parseInt(limit) || 50;
    const off = parseInt(offset) || 0;
    const posts = await getMyPosts(parseInt(req.params.userId), lim, off);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/posts/like/toggle/:postId
router.post("/like/toggle/:postId", authMiddleware, async (req, res) => {
  try {
    const { getDb } = require("../models/db");
    const db = getDb();
    const postId = parseInt(req.params.postId);
    const userId = req.userId;
    const existing = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (existing) {
      await new Promise((resolve, reject) => {
        db.run("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId], function(err) {
          if (err) reject(err); else resolve();
        });
      });
      db.run("UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?", [postId]);
      res.json({ liked: false });
    } else {
      await new Promise((resolve, reject) => {
        db.run("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId], function(err) {
          if (err) reject(err); else resolve();
        });
      });
      db.run("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?", [postId]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/like/check/:postId
router.get("/like/check/:postId", authMiddleware, async (req, res) => {
  try {
    const { getDb } = require("../models/db");
    const db = getDb();
    const row = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?", [parseInt(req.params.postId), req.userId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    res.json({ liked: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;