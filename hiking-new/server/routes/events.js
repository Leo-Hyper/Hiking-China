const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
  createEvent, getAllEvents, getEventById,
  updateEvent, deleteEvent, joinEvent, leaveEvent, checkJoined
} = require("../models/event");

console.log("[EVENTS] Routes loaded");

// GET /api/events - 获取活动列表
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.min(parseInt(req.query.offset) || 0, 10000);
    const events = await getAllEvents(limit, offset);
    res.json({ events });
  } catch (err) {
    console.error("[ERROR] GET /api/events:", err);
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
    const { title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url } = req.body;
    if (!title || !event_date || !location) {
      return res.status(400).json({ error: "标题、活动日期和地点为必填项" });
    }
    const result = await createEvent(req.userId, { title, content, location, location_lat, location_lng, event_date, difficulty, max_participants, image_url });
    res.status(201).json({ id: result.id });
  } catch (err) {
    console.error("[ERROR] POST /api/events:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// PUT /api/events/:id - 编辑活动（需登录，只能编辑自己的）
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    await updateEvent(parseInt(req.params.id), req.userId, req.body);
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
    await deleteEvent(parseInt(req.params.id), req.userId);
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
    await joinEvent(parseInt(req.params.id), req.userId);
    res.json({ success: true });
  } catch (err) {
    if (err.message === "已报名") return res.status(400).json({ error: err.message });
    console.error("[ERROR] POST /api/events/:id/join:", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/events/:id/leave - 取消报名（需登录）
router.post("/:id/leave", authMiddleware, async (req, res) => {
  try {
    await leaveEvent(parseInt(req.params.id), req.userId);
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