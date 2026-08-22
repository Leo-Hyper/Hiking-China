const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "hikingchina.db");

// 生产环境（Render 免费档无持久磁盘）：设置 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 走远程 libsql
// 本地开发：不设置则直接读写 data/hikingchina.db 文件，与现有数据零迁移
const USE_REMOTE = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

let localDb = null;
let remoteDb = null;

function getRawDb() {
  if (USE_REMOTE) {
    if (!remoteDb) {
      const { createClient } = require("@libsql/client");
      remoteDb = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    }
    return remoteDb;
  }
  if (!localDb) {
    localDb = new sqlite3.Database(DB_PATH, function (err) {
      if (err) console.error("DB connect error:", err.message);
    });
    // sqlite3 默认关闭外键约束，开启以保证 ON DELETE CASCADE 生效
    localDb.run("PRAGMA foreign_keys = ON", () => {});
  }
  return localDb;
}

// ---- 统一异步查询接口：模型层只依赖 all / get / run ----

async function all(sql, params = []) {
  if (USE_REMOTE) {
    const res = await getRawDb().execute({ sql, args: params });
    return res.rows;
  }
  return new Promise((resolve, reject) => {
    getRawDb().all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

async function get(sql, params = []) {
  if (USE_REMOTE) {
    const res = await getRawDb().execute({ sql, args: params });
    return res.rows[0];
  }
  return new Promise((resolve, reject) => {
    getRawDb().get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function run(sql, params = []) {
  if (USE_REMOTE) {
    const res = await getRawDb().execute({ sql, args: params });
    return { lastInsertRowid: Number(res.lastInsertRowid ?? 0), changes: res.rowsAffected };
  }
  return new Promise((resolve, reject) => {
    getRawDb().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
}

// ---- Schema：建表 + 迁移 + 索引（含活动模块）----
const SCHEMA_STATEMENTS = [
  // Users
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  `ALTER TABLE users ADD COLUMN location TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN hikinglevel INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN gear_prefs TEXT DEFAULT '[]'`,
  `ALTER TABLE users ADD COLUMN profile_public INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 0`,

  // Posts
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT '其他',
    tags TEXT DEFAULT '',
    image_urls TEXT DEFAULT '',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `ALTER TABLE posts ADD COLUMN extrainfo TEXT DEFAULT ''`,
  `ALTER TABLE posts ADD COLUMN status INTEGER DEFAULT 1`,
  `ALTER TABLE posts ADD COLUMN comment_closed INTEGER DEFAULT 0`,
  `ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0`,

  // Comments
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE)`,
  `ALTER TABLE comments ADD COLUMN reply_to_user_id INTEGER`,
  `ALTER TABLE comments ADD COLUMN reply_to_username TEXT`,
  `ALTER TABLE comments ADD COLUMN image_url TEXT`,

  // Comment Likes
  `CREATE TABLE IF NOT EXISTS comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,

  // Followers
  `CREATE TABLE IF NOT EXISTS followers (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE)`,

  // Post Likes
  `CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,

  // Bookmarks
  `CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE)`,

  // Search Index
  `CREATE TABLE IF NOT EXISTS search_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    excerpt TEXT,
    route TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, route))`,

  // Events（原 models/event.js 建表并入）
  `CREATE TABLE IF NOT EXISTS events (
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
    FOREIGN KEY (user_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id))`,
  `ALTER TABLE events ADD COLUMN signup_deadline TEXT DEFAULT ''`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_search_type ON search_index(type)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comment_likes ON comment_likes(comment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id)`,
  `CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`,
  `CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`,
  `CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations(event_id)`,
];

async function initDb() {
  for (const stmt of SCHEMA_STATEMENTS) {
    try {
      await run(stmt);
    } catch (err) {
      // ALTER TABLE ADD COLUMN 在已迁移过的库上重复执行会报 duplicate column，属预期
      if (!/duplicate column/i.test((err && err.message) || "")) {
        console.error("[DB] schema statement failed:", err.message);
      }
    }
  }
  const row = await get("SELECT COUNT(*) as cnt FROM search_index");
  if (!row || Number(row.cnt) === 0) {
    const { loadSeedSearchData } = require("./seed");
    await loadSeedSearchData();
  }
  const { loadSeedEvents, deactivateLegacyPost17 } = require("./seed");
  await loadSeedEvents();
  await deactivateLegacyPost17();
}

async function closeDb() {
  if (USE_REMOTE) {
    if (remoteDb) {
      try { await remoteDb.close(); } catch (e) { /* ignore */ }
      remoteDb = null;
    }
  } else if (localDb) {
    localDb.close();
    localDb = null;
  }
}

module.exports = { getDb: getRawDb, initDb, closeDb, all, get, run };
