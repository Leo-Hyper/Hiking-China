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
  setUserAccountStatus,
  setUserRole,
  listAdminEvents,
  setEventStatus,
  listFeatureFlags,
  setFeatureFlag,
} = require("../models/moderation");

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

router.get("/users", requireRole("admin"), async (_req, res) => {
  try {
    res.json({ users: await listAdminUsers() });
  } catch (error) {
    console.error("[ADMIN] users failed:", error);
    res.status(500).json({ error: "用户列表加载失败" });
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

module.exports = router;
