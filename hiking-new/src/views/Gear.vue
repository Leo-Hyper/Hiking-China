<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16">
    <div class="mb-12">
      <div class="accent-line mb-4" />
      <h1 class="text-4xl md:text-5xl font-bold text-charcoal mb-3" style="font-family: 'Noto Serif SC', serif;">装备指南</h1>
      <p class="text-lg text-slate-500">专业的徒步装备推荐与评测，助你轻装上阵</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="item in gearItems" :key="item.id" class="magazine-card group block p-5">
        <div class="img-container h-52 mb-5 rounded-xl overflow-hidden">
          <img :src="item.image" :alt="item.name" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <span class="text-xs font-medium text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full">{{ item.category }}</span>
        <h3 class="font-bold text-charcoal mt-3 mb-2 text-lg">{{ item.name }}</h3>
        <p class="text-sm text-slate-500 line-clamp-2 leading-relaxed">{{ item.desc }}</p>
        <div class="mt-4 text-sm text-forest-700 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          查看详情
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const gearItems = [
  { id: 1, name: 'Osprey 小鹰 65L 背包', category: '背包', desc: '经典重装徒步背包，背负系统出色，适合3-5天徒步', image: '/img/背包.webp' },
  { id: 2, name: 'Salomon X Ultra 4 徒步鞋', category: '鞋履', desc: '轻量防滑徒步鞋，Vibram大底抓地力优秀', image: '/img/鞋履.jpg' },
  { id: 3, name: 'Patagonia 三层穿衣法套装', category: '服装', desc: '防水透气外层 + 保暖中层 + 速干内层', image: '/img/服装.jpg' },
  { id: 4, name: 'MSR Hubba Hubba 帐篷', category: '露营', desc: '双人轻量化帐篷，重量仅1.5kg，搭建便捷', image: '/img/露营.webp' },
  { id: 5, name: 'Garmin inReach Mini 2', category: '导航', desc: '卫星通信设备，无信号区域也能保持联系', image: '/img/导航.jpg' },
  { id: 6, name: 'Snow Peak 钛杯套装', category: '其他配件', desc: '超轻钛合金杯具，户外用餐好伴侣', image: '/img/其他装备.jpg' },
]
</script>
