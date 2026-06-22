const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) return res.status(401).json({ error: 'Token 无效' });
  req.userId = decoded.id;
  next();
}

// POST /api/bookmarks/toggle - 收藏/取消收藏
router.post('/toggle/:postId', authMiddleware, async (req, res) => {
  try {
    const { getDb } = require('../models/db');
    const db = getDb();
    const userId = req.userId;
    const postId = parseInt(req.params.postId);

    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existing) {
      // 取消收藏
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({ bookmarked: false, message: '已取消收藏' });
    } else {
      // 添加收藏
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [userId, postId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({ bookmarked: true, message: '已收藏' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookmarks - 我的收藏列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { getDb } = require('../models/db');
    const db = getDb();
    const userId = req.userId;

    const rows = await new Promise((resolve, reject) => {
      db.all(
        'SELECT p.*, u.username, b.created_at as bookmarked_at FROM bookmarks b ' +
        'JOIN posts p ON b.post_id = p.id ' +
        'LEFT JOIN users u ON p.user_id = u.id ' +
        'WHERE b.user_id = ? ORDER BY b.created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // normalize
    const posts = rows.map(row => {
      let imageUrls = [];
      try { imageUrls = JSON.parse(row.image_urls || '[]'); } catch(e) {}
      const tags = (row.tags || '').split(',').filter(Boolean);
      let extrainfo = {};
      try { extrainfo = JSON.parse(row.extrainfo || '{}'); } catch(e) {}
      return { ...row, image_urls: JSON.stringify(imageUrls), tags: tags.join(','), extrainfo };
    });

    res.json({ bookmarks: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookmarks/check/:postId - 检查是否已收藏
router.get('/check/:postId', authMiddleware, async (req, res) => {
  try {
    const { getDb } = require('../models/db');
    const db = getDb();
    const userId = req.userId;
    const postId = parseInt(req.params.postId);

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({ bookmarked: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
