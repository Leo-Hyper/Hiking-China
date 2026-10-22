const bcrypt = require("bcrypt");
const { all, get, run } = require("./db");

const TARGET_TYPES = new Set(["post", "comment", "user", "event"]);
const REPORT_REASONS = new Set(["广告", "辱骂", "违法", "隐私", "其他"]);
const REPORT_STATUSES = new Set(["open", "resolved", "dismissed"]);

function normalizeTargetType(value) {
  const targetType = String(value || "").trim();
  if (!TARGET_TYPES.has(targetType)) throw new Error("举报对象类型无效");
  return targetType;
}

function normalizeReason(value) {
  const reason = String(value || "").trim();
  if (!REPORT_REASONS.has(reason)) throw new Error("举报原因无效");
  return reason;
}

async function createReport({ reporterId, targetType, targetId, reason, detail }) {
  const type = normalizeTargetType(targetType);
  const normalizedReason = normalizeReason(reason);
  const id = Number(targetId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("举报对象无效");

  const result = await run(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason, detail)
     VALUES (?, ?, ?, ?, ?)`,
    [reporterId, type, id, normalizedReason, String(detail || "").trim().slice(0, 1000)]
  );
  return { id: Number(result.lastInsertRowid) };
}

async function listReports({ status = "open", limit = 100, offset = 0 } = {}) {
  const safeStatus = REPORT_STATUSES.has(status) ? status : "open";
  return all(
    `SELECT r.id, r.reporter_id, r.target_type, r.target_id, r.reason, r.detail,
            r.status, r.resolved_by, r.resolved_at, r.created_at,
            reporter.username AS reporter_name,
            resolver.username AS resolver_name
     FROM reports r
     LEFT JOIN users reporter ON reporter.id = r.reporter_id
     LEFT JOIN users resolver ON resolver.id = r.resolved_by
     WHERE r.status = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [safeStatus, Math.min(Number(limit) || 100, 200), Math.max(Number(offset) || 0, 0)]
  );
}

async function getReportById(id) {
  return get("SELECT * FROM reports WHERE id = ?", [id]) || null;
}

async function resolveReport({ reportId, moderatorId, status, reason = "" }) {
  const nextStatus = status === "dismissed" ? "dismissed" : "resolved";
  const result = await run(
    `UPDATE reports
     SET status = ?, resolved_by = ?, resolved_at = ?
     WHERE id = ? AND status = 'open'`,
    [nextStatus, moderatorId, new Date().toISOString(), reportId]
  );
  if (Number(result.changes) !== 1) throw new Error("举报记录不存在或已处理");
  return { status: nextStatus, reason: String(reason || "").trim() };
}

async function writeAuditLog({ actorId, action, targetType = "", targetId = null, metadata = {}, req = null }) {
  const result = await run(
    `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      actorId || null,
      String(action || "").slice(0, 120),
      String(targetType || "").slice(0, 40),
      targetId == null ? null : Number(targetId),
      JSON.stringify(metadata || {}),
      req?.ip ? String(req.ip).slice(0, 80) : "",
      req?.get ? String(req.get("user-agent") || "").slice(0, 500) : "",
    ]
  );
  return { id: Number(result.lastInsertRowid) };
}

async function writeModerationAction({ moderatorId, action, targetType, targetId, reason = "", metadata = {} }) {
  const result = await run(
    `INSERT INTO moderation_actions (moderator_id, action, target_type, target_id, reason, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      moderatorId,
      String(action || "").slice(0, 80),
      normalizeTargetType(targetType),
      Number(targetId),
      String(reason || "").slice(0, 1000),
      JSON.stringify(metadata || {}),
    ]
  );
  return { id: Number(result.lastInsertRowid) };
}

async function listAuditLogs({ limit = 100, offset = 0 } = {}) {
  return all(
    `SELECT a.id, a.actor_id, a.action, a.target_type, a.target_id, a.metadata,
            a.ip, a.user_agent, a.created_at, u.username AS actor_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [Math.min(Number(limit) || 100, 200), Math.max(Number(offset) || 0, 0)]
  );
}

async function getAdminSummary() {
  const [users, posts, comments, events, openReports] = await Promise.all([
    get("SELECT COUNT(*) AS count FROM users WHERE account_status != 'deleted'"),
    get("SELECT COUNT(*) AS count FROM posts WHERE status != 2"),
    get("SELECT COUNT(*) AS count FROM comments WHERE status = 1"),
    get("SELECT COUNT(*) AS count FROM events WHERE status != 'deleted'"),
    get("SELECT COUNT(*) AS count FROM reports WHERE status = 'open'"),
  ]);
  return {
    users: Number(users?.count || 0),
    posts: Number(posts?.count || 0),
    comments: Number(comments?.count || 0),
    events: Number(events?.count || 0),
    open_reports: Number(openReports?.count || 0),
  };
}

async function listAdminPosts({ limit = 100, offset = 0 } = {}) {
  return all(
    `SELECT p.id, p.title, p.status, p.created_at, p.updated_at, u.username AS author_name
     FROM posts p
     LEFT JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [Math.min(Number(limit) || 100, 200), Math.max(Number(offset) || 0, 0)]
  );
}

