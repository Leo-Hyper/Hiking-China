const express = require("express");
const router = express.Router();
const { register, login, getUserById, updateUserProfile, getPublicUserById } = require("../models/user");
const { authMiddleware, generateToken } = require("../middleware/auth");
const { publicCache, clearPublicCache } = require("../middleware/public-cache");
const { safeImageUrl } = require("../utils/validation");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{2,20}$/u;

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({ error: "请填写所有必填字段" });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "密码需为8-72个字符" });
    }
    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({ error: "用户名需为2-20位文字、数字、下划线或短横线" });
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ error: "邮箱格式不正确" });
    }

    const user = await register(username, email, password);
    const token = generateToken(user);

    res.status(201).json({
      message: "注册成功",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    if (err.message === "用户名或邮箱已存在") {
      return res.status(409).json({ error: err.message });
    }
    console.error("[AUTH] register failed:", err);
    res.status(500).json({ error: "注册失败" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

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
    if (err.message === "邮箱或密码错误") {
      return res.status(401).json({ error: err.message });
    }
    console.error("[AUTH] login failed:", err);
    res.status(500).json({ error: "登录失败" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "服务器错误" });
  }
});

// PUT /api/auth/profile - 更新个人资料（需登录）
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, avatar, bio, location, hikinglevel, gear_prefs, profile_public } = req.body;

    if (username) {
      const normalizedUsername = String(username).trim();
      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        return res.status(400).json({ error: "用户名需为2-20位文字、数字、下划线或短横线" });
      }
      const { get } = require("../models/db");
      const existing = await get("SELECT id FROM users WHERE username = ? AND id != ?", [normalizedUsername, req.userId]);
      if (existing) {
        return res.status(400).json({ error: "用户名已被使用" });
      }
    }

    if (bio && String(bio).length > 300) {
      return res.status(400).json({ error: "个人简介不能超过300字" });
    }
    if (location && String(location).length > 80) {
      return res.status(400).json({ error: "所在地不能超过80字" });
    }
    if (avatar && !safeImageUrl(avatar)) {
      return res.status(400).json({ error: "头像地址不合法" });
    }
    if (hikinglevel !== undefined) {
      const level = Number(hikinglevel);
      if (![1, 2, 3].includes(level)) {
        return res.status(400).json({ error: "徒步等级无效" });
      }
    }
    if (gear_prefs !== undefined && (!Array.isArray(gear_prefs) || gear_prefs.length > 12)) {
      return res.status(400).json({ error: "装备偏好最多12项" });
    }

    await updateUserProfile(req.userId, {
      username: username ? String(username).trim() : undefined,
      avatar,
      bio,
      location,
      hikinglevel,
      gear_prefs,
      profile_public,
    });
    const user = await getUserById(req.userId);
    clearPublicCache();

    res.json({ message: "更新成功", user });
  } catch (err) {
    console.error("[PROFILE UPDATE ERROR]", err);
    res.status(500).json({ error: "更新失败" });
  }
});

// GET /api/users/:id - 公开用户资料
router.get("/users/:id", publicCache(30000), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await getPublicUserById(userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const safeUser = user.profile_public
      ? user
      : {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          profile_public: user.profile_public,
          created_at: user.created_at,
        };

    res.json({
      user: {
        ...safeUser,
        post_count: user.post_count,
        followers_count: user.followers_count,
        following_count: user.following_count,
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
