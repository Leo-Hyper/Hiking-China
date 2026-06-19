const { getDb } = require("./db");

function createComment({ post_id, user_id, content, parent_id }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
      [post_id, user_id, content, parent_id || null],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function getCommentsByPostId(postId, parentId = null, limit = 100) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    let sql, params;
    if (parentId === null) {
      // 顶级评论：parent_id IS NULL
      sql = `SELECT c.*, u.username FROM comments c ` +
            `LEFT JOIN users u ON c.user_id = u.id ` +
            `WHERE c.post_id = ? AND c.parent_id IS NULL ` +
            `ORDER BY c.created_at ASC LIMIT ?`;
      params = [postId, limit];
    } else {
      // 子评论：指定 parent_id
      sql = `SELECT c.*, u.username FROM comments c ` +
            `LEFT JOIN users u ON c.user_id = u.id ` +
            `WHERE c.post_id = ? AND c.parent_id = ? ` +
            `ORDER BY c.created_at ASC LIMIT ?`;
      params = [postId, parentId, limit];
    }
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getChildComments(parentId, limit = 100) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, u.username FROM comments c ` +
      `LEFT JOIN users u ON c.user_id = u.id ` +
      `WHERE c.parent_id = ? ORDER BY c.created_at ASC LIMIT ?`,
      [parentId, limit],
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

module.exports = { createComment, getCommentsByPostId, getChildComments, likeComment };
