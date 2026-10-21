const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
  createPost,
  deletePost,
  getAllPosts,
  getMyPosts,
  getMyPostCount,
  getPostById,
  getPostsByCategory,
  getPostsByIds,
  getPublicPostsByUser,
  isPostLiked,
  searchPosts,
  togglePostLike,
  updatePost,
} = require("../models/post");
const { publicCache, clearPublicCache } = require("../middleware/public-cache");
const { sanitizeRichText } = require("../services/sanitize");
const { pageLimit, pageOffset, safeImageUrls } = require("../utils/validation");

// GET /api/posts/my - 获取我的帖子（需登录）
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const lim = pageLimit(limit, 50);
    const off = pageOffset(offset);
    const posts = await getMyPosts(req.userId, lim, off);
    const total = await getMyPostCount(req.userId);
    res.json({ posts, total });
  } catch (err) {
    console.error("[ERROR] GET /api/posts/my:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// GET /api/posts - 获取所有帖子
router.get("/", publicCache(30000), async (req, res) => {
  try {
    const { category, q, limit, offset } = req.query;
    const lim = pageLimit(limit, 50);
    const off = pageOffset(offset);

    let posts;
    if (category) {
      posts = await getPostsByCategory(String(category).slice(0, 30), lim);
    } else if (q) {
      posts = await searchPosts(String(q).trim().slice(0, 100), lim);
    } else {
      posts = await getAllPosts(lim, off);
    }

    res.json({ posts });
  } catch (err) {
    console.error("[ERROR] GET /api/posts:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

router.get("/batch", publicCache(30000), async (req, res) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, 50);
    const posts = await getPostsByIds(ids);
    res.json({ posts });
  } catch (error) {
    console.error("[ERROR] GET /api/posts/batch:", error);
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
    const { title, category, tags, imageUrls, extrainfo } = req.body;
    const content = req.body.content === undefined ? undefined : sanitizeRichText(req.body.content);

    if (title && title.length > 100) {
      return res.status(400).json({ error: "标题不能超过100个字符" });
    }
    if (content !== undefined && (!content || content.length > 30000)) {
      return res.status(400).json({ error: "内容不能为空且不能超过30000个字符" });
    }
    if (category && String(category).length > 30) {
      return res.status(400).json({ error: "分类名称过长" });
    }

    await updatePost(Number.parseInt(req.params.id, 10), req.userId, {
      title: title === undefined ? undefined : String(title).trim(),
      content,
      category,
      tags,
      imageUrls: imageUrls === undefined ? undefined : safeImageUrls(imageUrls),
      extrainfo: extrainfo || undefined,
    });

    clearPublicCache();
    res.json({ message: "更新成功" });
  } catch (err) {
    console.error("[ERROR] PUT /api/posts/:id:", err);
    const status = err.message === "帖子不存在" ? 404 : err.message === "无权编辑" ? 403 : 500;
    res.status(status).json({ error: status === 500 ? "编辑失败" : err.message });
  }
});

// POST /api/posts - 创建帖子（需登录）
router.post("/", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = sanitizeRichText(req.body.content);
    const { category, tags, extrainfo } = req.body;
    const imageUrls = safeImageUrls(req.body.imageUrls);

    if (!title || !content) {
      return res.status(400).json({ error: "标题和内容不能为空" });
    }
    if (title.length > 100) {
      return res.status(400).json({ error: "标题不能超过100个字符" });
    }
    if (content.length > 30000) {
      return res.status(400).json({ error: "内容不能超过30000个字符" });
    }
    if (category && String(category).length > 30) {
      return res.status(400).json({ error: "分类名称过长" });
    }

    const result = await createPost(req.userId, {
      title,
      content,
      category: category ? String(category).trim() : "其他",
      tags: tags || [],
      imageUrls,
      extrainfo: extrainfo || undefined,
    });

    clearPublicCache();
    res.status(201).json({
      message: "发布成功",
      postId: result.id,
    });
  } catch (err) {
    console.error("[ERROR] POST /api/posts:", err);
    res.status(500).json({ error: "发布失败" });
  }
});

// DELETE /api/posts/:id - 删除帖子（需登录，只能删自己的）
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await deletePost(Number.parseInt(req.params.id, 10), req.userId);
    clearPublicCache();
    res.json({ message: "删除成功" });
  } catch (err) {
    console.error("[ERROR] DELETE /api/posts/:id:", err);
    const status = err.message === "帖子不存在" ? 404 : err.message === "无权删除" ? 403 : 500;
    res.status(status).json({ error: status === 500 ? "删除失败" : err.message });
  }
});

// GET /api/posts/user/:userId - 获取某用户的公开帖子
router.get("/user/:userId", async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const lim = pageLimit(limit, 50);
    const off = pageOffset(offset);
    const userId = Number.parseInt(req.params.userId, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "用户 ID 无效" });
    }
    const posts = await getPublicPostsByUser(userId, lim, off);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/posts/like/toggle/:postId
router.post("/like/toggle/:postId", authMiddleware, async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: "帖子 ID 无效" });
    }
    const result = await togglePostLike(postId, req.userId);
    clearPublicCache();
    res.json(result);
  } catch (err) {
    if (err.message === "帖子不存在") {
      return res.status(404).json({ error: err.message });
    }
    console.error("[ERROR] POST /api/posts/like/toggle:", err);
    res.status(500).json({ error: "操作失败" });
  }
});

// GET /api/posts/like/check/:postId
router.get("/like/check/:postId", authMiddleware, async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: "帖子 ID 无效" });
    }
    res.json({ liked: await isPostLiked(postId, req.userId) });
  } catch (err) {
    console.error("[ERROR] GET /api/posts/like/check:", err);
    res.status(500).json({ error: "操作失败" });
  }
});

module.exports = router;
