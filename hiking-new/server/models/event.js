const { all, get, run } = require("./db");

// 创建活动
async function createEvent(userId, { title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url, signup_deadline }) {
  const res = await run(
    `INSERT INTO events (user_id, title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url, signup_deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, content || "", location || "", location_lat || null, location_lng || null, event_date || "", difficulty || "初级", max_participants || 0, image_url || "", signup_deadline || ""]
  );
  return { id: res.lastInsertRowid };
}

// 获取活动列表
async function getAllEvents(limit = 50, offset = 0) {
  const rows = await all(
    `SELECT e.*, u.username,
      (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS participant_count
     FROM events e
     LEFT JOIN users u ON e.user_id = u.id
     ORDER BY e.event_date ASC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows || [];
}

// 获取单个活动
async function getEventById(id) {
  const row = await get(
    `SELECT e.*, u.username,
      (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS participant_count
     FROM events e
     LEFT JOIN users u ON e.user_id = u.id
     WHERE e.id = ?`,
    [id]
  );
  return row || null;
}

// 更新活动
async function updateEvent(id, userId, fields) {
  const event = await get("SELECT user_id FROM events WHERE id = ?", [id]);
  if (!event) throw new Error("活动不存在");
  if (event.user_id !== userId) throw new Error("无权编辑");

  const setClauses = [];
  const params = [];
  const allowed = ['title', 'content', 'location', 'location_lat', 'location_lng', 'event_date', 'difficulty', 'max_participants', 'image_url', 'status', 'signup_deadline'];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }
  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  const res = await run(`UPDATE events SET ${setClauses.join(", ")} WHERE id = ?`, params);
  return { changes: res.changes };
}

// 删除活动
async function deleteEvent(id, userId) {
  const event = await get("SELECT user_id FROM events WHERE id = ?", [id]);
  if (!event) throw new Error("活动不存在");
  if (event.user_id !== userId) throw new Error("无权删除");
  // 显式级联删除报名记录（不依赖数据库外键，兼容 Turso 远程）
  await run("DELETE FROM event_registrations WHERE event_id = ?", [id]);
  const res = await run("DELETE FROM events WHERE id = ?", [id]);
  return { deleted: res.changes };
}

// 报名
async function joinEvent(eventId, userId) {
  const event = await get("SELECT id, max_participants FROM events WHERE id = ?", [eventId]);
  if (!event) throw new Error("活动不存在");
  // 原子条件写入：未报名 且（不限人数 或 未满员）才插入
  const res = await run(
    `INSERT INTO event_registrations (event_id, user_id)
     SELECT ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM event_registrations WHERE event_id = ? AND user_id = ?)
       AND ((SELECT max_participants FROM events WHERE id = ?) = 0
            OR (SELECT max_participants FROM events WHERE id = ?) >
               (SELECT COUNT(*) FROM event_registrations WHERE event_id = ?))`,
    [eventId, userId, eventId, userId, eventId, eventId, eventId]
  );
  if (res.changes > 0) return { joined: true };
  // 区分失败原因：已报名 or 满员
  const reg = await get("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId]);
  if (reg) throw new Error("已报名");
  throw new Error("报名人数已满");
}

// 取消报名
async function leaveEvent(eventId, userId) {
  const res = await run("DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId]);
  return { left: res.changes > 0 };
}

// 检查是否已报名
async function checkJoined(eventId, userId) {
  const row = await get("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId]);
  return !!row;
}

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, joinEvent, leaveEvent, checkJoined };
