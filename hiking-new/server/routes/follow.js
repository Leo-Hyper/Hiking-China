const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { toggleFollow, isFollowing } = require("../models/follow");
const { createNotification } = require("../models/notification");

// POST /api/follow/toggle/:userId - 切换关注
router.post("/toggle/:userId", authMiddleware, async (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);
    if (targetId === req.userId) {
      return res.status(400).json({ error: "不能关注自己" });
    }
    const result = await toggleFollow(req.userId, targetId);
    if (result.following) {
      await createNotification({
        userId: targetId,
        type: "follow",
        actorId: req.userId,
        entityType: "user",
        entityId: req.userId,
        title: "有人关注了你",
        body: "去公开主页看看新的同行者",
        link: `/user/${req.userId}`,
      });
    }
    res.json(result);
  } catch (err) {
    if (err.message === "用户不存在") {
      return res.status(404).json({ error: err.message });
    }
    console.error("[FOLLOW] toggle error:", err);
    res.status(500).json({ error: "操作失败" });
  }
});

// GET /api/follow/check/:userId - 查询关注状态
router.get("/check/:userId", authMiddleware, async (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);
    const following = await isFollowing(req.userId, targetId);
    res.json({ following });
  } catch (err) {
    res.status(500).json({ error: "查询失败" });
  }
});

module.exports = router;
