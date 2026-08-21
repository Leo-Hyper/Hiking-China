const express = require("express");
const router = express.Router();

// GET /api/search?q=xxx - 搜索帖子
router.get("/", async (req, res) => {
  const { all } = require("../models/db");
  const q = req.query.q || "";

  if (!q.trim()) {
    return res.json({ results: [] });
  }

  const pattern = "%" + q + "%";
  const sql = "SELECT id, title, category, tags, content, created_at, user_id FROM posts WHERE title LIKE ? OR tags LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 20";

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
    res.status(500).json({ error: "搜索出错" });
  }
});

module.exports = router;
