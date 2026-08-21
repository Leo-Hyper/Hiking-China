const { all, get, run } = require("./db");

async function createComment({ post_id, user_id, content, parent_id, reply_to_user_id, reply_to_username, image_url }) {
  const res = await run(
    "INSERT INTO comments (post_id, user_id, content, parent_id, reply_to_user_id, reply_to_username, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [post_id, user_id, content, parent_id || null, reply_to_user_id || null, reply_to_username || null, image_url || null]
  );
  return { id: res.lastInsertRowid };
}

async function getAllCommentsByPostId(postId, limit) {
  if (limit === undefined) limit = 1000;
  const rows = await all(
    `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.reply_to_user_id, c.reply_to_username,
            c.content, c.likes, c.image_url, c.created_at, u.username, u.avatar
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  );
  return rows || [];
}

async function likeComment(commentId, userId) {
  const row = await get(
    "SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?",
    [commentId, userId]
  );
  if (row) {
    await run("DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?", [commentId, userId]);
    await run("UPDATE comments SET likes = MAX(0, likes - 1) WHERE id = ?", [commentId]);
    return { liked: false };
  }
  await run("INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)", [commentId, userId]);
  await run("UPDATE comments SET likes = likes + 1 WHERE id = ?", [commentId]);
  return { liked: true };
}

// 检查是否已点赞
async function isCommentLiked(commentId, userId) {
  const row = await get("SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?", [commentId, userId]);
  return !!row;
}

async function updateComment(id, userId, { content }) {
  const res = await run(
    "UPDATE comments SET content = ? WHERE id = ? AND user_id = ?",
    [content, id, userId]
  );
  if (res.changes === 0) throw new Error("评论不存在或无权编辑");
  return { id };
}

async function deleteComment(id, userId) {
  // 先获取评论信息
  const row = await get("SELECT user_id FROM comments WHERE id = ?", [id]);
  if (!row) throw new Error("评论不存在");
  if (row.user_id !== userId) throw new Error("无权删除");

  // 删除子回复的点赞记录
  await run("DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE parent_id = ?)", [id]);
  // 删除子回复
  await run("DELETE FROM comments WHERE parent_id = ?", [id]);
  // 删除评论的点赞记录
  await run("DELETE FROM comment_likes WHERE comment_id = ?", [id]);
  // 删除评论本身
  await run("DELETE FROM comments WHERE id = ?", [id]);
  return { id };
}

module.exports = { createComment, getAllCommentsByPostId, likeComment, isCommentLiked, updateComment, deleteComment };
