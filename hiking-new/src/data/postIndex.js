// 搜索索引 — 可替换为 API 数据源
// 后续接入数据库时，此文件可替换为 fetch('/api/search?q=xxx')

export const searchIndex = [
  // 帖子详情（15篇）
  { id: 1, type: "post", title: "四姑娘山大峰攀登全记录", category: "登山经验", date: "2024-01-15", author: "山野行者", tags: ["雪山", "入门级"], excerpt: "四姑娘山大峰海拔5025米，是入门级雪山的绝佳选择...", route: "/post/1" },
  { id: 2, type: "post", title: "虎跳峡高路徒步", category: "徒步路线", date: "2024-01-12", author: "江河漫步", tags: ["云南", "经典路线"], excerpt: "云南虎跳峡高路徒步被誉为世界十大经典徒步路线之一...", route: "/post/2" },
  { id: 3, type: "post", title: "秋季徒步装备指南", category: "装备评测", date: "2024-01-08", author: "装备控", tags: ["秋季", "装备"], excerpt: "秋季是徒步的黄金季节，但天气变化多端...", route: "/post/3" },
  { id: 4, type: "post", title: "贡嘎转山", category: "登山经验", date: "2024-01-05", author: "高原狼", tags: ["贡嘎", "重装"], excerpt: "蜀山之王的神圣之旅...", route: "/post/4" },
  { id: 5, type: "post", title: "稻城亚丁徒步", category: "徒步路线", date: "2024-01-03", author: "香格里拉", tags: ["稻城亚丁"], excerpt: "最后的香格里拉，三神山的神圣之旅...", route: "/post/5" },
  { id: 6, type: "post", title: "雨崩村徒步", category: "徒步路线", date: "2024-01-01", author: "雪山飞狐", tags: ["雨崩", "梅里雪山"], excerpt: "梅里雪山脚下的世外桃源...", route: "/post/6" },
  { id: 7, type: "post", title: "喀纳斯徒步", category: "徒步路线", date: "2023-12-28", author: "北疆行者", tags: ["喀纳斯", "新疆"], excerpt: "北疆最美的徒步秘境...", route: "/post/7" },
  { id: 8, type: "post", title: "墨脱徒步", category: "徒步路线", date: "2023-12-25", author: "秘境探索者", tags: ["墨脱", "西藏"], excerpt: "中国最美的大峡谷，莲花秘境...", route: "/post/8" },
  { id: 9, type: "post", title: "黄山徒步", category: "徒步路线", date: "2023-12-20", author: "安徽行者", tags: ["黄山", "安徽"], excerpt: "五岳归来不看山，黄山归来不看岳...", route: "/post/9" },
  { id: 10, type: "post", title: "徒步露营装备指南", category: "装备评测", date: "2023-12-18", author: "露营达人", tags: ["露营", "帐篷"], excerpt: "户外露营必备装备清单...", route: "/post/10" },
  { id: 11, type: "post", title: "徒步鞋履指南", category: "装备评测", date: "2023-12-15", author: "鞋控", tags: ["鞋履", "选购"], excerpt: "一双好鞋是徒步的基础...", route: "/post/11" },
  { id: 12, type: "post", title: "徒步服装系统指南", category: "装备评测", date: "2023-12-12", author: "装备控", tags: ["服装", "分层"], excerpt: "三层穿衣法是徒步的核心...", route: "/post/12" },
  { id: 13, type: "post", title: "徒步导航与安全装备", category: "装备评测", date: "2023-12-10", author: "安全队长", tags: ["导航", "安全"], excerpt: "野外导航是徒步者的必备技能...", route: "/post/13" },
  { id: 14, type: "post", title: "徒步背包装备指南", category: "装备评测", date: "2023-12-08", author: "背包客", tags: ["背包", "重装"], excerpt: "选对背包，徒步事半功倍...", route: "/post/14" },
  { id: 15, type: "post", title: "徒步其他配件指南", category: "装备评测", date: "2023-12-05", author: "装备控", tags: ["配件", "小物"], excerpt: "提升徒步体验的小物件...", route: "/post/15" },

  // 论坛帖子（示例）
  { id: 101, type: "forum", title: "新手徒步入门攻略", category: "经验分享", date: "2024-01-20", author: "徒步小白", tags: ["新手", "入门"], excerpt: "第一次徒步需要注意什么？...", route: "/forum" },
  { id: 102, type: "forum", title: "冬季徒步防寒技巧", category: "经验分享", date: "2024-01-18", author: "雪地猎人", tags: ["冬季", "防寒"], excerpt: "零下10度也能愉快徒步...", route: "/forum" },
  { id: 103, type: "forum", title: "徒步摄影器材推荐", category: "装备讨论", date: "2024-01-15", author: "山间快门", tags: ["摄影", "器材"], excerpt: "带上相机去徒步...", route: "/forum" },

  // 装备分类
  { id: 201, type: "gear", title: "Osprey 小鹰 65L 背包", category: "背包", date: "2024-01-10", author: "装备控", tags: ["背包", "重装"], excerpt: "经典重装徒步背包，背负系统出色...", route: "/gear" },
  { id: 202, type: "gear", title: "Salomon X Ultra 4 徒步鞋", category: "鞋履", date: "2024-01-08", author: "鞋控", tags: ["鞋履", "轻量"], excerpt: "轻量防滑徒步鞋，Vibram大底抓地力优秀...", route: "/gear" },
  { id: 203, type: "gear", title: "Patagonia 三层穿衣法套装", category: "服装", date: "2024-01-05", author: "装备控", tags: ["服装", "防水"], excerpt: "防水透气外层 + 保暖中层 + 速干内层...", route: "/gear" },
  { id: 204, type: "gear", title: "MSR Hubba Hubba 帐篷", category: "露营", date: "2024-01-03", author: "露营达人", tags: ["帐篷", "轻量化"], excerpt: "双人轻量化帐篷，重量仅1.5kg...", route: "/gear" },

  // 路线
  { id: 301, type: "route", title: "四姑娘山大峰", category: "路线", date: "2024-01-01", author: "山野行者", tags: ["四川", "雪山", "入门"], excerpt: "入门级雪山攀登，体验征服5025米的成就感...", route: "/routes" },
  { id: 302, type: "route", title: "虎跳峡高路徒步", category: "路线", date: "2023-12-28", author: "江河漫步", tags: ["云南", "峡谷", "经典"], excerpt: "世界十大经典徒步路线...", route: "/routes" },
  { id: 303, type: "route", title: "雨崩村徒步", category: "路线", date: "2023-12-25", author: "雪山飞狐", tags: ["云南", "藏族", "秘境"], excerpt: "梅里雪山脚下的世外桃源...", route: "/routes" },
  { id: 304, type: "route", title: "贡嘎大环线", category: "路线", date: "2023-12-20", author: "高原狼", tags: ["四川", "重装", "挑战"], excerpt: "蜀山之王挑战，全程约85公里...", route: "/routes" },
  { id: 305, type: "route", title: "喀纳斯环线", category: "路线", date: "2023-12-15", author: "北疆行者", tags: ["新疆", "秋色", "长线"], excerpt: "北疆最美秋色...", route: "/routes" },
]

// 搜索字段权重（用于排序）
export const SEARCH_FIELDS = ["title", "category", "tags", "excerpt"]
