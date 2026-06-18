<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16">
    <div class="mb-12">
      <div class="accent-line mb-4" />
      <h1 class="text-4xl md:text-5xl font-bold text-charcoal mb-3" style="font-family: 'Noto Serif SC', serif;">徒步论坛</h1>
      <p class="text-lg text-slate-500">与徒步爱好者们分享经验、交流心得</p>
    </div>

    <!-- Category Tabs -->
    <div class="flex gap-2 mb-10 overflow-x-auto pb-2">
      <button class="px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl whitespace-nowrap">全部</button>
      <button v-for="cat in categories" :key="cat" class="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 whitespace-nowrap transition-colors">{{ cat }}</button>
    </div>

    <div class="space-y-6">
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
  </div>
</template>

<script setup>
import PostCard from '@/components/PostCard.vue'

const categories = ['登山经验', '装备评测', '路线攻略', '摄影分享', '户外技巧']

const posts = [
  { id: 1, title: '四姑娘山大峰攀登全记录', author: '山野行者', date: '2024-01-15', category: '登山经验', excerpt: '四姑娘山大峰海拔5025米，是入门级雪山的绝佳选择...', image: '/img/四姑娘山.jpg', views: 1256, comments: 42 },
  { id: 2, title: '虎跳峡高路徒步攻略分享', author: '江河漫步', date: '2024-01-12', category: '路线攻略', excerpt: '云南虎跳峡高路徒步被誉为世界十大经典徒步路线之一...', image: '/img/虎跳峡.jpg', views: 987, comments: 36 },
  { id: 3, title: '秋季徒步装备完整清单推荐', author: '装备控', date: '2024-01-08', category: '装备评测', excerpt: '秋季是徒步的黄金季节，但天气变化多端，合适的装备至关重要...', image: '/img/徒步装备.avif', views: 1542, comments: 58 },
  { id: 4, title: '贡嘎大环线实测报告', author: '高原狼', date: '2024-01-05', category: '登山经验', excerpt: '贡嘎环线被誉为川西最经典的徒步线路，全程约85公里...', image: '/img/贡嘎转山.png', views: 892, comments: 28 },
  { id: 5, title: '稻城亚丁徒步全攻略', author: '香格里拉', date: '2024-01-03', category: '路线攻略', excerpt: '最后的香格里拉，三神山的神圣之旅，4天环线详细记录...', image: '/img/稻城亚丁.jpg', views: 1103, comments: 45 },
]
</script>
