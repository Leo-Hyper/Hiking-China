const bcrypt = require("bcrypt");
const { get, run } = require("./db");

async function register(username, email, password) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);

  try {
    const res = await run(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hash]
    );
    return { id: res.lastInsertRowid, username, email };
  } catch (err) {
    if (err.message.includes("UNIQUE") || err.message.includes("unique")) {
      throw new Error("用户名或邮箱已存在");
    }
    throw err;
  }
}

async function login(email, password) {
  const user = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) throw new Error("邮箱或密码错误");

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) throw new Error("邮箱或密码错误");

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function getUserById(id) {
  const user = await get(
    "SELECT id, username, email, avatar, bio, location, hikinglevel, gear_prefs, profile_public, status, created_at FROM users WHERE id = ?",
    [id]
  );
  return user || null;
}

// 更新个人资料
async function updateUserProfile(userId, { username, avatar, bio, location, hikinglevel, gear_prefs, profile_public }) {
  const fields = [];
  const params = [];

  if (username !== undefined) { fields.push("username = ?"); params.push(username); }
  if (avatar !== undefined) { fields.push("avatar = ?"); params.push(avatar); }
  if (bio !== undefined) { fields.push("bio = ?"); params.push(bio); }
  if (location !== undefined) { fields.push("location = ?"); params.push(location); }
  if (hikinglevel !== undefined) { fields.push("hikinglevel = ?"); params.push(hikinglevel); }
  if (gear_prefs !== undefined) {
    fields.push("gear_prefs = ?");
    params.push(typeof gear_prefs === "string" ? gear_prefs : JSON.stringify(gear_prefs));
  }
  if (profile_public !== undefined) { fields.push("profile_public = ?"); params.push(profile_public); }

  if (fields.length === 0) return {};

  params.push(userId);
  const res = await run(
    `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );
  return { changes: res.changes };
}

// 获取公开用户信息（不含邮箱、密码）
async function getPublicUserById(id) {
  const row = await get(
    "SELECT id, username, avatar, bio, location, hikinglevel, gear_prefs, profile_public, created_at FROM users WHERE id = ?",
    [id]
  );
  return row || null;
}

module.exports = { register, login, getUserById, updateUserProfile, getPublicUserById };