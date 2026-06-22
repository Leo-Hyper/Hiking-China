<template>
  <div class="min-h-screen bg-[#fafaf9]">
    <!-- 加载中 -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
    </div>

    <!-- 用户不存在 -->
    <div v-else-if="!profileUser" class="text-center py-20">
      <p class="text-slate-500 text-lg">用户不存在</p>
      <RouterLink to="/forum" class="inline-flex mt-4 px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl">返回论坛</RouterLink>
    </div>

    <!-- 用户主页 -->
    <div v-else class="max-w-3xl mx-auto px-6 lg:px-8 py-12">
      <!-- 用户信息卡片 -->
      <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
        <div class="flex flex-col items-center text-center">
          <img v-if="profileUser.avatar" :src="profileUser.avatar"
               class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4" alt="" />
          <div v-else class="w-24 h-24 rounded-full bg-gradient-to-br from-forest-500 to-forest-400 flex items-center justify-center text-white font-bold text-4xl shadow-lg mb-4">
            {{ profileUser.username?.charAt(0)?.toUpperCase() || '?' }}
          </div>

          <h1 class="text-2xl font-bold text-charcoal mb-1">{{ profileUser.username }}</h1>
          <span v-if="profileLevel" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-xs font-medium mb-2"
                :class="levelClass">{{ profileLevel }}</span>
          <p v-if="profileUser.bio" class="text-sm text-slate-500 mb-4 max-w-md">{{ profileUser.bio }}</p>
          <p v-else class="text-sm text-slate-400 mb-2">这个人很懒，什么都没写...</p>
          <p v-if="profileUser.location" class="text-xs text-slate-400 mb-4">{{ profileUser.location }}</p>
          <p v-else class="mb-4"></p>

          <div v-if="profileGear.length > 0" class="flex flex-wrap justify-center gap-1.5 mb-3">
            <span v-for="g in profileGear" :key="g" class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">{{ g }}</span>
          </div>
          <div class="text-xs text-slate-400 mb-4">
            加入于 {{ formatDate(profileUser.created_at) }}
          </div>

          <!-- 统计 -->
          <div class="flex items-center gap-8 mb-6">
            <div class="text-center">
              <div class="text-lg font-bold text-charcoal">{{ profileUser.post_count || 0 }}</div>
              <div class="text-xs text-slate-400">帖子</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-charcoal">{{ profileUser.followers_count || 0 }}</div>
              <div class="text-xs text-slate-400">粉丝</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-charcoal">{{ profileUser.following_count || 0 }}</div>
              <div class="text-xs text-slate-400">关注</div>
            </div>
          </div>

          <!-- 关注按钮（不给自己显示） -->
          <button v-if="isLoggedIn && currentUser && currentUser.id !== profileUser.id"
                  @click="toggleFollow"
                  :disabled="followLoading"
                  class="px-8 py-2.5 text-sm font-medium rounded-xl transition-all"
                  :class="isFollowingUser
                    ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 border border-slate-200'
                    : 'bg-forest-600 text-white hover:bg-forest-700 shadow-lg shadow-forest-500/20'">
            {{ followLoading ? '...' : (isFollowingUser ? '已关注' : '+ 关注') }}
          </button>

          <RouterLink v-if="isLoggedIn && currentUser && currentUser.id === profileUser.id"
                      to="/profile"
                      class="px-8 py-2.5 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
            编辑个人资料
          </RouterLink>
        </div>
      </div>

      <!-- 用户帖子 -->
      <div>
        <h2 class="text-lg font-bold text-charcoal mb-4">{{ profileUser.username }} 发布的帖子</h2>

        <div v-if="userPostsLoading" class="text-center py-10">
          <div class="inline-block w-6 h-6 border-3 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
        </div>

        <div v-else-if="userPosts.length === 0" class="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <p class="text-slate-500">暂无帖子</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="post in userPosts" :key="post.id">
            <PostCard :post="formatPost(post)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'
import PostCard from '../components/PostCard.vue'

const route = useRoute()
const { isLoggedIn, user: authUser } = useAuth()
const currentUser = computed(() => authUser.value)

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

const userId = computed(() => parseInt(route.params.id))

const loading = ref(true)
const profileUser = ref(null)
const userPosts = ref([])
const userPostsLoading = ref(true)
const isFollowingUser = ref(false)
const followLoading = ref(false)

const profileLevel = computed(() => {
  const lv = profileUser.value?.hikinglevel || 0;
  return ['', '新手', '进阶', '资深'][lv] || '';
});
const levelClass = computed(() => {
  const lv = profileUser.value?.hikinglevel || 0;
  return ['', 'bg-green-500', 'bg-blue-500', 'bg-orange-500'][lv] || '';
});
const profileGear = computed(() => {
  try {
    const gp = profileUser.value?.gear_prefs;
    return typeof gp === 'string' ? JSON.parse(gp) : (Array.isArray(gp) ? gp : []);
  } catch { return []; }
});

async function loadProfile() {
  loading.value = true
  profileUser.value = null
  try {
    const res = await fetch(`${API_URL}/api/auth/users/${userId.value}`)
    if (res.ok) {
      const data = await res.json()
      profileUser.value = data.user
    }
  } catch {}
  loading.value = false
}

async function loadUserPosts() {
  userPostsLoading.value = true
  try {
    const res = await fetch(`${API_URL}/api/posts/user/${userId.value}?limit=50`)
    if (res.ok) {
      const data = await res.json()
      userPosts.value = data.posts || []
    }
  } catch {}
  userPostsLoading.value = false
}

async function checkFollowStatus() {
  if (!isLoggedIn.value || !currentUser.value || currentUser.value.id === userId.value) return
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/api/follow/check/${userId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      isFollowingUser.value = data.following
    }
  } catch {}
}

async function toggleFollow() {
  if (!isLoggedIn.value) return
  followLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/api/follow/toggle/${userId.value}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      isFollowingUser.value = data.following
      // 更新粉丝数
      if (profileUser.value) {
        profileUser.value.followers_count += data.following ? 1 : -1
      }
    }
  } catch {}
  followLoading.value = false
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatPost(p) {
  const tags = typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (Array.isArray(p.tags) ? p.tags : [])
  let images = []
  try { images = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (Array.isArray(p.image_urls) ? p.image_urls : []) } catch { images = [] }
  if (!Array.isArray(images)) images = []
  images = images.map(img => img.startsWith('http') ? img : `${API_URL}${img}`)
  const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
  return {
    id: p.id,
    title: p.title,
    excerpt: stripHtml(p.content).substring(0, 150) + (stripHtml(p.content).length > 150 ? '...' : ''),
    author: p.username || '匿名',
    date: p.created_at ? p.created_at.split('T')[0] : '',
    category: p.category || '其他',
    image: images[0] || '/img/徒步装备.avif',
    images,
    tags,
    views: p.views || 0,
    comments: 0,
  }
}

watch(() => route.params.id, () => {
  loadProfile()
  loadUserPosts()
  checkFollowStatus()
})

onMounted(() => {
  loadProfile()
  loadUserPosts()
  checkFollowStatus()
})
</script>
