const { getDb } = require("./db");

function createComment({ post_id, user_id, content, parent_id, reply_to_user_id, reply_to_username, image_url }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO comments (post_id, user_id, content, parent_id, reply_to_user_id, reply_to_username, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [post_id, user_id, content, parent_id || null, reply_to_user_id || null, reply_to_username || null, image_url || null],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getAllCommentsByPostId(postId, limit) {
  if (limit === undefined) limit = 1000;
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.reply_to_user_id, c.reply_to_username,
              c.content, c.likes, c.image_url, c.created_at, u.username, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

function likeComment(commentId, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId],
      (err, row) => {
        if (err) return reject(err);
        if (row) {
          db.run(
            "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?",
            [commentId, userId],
            function() {
              db.run("UPDATE comments SET likes = MAX(0, likes - 1) WHERE id = ?", [commentId]);
              resolve({ liked: false });
            }
          );
        } else {
          db.run(
            "INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)",
            [commentId, userId],
            function(err) {
              if (err) return reject(err);
              db.run("UPDATE comments SET likes = likes + 1 WHERE id = ?", [commentId]);
              resolve({ liked: true });
            }
          );
        }
      }
    );
  });
}


function updateComment(id, userId, { content }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE comments SET content = ? WHERE id = ? AND user_id = ?",
      [content, id, userId],
      function(err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error("评论不存在或无权编辑"));
        resolve({ id });
      }
    );
  });
}

function deleteComment(id, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    // 先获取评论信息
    db.get("SELECT user_id FROM comments WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("评论不存在"));
      if (row.user_id !== userId) return reject(new Error("无权删除"));

      // 删除子回复的点赞记录
      db.run("DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE parent_id = ?)", [id]);
      // 删除子回复
      db.run("DELETE FROM comments WHERE parent_id = ?", [id]);
      // 删除评论的点赞记录
      db.run("DELETE FROM comment_likes WHERE comment_id = ?", [id]);
      // 删除评论本身
      db.run("DELETE FROM comments WHERE id = ?", [id], function(err) {
        if (err) return reject(err);
        resolve({ id });
      });
    });
  });
}

module.exports = { createComment, getAllCommentsByPostId, likeComment, updateComment, deleteComment };
