const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const rootDir = path.resolve(__dirname, "../../..");
const tmpDir = path.join(rootDir, ".tmp");
fs.mkdirSync(tmpDir, { recursive: true });

const dbPath = process.env.LOCAL_DB_PATH
  || path.join(tmpDir, `e2e-${Date.now()}-${process.pid}.db`);

process.env.LOCAL_DB_PATH = dbPath;
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_DISABLED = "1";
process.env.UPLOAD_PROVIDER = "local";
process.env.JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-not-for-production";
process.env.PORT = process.env.PORT || "3101";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";

const { initDb, run, get } = require("../models/db");

const TEST_PASSWORD = "E2ePassw0rd!";

async function insertUser(username, email, role) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  await run(
    `INSERT INTO users (username, email, password_hash, email_verified, role, account_status)
     VALUES (?, ?, ?, 1, ?, 'active')`,
    [username, email, passwordHash, role]
  );
  return get("SELECT * FROM users WHERE email = ?", [email]);
}

async function insertPost(userId, title, content, category, tags, status = 1, routeId = null) {
  const result = await run(
    `INSERT INTO posts (user_id, title, content, category, tags, image_urls, extrainfo, status, views, route_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      title,
      content,
      category,
      tags,
      JSON.stringify(["/img/首页.jpeg"]),
      JSON.stringify({ route: {} }),
      status,
      12,
      routeId,
    ]
  );
  return Number(result.lastInsertRowid);
}

async function insertEvent(userId, { title, eventDate, maxParticipants, content, location, image }) {
  const result = await run(
    `INSERT INTO events (user_id, title, content, location, event_date, difficulty, max_participants, image_url, status)
     VALUES (?, ?, ?, ?, ?, '初级', ?, ?, 'active')`,
    [userId, title, content, location, eventDate, maxParticipants, image]
  );
  return Number(result.lastInsertRowid);
}

async function seed() {
  const user = await insertUser("E2E User", "e2e-user@example.com", "user");
  const other = await insertUser("E2E Other", "e2e-other@example.com", "user");
  await insertUser("E2E Admin", "e2e-admin@example.com", "admin");

  const firstPostId = await insertPost(
    user.id,
    "E2E 测试路线帖",
    "<p>这是一条 E2E 测试帖子，用于验证发布、评论、点赞和收藏流程。</p>",
    "徒步路线",
    "测试,自动化",
    1,
    1
  );
  await insertPost(
    other.id,
    "E2E 周末结伴同行",
    "<p>周末想去西山走一圈，寻找同行者，路线轻松。</p>",
    "结伴同行",
    "结伴,周末"
  );
  await insertPost(
    other.id,
    "雨崩冰湖线徒步记录",
    "<p>从雨崩上村出发往返冰湖，记录沿途牧场和冰川。</p>",
    "徒步路线",
    "雨崩,冰湖"
  );
  await insertPost(
    user.id,
    "E2E 装备测试帖",
    "<p>装备测试内容。</p>",
    "装备评测",
    "装备,测试"
  );
  await insertPost(
    user.id,
    "E2E 草稿帖",
    "<p>草稿内容。</p>",
    "登山经验",
    "草稿",
    0
  );

  await insertEvent(user.id, {
    title: "E2E 周末徒步",
    eventDate: "2026-12-15",
    maxParticipants: 10,
    content: "E2E 活动，用于验证报名和取消。",
    location: "北京西山",
    image: "/img/首页.jpeg",
  });
  const fullEventId = await insertEvent(user.id, {
    title: "E2E 满员活动",
    eventDate: "2026-12-20",
    maxParticipants: 1,
    content: "E2E 满员测试。",
    location: "香山",
    image: "/img/香山.jpeg",
  });
  await run(
    "INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)",
    [fullEventId, other.id]
  );

  await run(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason, detail, status)
     VALUES (?, 'post', ?, '广告', 'E2E 测试举报', 'open')`,
    [other.id, firstPostId]
  );

  console.log(`[E2E] database=${dbPath}`);
  console.log("[E2E] seeded users=3 posts=3 events=2 reports=1");
}

(async () => {
  try {
    await initDb();
    await seed();
    require("../index");
  } catch (error) {
    console.error("[E2E] startup failed:", error);
    process.exit(1);
  }
})();
