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

      // Comment Likes
      db.run('CREATE TABLE IF NOT EXISTS comment_likes (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'comment_id INTEGER NOT NULL, ' +
        'user_id INTEGER NOT NULL, ' +
        'created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE(comment_id, user_id), ' +
        'FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE, ' +
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');

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
