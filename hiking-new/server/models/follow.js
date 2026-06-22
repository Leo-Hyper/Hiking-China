const { getDb } = require("./db");

// 切换关注状态（关注/取关）
function toggleFollow(followerId, followingId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM followers WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId],
      (err, row) => {
        if (err) return reject(err);
        if (row) {
          // 已关注 → 取关
          db.run(
            "DELETE FROM followers WHERE follower_id = ? AND following_id = ?",
            [followerId, followingId],
            function (err) {
              if (err) reject(err);
              else resolve({ following: false });
            }
          );
        } else {
          // 未关注 → 关注
          db.run(
            "INSERT INTO followers (follower_id, following_id) VALUES (?, ?)",
            [followerId, followingId],
            function (err) {
              if (err) reject(err);
              else resolve({ following: true });
            }
          );
        }
      }
    );
  });
}

// 查询是否关注
function isFollowing(followerId, followingId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId],
      (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      }
    );
  });
}

// 获取关注数量
function getFollowCounts(userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT (SELECT COUNT(*) FROM followers WHERE following_id = ?) as followers_count, (SELECT COUNT(*) FROM followers WHERE follower_id = ?) as following_count",
      [userId, userId],
      (err, row) => {
        if (err) reject(err);
        else resolve({ followers: row.followers_count, following: row.following_count });
      }
    );
  });
}

module.exports = { toggleFollow, isFollowing, getFollowCounts };
