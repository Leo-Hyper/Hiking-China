const bcrypt = require("bcrypt");
const { all, get, run } = require("./db");

async function register(username, email, password) {
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  try {
    const res = await run(
      "INSERT INTO users (username, email, password_hash, email_verified, role, account_status) VALUES (?, ?, ?, 0, 'user', 'active')",
      [username, email, hash]
    );
    return { id: res.lastInsertRowid, username, email, email_verified: 0, role: 'user', auth_version: 0 };
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

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("邮箱或密码错误");
  if (!["active", "pending_deletion"].includes(String(user.account_status || "active"))) {
    throw new Error("账号已被暂停，请联系管理员");
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function getUserById(id) {
  const user = await get(
    `SELECT id, username, email, avatar, bio, location, hikinglevel, gear_prefs,
            profile_public, role, email_verified, account_status, deletion_requested_at, created_at
     FROM users WHERE id = ?`,
    [id]
  );
  return user || null;
}

async function getUserAuthState(id) {
  const user = await get(
    "SELECT id, role, account_status, email_verified, auth_version FROM users WHERE id = ?",
    [id]
  );
  return user || null;
}

async function getUserByEmail(email) {
  return get("SELECT * FROM users WHERE email = ?", [email]) || null;
}

async function markEmailVerified(userId) {
  const result = await run(
    "UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [userId]
  );
  return { changes: Number(result.changes) };
}

async function setUserPassword(userId, passwordHash) {
  const result = await run(
    "UPDATE users SET password_hash = ?, auth_version = auth_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [passwordHash, userId]
  );
  return { changes: Number(result.changes) };
}

async function requestAccountDeletion(userId) {
  const result = await run(
    "UPDATE users SET account_status = 'pending_deletion', deletion_requested_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [new Date().toISOString(), userId]
  );
  return { changes: Number(result.changes) };
}

async function cancelAccountDeletion(userId) {
  const result = await run(
    "UPDATE users SET account_status = 'active', deletion_requested_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [userId]
  );
  return { changes: Number(result.changes) };
}

async function listDueAccountDeletions(cutoffIso) {
  return all(
    `SELECT id, email FROM users
     WHERE account_status = 'pending_deletion'
       AND deletion_requested_at IS NOT NULL
       AND deletion_requested_at <= ?`,
    [cutoffIso]
  );
}

async function anonymizeAccount(userId) {
  const result = await run(
    `UPDATE users
     SET username = ?, email = ?, password_hash = '', avatar = NULL, bio = '',
         location = '', gear_prefs = '[]', profile_public = 0,
         account_status = 'deleted', deletion_requested_at = NULL,
         auth_version = auth_version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [`已注销用户_${userId}`, `deleted+${userId}@invalid.local`, userId]
  );
  return { changes: Number(result.changes) };
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
    `SELECT u.id, u.username, u.avatar, u.bio, u.location, u.hikinglevel, u.gear_prefs,
            u.profile_public, u.created_at,
            (SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) AS followers_count,
            (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.status = 1) AS post_count
     FROM users u
     WHERE u.id = ?`,
    [id]
  );
  return row || null;
}

module.exports = {
  register,
  login,
  getUserById,
  getUserAuthState,
  getUserByEmail,
  markEmailVerified,
  setUserPassword,
  requestAccountDeletion,
  cancelAccountDeletion,
  listDueAccountDeletions,
  anonymizeAccount,
  updateUserProfile,
  getPublicUserById,
};
