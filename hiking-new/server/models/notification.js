const { all, get, run } = require("./db");

async function createNotification({ userId, type, actorId = null, entityType = "", entityId = null, title, body = "", link = "" }) {
  if (!userId || !title) return null;
  const result = await run(
    `INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id, title, body, link)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, type, actorId, entityType, entityId, title, body, link]
  );
  return { id: Number(result.lastInsertRowid) };
}

async function listNotifications(userId, limit = 30) {
  return all(
    `SELECT n.id, n.type, n.actor_id, n.entity_type, n.entity_id, n.title, n.body,
            n.link, n.read_at, n.created_at, u.username AS actor_name, u.avatar AS actor_avatar
     FROM notifications n
     LEFT JOIN users u ON u.id = n.actor_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT ?`,
    [userId, Math.min(Number(limit) || 30, 100)]
  );
}

async function getUnreadCount(userId) {
  const row = await get(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL",
    [userId]
  );
  return Number(row?.count || 0);
}

async function markNotificationRead(userId, notificationId) {
  const result = await run(
    "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL",
    [new Date().toISOString(), notificationId, userId]
  );
  return { changes: Number(result.changes) };
}

async function markAllNotificationsRead(userId) {
  const result = await run(
    "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
    [new Date().toISOString(), userId]
  );
  return { changes: Number(result.changes) };
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
