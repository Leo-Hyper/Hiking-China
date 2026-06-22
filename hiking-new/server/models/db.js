const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'hikingchina.db');

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, function(err) {
      if (err) console.error('DB connect error:', err.message);
    });
    db.serialize(function() {
      // Users
      db.run('CREATE TABLE IF NOT EXISTS users (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'username TEXT UNIQUE NOT NULL, ' +
        'email TEXT UNIQUE NOT NULL, ' +
        'password_hash TEXT NOT NULL, ' +
        'avatar TEXT, ' +
        'bio TEXT, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
      // === Phase 1 迁移：users 表新增字段 ===
      db.run("ALTER TABLE users ADD COLUMN location TEXT DEFAULT ''", () => {});
      db.run("ALTER TABLE users ADD COLUMN hikinglevel INTEGER DEFAULT 1", () => {});
      db.run("ALTER TABLE users ADD COLUMN gear_prefs TEXT DEFAULT '[]'", () => {});
      db.run("ALTER TABLE users ADD COLUMN profile_public INTEGER DEFAULT 1", () => {});
      db.run("ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 0", () => {});

      // Posts

      // Posts
      db.run('CREATE TABLE IF NOT EXISTS posts (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'user_id INTEGER NOT NULL, ' +
        'title TEXT NOT NULL, ' +
        'content TEXT NOT NULL, ' +
        'category TEXT DEFAULT ' + "'" + '其他' + "'" + ', ' +
        'tags TEXT DEFAULT ' + "'" + "'" + ', ' +
        'image_urls TEXT DEFAULT ' + "'" + "'" + ', ' +
        'views INTEGER DEFAULT 0, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');
      // === Phase 1 迁移：posts 表新增字段 ===
      db.run("ALTER TABLE posts ADD COLUMN extrainfo TEXT DEFAULT ''", () => {});
      db.run("ALTER TABLE posts ADD COLUMN status INTEGER DEFAULT 1", () => {});
      db.run("ALTER TABLE posts ADD COLUMN comment_closed INTEGER DEFAULT 0", () => {});
      db.run("ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0", () => {});

      // Comments

      // Comments
      db.run('CREATE TABLE IF NOT EXISTS comments (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'post_id INTEGER NOT NULL, ' +
        'user_id INTEGER NOT NULL, ' +
        'parent_id INTEGER DEFAULT NULL, ' +
        'content TEXT NOT NULL, ' +
        'likes INTEGER DEFAULT 0, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE)');

      // 迁移：添加回复对方字段、图片字段
      db.run("ALTER TABLE comments ADD COLUMN reply_to_user_id INTEGER", () => {});
      db.run("ALTER TABLE comments ADD COLUMN reply_to_username TEXT", () => {});
      db.run("ALTER TABLE comments ADD COLUMN image_url TEXT", () => {});

      // Comment Likes
      db.run('CREATE TABLE IF NOT EXISTS comment_likes (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'comment_id INTEGER NOT NULL, ' +
        'user_id INTEGER NOT NULL, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE(comment_id, user_id), ' +
        'FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');

      // Followers (关注关系表)
      db.run('CREATE TABLE IF NOT EXISTS followers (' +
        'follower_id INTEGER NOT NULL, ' +
        'following_id INTEGER NOT NULL, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'PRIMARY KEY (follower_id, following_id), ' +
        'FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE)');
      // === Phase 1 新增：帖子点赞表 ===
      db.run('CREATE TABLE IF NOT EXISTS post_likes (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'post_id INTEGER NOT NULL, ' +
        'user_id INTEGER NOT NULL, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE(post_id, user_id), ' +
        'FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');

      // === Phase 1 新增：收藏表 ===
      db.run('CREATE TABLE IF NOT EXISTS bookmarks (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'user_id INTEGER NOT NULL, ' +
        'post_id INTEGER NOT NULL, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE(user_id, post_id), ' +
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE)');

      // Search Index

      // Search Index
      db.run('CREATE TABLE IF NOT EXISTS search_index (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'type TEXT NOT NULL, ' +
        'title TEXT NOT NULL, ' +
        'category TEXT, ' +
        'tags TEXT, ' +
        'excerpt TEXT, ' +
        'route TEXT, ' +
        'content TEXT, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE(type, route))');

      // Indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_search_type ON search_index(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)');
      db.run('CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)');
      db.run('CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_comment_likes ON comment_likes(comment_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id)');      db.run('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)');
    });
  }
  return db;
}

function initDb() {
  const db = getDb();
  db.get('SELECT COUNT(*) as cnt FROM search_index', function(err, row) {
    if (!err && row.cnt === 0) {
      const { loadSeedSearchData } = require('./seed');
      loadSeedSearchData(db);
    }
  });
}

function closeDb() {
  if (db) db.close();
}

module.exports = { getDb, initDb, closeDb };
