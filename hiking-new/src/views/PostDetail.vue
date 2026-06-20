<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-8 py-16">
    <RouterLink to="/forum" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-charcoal transition-colors mb-8 group">
      <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      返回首页
    </RouterLink>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20">
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
      <!-- 头部信息 -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-xs font-medium text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full">{{ post.category }}</span>
          <span class="text-xs text-slate-400">{{ post.date }}</span>
          <span class="text-xs text-slate-400">· 作者 {{ post.author }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal leading-tight mb-6" style="font-family: 'Noto Serif SC', serif;">{{ post.title }}</h1>
        <div class="flex items-center gap-6 text-sm text-slate-500">
          <span>{{ post.views }} 阅读</span>
          <span>{{ comments.length }} 评论</span>
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
      <div class="prose prose-lg max-w-none text-slate-700 leading-loose mb-10" v-html="post.bodyHtml" />

      <!-- 标签 -->
      <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2 mb-10 pb-8 border-t border-slate-200">
        <RouterLink v-for="tag in post.tags" :key="tag" :to="`/forum?q=${encodeURIComponent(tag)}`"
          class="px-3 py-1.5 bg-forest-50 text-forest-700 text-xs rounded-full font-medium hover:bg-forest-100 transition-colors"># {{ tag }}</RouterLink>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-4 mb-12 pb-8 border-b border-slate-200">
        <button @click="toggleLike" class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all"
                :class="isLiked ? 'text-red-500 bg-red-50' : 'text-slate-500'">
          <svg class="w-5 h-5" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span class="text-sm font-medium">{{ post.likes || 0 }}</span>
        </button>
        <button @click="toggleFavorite" class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all"
                :class="isFavorited ? 'text-amber-500 bg-amber-50' : 'text-slate-500'">
          <svg class="w-5 h-5" :fill="isFavorited ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
          <span class="text-sm font-medium">{{ isFavorited ? '已收藏' : '收藏' }}</span>
        </button>
        <button @click="sharePost" class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          <span class="text-sm font-medium">分享</span>
        </button>
      </div>

      <!-- 评论区 -->
      <div class="mt-12">
        <h3 class="text-xl font-bold text-charcoal mb-6">评论 ({{ comments.length }})</h3>

        <!-- 发表评论 -->
        <div v-if="isLoggedIn" class="flex gap-3 mb-10">
          <div class="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold flex-shrink-0">
            {{ currentUser?.username?.charAt(0) || '?' }}
          </div>
          <div class="flex-1">
            <textarea v-model="newComment" rows="3" placeholder="写下你的想法..."
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none text-sm"
              @keydown.enter.ctrl.exact.prevent
              @keydown.enter.shift.exact.stop
              @keydown.enter.exact="submitComment"
            ></textarea>
            <div class="flex justify-end mt-2">
              <button @click="submitComment" :disabled="!newComment.trim() || submitting"
                class="px-5 py-2 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {{ submitting ? '发布中...' : '发表评论' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="mb-10 p-6 bg-slate-50 rounded-2xl text-center">
          <p class="text-slate-500 mb-3">登录后即可评论</p>
          <RouterLink to="/login" class="inline-flex px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all">
            去登录
          </RouterLink>
        </div>

        <!-- 评论列表 -->
        <div class="space-y-6">
          <component :is="CommentItemComponent" v-for="comment in comments" :key="comment.id" :comment="comment" :post-id="postId" @updated="loadComments" />
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && comments.length === 0" class="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p class="text-slate-500">暂无评论，来抢沙发吧！</p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'
const CommentItemComponent = defineAsyncComponent(() => import("../components/CommentItem.vue"))

const route = useRoute()
const router = useRouter()
const postId = computed(() => parseInt(route.params.id))
const { isLoggedIn, user: authUser, token } = useAuth()
const currentUser = computed(() => authUser.value)

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const newComment = ref('')
const submitting = ref(false)
const isLiked = ref(false)
const isFavorited = ref(false)

// 加载帖子
async function loadPost() {
  loading.value = true
  post.value = null
  try {
    const res = await fetch(`${API_URL}/api/posts/${postId.value}`)
    if (res.ok) {
      const data = await res.json()
      if (data.post) {
        const p = data.post
        let images = []
        try { images = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (Array.isArray(p.image_urls) ? p.image_urls : []) } catch { images = [] }
        if (!Array.isArray(images)) images = []
        let tags = []
        try { tags = typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (Array.isArray(p.tags) ? p.tags : []) } catch { tags = [] }
        const date = p.created_at ? new Date(p.created_at).toLocaleDateString('zh-CN') : ''
        post.value = {
          id: p.id,
          title: p.title,
          category: p.category,
          date,
          author: p.username || '匿名用户',
          views: p.views || 0,
          comments: 0,
          likes: 0,
          image: images[0] || '',
          images,
          tags,
          bodyHtml: p.content,
        }
        loading.value = false
        return
      }
    }
  } catch (err) {
    console.error('[PostDetail] loadPost error:', err)
  }
  loading.value = false
  post.value = null
}

// 加载评论
async function loadComments() {
  try {
    const res = await fetch(`${API_URL}/api/comments?post_id=${postId.value}`)
    if (res.ok) {
      const data = await res.json()
      comments.value = data.comments || []
    }
  } catch {}
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim()) return
  submitting.value = true
  try {
    const res = await fetch(`${API_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        post_id: postId.value,
        content: newComment.value.trim(),
      }),
    })
    if (res.ok) {
      newComment.value = ''
      await loadComments()
    } else {
      const data = await res.json()
      alert(data.error || '评论失败')
    }
  } catch {
    alert('网络错误')
  } finally {
    submitting.value = false
  }
}

// 点赞
function toggleLike() {
  if (!isLoggedIn.value) { router.push('/login'); return }
  isLiked.value = !isLiked.value
  post.value.likes = (post.value.likes || 0) + (isLiked.value ? 1 : -1)
}

// 收藏
function toggleFavorite() {
  if (!isLoggedIn.value) { router.push('/login'); return }
  isFavorited.value = !isFavorited.value
}

// 分享
function sharePost() {
  const url = window.location.href
  if (navigator.share) {
    navigator.share({ title: post.value?.title, url })
  } else {
    navigator.clipboard.writeText(url).then(() => alert('链接已复制到剪贴板')).catch(() => alert('分享链接：' + url))
  }
}

// 监听路由变化
watch(() => route.params.id, () => {
  post.value = null
  comments.value = []
  loadPost()
  loadComments()
})

const postNotExists = computed(() => !loading.value && !post.value)

onMounted(() => {
  loadPost()
  loadComments()
})
</script>
