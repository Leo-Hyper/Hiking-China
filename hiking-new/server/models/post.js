const { getDb } = require("./db");

// 创建帖子
function createPost(userId, { title, content, category, tags, imageUrls }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO posts (user_id, title, content, category, tags, image_urls) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, title, content, category || "其他", tags || "", imageUrls || []],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

// 获取所有帖子（按时间倒序）
function getAllPosts(limit = 50, offset = 0) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, u.username FROM posts p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// 按分类获取帖子
function getPostsByCategory(category, limit = 20) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT p.*, u.username FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.category = ? ORDER BY p.created_at DESC LIMIT ?",
      [category, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// 获取单个帖子
function getPostById(id) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      "UPDATE posts SET views = views + 1 WHERE id = ?",
      [id],
      function (err) {
        if (err) return reject(err);
        db.get(
          "SELECT p.*, u.username FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?",
          [id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
          }
        );
      }
    );
  });
}

// 搜索帖子
function searchPosts(query, limit = 20) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, u.username FROM posts p LEFT JOIN users u ON p.user_id = u.id 
       WHERE p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ? 
       ORDER BY p.created_at DESC LIMIT ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// 删除帖子
function deletePost(id, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get("SELECT user_id FROM posts WHERE id = ?", [id], (err, post) => {
      if (err) return reject(err);
      if (!post) return reject(new Error("帖子不存在"));
      if (post.user_id !== userId) return reject(new Error("无权删除"));
      db.run("DELETE FROM posts WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  });
}

module.exports = { createPost, getAllPosts, getPostsByCategory, getPostById, searchPosts, deletePost };
