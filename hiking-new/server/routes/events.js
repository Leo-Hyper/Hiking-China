const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
  createEvent, getAllEvents, getEventById,
  updateEvent, deleteEvent, joinEvent, leaveEvent, checkJoined, getJoinedEventIds
} = require("../models/event");
const { publicCache, clearPublicCache } = require("../middleware/public-cache");
const { sanitizeRichText } = require("../services/sanitize");
const { pageLimit, pageOffset, safeImageUrl } = require("../utils/validation");

function validateEventFields(fields) {
  if (fields.title !== undefined && (!String(fields.title).trim() || String(fields.title).length > 100)) {
    return "活动标题需为1-100字";
  }
  if (fields.location !== undefined && String(fields.location).length > 120) {
    return "活动地点不能超过120字";
  }
  if (fields.content !== undefined && String(fields.content).length > 30000) {
    return "活动内容不能超过30000字";
  }
  if (fields.event_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(fields.event_date))) {
    return "活动日期格式无效";
  }
  if (fields.signup_deadline && !/^\d{4}-\d{2}-\d{2}$/.test(String(fields.signup_deadline))) {
    return "报名截止日期格式无效";
  }
  if (fields.max_participants !== undefined) {
    const count = Number(fields.max_participants);
    if (!Number.isInteger(count) || count < 0 || count > 10000) return "报名人数上限无效";
  }
  if (fields.difficulty !== undefined && !["初级", "中级", "高级"].includes(String(fields.difficulty))) {
    return "活动难度无效";
  }
  if (fields.location_lat != null) {
    const latitude = Number(fields.location_lat);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return "纬度无效";
  }
  if (fields.location_lng != null) {
    const longitude = Number(fields.location_lng);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return "经度无效";
  }
  return "";
}

// GET /api/events - 获取活动列表
router.get("/", publicCache(30000), async (req, res) => {
  try {
    const limit = pageLimit(req.query.limit, 50);
    const offset = pageOffset(req.query.offset);
    const events = await getAllEvents(limit, offset);
    res.json({ events });
  } catch (err) {
    console.error("[ERROR] GET /api/events:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

router.get("/signup-statuses", authMiddleware, async (req, res) => {
  try {
    res.json({ event_ids: await getJoinedEventIds(req.userId) });
  } catch (error) {
    console.error("[ERROR] GET /api/events/signup-statuses:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// GET /api/events/:id - 获取单个活动
router.get("/:id", async (req, res) => {
  try {
    const event = await getEventById(parseInt(req.params.id));
    if (!event) return res.status(404).json({ error: "活动不存在" });
    res.json({ event });
  } catch (err) {
    console.error("[ERROR] GET /api/events/:id:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/events - 创建活动（需登录）
router.post("/", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = sanitizeRichText(req.body.content);
    const location = String(req.body.location || "").trim();
    const { location_lat, location_lng, event_date, difficulty, max_participants } = req.body;
    const image_url = safeImageUrl(req.body.image_url);
    if (!title || !event_date || !location) {
      return res.status(400).json({ error: "标题、活动日期和地点为必填项" });
    }
    if (title.length > 100 || location.length > 120 || content.length > 30000) {
      return res.status(400).json({ error: "活动内容长度超出限制" });
    }
    const validationError = validateEventFields({ ...req.body, title, content, location });
    if (validationError) return res.status(400).json({ error: validationError });
    const result = await createEvent(req.userId, { title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url });
    clearPublicCache();
    res.status(201).json({ id: result.id });
  } catch (err) {
    console.error("[ERROR] POST /api/events:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// PUT /api/events/:id - 编辑活动（需登录，只能编辑自己的）
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const fields = { ...req.body };
    if (fields.content !== undefined) fields.content = sanitizeRichText(fields.content);
    if (fields.image_url !== undefined) fields.image_url = safeImageUrl(fields.image_url);
    if (fields.title !== undefined) fields.title = String(fields.title).trim().slice(0, 100);
    if (fields.location !== undefined) fields.location = String(fields.location).trim().slice(0, 120);
    const validationError = validateEventFields(fields);
    if (validationError) return res.status(400).json({ error: validationError });
    await updateEvent(Number.parseInt(req.params.id, 10), req.userId, fields);
    clearPublicCache();
    res.json({ success: true });
  } catch (err) {
    if (err.message === "活动不存在") return res.status(404).json({ error: err.message });
    if (err.message === "无权编辑") return res.status(403).json({ error: err.message });
    console.error("[ERROR] PUT /api/events/:id:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// DELETE /api/events/:id - 删除活动（需登录，只能删除自己的）
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await deleteEvent(Number.parseInt(req.params.id, 10), req.userId);
    clearPublicCache();
    res.json({ success: true });
  } catch (err) {
    if (err.message === "活动不存在") return res.status(404).json({ error: err.message });
    if (err.message === "无权删除") return res.status(403).json({ error: err.message });
    console.error("[ERROR] DELETE /api/events/:id:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/events/:id/join - 报名（需登录）
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    await joinEvent(Number.parseInt(req.params.id, 10), req.userId);
    clearPublicCache();
    res.json({ success: true });
  } catch (err) {
    if (err.message === "已报名") return res.status(400).json({ error: err.message });
    if (err.message === "报名人数已满") return res.status(400).json({ error: err.message });
    if (err.message === "活动已结束" || err.message === "报名已截止") {
      return res.status(400).json({ error: err.message });
    }
    console.error("[ERROR] POST /api/events/:id/join:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/events/:id/leave - 取消报名（需登录）
router.post("/:id/leave", authMiddleware, async (req, res) => {
  try {
    await leaveEvent(Number.parseInt(req.params.id, 10), req.userId);
    clearPublicCache();
    res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] POST /api/events/:id/leave:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// GET /api/events/:id/check - 检查是否已报名（需登录）
router.get("/:id/check", authMiddleware, async (req, res) => {
  try {
    const joined = await checkJoined(parseInt(req.params.id), req.userId);
    res.json({ joined });
  } catch (err) {
    console.error("[ERROR] GET /api/events/:id/check:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

module.exports = router;
