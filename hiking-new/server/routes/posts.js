const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { createPost, getAllPosts, getPostsByCategory, getPostById, searchPosts, deletePost } = require("../models/post");

console.log("[POSTS] Routes loaded");

// GET /api/posts - 获取所有帖子
router.get("/", async (req, res) => {
  try {
    console.log("[DEBUG] GET /api/posts, query:", req.query);
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

    console.log("[DEBUG] GET /api/posts returning", posts.length, "posts");
    res.json({ posts });
  } catch (err) {
    console.error("[ERROR] GET /api/posts:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// GET /api/posts/:id - 获取单个帖子
router.get("/:id", async (req, res) => {
  try {
    console.log("[DEBUG] GET /api/posts/:id", req.params.id);
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "帖子不存在" });
    res.json({ post });
  } catch (err) {
    console.error("[ERROR] GET /api/posts/:id:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/posts - 创建帖子（需登录）
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("[DEBUG] POST /api/posts, userId:", req.userId);
    console.log("[DEBUG] Body:", JSON.stringify(req.body));
    const { title, content, category, tags, imageUrls } = req.body;

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
    });

    console.log("[DEBUG] Post created, id:", result.id);
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
    console.log("[DEBUG] DELETE /api/posts/:id", req.params.id, "userId:", req.userId);
    await deletePost(req.params.id, req.userId);
    res.json({ message: "删除成功" });
  } catch (err) {
    console.error("[ERROR] DELETE /api/posts/:id:", err);
    res.status(403).json({ error: err.message || "删除失败" });
  }
});

module.exports = router;

