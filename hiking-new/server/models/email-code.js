const crypto = require("crypto");
const { get, run } = require("./db");

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const CODE_SECRET =
  process.env.EMAIL_CODE_SECRET
  || process.env.JWT_SECRET
  || "hiking-china-dev-email-code";

function hashCode(userId, code) {
  return crypto.createHmac("sha256", CODE_SECRET).update(`${userId}:${code}`).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function parseDbDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw);
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getLatestCode(userId) {
  return get(
    `SELECT id, code_hash, expires_at, attempts, created_at
     FROM email_verification_codes
     WHERE user_id = ? AND used_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    [userId]
  );
}

async function createEmailCode(userId) {
  const latest = await getLatestCode(userId);
  if (latest) {
    const createdAt = parseDbDate(latest.created_at);
    const ageSeconds = createdAt ? (Date.now() - createdAt.getTime()) / 1000 : Infinity;
    if (ageSeconds >= 0 && ageSeconds < RESEND_COOLDOWN_SECONDS) {
      return {
        code: null,
        expiresAt: latest.expires_at,
        retryAfter: Math.max(1, Math.ceil(RESEND_COOLDOWN_SECONDS - ageSeconds)),
        reused: true,
      };
    }
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  await run(
    "UPDATE email_verification_codes SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
    [now.toISOString(), userId]
  );
  await run(
    `INSERT INTO email_verification_codes (user_id, code_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
    [userId, hashCode(userId, code), expiresAt, now.toISOString()]
  );

  return { code, expiresAt, retryAfter: RESEND_COOLDOWN_SECONDS, reused: false };
}

async function consumeEmailCode(userId, code) {
  const normalized = String(code || "").trim();
  if (!/^\d{6}$/.test(normalized)) {
    return { ok: false, reason: "invalid_format", attemptsLeft: MAX_ATTEMPTS };
  }

  const row = await getLatestCode(userId);
  if (!row) return { ok: false, reason: "missing", attemptsLeft: 0 };

  const expiresAt = parseDbDate(row.expires_at);
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired", attemptsLeft: 0 };
  }

  const attempts = Number(row.attempts || 0);
  if (attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "locked", attemptsLeft: 0 };
  }

  if (hashCode(userId, normalized) !== String(row.code_hash || "")) {
    const nextAttempts = attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      await run(
        "UPDATE email_verification_codes SET attempts = ?, used_at = ? WHERE id = ?",
        [nextAttempts, new Date().toISOString(), row.id]
      );
      return { ok: false, reason: "locked", attemptsLeft: 0 };
    }
    await run("UPDATE email_verification_codes SET attempts = ? WHERE id = ?", [
      nextAttempts,
      row.id,
    ]);
    return { ok: false, reason: "invalid", attemptsLeft: MAX_ATTEMPTS - nextAttempts };
  }

  const result = await run(
    `UPDATE email_verification_codes
     SET used_at = ?, attempts = attempts + 1
     WHERE id = ? AND used_at IS NULL`,
    [new Date().toISOString(), row.id]
  );
  if (Number(result.changes) !== 1) {
    return { ok: false, reason: "used", attemptsLeft: 0 };
  }
  return { ok: true, attemptsLeft: 0 };
}

module.exports = {
  CODE_TTL_MINUTES,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  consumeEmailCode,
  createEmailCode,
};
