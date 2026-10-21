const express = require("express");
const router = express.Router();
const { publicCache } = require("../middleware/public-cache");

// GET /api/search?q=xxx - 搜索帖子
router.get("/", publicCache(30000), async (req, res) => {
  const { all } = require("../models/db");
  const q = String(req.query.q || "").trim().slice(0, 100);

  if (!q) {
    return res.json({ results: [] });
  }

  const pattern = "%" + q + "%";
  const sql = `
    SELECT id, title, category, tags, substr(content, 1, 800) AS content, created_at, user_id
    FROM posts
    WHERE status = 1 AND (title LIKE ? OR tags LIKE ? OR content LIKE ?)
    ORDER BY created_at DESC
    LIMIT 20
  `;

  try {
    const rows = await all(sql, [pattern, pattern, pattern]);

    const results = (rows || []).map(r => ({
      id: r.id,
      type: "post",
      title: r.title,
      category: r.category || "",
      tags: (r.tags || "").split(",").filter(Boolean),
      excerpt: (r.content || "").replace(/<[^>]*>/g, "").substring(0, 200),
      route: "/post/" + r.id,
      created_at: r.created_at
    }));

    res.json({ results });
  } catch (err) {
    console.error("[SEARCH] failed:", err);
    res.status(500).json({ error: "搜索出错" });
  }
});

module.exports = router;
