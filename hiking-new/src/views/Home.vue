<template>
  <div>
    <Hero />

    <!-- 精选帖子 -->
    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <div class="flex items-end justify-between mb-12">
        <div>
          <div class="accent-line mb-4" />
          <h2 class="text-3xl md:text-4xl font-bold text-charcoal">最新精选</h2>
        </div>
        <RouterLink to="/forum" class="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-800 transition-colors">
          查看全部
          <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </RouterLink>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
      </div>

      <!-- 帖子列表 -->
      <div v-else class="space-y-6">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && posts.length === 0" class="text-center py-12 bg-white rounded-2xl border border-slate-100">
        <p class="text-slate-500">暂无帖子</p>
      </div>
    </section>

    <!-- 热门路线 -->
    <section class="bg-white py-20">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="flex items-end justify-between mb-12">
          <div>
            <div class="accent-line mb-4" />
            <h2 class="text-3xl md:text-4xl font-bold text-charcoal">热门路线</h2>
          </div>
          <RouterLink to="/routes" class="group inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-800 transition-colors">
            探索更多
            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RouteCard v-for="route in routes" :key="route.id" :route-data="route" />
        </div>
      </div>
    </section>

    <!-- CTA 区域 -->
    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <div class="relative rounded-[2rem] overflow-hidden">
        <div class="absolute inset-0">
          <img src="/img/云蒙山.jpg" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-charcoal/60" />
        </div>
        <div class="relative px-8 py-20 md:px-16 md:py-28 text-center">
          <h2 class="text-3xl md:text-5xl font-bold text-white mb-4"
              style="font-family: 'Noto Serif SC', serif;">
            准备好出发了吗？
          </h2>
          <p class="text-white/70 max-w-lg mx-auto mb-8 text-lg">
            加入数万名徒步爱好者，发现属于你的下一段旅程
          </p>
          <div class="flex flex-wrap gap-4 justify-center">
            <RouterLink to="/routes" class="px-8 py-4 bg-white text-charcoal font-semibold rounded-2xl hover:bg-forest-50 transition-all shadow-xl">
              查看路线
            </RouterLink>
            <RouterLink to="/forum" class="px-8 py-4 border border-white/30 text-white font-medium rounded-2xl hover:bg-white/10 transition-all">
              加入社区
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Hero from '@/components/Hero.vue'
import PostCard from '@/components/PostCard.vue'
import RouteCard from '@/components/RouteCard.vue'

const posts = ref([])
const loading = ref(true)

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")

async function loadPosts() {
  try {
    const res = await fetch(`${API_URL}/api/posts?limit=5`)
    const data = await res.json()
    posts.value = (data.posts || []).map(p => {
      const images = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (Array.isArray(p.image_urls) ? p.image_urls : [])
      const tags = typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (Array.isArray(p.tags) ? p.tags : [])
      const date = p.created_at ? p.created_at.split('T')[0] : ''
      return {
        id: p.id,
        title: p.title,
        excerpt: (p.content || '').substring(0, 150) + '...',
        author: p.username || '匿名',
        date,
        category: p.category || '其他',
        image: images[0] || '/img/徒步装备.avif',
        images,
        tags,
        views: p.views || 0,
        comments: 0,
      }
    })
  } catch {
    // API 失败，不显示帖子
  } finally {
    loading.value = false
  }
}

const routes = [
  { id: 1, name: '四姑娘山大峰', region: '四川', difficulty: '中级', description: '入门级雪山攀登，体验征服5025米的成就感', distance: 28, duration: '2天', rating: 4.8, image: '/img/四姑娘山.jpg' },
  { id: 2, name: '虎跳峡高路徒步', region: '云南', difficulty: '中级', description: '世界十大经典徒步路线，金沙江峡谷震撼体验', distance: 25, duration: '2天', rating: 4.9, image: '/img/虎跳峡.jpg' },
  { id: 3, name: '稻城亚丁徒步', region: '四川', difficulty: '中级', description: '最后的香格里拉，三神山神圣之旅', distance: 45, duration: '4天', rating: 4.9, image: '/img/稻城亚丁.jpg' },
  { id: 4, name: '喀纳斯环线', region: '新疆', difficulty: '中级', description: '北疆最美秋色，禾木-白哈巴-喀纳斯', distance: 60, duration: '5天', rating: 4.8, image: '/img/喀纳斯.jpg' },
  { id: 5, name: '雨崩村徒步', region: '云南', difficulty: '初级', description: '梅里雪山脚下的世外桃源，藏族村落体验', distance: 20, duration: '3天', rating: 4.7, image: '/img/雨崩村.webp' },
  { id: 6, name: '黄山徒步', region: '安徽', difficulty: '初级', description: '中国山水之美典范，奇松怪石云海温泉', distance: 15, duration: '2天', rating: 4.6, image: '/img/黄山.jpg' },
]

onMounted(() => loadPosts())
</script>

