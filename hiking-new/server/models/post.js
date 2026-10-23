const { all, get, run } = require("./db");

const LIST_COLUMNS = `
  p.id, p.user_id, p.title, substr(p.content, 1, 600) AS content,
  p.category, p.tags, p.image_urls, p.views, p.created_at, p.updated_at,
  substr(p.extrainfo, 1, 1000) AS extrainfo, p.status, p.comment_closed,
  p.likes_count, u.username, u.avatar AS author_avatar,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
`;

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
async function createPost(userId, { title, content, category, tags, imageUrls, extrainfo, status }) {
  const tagsStr = Array.isArray(tags) ? tags.join(",") : (tags || "");
  const imagesStr = Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : "";
  const res = await run(
    "INSERT INTO posts (user_id, title, content, category, tags, image_urls, extrainfo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, title, content, category || "其他", tagsStr, imagesStr, extrainfo ? JSON.stringify(extrainfo) : "", status !== undefined ? status : 1]
  );
  return { id: res.lastInsertRowid };
}

// 获取所有帖子（按时间倒序）
async function getAllPosts(limit = 50, offset = 0) {
  const rows = await all(
    `SELECT ${LIST_COLUMNS} FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.status = 1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return (rows || []).map(normalizePost);
}

// 按分类获取帖子
async function getPostsByCategory(category, limit = 20, offset = 0, query = "") {
  const params = [category];
  let searchClause = "";
  if (query) {
    searchClause = " AND (p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)";
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }
  params.push(limit, offset);
  const rows = await all(
    `SELECT ${LIST_COLUMNS} FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
    `WHERE p.category = ? AND p.status = 1${searchClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    params
  );
  return (rows || []).map(normalizePost);
}

// 获取单个帖子
async function getPostById(id) {
  const row = await get(
    `SELECT p.*, u.username, u.avatar AS author_avatar,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.status = 1`,
    [id]
  );
  if (row) {
    run("UPDATE posts SET views = views + 1 WHERE id = ?", [id]).catch((error) => {
      console.error("[POST] view increment failed:", error.message);
    });
  }
  return normalizePost(row) || null;
}

async function getOwnPostById(id, userId) {
  const row = await get(
    `SELECT p.*, u.username, u.avatar AS author_avatar,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.user_id = ?`,
    [id, userId],
  );
  return normalizePost(row) || null;
}

// 搜索帖子
async function searchPosts(query, limit = 20, offset = 0) {
  const rows = await all(
    `SELECT ${LIST_COLUMNS} FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
    `WHERE p.status = 1 AND (p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ?) ` +
    `ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [`%${query}%`, `%${query}%`, `%${query}%`, limit, offset]
  );
  return (rows || []).map(normalizePost);
}

// 删除帖子
async function deletePost(id, userId) {
  const post = await get("SELECT user_id FROM posts WHERE id = ?", [id]);
  if (!post) throw new Error("帖子不存在");
  if (post.user_id !== userId) throw new Error("无权删除");
  // 显式级联删除关联数据（不依赖数据库外键，兼容 Turso 远程）
  await run("DELETE FROM comments WHERE post_id = ?", [id]);
  await run("DELETE FROM post_likes WHERE post_id = ?", [id]);
  await run("DELETE FROM bookmarks WHERE post_id = ?", [id]);
  await run("DELETE FROM search_index WHERE type = 'post' AND route = ?", [`/post/${id}`]);
  const res = await run("DELETE FROM posts WHERE id = ?", [id]);
  return { deleted: res.changes };
}

// 更新帖子
async function updatePost(id, userId, { title, content, category, tags, imageUrls, extrainfo, status }) {
  const post = await get("SELECT user_id FROM posts WHERE id = ?", [id]);
  if (!post) throw new Error("帖子不存在");
  if (post.user_id !== userId) throw new Error("无权编辑");

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

  const res = await run(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`, params);
  return { changes: res.changes };
}

// 获取我的帖子
async function getMyPosts(userId, limit = 50, offset = 0) {
  const rows = await all(
    `SELECT ${LIST_COLUMNS} FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
    `WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return (rows || []).map(normalizePost);
}

async function getPublicPostsByUser(userId, limit = 50, offset = 0) {
  const rows = await all(
    `SELECT ${LIST_COLUMNS} FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
    `WHERE p.user_id = ? AND p.status = 1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return (rows || []).map(normalizePost);
}

async function getPostsByIds(ids) {
  const uniqueIds = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50);
  if (uniqueIds.length === 0) return [];
  const placeholders = uniqueIds.map(() => "?").join(", ");
  const rows = await all(
    `SELECT ${LIST_COLUMNS} FROM posts p LEFT JOIN users u ON p.user_id = u.id ` +
    `WHERE p.status = 1 AND p.id IN (${placeholders})`,
    uniqueIds
  );
  return (rows || []).map(normalizePost);
}

async function togglePostLike(postId, userId) {
  const post = await get("SELECT id FROM posts WHERE id = ? AND status = 1", [postId]);
  if (!post) throw new Error("帖子不存在");

  const existing = await get(
    "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?",
    [postId, userId],
  );
  if (existing) {
    await run("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
    await run("UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?", [postId]);
    return { liked: false };
  }
  await run("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
  await run("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?", [postId]);
  return { liked: true };
}

async function isPostLiked(postId, userId) {
  const row = await get(
    "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?",
    [postId, userId],
  );
  return !!row;
}

// 获取我的帖子总数
async function getMyPostCount(userId) {
  const row = await get("SELECT COUNT(*) as count FROM posts WHERE user_id = ?", [userId]);
  return row.count;
}

module.exports = {
  normalizePost,
  createPost,
  getAllPosts,
  getPostsByCategory,
  getPostById,
  getOwnPostById,
  searchPosts,
  deletePost,
  updatePost,
  getMyPosts,
  getMyPostCount,
  getPublicPostsByUser,
  getPostsByIds,
  togglePostLike,
  isPostLiked,
};