async function setPostStatus({ postId, status, moderatorId, reason = "", req = null }) {
  const nextStatus = Number(status);
  if (![0, 1, 2].includes(nextStatus)) throw new Error("帖子状态无效");
  const result = await run("UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    nextStatus,
    postId,
  ]);
  if (Number(result.changes) !== 1) throw new Error("帖子不存在");
  await writeModerationAction({
    moderatorId,
    action: nextStatus === 1 ? "post_restore" : nextStatus === 0 ? "post_hide" : "post_delete",
    targetType: "post",
    targetId: postId,
    reason,
    metadata: { status: nextStatus },
  });
  await writeAuditLog({
    actorId: moderatorId,
    action: "post_status_change",
    targetType: "post",
    targetId: postId,
    metadata: { status: nextStatus, reason },
    req,
  });
  return { status: nextStatus };
}

async function listAdminComments({ limit = 100, offset = 0 } = {}) {
  return all(
    `SELECT c.id, c.post_id, c.content, c.status, c.created_at, u.username AS author_name
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [Math.min(Number(limit) || 100, 200), Math.max(Number(offset) || 0, 0)]
  );
}

async function setCommentStatus({ commentId, status, moderatorId, reason = "", req = null }) {
  const nextStatus = Number(status);
  if (![0, 1, 2].includes(nextStatus)) throw new Error("评论状态无效");
  const result = await run("UPDATE comments SET status = ? WHERE id = ?", [nextStatus, commentId]);
  if (Number(result.changes) !== 1) throw new Error("评论不存在");
  await writeModerationAction({
    moderatorId,
    action: nextStatus === 1 ? "comment_restore" : nextStatus === 0 ? "comment_hide" : "comment_delete",
    targetType: "comment",
    targetId: commentId,
    reason,
    metadata: { status: nextStatus },
  });
  await writeAuditLog({
    actorId: moderatorId,
    action: "comment_status_change",
    targetType: "comment",
    targetId: commentId,
    metadata: { status: nextStatus, reason },
    req,
  });
  return { status: nextStatus };
}

const ADMIN_USER_SELECT = `
  id, username, email, avatar, bio, location, hikinglevel, gear_prefs,
  profile_public, role, account_status, email_verified, created_at, updated_at
`;

async function listAdminUsers({ q = "", role = "", status = "", page = 1, pageSize = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const where = [];
  const params = [];
  const query = String(q || "").trim();
  if (query) {
    where.push("(username LIKE ? OR email LIKE ?)");
    params.push(`%${query}%`, `%${query}%`);
  }
  if (["user", "moderator", "admin"].includes(role)) {
    where.push("role = ?");
    params.push(role);
  }
  if (["active", "suspended", "pending_deletion", "deleted"].includes(status)) {
    where.push("account_status = ?");
    params.push(status);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [users, totalRow] = await Promise.all([
    all(
      `SELECT ${ADMIN_USER_SELECT} FROM users ${clause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, safePageSize, (safePage - 1) * safePageSize]
    ),
    get(`SELECT COUNT(*) AS count FROM users ${clause}`, params),
  ]);
  return {
    users,
    total: Number(totalRow?.count || 0),
    page: safePage,
    pageSize: safePageSize,
  };
}

async function getAdminUserDetail(userId) {
  const user = await get(`SELECT ${ADMIN_USER_SELECT} FROM users WHERE id = ?`, [userId]);
  if (!user) return null;
  const [postCount, commentCount, eventCount, followersCount, followingCount] = await Promise.all([
    get("SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND status != 2", [userId]),
    get("SELECT COUNT(*) AS count FROM comments WHERE user_id = ? AND status = 1", [userId]),
    get("SELECT COUNT(*) AS count FROM events WHERE user_id = ? AND status != 'deleted'", [userId]),
    get("SELECT COUNT(*) AS count FROM followers WHERE following_id = ?", [userId]),
    get("SELECT COUNT(*) AS count FROM followers WHERE follower_id = ?", [userId]),
  ]);
  return {
    ...user,
    stats: {
      posts: Number(postCount?.count || 0),
      comments: Number(commentCount?.count || 0),
      events: Number(eventCount?.count || 0),
      followers: Number(followersCount?.count || 0),
      following: Number(followingCount?.count || 0),
    },
  };
}

