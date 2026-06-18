// 搜索索引 — 合并所有可搜索的内容（帖子 + 路线 + 装备）
export const searchIndex = [
  // === 帖子 ===
  { id: 1, type: 'post', key: '1', title: '四姑娘山大峰攀登全记录', category: '登山经验', author: '山野行者', date: '2024-01-15', tags: ['雪山', '入门级', '四姑娘山', '攀登'], image: '/img/四姑娘山.jpg', url: '/post/1', excerpt: '四姑娘山大峰海拔5025米，是入门级雪山的绝佳选择。' },
  { id: 2, type: 'post', key: '2', title: '虎跳峡高路徒步攻略分享', category: '路线攻略', author: '江河漫步', date: '2024-01-12', tags: ['云南', '经典路线', '虎跳峡', '徒步'], image: '/img/虎跳峡.jpg', url: '/post/2', excerpt: '云南虎跳峡高路徒步被誉为世界十大经典徒步路线之一。' },
  { id: 3, type: 'post', key: '3', title: '秋季徒步装备指南', category: '装备评测', author: '装备控', date: '2024-01-08', tags: ['秋季', '装备', '清单'], image: '/img/徒步装备.avif', url: '/post/3', excerpt: '秋季是徒步的黄金季节，但天气变化多端，合适的装备至关重要。' },
  { id: 4, type: 'post', key: '4', title: '贡嘎转山', category: '登山经验', author: '高原狼', date: '2024-01-05', tags: ['贡嘎', '重装', '大环线'], image: '/img/贡嘎转山.png', url: '/post/4', excerpt: '贡嘎环线被誉为川西最经典的徒步线路，蜀山之王的神圣之旅。' },
  { id: 5, type: 'post', key: '5', title: '稻城亚丁徒步', category: '路线攻略', author: '香格里拉', date: '2024-01-03', tags: ['稻城亚丁', '三神山'], image: '/img/稻城亚丁.jpg', url: '/post/5', excerpt: '最后的香格里拉，三神山的神圣之旅。' },
  { id: 6, type: 'post', key: '6', title: '雨崩村徒步', category: '路线攻略', author: '雪山飞狐', date: '2024-01-01', tags: ['雨崩', '梅里雪山'], image: '/img/雨崩村.webp', url: '/post/6', excerpt: '梅里雪山脚下的世外桃源，藏族村落体验。' },
  { id: 7, type: 'post', key: '7', title: '喀纳斯徒步', category: '路线攻略', author: '北疆行者', date: '2023-12-28', tags: ['喀纳斯', '新疆'], image: '/img/喀纳斯.jpg', url: '/post/7', excerpt: '北疆最美的秋色，禾木到喀纳斯。' },
  { id: 8, type: 'post', key: '8', title: '墨脱徒步', category: '路线攻略', author: '秘境探索者', date: '2023-12-25', tags: ['墨脱', '西藏'], image: '/img/墨脱.jpg', url: '/post/8', excerpt: '中国最神秘的徒步路线，莲花秘境挑战。' },
  { id: 9, type: 'post', key: '9', title: '黄山徒步', category: '路线攻略', author: '安徽行者', date: '2023-12-20', tags: ['黄山', '安徽'], image: '/img/黄山.jpg', url: '/post/9', excerpt: '奇松怪石云海温泉，中国山水之美典范。' },
  { id: 10, type: 'post', key: '10', title: '徒步露营装备指南', category: '装备评测', author: '露营达人', date: '2023-12-18', tags: ['露营', '帐篷'], image: '/img/露营.webp', url: '/post/10', excerpt: '徒步露营装备的完整指南。' },
  { id: 11, type: 'post', key: '11', title: '徒步鞋履指南', category: '装备评测', author: '鞋控', date: '2023-12-15', tags: ['鞋履', '选购'], image: '/img/鞋履.jpg', url: '/post/11', excerpt: '徒步鞋履选购指南。' },
  { id: 12, type: 'post', key: '12', title: '徒步服装系统指南', category: '装备评测', author: '装备控', date: '2023-12-12', tags: ['服装', '分层'], image: '/img/服装.jpg', url: '/post/12', excerpt: '徒步服装三层穿衣法。' },
  { id: 13, type: 'post', key: '13', title: '徒步导航与安全装备', category: '装备评测', author: '安全队长', date: '2023-12-10', tags: ['导航', '安全'], image: '/img/导航.jpg', url: '/post/13', excerpt: '徒步导航与安全装备。' },
  { id: 14, type: 'post', key: '14', title: '徒步背包装备指南', category: '装备评测', author: '背包客', date: '2023-12-08', tags: ['背包', '重装'], image: '/img/背包.webp', url: '/post/14', excerpt: '徒步背包选购指南。' },
  { id: 15, type: 'post', key: '15', title: '徒步其他配件指南', category: '装备评测', author: '装备控', date: '2023-12-05', tags: ['配件', '小物件'], image: '/img/其他装备.jpg', url: '/post/15', excerpt: '提升徒步体验的小物件。' },
  // === 路线 ===
  { id: 101, type: 'route', key: '1', title: '四姑娘山大峰', region: '四川', difficulty: '中级', distance: 28, duration: '2天', rating: 4.8, image: '/img/四姑娘山.jpg', url: '/routes', description: '入门级雪山攀登，体验征服5025米的成就感。' },
  { id: 102, type: 'route', key: '2', title: '虎跳峡高路徒步', region: '云南', difficulty: '中级', distance: 25, duration: '2天', rating: 4.9, image: '/img/虎跳峡.jpg', url: '/routes', description: '世界十大经典徒步路线，金沙江峡谷震撼体验。' },
  { id: 103, type: 'route', key: '3', title: '雨崩村徒步', region: '云南', difficulty: '初级', distance: 20, duration: '3天', rating: 4.7, image: '/img/雨崩村.webp', url: '/routes', description: '梅里雪山脚下的世外桃源，藏族村落体验。' },
  { id: 104, type: 'route', key: '4', title: '贡嘎大环线', region: '四川', difficulty: '高级', distance: 85, duration: '6天', rating: 5.0, image: '/img/贡嘎转山.png', url: '/routes', description: '蜀山之王挑战，全程约85公里重装线路。' },
  { id: 105, type: 'route', key: '5', title: '稻城亚丁长线', region: '四川', difficulty: '中级', distance: 45, duration: '4天', rating: 4.9, image: '/img/稻城亚丁.jpg', url: '/routes', description: '最后的香格里拉，三神山神圣之旅。' },
  { id: 106, type: 'route', key: '6', title: '喀纳斯环线', region: '新疆', difficulty: '中级', distance: 60, duration: '5天', rating: 4.8, image: '/img/喀纳斯.jpg', url: '/routes', description: '北疆最美秋色，禾木-白哈巴-喀纳斯。' },
  { id: 107, type: 'route', key: '7', title: '黄山徒步', region: '安徽', difficulty: '初级', distance: 15, duration: '2天', rating: 4.6, image: '/img/黄山.jpg', url: '/routes', description: '奇松怪石云海温泉，中国山水之美典范。' },
  { id: 108, type: 'route', key: '8', title: '墨脱徒步', region: '西藏', difficulty: '高级', distance: 120, duration: '8天', rating: 5.0, image: '/img/墨脱.jpg', url: '/routes', description: '中国最神秘的徒步路线，莲花秘境挑战。' },
  { id: 109, type: 'route', key: '9', title: '张家界徒步', region: '湖南', difficulty: '中级', distance: 35, duration: '3天', rating: 4.7, image: '/img/张家界.png', url: '/routes', description: '三千奇峰拔地起，玻璃栈道心跳体验。' },
]

export function search(query) {
  if (!query || !query.trim()) return []
  const q = query.toLowerCase().trim()
  const terms = q.split(/[\s,，\s]+/).filter(Boolean)
  return searchIndex.filter(item => {
    const searchable = [
      item.title, item.category, item.description,
      item.tags?.join(' '), item.region
    ].join(' ').toLowerCase()
    return terms.some(term => searchable.includes(term))
  })
}
