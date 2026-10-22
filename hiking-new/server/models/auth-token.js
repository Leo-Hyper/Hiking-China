const crypto = require("crypto");
const { get, run } = require("./db");

const TOKEN_TYPES = new Set(["email_verify", "password_reset"]);

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function assertTokenType(type) {
  if (!TOKEN_TYPES.has(type)) {
    throw new Error("无效的验证类型");
  }
}

async function createAuthToken(userId, type, ttlMinutes) {
  assertTokenType(type);
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  // Invalidate older links for the same purpose before issuing a new one.
  await run(
    "UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND type = ? AND used_at IS NULL",
    [new Date().toISOString(), userId, type]
  );
  await run(
    "INSERT INTO auth_tokens (user_id, type, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [userId, type, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

async function consumeAuthToken(token, type) {
  assertTokenType(type);
  const now = new Date().toISOString();
  const row = await get(
    "SELECT id, user_id FROM auth_tokens WHERE token_hash = ? AND type = ? AND used_at IS NULL AND expires_at > ?",
    [hashToken(token), type, now]
  );
  if (!row) return null;

  const result = await run(
    "UPDATE auth_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL",
    [now, row.id]
  );
  if (Number(result.changes) !== 1) return null;
  return { userId: Number(row.user_id) };
}

module.exports = { createAuthToken, consumeAuthToken, hashToken };
