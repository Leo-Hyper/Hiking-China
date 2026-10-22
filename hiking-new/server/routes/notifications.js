const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../models/notification");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [notifications, unread] = await Promise.all([
      listNotifications(req.userId),
      getUnreadCount(req.userId),
    ]);
    res.json({ notifications, unread });
  } catch (error) {
    console.error("[NOTIFICATIONS] list failed:", error);
    res.status(500).json({ error: "通知加载失败" });
  }
});

router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    res.json({ unread: await getUnreadCount(req.userId) });
  } catch (error) {
    console.error("[NOTIFICATIONS] unread failed:", error);
    res.status(500).json({ error: "未读数加载失败" });
  }
});

router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    await markNotificationRead(req.userId, Number(req.params.id));
    res.json({ message: "已读" });
  } catch (error) {
    console.error("[NOTIFICATIONS] mark read failed:", error);
    res.status(500).json({ error: "通知更新失败" });
  }
});

router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.userId);
    res.json({ message: "全部已读", changes: result.changes });
  } catch (error) {
    console.error("[NOTIFICATIONS] mark all read failed:", error);
    res.status(500).json({ error: "通知更新失败" });
  }
});

module.exports = router;
