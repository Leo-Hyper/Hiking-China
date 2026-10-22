const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { createReport } = require("../models/moderation");

// POST /api/reports
router.post("/", authMiddleware, async (req, res) => {
  try {
    const report = await createReport({
      reporterId: req.userId,
      targetType: req.body.target_type,
      targetId: req.body.target_id,
      reason: req.body.reason,
      detail: req.body.detail,
    });
    res.status(201).json({ message: "举报已提交", reportId: report.id });
  } catch (err) {
    const known = /无效|不能为空/.test(err.message || "");
    res.status(known ? 400 : 500).json({ error: known ? err.message : "举报提交失败" });
  }
});

module.exports = router;
