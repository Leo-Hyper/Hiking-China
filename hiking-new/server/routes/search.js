const express = require("express");
const router = express.Router();
const { getDb } = require("../models/db");

// GET /api/search?q=xxx
router.get("/", (req, res) => {
  const { getDb } = require("../models/db");
  const db = getDb();
  const q = req.query.q || "";

  if (!q.trim()) {
    return res.json({ results: [] });
  }

  // SQLite LIKE 模糊搜索（后续可替换为全文索引）
  const sql = `
    SELECT type, title, category, tags, excerpt, route, created_at
    FROM search_index
    WHERE title LIKE ? OR category LIKE ? OR tags LIKE ? OR excerpt LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `;
  const pattern = `%${q}%`;

  db.all(sql, [pattern, pattern, pattern, pattern], (err, rows) => {
    if (err) return res.status(500).json({ error: "搜索出错" });
    res.json({ results: rows });
  });
});

module.exports = router;
