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
    db.get("SELECT id, username, email, avatar, bio, location, hikinglevel, gear_prefs, profile_public, status, created_at FROM users WHERE id = ?", [id], (err, user) => {
      if (err) reject(err);
      else resolve(user || null);
    });
  });
}

// 更新个人资料
function updateUserProfile(userId, { username, avatar, bio, location, hikinglevel, gear_prefs, profile_public }) {
  const { getDb } = require("./db");
  const db = getDb();
  const fields = [];
  const params = [];

  if (username !== undefined) {
    fields.push("username = ?");
    params.push(username);
  }
  if (avatar !== undefined) {
    fields.push("avatar = ?");
    params.push(avatar);
  }
  if (bio !== undefined) {
    fields.push("bio = ?");
    params.push(bio);
  }
  if (location !== undefined) {
    fields.push("location = ?");
    params.push(location);
  }
  if (hikinglevel !== undefined) {
    fields.push("hikinglevel = ?");
    params.push(hikinglevel);
  }
  if (gear_prefs !== undefined) {
    fields.push("gear_prefs = ?");
    params.push(typeof gear_prefs === "string" ? gear_prefs : JSON.stringify(gear_prefs));
  }
  if (profile_public !== undefined) {
    fields.push("profile_public = ?");
    params.push(profile_public);
  }

  if (fields.length === 0) return Promise.resolve({});

  params.push(userId);

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
      function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
}

// 获取公开用户信息（不含邮箱、密码）
function getPublicUserById(id) {
  const { getDb } = require("./db");
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, username, avatar, bio, location, hikinglevel, gear_prefs, profile_public, created_at FROM users WHERE id = ?",
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

module.exports = { register, login, getUserById, updateUserProfile, getPublicUserById };
