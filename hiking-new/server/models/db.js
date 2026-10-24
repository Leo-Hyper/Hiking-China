const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.LOCAL_DB_PATH
  ? path.resolve(process.env.LOCAL_DB_PATH)
  : path.join(DATA_DIR, "hikingchina.db");

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
    // Production uses Turso. Load the native SQLite binding only for local development/migration.
    const sqlite3 = require("sqlite3").verbose();
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
  `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`,
  `ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN auth_version INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'active'`,
  `ALTER TABLE users ADD COLUMN deletion_requested_at TEXT`,

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
  `ALTER TABLE posts ADD COLUMN route_id INTEGER`,

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
  `ALTER TABLE comments ADD COLUMN status INTEGER DEFAULT 1`,

  // Auth tokens
  `CREATE TABLE IF NOT EXISTS auth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS email_verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    used_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,

  // Moderation
  `CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    detail TEXT DEFAULT '',
    status TEXT DEFAULT 'open',
    resolved_by INTEGER,
    resolved_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS moderation_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moderator_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER,
    metadata TEXT DEFAULT '{}',
    ip TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS feature_flags (
    key TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL)`,

  // Notifications are created in P1, but the schema is additive and safe to ship with P0.
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    actor_id INTEGER,
    entity_type TEXT DEFAULT '',
    entity_id INTEGER,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    link TEXT DEFAULT '',
    read_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL)`,

  // Direct messaging
  `CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'direct',
    title TEXT DEFAULT '',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at TEXT,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE)`,

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

  // Routes（路线实体：静态路线升级为可检索、可收藏的数据库记录）
  `CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    region TEXT DEFAULT '',
    difficulty TEXT DEFAULT '初级',
    description TEXT DEFAULT '',
    content TEXT DEFAULT '',
    distance REAL DEFAULT 0,
    duration TEXT DEFAULT '',
    rating REAL DEFAULT 4.5,
    image TEXT DEFAULT '',
    post_id INTEGER,
    tags TEXT DEFAULT '',
    geojson TEXT DEFAULT '',
    ascent_m REAL,
    descent_m REAL,
    min_elevation REAL,
    max_elevation REAL,
    start_point TEXT DEFAULT '',
    end_point TEXT DEFAULT '',
    point_count INTEGER DEFAULT 0,
    is_sample INTEGER DEFAULT 0,
    sample_version INTEGER DEFAULT 0,
    data_source TEXT DEFAULT '',
    data_version INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `ALTER TABLE routes ADD COLUMN is_sample INTEGER DEFAULT 0`,
  `ALTER TABLE routes ADD COLUMN sample_version INTEGER DEFAULT 0`,
  `ALTER TABLE routes ADD COLUMN data_source TEXT DEFAULT ''`,
  `ALTER TABLE routes ADD COLUMN data_version INTEGER DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS route_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, route_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE)`,

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
  `CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_route_id ON posts(route_id)`,
  `CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`,
  `CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations(event_id)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type ON auth_tokens(user_id, type)`,
  `CREATE INDEX IF NOT EXISTS idx_email_codes_user ON email_verification_codes(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id, conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status)`,
  `CREATE INDEX IF NOT EXISTS idx_routes_region ON routes(region)`,
  `CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty)`,
  `CREATE INDEX IF NOT EXISTS idx_route_favorites_user ON route_favorites(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC)`,
];

const DEFAULT_FEATURE_FLAGS = [
  ["admin_console", 1, "管理后台和举报处理"],
  ["email_verification", 1, "新用户邮箱验证"],
  ["notifications", 0, "站内通知"],
  ["analytics", 0, "运营分析"],
  ["recommendations", 0, "个性化推荐"],
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
  for (const [key, enabled, description] of DEFAULT_FEATURE_FLAGS) {
    await run(
      `INSERT INTO feature_flags (key, enabled, description)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO NOTHING`,
      [key, enabled, description]
    );
  }
  const row = await get("SELECT COUNT(*) as cnt FROM search_index");
  if (!row || Number(row.cnt) === 0) {
    const { loadSeedSearchData } = require("./seed");
    await loadSeedSearchData();
  }
  const { loadSeedEvents, deactivateLegacyPost17 } = require("./seed");
  await loadSeedEvents();
  await deactivateLegacyPost17();

  const routeCount = await get("SELECT COUNT(*) AS count FROM routes");
  if (Number(routeCount?.count || 0) === 0) {
    const { ROUTE_SEEDS } = require("./seed-routes");
    for (const route of ROUTE_SEEDS) {
      await run(
        `INSERT INTO routes (
          id, name, region, difficulty, description, content, distance, duration,
          rating, image, post_id, tags, geojson, ascent_m, descent_m,
          min_elevation, max_elevation, start_point, end_point, point_count,
          is_sample, sample_version, data_source, data_version, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          route.id,
          route.name,
          route.region,
          route.difficulty,
          route.description,
          route.content,
          route.distance,
          route.duration,
          route.rating,
          route.image,
          route.postId,
          route.tags,
          route.geojson,
          route.ascentM,
          route.descentM,
          route.minElevation,
          route.maxElevation,
          route.startPoint,
          route.endPoint,
          route.pointCount,
          route.isSample ? 1 : 0,
          route.isSample ? 1 : 0,
          String(route.dataSource || ""),
          Number(route.dataVersion || 0),
        ]
      );
    }
  }
  await removeDeprecatedSampleTracks();
  await applyOsmRoutes();
}

