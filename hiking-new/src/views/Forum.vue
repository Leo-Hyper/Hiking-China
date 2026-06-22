<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16">
    <div class="flex items-center justify-between mb-12">
      <div>
        <div class="accent-line mb-4" />
        <h1 class="text-4xl md:text-5xl font-bold text-charcoal mb-3" style="font-family: 'Noto Serif SC', serif;">徒步论坛</h1>
        <p class="text-lg text-slate-500">与徒步爱好者们分享经验、交流心得</p>
      </div>
      <RouterLink v-if="isLoggedIn" to="/publish"
        class="hidden sm:inline-flex items-center px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all shadow-lg shadow-forest-500/20">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        发帖
      </RouterLink>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="searchQuery" @input="onSearchInput" placeholder="搜索帖子标题、内容或标签..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
        <button v-if="searchQuery" @click="clearSearch" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">&times;</button>
      </div>
      <p v-if="searchQuery" class="text-xs text-slate-400 mt-1">搜索 "{{ searchQuery }}" 的结果</p>
    </div>

    <!-- 分类 Tabs -->
    <div class="flex gap-2 mb-10 overflow-x-auto pb-2">
      <button @click="activeCategory = ''"
        class="px-5 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-colors"
        :class="activeCategory === '' ? 'bg-charcoal text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'">
        全部
      </button>
      <button v-for="cat in categories" :key="cat" @click="activeCategory = cat"
        class="px-5 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-colors"
        :class="activeCategory === cat ? 'bg-charcoal text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'">
        {{ cat }}
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
      <p class="text-slate-400 mt-4">加载中...</p>
    </div>

    <!-- 帖子列表 -->
    <div v-else-if="posts.length > 0" class="space-y-6">
      <PostCard v-for="post in posts" :key="post.id" :post="formatPost(post)" />
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-20 bg-white rounded-2xl border border-slate-100">
      <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
      <p class="text-slate-500 mb-4">{{ activeCategory ? '该分类下暂无帖子' : (searchQuery ? '没有找到与 "' + searchQuery + '" 相关的帖子' : '还没有帖子，快来发第一篇吧！') }}</p>
      <RouterLink v-if="isLoggedIn" to="/publish" class="inline-flex px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all">
        立即发帖
      </RouterLink>
      <RouterLink v-else to="/login" class="inline-flex px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all">
        登录后发帖
      </RouterLink>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="text-center mt-10">
      <button @click="loadMore" :disabled="loadingMore"
        class="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import PostCard from '@/components/PostCard.vue'

const categories = ['登山经验', '路线攻略', '装备评测', '摄影分享', '户外活动']
const activeCategory = ref('')
const posts = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const limit = 20
const offset = ref(0)
const hasMore = ref(true)

const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const route = useRoute()
const router = useRouter()
const searchQuery = ref('')

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")

async function fetchPosts(cat = '', sq = '', off = 0) {
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(off) })
    if (cat) params.set('category', cat)
    if (sq) params.set('q', sq)
    const res = await fetch(`${API_URL}/api/posts?${params}`)
    const data = await res.json()
    return data.posts || []
  } catch {
    return []
  }
}

function formatPost(p) {
  const tags = typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (Array.isArray(p.tags) ? p.tags : [])
  let images = []
  try { images = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (Array.isArray(p.image_urls) ? p.image_urls : []) } catch { images = [] }
  if (!Array.isArray(images)) images = []
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")
  images = images.map(img => { if (img.startsWith('http')) return img; if (img.startsWith('/uploads/')) return `${API_URL}${img}`; return img })
  const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
  const excerptText = stripHtml(p.content).substring(0, 150)
  return {
    id: p.id,
    title: p.title,
    excerpt: excerptText + (stripHtml(p.content).length > 150 ? '...' : ''),
    author: p.username || '匿名',
    authorId: p.user_id,
    date: p.created_at ? p.created_at.split('T')[0] : '',
    category: p.category || '其他',
    image: images[0] || '/img/徒步装备.avif',
    images,
    tags,
    views: p.views || 0,
    comments: 0,
  }
}

async function loadPosts() {
  loading.value = true
  offset.value = 0
  const data = await fetchPosts(activeCategory.value, searchQuery.value, 0)
  posts.value = data
  hasMore.value = data.length >= limit
  loading.value = false
}

async function loadMore() {
  loadingMore.value = true
  offset.value += limit
  const data = await fetchPosts(activeCategory.value, searchQuery.value, offset.value)
  if (data.length > 0) {
    posts.value = [...posts.value, ...data]
    hasMore.value = data.length >= limit
  } else {
    hasMore.value = false
  }
  loadingMore.value = false
}

// 监听分类切换

watch(activeCategory, () => { searchQuery.value = ''; loadPosts() })

function onSearchInput() {
  loadPosts()
}

function clearSearch() {
  searchQuery.value = ''
  loadPosts()
}

onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q
  }
  loadPosts()
})
</script>
