import type { GearItem, RouteItem } from './hiking-types';

export const POST_CATEGORIES: string[] = [
  '登山经验',
  '路线攻略',
  '装备评测',
  '摄影分享',
  '其他',
];

export const HOME_ROUTES: RouteItem[] = [
  { id: 1, name: '四姑娘山大峰', region: '四川', difficulty: '中级', description: '入门级雪山攀登，体验征服5025米的成就感', distance: 28.72, duration: '2天', rating: 4.8, image: '/img/四姑娘山.jpg', postId: 1 },
  { id: 2, name: '虎跳峡高路徒步', region: '云南', difficulty: '中级', description: '世界十大经典徒步路线，金沙江峡谷震撼体验', distance: 20.71, duration: '2天', rating: 4.9, image: '/img/虎跳峡.jpg', postId: 2 },
  { id: 3, name: '稻城亚丁徒步', region: '四川', difficulty: '中级', description: '最后的香格里拉，三神山神圣之旅', distance: 45, duration: '4天', rating: 4.9, image: '/img/routes/yading-butu.webp', postId: 5 },
  { id: 4, name: '喀纳斯环线', region: '新疆', difficulty: '中级', description: '北疆最美秋色，禾木-白哈巴-喀纳斯', distance: 60, duration: '5天', rating: 4.8, image: '/img/喀纳斯.jpg', postId: 7 },
  { id: 5, name: '雨崩村徒步', region: '云南', difficulty: '初级', description: '梅里雪山脚下的世外桃源，藏族村落体验', distance: 20, duration: '3天', rating: 4.7, image: '/img/routes/yubeng-cun.webp', postId: 6 },
  { id: 6, name: '黄山徒步', region: '安徽', difficulty: '初级', description: '中国山水之美典范，奇松怪石云海温泉', distance: 23.81, duration: '2天', rating: 4.6, image: '/img/routes/huangshan.webp', postId: 9 },
];

export const GEAR_ITEMS: GearItem[] = [
  { id: 1, name: 'Osprey 小鹰 65L 背包', category: '背包', desc: '经典重装徒步背包，背负系统出色，适合3-5天徒步', image: '/img/背包.webp' },
  { id: 2, name: 'Salomon X Ultra 4 徒步鞋', category: '鞋履', desc: '轻量防滑徒步鞋，Vibram大底抓地力优秀', image: '/img/鞋履.jpg' },
  { id: 3, name: 'Patagonia 三层穿衣法套装', category: '服装', desc: '防水透气外层 + 保暖中层 + 速干内层', image: '/img/服装.jpg' },
  { id: 4, name: 'MSR Hubba Hubba 帐篷', category: '露营', desc: '双人轻量化帐篷，重量仅1.5kg，搭建便捷', image: '/img/露营.webp' },
  { id: 5, name: 'Garmin inReach Mini 2', category: '导航', desc: '卫星通信设备，无信号区域也能保持联系', image: '/img/导航.jpg' },
  { id: 6, name: 'Snow Peak 钛杯套装', category: '其他配件', desc: '超轻钛合金杯具，户外用餐好伴侣', image: '/img/其他装备.jpg' },
];