const express = require("express");
const router = express.Router();
const { publicCache } = require("../middleware/public-cache");

// GET /api/search?q=xxx - 搜索帖子与路线
router.get("/", publicCache(30000), async (req, res) => {
  const { all } = require("../models/db");
  const q = String(req.query.q || "").trim().slice(0, 100);

  if (!q) {
    return res.json({ results: [] });
  }

  const pattern = "%" + q + "%";
  const postSql = `
    SELECT id, title, category, tags, substr(content, 1, 800) AS content, created_at, user_id
    FROM posts
    WHERE status = 1 AND (title LIKE ? OR tags LIKE ? OR content LIKE ?)
    ORDER BY created_at DESC
    LIMIT 20
  `;
  const routeSql = `
    SELECT id, name, region, difficulty, tags, description
    FROM routes
    WHERE status = 1
      AND (name LIKE ? OR region LIKE ? OR tags LIKE ? OR description LIKE ?)
    ORDER BY rating DESC, id ASC
    LIMIT 10
  `;

  try {
    const [postRows, routeRows] = await Promise.all([
      all(postSql, [pattern, pattern, pattern]),
      all(routeSql, [pattern, pattern, pattern, pattern]),
    ]);

    const postResults = (postRows || []).map(r => ({
      id: r.id,
      type: "post",
      title: r.title,
      category: r.category || "",
      tags: (r.tags || "").split(",").filter(Boolean),
      excerpt: (r.content || "").replace(/<[^>]*>/g, "").substring(0, 200),
      route: "/post/" + r.id,
      created_at: r.created_at
    }));

    const routeResults = (routeRows || []).map(r => ({
      id: r.id,
      type: "route",
      title: r.name,
      category: "路线",
      tags: String(r.tags || "").split(",").filter(Boolean),
      excerpt: [r.region, r.difficulty, r.description].filter(Boolean).join(" · ").slice(0, 160),
      route: "/routes/" + r.id,
      created_at: null,
    }));

    res.json({ results: [...postResults, ...routeResults] });
  } catch (err) {
    console.error("[SEARCH] failed:", err);
    res.status(500).json({ error: "搜索出错" });
  }
});

module.exports = router;