async function getAdminUserRecord(userId) {
  return get("SELECT id, username, email, role, account_status FROM users WHERE id = ?", [userId]);
}

async function countActiveAdmins() {
  const row = await get("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND account_status = 'active'");
  return Number(row?.count || 0);
}

async function assertSafeUserMutation({ targetId, actorId, nextRole, nextStatus }) {
  const target = await getAdminUserRecord(targetId);
  if (!target) throw new Error("用户不存在");

  if (Number(targetId) === Number(actorId)) {
    if (nextStatus && nextStatus !== "active") throw new Error("不能停用当前管理员账号");
    if (nextRole && nextRole !== "admin") throw new Error("不能降级当前管理员账号");
  }

  const isRemovingAdmin =
    String(target.role) === "admin"
    && ((nextRole && nextRole !== "admin") || (nextStatus && nextStatus !== "active"));
  if (isRemovingAdmin && (await countActiveAdmins()) <= 1) {
    throw new Error("不能操作最后一个管理员");
  }
}

async function createAdminUser({ username, email, password, role = "user", emailVerified = 0, actorId, req = null }) {
  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || "user");
  if (!normalizedUsername || !normalizedEmail || !password) throw new Error("用户名、邮箱和密码不能为空");
  if (String(password).length < 8 || String(password).length > 72) throw new Error("密码需为8-72个字符");
  if (!["user", "moderator", "admin"].includes(normalizedRole)) throw new Error("用户角色无效");

  const hash = await bcrypt.hash(String(password), 12);
  try {
    const result = await run(
      `INSERT INTO users
       (username, email, password_hash, role, email_verified, account_status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [normalizedUsername, normalizedEmail, hash, normalizedRole, Number(emailVerified) === 1 ? 1 : 0]
    );
    const user = await getAdminUserDetail(result.lastInsertRowid);
    await writeAuditLog({
      actorId,
      action: "user_create",
      targetType: "user",
      targetId: result.lastInsertRowid,
      metadata: { username: normalizedUsername, email: normalizedEmail, role: normalizedRole },
      req,
    });
    return user;
  } catch (error) {
    if (/UNIQUE|unique/.test(error.message || "")) throw new Error("用户名或邮箱已存在");
    throw error;
  }
}

async function updateAdminUser({ userId, patch, actorId, req = null }) {
  patch = { ...patch };
  if (patch.username !== undefined) patch.username = String(patch.username).trim();
  if (patch.email !== undefined) patch.email = String(patch.email).trim().toLowerCase();
  const fields = [];
  const params = [];
  const metadata = {};
  const allowed = [
    "username", "email", "avatar", "bio", "location", "hikinglevel",
    "gear_prefs", "profile_public", "role", "account_status", "email_verified",
  ];

  const nextRole = patch.role !== undefined ? String(patch.role) : undefined;
  const nextStatus = patch.account_status !== undefined ? String(patch.account_status) : undefined;
  if (nextRole && !["user", "moderator", "admin"].includes(nextRole)) throw new Error("用户角色无效");
  if (nextStatus && !["active", "suspended", "pending_deletion", "deleted"].includes(nextStatus)) {
    throw new Error("账号状态无效");
  }
  await assertSafeUserMutation({ targetId: userId, actorId, nextRole, nextStatus });

  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    fields.push(`${key} = ?`);
    params.push(key === "gear_prefs" && typeof patch[key] !== "string" ? JSON.stringify(patch[key]) : patch[key]);
    metadata[key] = patch[key];
  }
  if (!fields.length) throw new Error("没有需要更新的字段");

  // Identity and permission changes invalidate existing sessions; profile-only edits do not.
  if (["email", "role", "account_status", "email_verified"].some((key) => patch[key] !== undefined)) {
    fields.push("auth_version = auth_version + 1");
  }
  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(userId);
  try {
    const result = await run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
    if (Number(result.changes) !== 1) throw new Error("用户不存在");
    await writeAuditLog({
      actorId,
      action: "user_update",
      targetType: "user",
      targetId: userId,
      metadata,
      req,
    });
    return getAdminUserDetail(userId);
  } catch (error) {
    if (/UNIQUE|unique/.test(error.message || "")) throw new Error("用户名或邮箱已存在");
    throw error;
  }
}

async function forceLogoutUser({ userId, actorId, req = null }) {
  const result = await run(
    "UPDATE users SET auth_version = auth_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [userId]
  );
  if (Number(result.changes) !== 1) throw new Error("用户不存在");
  await writeAuditLog({
    actorId,
    action: "user_force_logout",
    targetType: "user",
    targetId: userId,
    req,
  });
  return { ok: true };
}

async function deleteAdminUser({ userId, mode = "soft", actorId, req = null }) {
  const target = await getAdminUserRecord(userId);
  if (!target) throw new Error("用户不存在");
  await assertSafeUserMutation({ targetId: userId, actorId, nextStatus: "deleted" });
  if (mode === "anonymize") {
    const { anonymizeAccount } = require("./user");
    await anonymizeAccount(userId);
  } else {
    await run("UPDATE users SET account_status = 'deleted', auth_version = auth_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
  }
  await writeAuditLog({
    actorId,
    action: mode === "anonymize" ? "user_anonymize" : "user_soft_delete",
    targetType: "user",
    targetId: userId,
    metadata: { mode, username: target.username },
    req,
  });
  return { mode };
}

async function setUserAccountStatus({ userId, status, moderatorId, reason = "", req = null }) {
  const nextStatus = String(status || "");
  if (!["active", "suspended", "deleted"].includes(nextStatus)) throw new Error("账号状态无效");
  const result = await run(
    "UPDATE users SET account_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [nextStatus, userId]
  );
  if (Number(result.changes) !== 1) throw new Error("用户不存在");
  await writeAuditLog({
    actorId: moderatorId,
    action: "user_account_status_change",
    targetType: "user",
    targetId: userId,
    metadata: { status: nextStatus, reason },
    req,
  });
  return { status: nextStatus };
}

async function setUserRole({ userId, role, adminId, req = null }) {
  const nextRole = String(role || "");
  if (!["user", "moderator", "admin"].includes(nextRole)) throw new Error("用户角色无效");
  const result = await run("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    nextRole,
    userId,
  ]);
  if (Number(result.changes) !== 1) throw new Error("用户不存在");
  await writeAuditLog({
    actorId: adminId,
    action: "user_role_change",
    targetType: "user",
    targetId: userId,
    metadata: { role: nextRole },
    req,
  });
  return { role: nextRole };
}

async function listAdminEvents({ limit = 100, offset = 0 } = {}) {
  return all(
    `SELECT e.id, e.title, e.status, e.event_date, e.created_at, u.username AS author_name
     FROM events e LEFT JOIN users u ON u.id = e.user_id
     ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
    [Math.min(Number(limit) || 100, 200), Math.max(Number(offset) || 0, 0)]
  );
}

