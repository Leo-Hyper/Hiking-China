const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { register, login, getUserById, updateUserProfile, getPublicUserById } = require("../models/user");
const { getFollowCounts } = require("../models/follow");
const { getMyPostCount } = require("../models/post");
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

// PUT /api/auth/profile - 更新个人资料（需登录）
router.put("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "未登录" });
    }

    const decoded = verifyToken(authHeader.split(" ")[1]);
    if (!decoded) {
      return res.status(401).json({ error: "Token 无效" });
    }

    const { username, avatar, bio, location, hikinglevel, gear_prefs, profile_public } = req.body;

    if (username) {
      const { getDb } = require("../models/db");
      const db = getDb();
      const existing = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE username = ? AND id != ?", [username, decoded.id], (err, row) => {
          err ? reject(err) : resolve(row);
        });
      });
      if (existing) {
        return res.status(400).json({ error: "用户名已被使用" });
      }
    }

    await updateUserProfile(decoded.id, { username, avatar, bio, location, hikinglevel, gear_prefs, profile_public });
    const user = await getUserById(decoded.id);

    res.json({ message: "更新成功", user });
  } catch (err) {
    console.error("[PROFILE UPDATE ERROR]", err);
    res.status(500).json({ error: "更新失败" });
  }
});

// GET /api/users/:id - 公开用户资料
router.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await getPublicUserById(userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const counts = await getFollowCounts(userId);
    const postCount = await getMyPostCount(userId);

    res.json({
      user: {
        ...user,
        post_count: postCount,
        followers_count: counts.followers,
        following_count: counts.following,
      },
    });
  } catch (err) {
    console.error("[USER PROFILE ERROR]", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ message: "已登出" });
});

module.exports = router;
