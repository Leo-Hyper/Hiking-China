const bcrypt = require("bcrypt");

function register(username, email, password) {
  const { getDb } = require("./db");
  const db = getDb();
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);

  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hash],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE") || err.message.includes("unique")) {
            reject(new Error("用户名或邮箱已存在"));
          }
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email });
        }
      }
    );
  });
}

function login(email, password) {
  const { getDb } = require("./db");
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) return reject(err);
      if (!user) return reject(new Error("邮箱或密码错误"));

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) return reject(new Error("邮箱或密码错误"));

      const { password_hash, ...safeUser } = user;
      resolve(safeUser);
    });
  });
}

function getUserById(id) {
  const { getDb } = require("./db");
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.get("SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?", [id], (err, user) => {
      if (err) reject(err);
      else resolve(user || null);
    });
  });
}

module.exports = { register, login, getUserById };
