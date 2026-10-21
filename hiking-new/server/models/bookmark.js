const { all, get, run } = require("./db");
const { normalizePost } = require("./post");

async function toggleBookmark(userId, postId) {
  const post = await get("SELECT id FROM posts WHERE id = ? AND status = 1", [postId]);
  if (!post) throw new Error("帖子不存在");

  const existing = await get(
    "SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?",
    [userId, postId],
  );
  if (existing) {
    await run("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?", [userId, postId]);
    return { bookmarked: false };
  }
  await run("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)", [userId, postId]);
  return { bookmarked: true };
}

async function isBookmarked(userId, postId) {
  const row = await get(
    "SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?",
    [userId, postId],
  );
  return !!row;
}

async function listBookmarkedPosts(userId, limit = 50) {
  const rows = await all(
    `SELECT p.id, p.user_id, p.title, substr(p.content, 1, 600) AS content,
            p.category, p.tags, p.image_urls, p.views, p.created_at, p.updated_at,
            substr(p.extrainfo, 1, 1000) AS extrainfo, p.status, p.comment_closed,
            p.likes_count, u.username, u.avatar AS author_avatar,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
            b.created_at AS bookmarked_at
     FROM bookmarks b
     JOIN posts p ON b.post_id = p.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE b.user_id = ? AND p.status = 1
     ORDER BY b.created_at DESC
     LIMIT ?`,
    [userId, limit],
  );
  return (rows || []).map(normalizePost);
}

module.exports = { toggleBookmark, isBookmarked, listBookmarkedPosts };
