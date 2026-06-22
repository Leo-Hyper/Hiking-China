const { getDb } = require("./db");

// Helper: normalize post data for API responses
function normalizePost(row) {
  if (!row) return null;
  let imageUrls = [];
  try {
    imageUrls = typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : (Array.isArray(row.image_urls) ? row.image_urls : []);
  } catch(e) { imageUrls = []; }
  if (!Array.isArray(imageUrls)) imageUrls = [];
  let extrainfo = {};
  try { extrainfo = typeof row.extrainfo === "string" && row.extrainfo ? JSON.parse(row.extrainfo) : (row.extrainfo || {}); }
  catch(e) { extrainfo = {}; }
  const tags = typeof row.tags === 'string' ? row.tags.split(',').filter(Boolean) : (Array.isArray(row.tags) ? row.tags : []);
  let content = row.content || '';
  content = content.replace(/\\n/g, '\n');
  return { ...row, image_urls: JSON.stringify(imageUrls), tags: tags.join(','), extrainfo };
}


// 创建帖子
function createPost(userId, { title, content, category, tags, imageUrls, extrainfo, status }) {
  const db = getDb();
  const tagsStr = Array.isArray(tags) ? tags.join(",") : (tags || "");
  const imagesStr = Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : "";
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO posts (user_id, title, content, category, tags, image_urls, extrainfo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, title, content, category || "其他", tagsStr, imagesStr, extrainfo ? JSON.stringify(extrainfo) : "", status !== undefined ? status : 1],
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
        else resolve((rows || []).map(normalizePost));
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
        else resolve((rows || []).map(normalizePost));
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
            else resolve(normalizePost(row) || null);
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
      `SELECT p.*, u.username FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
      `WHERE p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ? ` +
      `ORDER BY p.created_at DESC LIMIT ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(normalizePost));
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

// 更新帖子
function updatePost(id, userId, { title, content, category, tags, imageUrls, extrainfo, status }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get("SELECT user_id FROM posts WHERE id = ?", [id], (err, post) => {
      if (err) return reject(err);
      if (!post) return reject(new Error("帖子不存在"));
      if (post.user_id !== userId) return reject(new Error("无权编辑"));

      const fields = [];
      const params = [];
      if (title !== undefined) { fields.push("title = ?"); params.push(title); }
      if (content !== undefined) { fields.push("content = ?"); params.push(content); }
      if (category !== undefined) { fields.push("category = ?"); params.push(category); }
      if (tags !== undefined) { fields.push("tags = ?"); params.push(Array.isArray(tags) ? tags.join(",") : tags); }
      if (imageUrls !== undefined) { fields.push("image_urls = ?"); params.push(JSON.stringify(imageUrls)); }
      if (extrainfo !== undefined) { fields.push("extrainfo = ?"); params.push(JSON.stringify(extrainfo)); }
      if (status !== undefined) { fields.push("status = ?"); params.push(status); }
      fields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);

      db.run(
        `UPDATE posts SET ${fields.join(", ")} WHERE id = ?`,
        params,
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  });
}

// 获取我的帖子
function getMyPosts(userId, limit = 50, offset = 0) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, u.username FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
      `WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(normalizePost));
      }
    );
  });
}

// 获取我的帖子总数
function getMyPostCount(userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) as count FROM posts WHERE user_id = ?",
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
}

module.exports = { createPost, getAllPosts, getPostsByCategory, getPostById, searchPosts, deletePost, updatePost, getMyPosts, getMyPostCount };
