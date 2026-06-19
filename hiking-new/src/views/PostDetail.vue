<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-8 py-16">
    <RouterLink to="/forum" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-charcoal transition-colors mb-8 group">
      <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      返回首页
    </RouterLink>

    <!-- 加载中 -->
    <div v-if="!post" class="text-center py-20">
      <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
      <p class="text-slate-400 mt-4">帖子加载中...</p>
    </div>

    <!-- 帖子不存在 -->
    <div v-else-if="postNotExists" class="text-center py-20 bg-white rounded-2xl border border-slate-100">
      <p class="text-slate-500 text-lg">帖子不存在或已被删除</p>
      <RouterLink to="/forum" class="inline-flex mt-6 px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all">
        返回论坛
      </RouterLink>
    </div>

    <!-- 帖子内容 -->
    <article v-else class="max-w-4xl mx-auto">
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-xs font-medium text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full">{{ post.category }}</span>
          <span class="text-xs text-slate-400">{{ post.date }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal leading-tight mb-6" style="font-family: 'Noto Serif SC', serif;">{{ post.title }}</h1>
        <div class="flex items-center gap-6 text-sm text-slate-500">
          <span>{{ post.author }}</span>
          <span>{{ post.views }} 阅读</span>
          <span>{{ post.comments }} 评论</span>
        </div>
      </div>

      <!-- 封面图 -->
      <div v-if="post.image" class="rounded-3xl overflow-hidden mb-10 img-container aspect-21/9">
        <img :src="post.image" :alt="post.title" class="w-full h-full object-cover" loading="eager" />
      </div>

      <!-- 多图画廊 -->
      <div v-else-if="post.images && post.images.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <img v-for="(img, i) in post.images" :key="i" :src="img" :alt="`${post.title} ${i+1}`"
             class="w-full h-64 object-cover rounded-2xl" />
      </div>

      <!-- 正文 -->
      <div class="prose prose-lg max-w-none text-slate-700 leading-loose" v-html="post.bodyHtml" />

      <!-- 标签 -->
      <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-200">
        <span v-for="tag in post.tags" :key="tag" class="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium"># {{ tag }}</span>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { postContents } from '@/data/postContent.js'

const route = useRoute()
const postId = parseInt(route.params.id)

const apiPost = ref(null)
const apiLoading = ref(true)

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")

// 从 API 加载帖子
async function loadApiPost() {
  try {
    const res = await fetch(`${API_URL}/api/posts/${postId}`)
    if (res.ok) {
      const data = await res.json()
      if (data.post) {
        apiPost.value = data.post
        return true
      }
    }
  } catch {
    // API 失败，fallback 到静态数据
  }
  return false
}

// 静态帖子数据
const postMap = {
  1: { key: "四姑娘山", title: "四姑娘山大峰攀登全记录", category: "登山经验", date: "2024-01-15", author: "山野行者", views: 1256, tags: ["雪山","入门级"] },
  2: { key: "虎跳峡", title: "虎跳峡高路徒步", category: "徒步路线", date: "2024-01-12", author: "江河漫步", views: 987, tags: ["云南","经典路线"] },
  3: { key: "秋季徒步装备指南", title: "秋季徒步装备指南", category: "装备评测", date: "2024-01-08", author: "装备控", views: 1542, tags: ["秋季","装备"] },
  4: { key: "贡嘎转山", title: "贡嘎转山", category: "登山经验", date: "2024-01-05", author: "高原狼", views: 892, tags: ["贡嘎","重装"] },
  5: { key: "稻城亚丁徒步", title: "稻城亚丁徒步", category: "徒步路线", date: "2024-01-03", author: "香格里拉", views: 1103, tags: ["稻城亚丁"] },
  6: { key: "雨崩村徒步", title: "雨崩村徒步", category: "徒步路线", date: "2024-01-01", author: "雪山飞狐", views: 756, tags: ["雨崩","梅里雪山"] },
  7: { key: "喀纳斯徒步", title: "喀纳斯徒步", category: "徒步路线", date: "2023-12-28", author: "北疆行者", views: 1321, tags: ["喀纳斯","新疆"] },
  8: { key: "墨脱徒步", title: "墨脱徒步", category: "徒步路线", date: "2023-12-25", author: "秘境探索者", views: 645, tags: ["墨脱","西藏"] },
  9: { key: "黄山徒步", title: "黄山徒步", category: "徒步路线", date: "2023-12-20", author: "安徽行者", views: 890, tags: ["黄山","安徽"] },
  10: { key: "露营装备", title: "徒步露营装备指南", category: "装备评测", date: "2023-12-18", author: "露营达人", views: 1050, tags: ["露营","帐篷"] },
  11: { key: "徒步鞋履", title: "徒步鞋履指南", category: "装备评测", date: "2023-12-15", author: "鞋控", views: 780, tags: ["鞋履","选购"] },
  12: { key: "服装系统", title: "徒步服装系统指南", category: "装备评测", date: "2023-12-12", author: "装备控", views: 920, tags: ["服装","分层"] },
  13: { key: "导航与安全", title: "徒步导航与安全装备", category: "装备评测", date: "2023-12-10", author: "安全队长", views: 660, tags: ["导航","安全"] },
  14: { key: "背包装备", title: "徒步背包装备指南", category: "装备评测", date: "2023-12-08", author: "背包客", views: 840, tags: ["背包","重装"] },
  15: { key: "其他配件", title: "徒步其他配件指南", category: "装备评测", date: "2023-12-05", author: "装备控", views: 530, tags: ["配件","小物"] },
}

const post = computed(() => {
  // 优先使用 API 数据
  if (apiPost.value) {
    const p = apiPost.value
    const images = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (Array.isArray(p.image_urls) ? p.image_urls : [])
    const tags = typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (Array.isArray(p.tags) ? p.tags : [])
    const date = p.created_at ? p.created_at.split('T')[0] : ''
    return {
      title: p.title,
      category: p.category,
      date,
      author: p.username || '匿名用户',
      views: p.views || 0,
      comments: 0,
      image: images[0] || '',
      images,
      tags,
      bodyHtml: p.content,
    }
  }

  // Fallback 到静态数据
  const meta = postMap[postId]
  if (!meta) return null

  const content = postContents[meta.key]
  let bodyHtml = content ? content.html : "<p>内容加载中...</p>"
  const bodyMatch = bodyHtml.match(/<body[^>]*>([\s\S]*)<\/body>/)
  if (bodyMatch) bodyHtml = bodyMatch[1]
  bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '')
  bodyHtml = bodyHtml.replace(/class="post-detail"/g, "class='max-w-4xl mx-auto'")
  bodyHtml = bodyHtml.replace(/class="container"/g, '')

  return {
    ...meta,
    image: content ? content.image : '/img/四姑娘山.jpg',
    tags: meta.tags || [],
    comments: meta.commentList ? meta.commentList.length : 0,
    bodyHtml,
  }
})

const postNotExists = computed(() => !apiLoading.value && !apiPost.value && !post.value)

onMounted(async () => {
  const loaded = await loadApiPost()
  apiLoading.value = false
  if (!loaded) {
    // API 没有数据，使用静态 fallback
    apiLoading.value = false
  }
})
</script>

