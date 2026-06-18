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

function loadSeedSearchData(db) {
  const stmt = db.prepare("INSERT OR IGNORE INTO search_index (type, title, category, tags, excerpt, route) VALUES (?, ?, ?, ?, ?, ?)");
  for (const item of searchData) {
    stmt.run(item.type, item.title, item.category, item.tags, item.excerpt, item.route);
  }
  stmt.finalize();
  console.log(`Seeded ${searchData.length} search records`);
}

module.exports = { loadSeedSearchData };
