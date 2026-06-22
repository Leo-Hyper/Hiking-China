<template>
  <div class="comment-item">
    <!-- 评论主体 -->
    <div class="flex gap-3">
      <!-- 头像 -->
      <RouterLink v-if="comment.user_id" :to="`/user/${comment.user_id}`" class="flex-shrink-0">
        <img v-if="comment.avatar" :src="comment.avatar" class="w-9 h-9 rounded-full object-cover" alt="" />
        <div v-else class="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-sm hover:bg-forest-200 transition-colors">
          {{ comment.username?.charAt(0)?.toUpperCase() || '?' }}
        </div>
      </RouterLink>
      <div v-else class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
        ?
      </div>

      <div class="flex-1 min-w-0">
        <!-- 头部 -->
        <div class="flex items-center gap-2 mb-1">
          <RouterLink v-if="comment.user_id" :to="`/user/${comment.user_id}`" class="text-sm font-medium text-charcoal hover:text-forest-600 transition-colors">
            {{ comment.username || '匿名用户' }}
          </RouterLink>
          <span v-else class="text-sm font-medium text-charcoal">{{ comment.username || '匿名用户' }}</span>

          <span v-if="comment.reply_to_username" class="text-xs text-forest-600 font-medium">
            回复 @{{ comment.reply_to_username }}
          </span>

          <span class="text-xs text-slate-400">{{ formatDate(comment.created_at) }}</span>
        </div>

        <!-- 内容 -->
        <div v-if="editingCommentId === comment.id" class="mb-2">
          <textarea v-model="editContent" rows="3" maxlength="2000"
            class="w-full px-3 py-2 rounded-lg border border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none text-sm"
            @keydown.enter.ctrl.exact.prevent="saveEdit(comment)"></textarea>
          <div class="flex items-center gap-2 mt-1.5">
            <button @click="saveEdit(comment)" :disabled="editSaving" class="px-3 py-1 bg-forest-600 text-white text-xs font-medium rounded-lg hover:bg-forest-700 disabled:opacity-50">保存</button>
            <button @click="cancelEdit" class="px-3 py-1 text-xs text-slate-500 hover:text-slate-700">取消</button>
          </div>
        </div>
        <div v-else class="text-sm text-slate-700 leading-relaxed mb-2 whitespace-pre-wrap break-words">
          {{ comment.content }}
        </div>

        <!-- 图片 -->
        <div v-if="comment.image_url" class="mb-2">
          <img :src="comment.image_url"
               class="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-slate-100"
               @click="viewImage = comment.image_url"
               alt="评论图片" />
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
          <template v-if="isCommentAuthor">
            <button @click="startEdit()" class="hover:text-charcoal transition-colors">编辑</button>
            <button @click="confirmDelete(comment)" class="hover:text-red-500 transition-colors">删除</button>
          </template>
        </div>

        <!-- 子回复区域（二级扁平）- 仅顶级评论显示 -->
        <div v-if="isTopLevel && comment.replies && comment.replies.length > 0" class="mt-3 ml-2 pl-4 border-l-2 border-slate-100 space-y-3">
          <!-- 默认显示前2条 -->
          <div v-for="reply in visibleReplies" :key="reply.id" class="flex gap-2.5">
            <RouterLink v-if="reply.user_id" :to="`/user/${reply.user_id}`" class="flex-shrink-0">
              <img v-if="reply.avatar" :src="reply.avatar" class="w-7 h-7 rounded-full object-cover" alt="" />
              <div v-else class="w-7 h-7 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 font-bold text-xs hover:bg-forest-100 transition-colors">
                {{ reply.username?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </RouterLink>
            <div v-else class="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">?</div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <RouterLink v-if="reply.user_id" :to="`/user/${reply.user_id}`" class="text-xs font-medium text-charcoal hover:text-forest-600">
                  {{ reply.username || '匿名' }}
                </RouterLink>
                <span v-else class="text-xs font-medium text-charcoal">{{ reply.username || '匿名' }}</span>

                <span v-if="reply.reply_to_username" class="text-xs text-forest-600">
                  回复 @{{ reply.reply_to_username }}
                </span>

                <span class="text-xs text-slate-400">{{ formatShortDate(reply.created_at) }}</span>
              </div>
              <div v-if="editingCommentId === reply.id" class="mb-1">
                <textarea v-model="editContent" rows="2" maxlength="2000"
                  class="w-full px-2 py-1.5 rounded-lg border border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none text-xs"
                  @keydown.enter.ctrl.exact.prevent="saveEdit(reply)"></textarea>
                <div class="flex items-center gap-2 mt-1">
                  <button @click="saveEdit(reply)" :disabled="editSaving" class="px-2.5 py-1 bg-forest-600 text-white text-xs font-medium rounded-lg hover:bg-forest-700 disabled:opacity-50">保存</button>
                  <button @click="cancelEdit" class="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700">取消</button>
                </div>
              </div>
              <p v-else class="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{{ reply.content }}</p>

              <!-- 子回复图片 -->
              <img v-if="reply.image_url" :src="reply.image_url"
                   class="mt-1.5 max-w-[160px] max-h-[160px] rounded-lg object-cover cursor-pointer hover:opacity-90 border border-slate-50"
                   @click="viewImage = reply.image_url" alt="" />

              <div class="flex items-center gap-3 mt-1">
                <button @click="handleReplyLike(reply)" class="text-xs flex items-center gap-0.5 hover:text-red-500 transition-colors"
                        :class="reply.is_liked ? 'text-red-500' : 'text-slate-400'">
                  <svg class="w-3 h-3" :fill="reply.is_liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  {{ reply.likes || 0 }}
                </button>
                <button @click="startReplyTo(reply)" class="text-xs text-slate-400 hover:text-charcoal">
                  回复
                </button>
                <template v-if="isReplyAuthor(reply)">
                  <button @click="startEditReply(reply)" class="text-xs text-slate-400 hover:text-charcoal">编辑</button>
                  <button @click="confirmDelete(reply)" class="text-xs text-slate-400 hover:text-red-500">删除</button>
                </template>
              </div>
            </div>
          </div>

          <!-- 展开/收起 -->
          <button v-if="comment.replies.length > REPLY_LIMIT"
                  @click="expanded = !expanded"
                  class="text-xs text-forest-600 hover:text-forest-700 font-medium pl-9">
            {{ expanded ? '收起 ▲' : `展开剩余 ${comment.replies.length - REPLY_LIMIT} 条回复 ▼` }}
          </button>
        </div>

        <!-- 回复输入框 -->
        <div v-if="showReplyInput" class="flex gap-2 mt-3">
          <div class="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs flex-shrink-0">
            {{ currentUser?.username?.charAt(0) || '?' }}
          </div>
          <div class="flex-1">
            <textarea v-model="replyContent" rows="2" :placeholder="placeholderText"
              class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none text-xs"
              @keydown.enter.ctrl.exact.prevent
              @keydown.enter.shift.exact.stop
              @keydown.enter.exact="submitReply"
              ref="replyTextarea"
            ></textarea>
            <div class="flex items-center justify-between mt-1.5">
              <button @click="showReplyImage = !showReplyImage"
                      class="text-xs text-slate-400 hover:text-forest-600 transition-colors flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                图片
              </button>
              <div class="flex gap-2">
                <button @click="submitReply" :disabled="!replyContent.trim() || replying"
                  class="px-3 py-1 bg-forest-600 text-white text-xs font-medium rounded-lg hover:bg-forest-700 transition-all disabled:opacity-50">
                  {{ replying ? '发布中...' : '回复' }}
                </button>
                <button @click="cancelReply" class="px-3 py-1 text-slate-400 text-xs hover:text-slate-600">取消</button>
              </div>
            </div>
            <!-- 回复图片上传 -->
            <div v-if="showReplyImage" class="mt-2">
              <ImageUploader v-model="replyImageUrls" :multiple="false" :max-files="1" compact @uploaded="onReplyImageUploaded" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="deleteTarget = null">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <h3 class="text-lg font-bold text-charcoal mb-2">确认删除</h3>
          <p class="text-sm text-slate-500 mb-4">确定要删除这条评论吗？此操作不可撤销。</p>
          <div class="flex gap-3 justify-end">
            <button @click="deleteTarget = null" class="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">取消</button>
            <button @click="doDelete" :disabled="deleteSaving" class="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">{{ deleteSaving ? "删除中..." : "确认删除" }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 图片放大弹窗 -->
    <Teleport to="body">
      <div v-if="viewImage" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer" @click="viewImage = null">
        <img :src="viewImage" class="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain" @click.stop alt="" />
        <button @click="viewImage = null" class="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center text-xl transition-all">&times;</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'
import ImageUploader from './ImageUploader.vue'

const REPLY_LIMIT = 2

const props = defineProps({
  comment: { type: Object, required: true },
  postId: { type: Number, required: true },
})

const emit = defineEmits(['updated'])

const { isLoggedIn, user: authUser } = useAuth()
const currentUser = computed(() => authUser.value)
const isCommentAuthor = computed(() => currentUser.value && props.comment.user_id === currentUser.value.id)

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

// 顶级评论才有 replies
const isTopLevel = computed(() => !props.comment.parent_id)

// 展开/折叠
const expanded = ref(false)
const visibleReplies = computed(() => {
  if (!props.comment.replies) return []
  if (expanded.value) return props.comment.replies
  return props.comment.replies.slice(0, REPLY_LIMIT)
})

// 回复状态
const showReplyInput = ref(false)
const replyContent = ref('')
const replying = ref(false)
const replyTextarea = ref(null)
const replyTarget = ref(null) // 被回复的评论对象
const showReplyImage = ref(false)
const replyImageUrls = ref([])

// 图片放大
const viewImage = ref(null)

// 回复占位文本
const placeholderText = computed(() => {
  if (replyTarget.value) return `回复 @${replyTarget.value.username}...`
  return `回复 @${props.comment.username || '匿名'}...`
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 点赞顶级评论
async function handleLike() {
  if (!isLoggedIn.value) { alert('请先登录'); return }
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/api/comments/${props.comment.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      props.comment.is_liked = data.liked
      props.comment.likes = (props.comment.likes || 0) + (data.liked ? 1 : -1)
    }
  } catch { alert('操作失败') }
}

// 点赞子回复
async function handleReplyLike(reply) {
  if (!isLoggedIn.value) { alert('请先登录'); return }
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/api/comments/${reply.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      reply.is_liked = data.liked
      reply.likes = (reply.likes || 0) + (data.liked ? 1 : -1)
    }
  } catch { alert('操作失败') }
}

// 回复顶级评论
function toggleReply() {
  if (!isLoggedIn.value) { alert('请先登录'); return }
  showReplyInput.value = !showReplyInput.value
  replyTarget.value = null
  showReplyImage.value = false
  replyImageUrls.value = []
  if (showReplyInput.value) {
    replyContent.value = ''
    nextTick(() => replyTextarea.value?.focus())
  }
}

// 回复某条子回复
function startReplyTo(target) {
  if (!isLoggedIn.value) { alert('请先登录'); return }
  showReplyInput.value = true
  replyTarget.value = target
  showReplyImage.value = false
  replyImageUrls.value = []
  replyContent.value = ''
  nextTick(() => replyTextarea.value?.focus())
}

function cancelReply() {
  showReplyInput.value = false
  replyContent.value = ''
  replyTarget.value = null
  showReplyImage.value = false
  replyImageUrls.value = []
}

function onReplyImageUploaded(urls) {
  replyImageUrls.value = urls
}

// 编辑状态
const editingCommentId = ref(null)
const editContent = ref('')
const editSaving = ref(false)
const deleteTarget = ref(null)
const deleteSaving = ref(false)

function isReplyAuthor(reply) {
  return currentUser.value && reply.user_id === currentUser.value.id
}

function startEdit(comment) {
  editingCommentId.value = comment.id
  editContent.value = comment.content
}

function startEditReply(reply) {
  editingCommentId.value = reply.id
  editContent.value = reply.content
}

function cancelEdit() {
  editingCommentId.value = null
  editContent.value = ''
}

async function saveEdit(comment) {
  if (!editContent.value.trim()) return
  editSaving.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/api/comments/${comment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: editContent.value.trim() }),
    })
    if (res.ok) {
      comment.content = editContent.value.trim()
      cancelEdit()
    } else {
      const err = await res.json()
      alert(err.error || '编辑失败')
    }
  } catch { alert('网络错误') }
  finally { editSaving.value = false }
}

