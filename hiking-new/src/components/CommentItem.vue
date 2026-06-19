<template>
  <div class="flex gap-3">
    <!-- 头像 -->
    <div class="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-sm flex-shrink-0">
      {{ comment.username?.charAt(0)?.toUpperCase() || '?' }}
    </div>
    <div class="flex-1">
      <!-- 评论头部 -->
      <div class="flex items-center gap-2 mb-1">
        <span class="text-sm font-medium text-charcoal">{{ comment.username || '匿名用户' }}</span>
        <span class="text-xs text-slate-400">{{ formatDate(comment.created_at) }}</span>
      </div>
      <!-- 评论内容 -->
      <div class="text-sm text-slate-700 leading-relaxed mb-2">
        <template v-if="replyTo">
          <span class="text-forest-600 font-medium">@{{ replyTo.username }} </span>
        </template>
        {{ comment.content }}
      </div>

      <!-- 操作栏 -->
      <div class="flex items-center gap-4 text-xs text-slate-400">
        <button @click="handleLike" class="flex items-center gap-1 hover:text-red-500 transition-colors"
                :class="comment.is_liked ? 'text-red-500' : ''">
          <svg class="w-3.5 h-3.5" :fill="comment.is_liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          {{ comment.likes || 0 }}
        </button>
        <button @click="toggleReply" class="hover:text-charcoal transition-colors">
          回复
        </button>
      </div>

      <!-- 回复输入框 -->
      <div v-if="showReplyInput" class="flex gap-2 mt-3 ml-10">
        <div class="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs flex-shrink-0">
          {{ currentUser?.username?.charAt(0) || '?' }}
        </div>
        <div class="flex-1">
          <textarea v-model="replyContent" rows="2" :placeholder="`回复 ${comment.username}...`"
            class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none text-xs"></textarea>
          <div class="flex gap-2 mt-1">
            <button @click="submitReply" :disabled="!replyContent.trim() || replying"
              class="px-3 py-1 bg-forest-600 text-white text-xs font-medium rounded-lg hover:bg-forest-700 transition-all disabled:opacity-50">
              {{ replying ? '发布中...' : '回复' }}
            </button>
            <button @click="showReplyInput = false" class="px-3 py-1 text-slate-400 text-xs hover:text-slate-600">取消</button>
          </div>
        </div>
      </div>

      <!-- 子评论列表 -->
      <div v-if="comment.replies && comment.replies.length" class="mt-4 ml-4 pl-4 border-l-2 border-slate-100 space-y-4">
        <CommentItem v-for="child in comment.replies" :key="child.id" :comment="child" :post-id="postId" :reply-to="comment" @updated="handleUpdated" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../stores/auth'

const props = defineProps({
  comment: { type: Object, required: true },
  postId: { type: Number, required: true },
  replyTo: { type: Object, default: null },
})

const emit = defineEmits(['updated'])
const { isLoggedIn, user: authUser } = useAuth()
const currentUser = computed(() => authUser.value)

const showReplyInput = ref(false)
const replyContent = ref('')
const replying = ref(false)

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function handleLike() {
  if (!isLoggedIn.value) {
    alert('请先登录')
    return
  }
  try {
    const res = await fetch(`${API_URL}/api/comments/${props.comment.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
    if (res.ok) {
      const data = await res.json()
      props.comment.is_liked = data.liked
      props.comment.likes = (props.comment.likes || 0) + (data.liked ? 1 : -1)
    }
  } catch {
    alert('操作失败')
  }
}

function toggleReply() {
  if (!isLoggedIn.value) {
    alert('请先登录')
    return
  }
  showReplyInput.value = !showReplyInput.value
  if (showReplyInput.value) {
    replyContent.value = ''
  }
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  replying.value = true
  try {
    const res = await fetch(`${API_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        post_id: props.postId,
        parent_id: props.comment.id,
        content: replyContent.value.trim(),
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (!props.comment.replies) props.comment.replies = []
      props.comment.replies.push(data.comment)
      replyContent.value = ''
      showReplyInput.value = false
      emit('updated')
    } else {
      const err = await res.json()
      alert(err.error || '回复失败')
    }
  } catch {
    alert('网络错误')
  } finally {
    replying.value = false
  }
}

function handleUpdated() {
  emit('updated')
}
</script>