async function setEventStatus({ eventId, status, moderatorId, reason = "", req = null }) {
  const nextStatus = String(status || "");
  if (!["active", "hidden", "deleted"].includes(nextStatus)) throw new Error("活动状态无效");
  const result = await run("UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    nextStatus,
    eventId,
  ]);
  if (Number(result.changes) !== 1) throw new Error("活动不存在");
  await writeAuditLog({
    actorId: moderatorId,
    action: "event_status_change",
    targetType: "event",
    targetId: eventId,
    metadata: { status: nextStatus, reason },
    req,
  });
  return { status: nextStatus };
}

async function listFeatureFlags() {
  return all("SELECT key, enabled, description, updated_by, updated_at FROM feature_flags ORDER BY key");
}

async function setFeatureFlag({ key, enabled, updatedBy }) {
  const flagKey = String(key || "").trim();
  if (!flagKey) throw new Error("功能开关名称不能为空");
  await run(
    `INSERT INTO feature_flags (key, enabled, updated_by, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`,
    [flagKey, enabled ? 1 : 0, updatedBy]
  );
  return { key: flagKey, enabled: Boolean(enabled) };
}

module.exports = {
  createReport,
  listReports,
  getReportById,
  resolveReport,
  writeAuditLog,
  writeModerationAction,
  listAuditLogs,
  getAdminSummary,
  listAdminPosts,
  setPostStatus,
  listAdminComments,
  setCommentStatus,
  listAdminUsers,
  getAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  forceLogoutUser,
  deleteAdminUser,
  setUserAccountStatus,
  setUserRole,
  listAdminEvents,
  setEventStatus,
  listFeatureFlags,
  setFeatureFlag,
  REPORT_REASONS,
  TARGET_TYPES,
};
