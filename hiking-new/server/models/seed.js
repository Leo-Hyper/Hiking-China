const { get, run } = require("./db");
const bcrypt = require("bcrypt");

// 从 postIndex.js 提取的数据种子
const searchData = [
  { type: "post", title: "四姑娘山大峰攀登全记录", category: "登山经验", tags: "雪山,入门级", excerpt: "四姑娘山大峰海拔5025米...", route: "/post/1" },
  { type: "post", title: "虎跳峡高路徒步", category: "徒步路线", tags: "云南,经典路线", excerpt: "云南虎跳峡高路徒步...", route: "/post/2" },
  { type: "post", title: "秋季徒步装备指南", category: "装备评测", tags: "秋季,装备", excerpt: "秋季是徒步的黄金季节...", route: "/post/3" },
  { type: "post", title: "贡嘎转山", category: "登山经验", tags: "贡嘎,重装", excerpt: "蜀山之王的神圣之旅...", route: "/post/4" },
  { type: "post", title: "稻城亚丁徒步", category: "徒步路线", tags: "稻城亚丁", excerpt: "最后的香格里拉...", route: "/post/5" },
  { type: "post", title: "雨崩村徒步", category: "徒步路线", tags: "雨崩,梅里雪山", excerpt: "梅里雪山脚下的世外桃源...", route: "/post/6" },
  { type: "post", title: "喀纳斯徒步", category: "徒步路线", tags: "喀纳斯,新疆", excerpt: "北疆最美的徒步秘境...", route: "/post/7" },
  { type: "post", title: "墨脱徒步", category: "徒步路线", tags: "墨脱,西藏", excerpt: "中国最美的大峡谷...", route: "/post/8" },
  { type: "post", title: "黄山徒步", category: "徒步路线", tags: "黄山,安徽", excerpt: "五岳归来不看山...", route: "/post/9" },
  { type: "post", title: "徒步露营装备指南", category: "装备评测", tags: "露营,帐篷", excerpt: "户外露营必备装备...", route: "/post/10" },
  { type: "post", title: "徒步鞋履指南", category: "装备评测", tags: "鞋履,选购", excerpt: "一双好鞋是徒步的基础...", route: "/post/11" },
  { type: "post", title: "徒步服装系统指南", category: "装备评测", tags: "服装,分层", excerpt: "三层穿衣法是徒步的核心...", route: "/post/12" },
  { type: "post", title: "徒步导航与安全装备", category: "装备评测", tags: "导航,安全", excerpt: "野外导航是徒步者的必备技能...", route: "/post/13" },
  { type: "post", title: "徒步背包装备指南", category: "装备评测", tags: "背包,重装", excerpt: "选对背包，徒步事半功倍...", route: "/post/14" },
  { type: "post", title: "徒步其他配件指南", category: "装备评测", tags: "配件,小物", excerpt: "提升徒步体验的小物件...", route: "/post/15" },
  { type: "route", title: "四姑娘山大峰", category: "路线", tags: "四川,雪山,入门", excerpt: "入门级雪山攀登...", route: "/routes" },
  { type: "route", title: "虎跳峡高路徒步", category: "路线", tags: "云南,峡谷,经典", excerpt: "世界十大经典徒步路线...", route: "/routes" },
  { type: "route", title: "雨崩村徒步", category: "路线", tags: "云南,藏族,秘境", excerpt: "梅里雪山脚下的世外桃源...", route: "/routes" },
  { type: "route", title: "贡嘎大环线", category: "路线", tags: "四川,重装,挑战", excerpt: "蜀山之王挑战...", route: "/routes" },
  { type: "route", title: "喀纳斯环线", category: "路线", tags: "新疆,秋色,长线", excerpt: "北疆最美秋色...", route: "/routes" },
];

// 活动初始数据（与妙搭前端 STATIC_EVENTS 对齐，字段映射到 events 表）
const STATIC_EVENTS = [
  { title: "周末·西山国家森林公园徒步", event_date: "2026-09-15", location: "北京西山", difficulty: "初级", max_participants: 40, content: "轻松休闲的周末徒步活动，适合新手参与", image_url: "/img/首页.jpeg", signup_deadline: "" },
  { title: "长城徒步·慕田峪至司马台", event_date: "2026-09-22", location: "北京怀柔", difficulty: "中级", max_participants: 30, content: "穿越长城精华段，感受千年历史与自然美景", image_url: "/img/云蒙山.jpg", signup_deadline: "" },
  { title: "秋季赏花·桃花源徒步之旅", event_date: "2026-10-08", location: "北京平谷", difficulty: "初级", max_participants: 50, content: "秋天来了，一起去山谷中徒步赏景", image_url: "/img/香山.jpeg", signup_deadline: "" },
  { title: "云蒙山亲子徒步招募", event_date: "2026-09-15", location: "北京·云蒙山国家森林公园", difficulty: "初级", max_participants: 20, content: "<p>周末带娃进山！云蒙山步道修缮完好、坡度平缓，是最适合亲子的入门徒步地之一。</p><h2>活动安排</h2><p>上午八点半山门集合，全程约六公里，沿途设置三个自然观察任务点，孩子们可以收集落叶标本。中午山顶草坪野餐，下午两点前下撤。</p><h2>参与须知</h2><p>建议六岁以上儿童参加，需家长全程陪同。自备午餐与水，组织方提供急救包与对讲机。</p><p><strong>招募人数</strong>：20人　<strong>报名截止</strong>：2026-09-10</p>", image_url: "/img/云蒙山.jpg", signup_deadline: "2026-09-10" },
];

async function loadSeedSearchData() {
  for (const item of searchData) {
    await run(
      "INSERT OR IGNORE INTO search_index (type, title, category, tags, excerpt, route) VALUES (?, ?, ?, ?, ?, ?)",
      [item.type, item.title, item.category, item.tags, item.excerpt, item.route]
    );
  }
  console.log(`Seeded ${searchData.length} search records`);
}

// 活动种子：仅当 events 表为空时导入，避免重复
async function loadSeedEvents() {
  const row = await get("SELECT COUNT(*) as cnt FROM events");
  if (!row || Number(row.cnt) > 0) return;
  let owner = await get("SELECT id FROM users ORDER BY id LIMIT 1");
  if (!owner) {
    await run(
      "INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES (1, ?, ?, ?)",
      ["system", "system@hiking-china.local", bcrypt.hashSync(crypto.randomUUID(), 10)]
    );
    owner = await get("SELECT id FROM users WHERE username = ?", ["system"]);
  }
  const ownerId = owner.id;
  for (const ev of STATIC_EVENTS) {
    await run(
      `INSERT INTO events (user_id, title, content, location, event_date, difficulty, max_participants, image_url, signup_deadline, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [ownerId, ev.title, ev.content, ev.location, ev.event_date, ev.difficulty, ev.max_participants, ev.image_url, ev.signup_deadline]
    );
  }
  console.log(`Seeded ${STATIC_EVENTS.length} events`);
}

// 旧亲子徒步招募帖（post 17）标记删除，与前端活动化对齐
async function deactivateLegacyPost17() {
  const res = await run("UPDATE posts SET status = 2 WHERE id = 17 AND status != 2");
  if (res.changes > 0) console.log("Deactivated legacy post 17 (亲子徒步招募帖 → 已活动化)");
}

module.exports = { loadSeedSearchData, loadSeedEvents, deactivateLegacyPost17 };