async function removeDeprecatedSampleTracks() {
  // 只清理此前由程序生成的 4 条示例轨迹，避免误删管理员后来上传的真实 GPX。
  const deprecated = [
    { id: 1, pointCount: 720 },
    { id: 2, pointCount: 337 },
    { id: 5, pointCount: 365 },
    { id: 6, pointCount: 261 },
  ];
  for (const item of deprecated) {
    const row = await get(
      "SELECT id, is_sample, point_count FROM routes WHERE id = ?",
      [item.id]
    );
    if (!row) continue;
    if (Number(row.is_sample || 0) !== 1) continue;
    if (Number(row.point_count || 0) !== item.pointCount) continue;
    await run(
      `UPDATE routes SET
         geojson = '', ascent_m = NULL, descent_m = NULL,
         min_elevation = NULL, max_elevation = NULL, point_count = 0,
         is_sample = 0, sample_version = 2, data_source = '', data_version = 0,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [item.id]
    );
    console.log(`[DB] removed deprecated sample track from route ${item.id}`);
  }
}

async function applyOsmRoutes() {
  const { routes } = require("./osm-routes.json");
  const { calculateStats, toLineString } = require("../utils/geo");

  for (const item of routes) {
    const existing = await get(
      "SELECT id, data_version FROM routes WHERE name = ? LIMIT 1",
      [item.name]
    );
    if (existing && Number(existing.data_version || 0) >= 1) continue;

    const points = (item.points || []).map((point) => [
      Number(point[0]),
      Number(point[1]),
      Number(point[2]),
    ]);
    if (points.length < 2) continue;
    const stats = calculateStats(points);
    const geojson = JSON.stringify(toLineString(points));

    if (existing) {
      await run(
        `UPDATE routes SET
           geojson = ?, distance = ?, ascent_m = ?, descent_m = ?,
           min_elevation = ?, max_elevation = ?, point_count = ?,
           content = ?, description = ?, start_point = ?, end_point = ?,
           is_sample = 0, sample_version = 2, data_source = 'osm+srtm',
           data_version = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          geojson,
          stats.distance,
          stats.ascentM,
          stats.descentM,
          stats.minElevation,
          stats.maxElevation,
          stats.pointCount,
          item.content,
          item.description,
          item.startPoint,
          item.endPoint,
          existing.id,
        ]
      );
      console.log(`[DB] applied OSM track to route ${existing.id} (${item.name})`);
    } else {
      const result = await run(
        `INSERT INTO routes (
           name, region, difficulty, description, content, distance, duration,
           rating, image, post_id, tags, geojson, ascent_m, descent_m,
           min_elevation, max_elevation, start_point, end_point, point_count,
           is_sample, sample_version, data_source, data_version, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 2, 'osm+srtm', 1, 1)`,
        [
          item.name,
          item.region,
          item.difficulty,
          item.description,
          item.content,
          stats.distance,
          item.duration,
          item.rating,
          item.image,
          item.postId == null ? null : Number(item.postId),
          item.tags,
          geojson,
          stats.ascentM,
          stats.descentM,
          stats.minElevation,
          stats.maxElevation,
          item.startPoint,
          item.endPoint,
          stats.pointCount,
        ]
      );
      console.log(
        `[DB] created OSM route ${Number(result.lastInsertRowid)} (${item.name})`
      );
    }
  }
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
