const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
  listConversations,
  getOrCreateDirectConversation,
  listMessages,
  sendMessage,
  markConversationRead,
} = require("../models/message");

router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    res.json({ conversations: await listConversations(req.userId) });
  } catch (error) {
    console.error("[MESSAGES] conversations failed:", error);
    res.status(500).json({ error: "会话加载失败" });
  }
});

router.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const result = await getOrCreateDirectConversation(req.userId, Number(req.body.user_id));
    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    const known = /不能|不存在/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "会话创建失败" });
  }
});

router.get("/conversations/:id", authMiddleware, async (req, res) => {
  try {
    res.json({ messages: await listMessages(Number(req.params.id), req.userId) });
  } catch (error) {
    const known = /无权/.test(error.message || "");
    res.status(known ? 403 : 500).json({ error: known ? error.message : "消息加载失败" });
  }
});

router.post("/conversations/:id/messages", authMiddleware, async (req, res) => {
  try {
    const result = await sendMessage(Number(req.params.id), req.userId, req.body.content);
    res.status(201).json(result);
  } catch (error) {
    const known = /无权|内容/.test(error.message || "");
    res.status(known ? 400 : 500).json({ error: known ? error.message : "消息发送失败" });
  }
});

router.put("/conversations/:id/read", authMiddleware, async (req, res) => {
  try {
    res.json(await markConversationRead(Number(req.params.id), req.userId));
  } catch (error) {
    const known = /无权/.test(error.message || "");
    res.status(known ? 403 : 500).json({ error: known ? error.message : "消息状态更新失败" });
  }
});

module.exports = router;
