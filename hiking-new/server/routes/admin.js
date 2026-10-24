const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/auth");
const { clearPublicCache } = require("../middleware/public-cache");
const {
  getAdminSummary,
  listReports,
  resolveReport,
  listAuditLogs,
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
  writeAuditLog,
} = require("../models/moderation");
const {
  backfillRouteLinks,
  listPendingRouteLinks,
  setPostRoute,
} = require("../models/route-link");
const { createAuthToken } = require("../models/auth-token");
const { sendMail, passwordResetEmail } = require("../services/mailer");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{2,20}$/u;

function validateAdminUserFields(fields) {
  if (fields.username !== undefined) {
    const username = String(fields.username).trim();
    if (!USERNAME_PATTERN.test(username)) return "用户名需为2-20位文字、数字、下划线或短横线";
  }
  if (fields.email !== undefined) {
    const email = String(fields.email).trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || email.length > 254) return "邮箱格式不正确";
  }
  if (fields.bio !== undefined && String(fields.bio).length > 300) return "个人简介不能超过300字";
  if (fields.location !== undefined && String(fields.location).length > 80) return "所在地不能超过80字";
  if (fields.hikinglevel !== undefined && ![1, 2, 3].includes(Number(fields.hikinglevel))) {
    return "徒步等级无效";
  }
  if (fields.gear_prefs !== undefined && (!Array.isArray(fields.gear_prefs) || fields.gear_prefs.length > 12)) {
    return "装备偏好最多12项";
  }
  return "";
}

router.use(authMiddleware, requireRole("moderator", "admin"));

router.get("/summary", async (_req, res) => {
  try {
    res.json({ summary: await getAdminSummary() });
  } catch (error) {
    console.error("[ADMIN] summary failed:", error);
    res.status(500).json({ error: "管理概览加载失败" });
  }
});

router.get("/reports", async (req, res) => {
  try {
    res.json({ reports: await listReports({ status: req.query.status || "open" }) });
  } catch (error) {
    console.error("[ADMIN] reports failed:", error);
    res.status(500).json({ error: "举报列表加载失败" });
  }
});

router.post("/reports/:id/resolve", async (req, res) => {
  try {
    const result = await resolveReport({
      reportId: Number(req.params.id),
      moderatorId: req.userId,
      status: req.body.status,
      reason: req.body.reason,
    });
    res.json({ message: "举报已处理", result });
  } catch (error) {
    const known = /不存在|已处理/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "举报处理失败" });
  }
});

router.get("/posts", async (_req, res) => {
  try {
    res.json({ posts: await listAdminPosts() });
  } catch (error) {
    console.error("[ADMIN] posts failed:", error);
    res.status(500).json({ error: "帖子列表加载失败" });
  }
});

router.put("/posts/:id/status", async (req, res) => {
  try {
    const result = await setPostStatus({
      postId: Number(req.params.id),
      status: req.body.status,
      moderatorId: req.userId,
      reason: req.body.reason,
      req,
    });
    clearPublicCache();
    res.json({ message: "帖子状态已更新", result });
  } catch (error) {
    const known = /无效|不存在/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "帖子操作失败" });
  }
});

router.get("/comments", async (_req, res) => {
  try {
    res.json({ comments: await listAdminComments() });
  } catch (error) {
    console.error("[ADMIN] comments failed:", error);
    res.status(500).json({ error: "评论列表加载失败" });
  }
});

router.put("/comments/:id/status", async (req, res) => {
  try {
    const result = await setCommentStatus({
      commentId: Number(req.params.id),
      status: req.body.status,
      moderatorId: req.userId,
      reason: req.body.reason,
      req,
    });
    clearPublicCache();
    res.json({ message: "评论状态已更新", result });
  } catch (error) {
    const known = /无效|不存在/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "评论操作失败" });
  }
});

router.get("/users", requireRole("admin"), async (req, res) => {
  try {
    res.json(await listAdminUsers({
      q: req.query.q,
      role: req.query.role,
      status: req.query.status,
      page: req.query.page,
      pageSize: req.query.pageSize,
    }));
  } catch (error) {
    console.error("[ADMIN] users failed:", error);
    res.status(500).json({ error: "用户列表加载失败" });
  }
});

router.get("/users/:id", requireRole("admin"), async (req, res) => {
  try {
    const user = await getAdminUserDetail(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json({ user });
  } catch (error) {
    console.error("[ADMIN] user detail failed:", error);
    res.status(500).json({ error: "用户详情加载失败" });
  }
});

router.post("/users", requireRole("admin"), async (req, res) => {
  try {
    const { username, email, password, role, email_verified } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "用户名、邮箱和密码不能为空" });
    }
    const fieldError = validateAdminUserFields({ username, email });
    if (fieldError) return res.status(400).json({ error: fieldError });
    const user = await createAdminUser({
      username,
      email,
      password,
      role,
      emailVerified: email_verified,
      actorId: req.userId,
      req,
    });
    res.status(201).json({ message: "用户已创建", user });
  } catch (error) {
    const known = /不能为空|已存在|无效|密码需/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "用户创建失败" });
  }
});

router.put("/users/:id", requireRole("admin"), async (req, res) => {
  try {
    const patch = {};
    for (const key of [
      "username", "email", "avatar", "bio", "location", "hikinglevel",
      "gear_prefs", "profile_public", "role", "account_status", "email_verified",
    ]) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const fieldError = validateAdminUserFields(patch);
    if (fieldError) return res.status(400).json({ error: fieldError });
    const user = await updateAdminUser({
      userId: Number(req.params.id),
      patch,
      actorId: req.userId,
      req,
    });
    res.json({ message: "用户资料已更新", user });
  } catch (error) {
    const known = /不存在|不能|无效|已存在|没有需要/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "用户资料更新失败" });
  }
});

