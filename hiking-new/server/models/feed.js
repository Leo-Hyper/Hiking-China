const { all } = require("./db");

const FEED_COLUMNS = `
  p.id, p.title, p.category, p.tags, p.image_urls, p.views, p.likes_count,
  p.status, p.created_at, p.user_id, u.username, u.avatar AS author_avatar,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 1) AS comment_count
`;

async function getPersonalizedFeed(userId, limit = 20, offset = 0) {
  return all(
    `SELECT ${FEED_COLUMNS}
     FROM posts p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.status = 1
       AND (
         p.user_id IN (SELECT following_id FROM followers WHERE follower_id = ?)
         OR p.id IN (
           SELECT p2.id FROM posts p2
           WHERE p2.status = 1
           ORDER BY (p2.views + p2.likes_count * 8) DESC
           LIMIT 8
         )
       )
     ORDER BY
       CASE WHEN p.user_id IN (SELECT following_id FROM followers WHERE follower_id = ?) THEN 0 ELSE 1 END,
       p.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, Math.min(Number(limit) || 20, 50), Math.max(Number(offset) || 0, 0)]
  );
}

module.exports = { getPersonalizedFeed };
