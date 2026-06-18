const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { register, login, getUserById } = require("../models/user");
const { generateToken, verifyToken } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "请填写所有必填字段" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "密码至少6个字符" });
    }
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: "用户名2-20个字符" });
    }

    const user = await register(username, email, password);
    const token = generateToken(user);

    res.status(201).json({
      message: "注册成功",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "请填写邮箱和密码" });
    }

    const user = await login(email, password);
    const token = generateToken(user);

    res.json({
      message: "登录成功",
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio },
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "未登录" });
    }

    const decoded = verifyToken(authHeader.split(" ")[1]);
    if (!decoded) {
      return res.status(401).json({ error: "Token 无效" });
    }

    const user = await getUserById(decoded.id);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ message: "已登出" });
});

module.exports = router;
