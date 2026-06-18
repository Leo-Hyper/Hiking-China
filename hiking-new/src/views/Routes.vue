<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16">
    <!-- Header -->
    <div class="mb-12">
      <div class="accent-line mb-4" />
      <h1 class="text-4xl md:text-5xl font-bold text-charcoal mb-3" style="font-family: 'Noto Serif SC', serif;">
        徒步路线
      </h1>
      <p class="text-lg text-slate-500 max-w-2xl">从中国的最北端到最西南，探索每一条被大自然眷顾的路径</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-10 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <select v-model="filters.region" class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 outline-none transition-all">
        <option value="">全部地区</option>
        <option value="四川">四川</option>
        <option value="云南">云南</option>
        <option value="西藏">西藏</option>
        <option value="新疆">新疆</option>
        <option value="安徽">安徽</option>
      </select>
      <select v-model="filters.difficulty" class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 outline-none transition-all">
        <option value="">全部难度</option>
        <option value="初级">初级</option>
        <option value="中级">中级</option>
        <option value="高级">高级</option>
      </select>
      <button @click="resetFilters" class="px-5 py-2.5 text-slate-500 hover:text-charcoal text-sm font-medium transition-colors">
        重置
      </button>
    </div>

    <!-- Route Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouteCard v-for="route in filteredRoutes" :key="route.id" :route-data="route" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RouteCard from '@/components/RouteCard.vue'

const filters = ref({ region: '', difficulty: '' })

const routes = ref([
  { id: 1, name: '四姑娘山大峰', region: '四川', difficulty: '中级', description: '入门级雪山攀登，体验征服5025米的成就感', distance: 28, duration: '2天', rating: 4.8, image: '/img/四姑娘山.jpg' },
  { id: 2, name: '虎跳峡高路徒步', region: '云南', difficulty: '中级', description: '世界十大经典徒步路线，金沙江峡谷震撼体验', distance: 25, duration: '2天', rating: 4.9, image: '/img/虎跳峡.jpg' },
  { id: 3, name: '雨崩村徒步', region: '云南', difficulty: '初级', description: '梅里雪山脚下的世外桃源，藏族村落体验', distance: 20, duration: '3天', rating: 4.7, image: '/img/雨崩村.webp' },
  { id: 4, name: '贡嘎大环线', region: '四川', difficulty: '高级', description: '蜀山之王挑战，全程约85公里重装线路', distance: 85, duration: '6天', rating: 5.0, image: '/img/贡嘎转山.png' },
  { id: 5, name: '稻城亚丁长线', region: '四川', difficulty: '中级', description: '最后的香格里拉，三神山神圣之旅', distance: 45, duration: '4天', rating: 4.9, image: '/img/稻城亚丁.jpg' },
  { id: 6, name: '喀纳斯环线', region: '新疆', difficulty: '中级', description: '北疆最美秋色，禾木-白哈巴-喀纳斯', distance: 60, duration: '5天', rating: 4.8, image: '/img/喀纳斯.jpg' },
  { id: 7, name: '黄山徒步', region: '安徽', difficulty: '初级', description: '奇松怪石云海温泉，中国山水之美典范', distance: 15, duration: '2天', rating: 4.6, image: '/img/黄山.jpg' },
  { id: 8, name: '墨脱徒步', region: '西藏', difficulty: '高级', description: '中国最神秘的徒步路线，莲花秘境挑战', distance: 120, duration: '8天', rating: 5.0, image: '/img/墨脱.jpg' },
  { id: 9, name: '张家界徒步', region: '湖南', difficulty: '中级', description: '三千奇峰拔地起，玻璃栈道心跳体验', distance: 35, duration: '3天', rating: 4.7, image: '/img/张家界.png' },
])

const filteredRoutes = computed(() => {
  return routes.value.filter(r =>
    (!filters.value.region || r.region === filters.value.region) &&
    (!filters.value.difficulty || r.difficulty === filters.value.difficulty)
  )
})

const resetFilters = () => { filters.value = { region: '', difficulty: '' } }
</script>