router.post("/users/:id/force-logout", requireRole("admin"), async (req, res) => {
  try {
    const result = await forceLogoutUser({
      userId: Number(req.params.id),
      actorId: req.userId,
      req,
    });
    res.json({ message: "已强制该用户下线", result });
  } catch (error) {
    const known = /不存在/.test(error.message || "");
    res.status(known ? 404 : 500).json({ error: known ? error.message : "强制下线失败" });
  }
});

router.post("/users/:id/send-reset", requireRole("admin"), async (req, res) => {
  try {
    const user = await getAdminUserDetail(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "用户不存在" });
    if (String(user.account_status) !== "active") {
      return res.status(400).json({ error: "只有正常状态账号可以发送重置邮件" });
    }
    const { token } = await createAuthToken(user.id, "password_reset", 30);
    await sendMail({ to: user.email, ...passwordResetEmail(token) });
    res.json({ message: "密码重置邮件已发送" });
  } catch (error) {
    console.error("[ADMIN] send reset failed:", error);
    res.status(500).json({ error: error.message || "密码重置邮件发送失败" });
  }
});

router.delete("/users/:id", requireRole("admin"), async (req, res) => {
  try {
    const mode = req.body.mode === "anonymize" ? "anonymize" : "soft";
    const result = await deleteAdminUser({
      userId: Number(req.params.id),
      mode,
      actorId: req.userId,
      req,
    });
    res.json({ message: mode === "anonymize" ? "用户已匿名化" : "用户已软删除", result });
  } catch (error) {
    const known = /不存在|不能|最后/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "用户删除失败" });
  }
});

router.put("/users/:id/account-status", requireRole("admin"), async (req, res) => {
  try {
    const result = await setUserAccountStatus({
      userId: Number(req.params.id),
      status: req.body.status,
      moderatorId: req.userId,
      reason: req.body.reason,
      req,
    });
    res.json({ message: "账号状态已更新", result });
  } catch (error) {
    const known = /无效|不存在/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "用户操作失败" });
  }
});

router.put("/users/:id/role", requireRole("admin"), async (req, res) => {
  try {
    const result = await setUserRole({
      userId: Number(req.params.id),
      role: req.body.role,
      adminId: req.userId,
      req,
    });
    res.json({ message: "用户角色已更新", result });
  } catch (error) {
    const known = /无效|不存在/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "角色更新失败" });
  }
});

router.get("/events", async (_req, res) => {
  try {
    res.json({ events: await listAdminEvents() });
  } catch (error) {
    console.error("[ADMIN] events failed:", error);
    res.status(500).json({ error: "活动列表加载失败" });
  }
});

router.put("/events/:id/status", async (req, res) => {
  try {
    const result = await setEventStatus({
      eventId: Number(req.params.id),
      status: req.body.status,
      moderatorId: req.userId,
      reason: req.body.reason,
      req,
    });
    clearPublicCache();
    res.json({ message: "活动状态已更新", result });
  } catch (error) {
    const known = /无效|不存在/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "活动操作失败" });
  }
});

router.get("/audit-logs", requireRole("admin"), async (_req, res) => {
  try {
    res.json({ logs: await listAuditLogs() });
  } catch (error) {
    console.error("[ADMIN] audit logs failed:", error);
    res.status(500).json({ error: "审计日志加载失败" });
  }
});

router.get("/feature-flags", requireRole("admin"), async (_req, res) => {
  try {
    res.json({ flags: await listFeatureFlags() });
  } catch (error) {
    console.error("[ADMIN] flags failed:", error);
    res.status(500).json({ error: "功能开关加载失败" });
  }
});

router.put("/feature-flags/:key", requireRole("admin"), async (req, res) => {
  try {
    const result = await setFeatureFlag({
      key: req.params.key,
      enabled: Boolean(req.body.enabled),
      updatedBy: req.userId,
    });
    res.json({ message: "功能开关已更新", result });
  } catch (error) {
    res.status(400).json({ error: error.message || "功能开关更新失败" });
  }
});

router.get("/route-links", requireRole("admin"), async (req, res) => {
  try {
    const result = await listPendingRouteLinks(req.query.limit);
    res.json(result);
  } catch (error) {
    console.error("[ADMIN] route links failed:", error);
    res.status(500).json({ error: "路线归属数据加载失败" });
  }
});

router.post("/route-links/backfill", requireRole("admin"), async (req, res) => {
  try {
    const linked = await backfillRouteLinks();
    if (linked > 0) clearPublicCache();
    await writeAuditLog({
      actorId: req.userId,
      action: "route_link_backfill",
      targetType: "post",
      metadata: { linked },
      req,
    });
    res.json({
      linked,
      message: linked > 0 ? `已从路线库回填 ${linked} 条帖子关联` : "没有可回填的帖子",
    });
  } catch (error) {
    console.error("[ADMIN] route link backfill failed:", error);
    res.status(500).json({ error: "路线关联回填失败" });
  }
});

router.put("/posts/:id/route-link", requireRole("admin"), async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const routeId = Number(req.body.routeId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: "帖子 ID 无效" });
    }
    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).json({ error: "路线 ID 无效" });
    }
    await setPostRoute(postId, routeId);
    clearPublicCache();
    await writeAuditLog({
      actorId: req.userId,
      action: "route_link_set",
      targetType: "post",
      targetId: postId,
      metadata: { routeId },
      req,
    });
    res.json({ message: "路线关联已保存", postId, routeId });
  } catch (error) {
    console.error("[ADMIN] route link set failed:", error);
    const status = error.message === "帖子不存在" || error.message === "路线不存在" ? 404 : 500;
    res.status(status).json({ error: error.message || "路线关联保存失败" });
  }
});

module.exports = router;