function confirmDelete(comment) {
  deleteTarget.value = comment
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleteSaving.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/api/comments/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      deleteTarget.value = null
      emit('updated')
    } else {
      const err = await res.json()
      alert(err.error || '删除失败')
    }
  } catch { alert('网络错误') }
  finally { deleteSaving.value = false }
}

// 提交回复
async function submitReply() {
  if (!replyContent.value.trim()) return

  // 如果通过 Enter 键提交且按了 Shift，不提交（由 @keydown.enter.shift.exact.stop 阻止）
  replying.value = true
  try {
    const token = localStorage.getItem('token')

    // 确定 parent_id: 始终是顶级评论的 id
    const topParentId = props.comment.parent_id || props.comment.id

    // 确定 reply_to_user_id: 被回复的用户
    let replyToUserId = props.comment.user_id
    if (replyTarget.value) {
      replyToUserId = replyTarget.value.user_id
    }

    const body = {
      post_id: props.postId,
      parent_id: topParentId,
      reply_to_user_id: replyToUserId,
      content: replyContent.value.trim(),
      image_url: replyImageUrls.value[0] || null,
    }

    const res = await fetch(`${API_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      replyContent.value = ''
      showReplyInput.value = false
      replyTarget.value = null
      showReplyImage.value = false
      replyImageUrls.value = []
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
</script>