const { getDb } = require("./db");

// 创建 events 表
function initEventsTable() {
  const db = getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      location TEXT DEFAULT '',
      location_lat REAL,
      location_lng REAL,
      event_date TEXT DEFAULT '',
      difficulty TEXT DEFAULT '初级',
      max_participants INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 报名表
  db.run(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

// 创建活动
function createEvent(userId, { title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url }) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO events (user_id, title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, content || '', location || '', location_lat || null, location_lng || null, event_date || '', difficulty || '初级', max_participants || 0, image_url || ''],
      function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
    );
  });
}

// 获取活动列表
function getAllEvents(limit = 50, offset = 0) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT e.*, u.username,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS participant_count
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY e.event_date ASC
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// 获取单个活动
function getEventById(id) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT e.*, u.username,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS participant_count
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id],
      (err, row) => { if (err) reject(err); else resolve(row || null); }
    );
  });
}

// 更新活动
function updateEvent(id, userId, fields) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get("SELECT user_id FROM events WHERE id = ?", [id], (err, event) => {
      if (err) return reject(err);
      if (!event) return reject(new Error("活动不存在"));
      if (event.user_id !== userId) return reject(new Error("无权编辑"));

      const setClauses = [];
      const params = [];
      const allowed = ['title', 'content', 'location', 'location_lat', 'location_lng', 'event_date', 'difficulty', 'max_participants', 'image_url', 'status'];
      for (const key of allowed) {
        if (fields[key] !== undefined) {
          setClauses.push(`${key} = ?`);
          params.push(fields[key]);
        }
      }
      setClauses.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);
      db.run(`UPDATE events SET ${setClauses.join(", ")} WHERE id = ?`, params,
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  });
}

// 删除活动
function deleteEvent(id, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get("SELECT user_id FROM events WHERE id = ?", [id], (err, event) => {
      if (err) return reject(err);
      if (!event) return reject(new Error("活动不存在"));
      if (event.user_id !== userId) return reject(new Error("无权删除"));
      db.run("DELETE FROM events WHERE id = ?", [id],
        function (err) { if (err) reject(err); else resolve({ deleted: this.changes }); }
      );
    });
  });
}

// 报名
function joinEvent(eventId, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get("SELECT id, max_participants FROM events WHERE id = ?", [eventId], (err, event) => {
      if (err) return reject(err);
      if (!event) return reject(new Error("活动不存在"));
      db.get("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId], (err, reg) => {
        if (err) return reject(err);
        if (reg) return reject(new Error("已报名"));
        db.run("INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)", [eventId, userId],
          function (err) { if (err) reject(err); else resolve({ joined: true }); }
        );
      });
    });
  });
}

// 取消报名
function leaveEvent(eventId, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId],
      function (err) { if (err) reject(err); else resolve({ left: this.changes > 0 }); }
    );
  });
}

// 检查是否已报名
function checkJoined(eventId, userId) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId],
      (err, row) => { if (err) reject(err); else resolve(!!row); }
    );
  });
}

module.exports = {
  initEventsTable, createEvent, getAllEvents, getEventById,
  updateEvent, deleteEvent, joinEvent, leaveEvent, checkJoined
};