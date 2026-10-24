const { all, get, run } = require("./db");

const MANUAL_ALIASES = [
  { contains: "四姑娘山大峰", aliases: ["四姑娘山", "大峰", "日隆"] },
  { contains: "虎跳峡高路", aliases: ["虎跳峡", "高路", "二十八道拐", "中峡"] },
  { contains: "中虎跳", aliases: ["中虎跳", "虎跳峡"] },
  { contains: "雨崩冰湖", aliases: ["雨崩冰湖", "冰湖", "雨崩"] },
  { contains: "雨崩神瀑", aliases: ["雨崩神瀑", "神瀑", "雨崩"] },
  { contains: "雨崩尼农", aliases: ["雨崩尼农", "尼农", "雨崩"] },
  { contains: "雨崩村", aliases: ["雨崩"] },
  { contains: "黄山", aliases: ["黄山", "光明顶", "迎客松", "云谷寺", "慈光阁"] },
  { contains: "长坪沟", aliases: ["长坪沟", "毕棚沟", "长穿毕"] },
  { contains: "稻城亚丁长线", aliases: ["稻城亚丁", "转山", "卡斯", "仙乃日", "央迈勇"] },
  { contains: "稻城亚丁", aliases: ["稻城亚丁", "牛奶海", "五色海", "冲古寺"] },
  { contains: "贡嘎", aliases: ["贡嘎", "日乌且", "格西草原", "草科"] },
  { contains: "喀纳斯", aliases: ["喀纳斯", "禾木", "白哈巴"] },
  { contains: "墨脱", aliases: ["墨脱", "背崩", "嘎隆拉"] },
  { contains: "张家界", aliases: ["张家界", "袁家界", "天子山", "金鞭溪"] },
];

const GENERIC_TOKENS = new Set(["徒步", "路线", "线路", "穿越", "环线", "大峰", "村", "线", "攻略"]);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[（）()【】\[\]·—\-_/、,，。.!！?？:：;；"'“”‘’]/g, "");
}

function routeAliases(route) {
  const aliases = new Set();
  const name = normalize(route.name);
  if (name.length >= 2) aliases.add(name);

  const withoutParen = name.replace(/（[^）]*）|\([^)]*\)/g, "");
  if (withoutParen.length >= 2) aliases.add(withoutParen);

  for (const token of withoutParen.split(/[·—\-_/、,，]+/)) {
    if (token.length >= 2 && !GENERIC_TOKENS.has(token)) aliases.add(token);
  }

  for (const rule of MANUAL_ALIASES) {
    if (route.name.includes(rule.contains)) {
      rule.aliases.forEach((alias) => aliases.add(normalize(alias)));
    }
  }

  return [...aliases].filter((alias) => alias.length >= 2);
}

function scoreRoute(post, route) {
  const title = normalize(post.title);
  const tags = normalize(post.tags);
  const content = normalize(post.content);
  const fullName = normalize(route.name);
  const aliases = routeAliases(route);
  const matches = [];

  for (const alias of aliases) {
    if (title.includes(alias)) {
      matches.push({ alias, where: "标题", weight: alias === fullName ? 100 : 82 });
      continue;
    }
    if (tags.includes(alias)) {
      matches.push({ alias, where: "标签", weight: 70 });
      continue;
    }
    if (content.includes(alias)) {
      matches.push({ alias, where: "正文", weight: 42 });
    }
  }

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.weight - a.weight || b.alias.length - a.alias.length);
  const best = matches[0];
  const score = Math.min(100, best.weight + Math.max(0, matches.length - 1) * 10);
  if (score < 60) return null;

  return {
    routeId: Number(route.id),
    name: route.name,
    score,
    confidence: score >= 85 ? "高" : score >= 68 ? "中" : "低",
    reason: `${best.where}命中「${best.alias}」${matches.length > 1 ? `，共 ${matches.length} 处线索` : ""}`,
  };
}

async function listPendingRouteLinks(limit = 100) {
  const rows = await all(
    `SELECT p.id, p.title, p.tags, p.category, p.created_at,
            substr(p.content, 1, 600) AS content,
            u.username AS author
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.status = 1 AND p.route_id IS NULL
     ORDER BY p.created_at DESC
     LIMIT ?`,
    [Math.max(1, Math.min(200, Number(limit) || 100))]
  );
  const routes = await all(
    "SELECT id, name, region, tags FROM routes WHERE status = 1 ORDER BY id"
  );
  const pendingRow = await get(
    "SELECT COUNT(*) AS count FROM posts WHERE status = 1 AND route_id IS NULL"
  );

  return {
    pending: Number(pendingRow?.count || 0),
    posts: (rows || []).map((post) => ({
      ...post,
      suggestions: (routes || [])
        .map((route) => scoreRoute(post, route))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    })),
  };
}

async function backfillRouteLinks() {
  const result = await run(
    `UPDATE posts
     SET route_id = (
       SELECT r.id FROM routes r
       WHERE r.post_id = posts.id AND r.status = 1
       ORDER BY r.id LIMIT 1
     )
     WHERE route_id IS NULL
       AND EXISTS (
         SELECT 1 FROM routes r
         WHERE r.post_id = posts.id AND r.status = 1
       )`
  );
  return Number(result.changes || 0);
}

async function setPostRoute(postId, routeId) {
  const post = await get("SELECT id FROM posts WHERE id = ?", [postId]);
  if (!post) throw new Error("帖子不存在");
  const route = await get("SELECT id FROM routes WHERE id = ? AND status = 1", [routeId]);
  if (!route) throw new Error("路线不存在");
  const result = await run("UPDATE posts SET route_id = ? WHERE id = ?", [
    Number(routeId),
    Number(postId),
  ]);
  return { changes: Number(result.changes || 0) };
}

module.exports = {
  backfillRouteLinks,
  listPendingRouteLinks,
  routeAliases,
  setPostRoute,
};
