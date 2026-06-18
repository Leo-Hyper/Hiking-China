const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "hikingchina.db");

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) console.error("DB connect error:", err.message);
    });
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS search_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        excerpt TEXT,
        route TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, route)
      )`);

      db.run("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
      db.run("CREATE INDEX IF NOT EXISTS idx_search_type ON search_index(type)");
    });
  }
  return db;
}

function initDb() {
  const db = getDb();
  db.get("SELECT COUNT(*) as cnt FROM search_index", (err, row) => {
    if (!err && row.cnt === 0) {
      const { loadSeedSearchData } = require("./seed");
      loadSeedSearchData(db);
    }
  });
}

function closeDb() {
  if (db) db.close();
}

module.exports = { getDb, initDb, closeDb };
