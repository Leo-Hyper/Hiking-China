<template>
  <div class="min-h-screen bg-[#fafaf9]">
    <div class="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      <!-- 头部 -->
      <div class="text-center mb-10">
        <div class="relative inline-block mb-4">
          <img v-if="currentUser?.avatar" :src="currentUser.avatar"
               class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" alt="" />
          <div v-else class="w-20 h-20 rounded-full bg-gradient-to-br from-forest-500 to-forest-400 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {{ currentUser?.username?.charAt(0)?.toUpperCase() || '?' }}
          </div>
        </div>
        <h1 class="text-2xl font-bold text-charcoal">{{ currentUser?.username }}</h1>
        <p v-if="profileLevel" class="text-xs mt-1">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-xs font-medium"
                :class="levelClass">{{ profileLevel }}</span>
        </p>
        <p class="text-sm text-slate-400 mt-1">{{ currentUser?.bio || '这个人很懒，什么都没写...' }}</p>
        <p v-if="currentUser?.location" class="text-xs text-slate-400 mt-0.5">{{ currentUser.location }}</p>

        <!-- 统计栏 -->
        <div class="flex items-center justify-center gap-8 mt-4">
          <div class="text-center">
            <div class="text-lg font-bold text-charcoal">{{ myPostCount }}</div>
            <div class="text-xs text-slate-400">帖子</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-charcoal">{{ followCounts.followers }}</div>
            <div class="text-xs text-slate-400">粉丝</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-charcoal">{{ followCounts.following }}</div>
            <div class="text-xs text-slate-400">关注</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-charcoal">{{ myBookmarks.length }}</div>
            <div class="text-xs text-slate-400">收藏</div>
          </div>
        </div>
      </div>

      <!-- Tab 切换 -->
      <div class="flex justify-center gap-1 mb-8 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-md mx-auto">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
                class="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
                :class="activeTab === tab.key ? 'bg-forest-600 text-white shadow-sm' : 'text-slate-500 hover:text-charcoal'">
          {{ tab.label }}
        </button>
      </div>

      <!-- 「我的帖子」Tab -->
      <div v-if="activeTab === 'posts'">
        <div v-if="myPostsLoading" class="text-center py-20">
          <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
        </div>

        <div v-else-if="draftPosts.length + publishedPosts.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <svg class="w-14 h-14 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          <p class="text-slate-500 mb-4">你还没有发布过帖子</p>
          <RouterLink to="/publish" class="inline-flex px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all">
            去发帖
          </RouterLink>
        </div>

        <div v-else class="space-y-6">
          <!-- 草稿 -->
          <div v-if="draftPosts.length > 0">
            <h3 class="text-sm font-medium text-amber-600 mb-3">草稿箱 ({{ draftPosts.length }})</h3>
            <div class="space-y-3">
              <div v-for="post in draftPosts" :key="post.id" class="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">草稿</span>
                      <span class="text-xs text-slate-400">{{ formatDate(post.created_at) }}</span>
                    </div>
                    <span class="font-bold text-charcoal line-clamp-1">{{ post.title || '未命名草稿' }}</span>
                  </div>
                  <div class="flex items-center gap-2 ml-4 flex-shrink-0">
                    <RouterLink :to="'/post/' + post.id + '/edit'" class="text-xs px-3 py-1.5 text-forest-600 bg-forest-50 hover:bg-forest-100 rounded-lg transition-all">继续编辑</RouterLink>
                    <button @click="confirmDelete(post)" class="text-xs px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 已发布 -->
          <div v-if="publishedPosts.length > 0">
            <h3 v-if="draftPosts.length > 0" class="text-sm font-medium text-slate-500 mb-3">已发布 ({{ publishedPosts.length }})</h3>
            <div class="space-y-3">
              <div v-for="post in publishedPosts" :key="post.id" class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-xs font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">{{ post.category }}</span>
                      <span class="text-xs text-slate-400">{{ formatDate(post.created_at) }}</span>
                      <span class="text-xs text-slate-400">· {{ post.views || 0 }} 浏览</span>
                    </div>
                    <RouterLink :to="'/post/' + post.id" class="font-bold text-charcoal hover:text-forest-700 transition-colors line-clamp-1">
                      {{ post.title }}
                    </RouterLink>
                  </div>
                  <div class="flex items-center gap-2 ml-4 flex-shrink-0">
                    <RouterLink :to="'/post/' + post.id + '/edit'" class="text-xs px-3 py-1.5 text-slate-500 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-all">编辑</RouterLink>
                    <button @click="confirmDelete(post)" class="text-xs px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 「我的收藏」Tab -->
      <div v-if="activeTab === 'bookmarks'">
        <div v-if="myBookmarks.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p class="text-slate-500">还没有收藏任何帖子</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="post in myBookmarks" :key="post.id" class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-xs font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">{{ post.category }}</span>
                  <span class="text-xs text-slate-400">作者 {{ post.username }}</span>
                </div>
                <RouterLink :to="'/post/' + post.id" class="font-bold text-charcoal hover:text-forest-700 transition-colors line-clamp-1">
                  {{ post.title }}
                </RouterLink>
              </div>
              <button @click="removeBookmark(post.id)" class="text-xs px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-4 flex-shrink-0">
                取消收藏
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 「最近浏览」Tab -->
      <div v-if="activeTab === 'recent'">
        <div v-if="recentLoading" class="text-center py-10">
          <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
        </div>
        <div v-else-if="recentPosts.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p class="text-slate-500">暂无浏览记录</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="post in recentPosts" :key="post.id" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <RouterLink :to="'/post/' + post.id" class="flex-1 min-w-0 flex items-center gap-3">
              <img v-if="post.image" :src="post.image" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-charcoal truncate">{{ post.title }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(post.viewed_at) }}</p>
              </div>
            </RouterLink>
            <span class="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{{ post.category }}</span>
          </div>
        </div>
      </div>
      <!-- 「个人资料」Tab -->
      <div v-if="activeTab === 'profile'" class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-lg mx-auto">
        <div class="space-y-5">
          <!-- 头像 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">头像</label>
            <button @click="showAvatarUpload = !showAvatarUpload" class="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 hover:border-forest-400 transition-colors">
              <img v-if="avatarPreview || currentUser?.avatar" :src="avatarPreview || currentUser.avatar" class="w-full h-full object-cover" alt="" />
              <div v-else class="w-full h-full bg-gradient-to-br from-forest-500 to-forest-400 flex items-center justify-center text-white font-bold text-3xl">
                {{ currentUser?.username?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </button>
            <div v-if="showAvatarUpload" class="mt-3">
              <ImageUploader v-model="avatarUrls" :max-files="1" @uploaded="onAvatarUploaded" />
            </div>
          </div>

          <!-- 用户名 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">用户名</label>
            <input v-model="editingUsername" type="text" maxlength="20"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>

          <!-- 个人简介 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">个人简介</label>
            <textarea v-model="editingBio" rows="3" maxlength="200" placeholder="介绍一下你自己..."
                      class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none"></textarea>
          </div>

          <!-- 所在地 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">所在地</label>
            <input v-model="editingLocation" type="text" maxlength="64" placeholder="例如：四川·成都"
                   class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
          </div>

          <!-- 徒步等级 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">徒步等级</label>
            <select v-model="editingHikinglevel"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all bg-white">
              <option :value="1">新手</option>
              <option :value="2">进阶</option>
              <option :value="3">资深</option>
            </select>
          </div>

          <!-- 装备偏好 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">装备偏好</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="gear in gearOptions" :key="gear"
                      @click="toggleGear(gear)" type="button"
                      class="px-3 py-1.5 text-xs rounded-lg border transition-all"
                      :class="editingGear.includes(gear) ? 'bg-forest-50 text-forest-700 border-forest-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'">
                {{ gear }}
              </button>
            </div>
          </div>

          <!-- 隐私设置 -->
          <div class="flex items-center justify-between py-2">
            <span class="text-sm font-medium text-slate-600">资料公开</span>
            <button @click="editingProfilePublic = editingProfilePublic ? 0 : 1" type="button"
                    class="relative w-11 h-6 rounded-full transition-colors"
                    :class="editingProfilePublic ? 'bg-forest-500' : 'bg-slate-300'">
              <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    :class="editingProfilePublic ? 'translate-x-5' : ''"></span>
            </button>
          </div>

          <!-- 保存 -->
          <div class="pt-2">
            <button @click="saveProfile" :disabled="saving"
                    class="w-full py-3 bg-forest-600 text-white font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50">
              {{ saving ? '保存中...' : '保存修改' }}
            </button>
            <p v-if="saveMsg" class="text-sm mt-2 text-center" :class="saveError ? 'text-red-500' : 'text-green-600'">{{ saveMsg }}</p>
          </div>

          <!-- 数据管理 -->
          <div class="pt-4 border-t border-slate-200 space-y-2">
            <p class="text-sm font-medium text-slate-600 mb-2">数据管理</p>
            <button @click="exportData" class="text-xs text-blue-600 hover:text-blue-700">导出个人数据</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="deleteTarget = null">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <h3 class="text-lg font-bold text-charcoal mb-2">确认删除</h3>
          <p class="text-sm text-slate-500 mb-4">确定要删除帖子「{{ deleteTarget.title }}」吗？此操作不可撤销。</p>
          <div class="flex gap-3 justify-end">
            <button @click="deleteTarget = null" class="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">取消</button>
            <button @click="doDelete" :disabled="deleteSaving"
                    class="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
              {{ deleteSaving ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue"
import { RouterLink } from "vue-router"
import { useAuth } from "../../stores/auth"
import ImageUploader from "../../components/ImageUploader.vue"

const auth = useAuth()
const currentUser = computed(() => auth.user.value)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")

// Tabs
const tabs = [
  { key: 'posts', label: '我的帖子' },
  { key: 'recent', label: '最近浏览' },
  { key: 'bookmarks', label: '我的收藏' },
  { key: 'profile', label: '个人资料' },
]
const activeTab = ref("posts")

// 等级显示
const profileLevel = computed(() => {
  const lv = currentUser.value?.hikinglevel || 0
  return ['', '新手', '进阶', '资深'][lv] || ''
})
const levelClass = computed(() => {
  const lv = currentUser.value?.hikinglevel || 0
  return ['', 'bg-green-500', 'bg-blue-500', 'bg-orange-500'][lv] || ''
})

// 我的帖子
const myPosts = ref([])
const myPostsLoading = ref(true)
const myPostCount = ref(0)
const draftPosts = computed(() => myPosts.value.filter(p => p.status === 0))
const publishedPosts = computed(() => myPosts.value.filter(p => p.status !== 0))

// 我的收藏
const myBookmarks = ref([])

// 我的评论
const recentPosts = ref([])
const recentLoading = ref(false)

// 删除
const deleteTarget = ref(null)
const deleteSaving = ref(false)

// 关注统计
const followCounts = reactive({ followers: 0, following: 0 })

// 个人资料编辑
const showAvatarUpload = ref(false)
const avatarUrls = ref([])
const avatarPreview = ref("")
const editingUsername = ref("")
const editingBio = ref("")
const editingLocation = ref("")
const editingHikinglevel = ref(1)
const editingGear = ref([])
const editingProfilePublic = ref(1)
const saving = ref(false)
const saveMsg = ref("")
const saveError = ref(false)

const gearOptions = ['徒步鞋', '背包', '帐篷', '登山杖', '冲锋衣', '登山炉', '头灯', '冰爪', '雪套', '睡袋', '冲锋裤', '指南针']

function initEditing() {
  const u = currentUser.value
  editingUsername.value = u?.username || ""
  editingBio.value = u?.bio || ""
  editingLocation.value = u?.location || ""
  editingHikinglevel.value = u?.hikinglevel || 1
  editingProfilePublic.value = u?.profile_public !== undefined ? u.profile_public : 1
  try { editingGear.value = typeof u?.gear_prefs === 'string' ? JSON.parse(u.gear_prefs) : (Array.isArray(u?.gear_prefs) ? u.gear_prefs : []) } catch { editingGear.value = [] }
  if (!Array.isArray(editingGear.value)) editingGear.value = []
}

function toggleGear(gear) {
  const idx = editingGear.value.indexOf(gear)
  if (idx >= 0) editingGear.value.splice(idx, 1)
  else editingGear.value.push(gear)
}


onMounted(() => {
  loadMyPosts()
  loadFollowCounts()
  loadBookmarks()
  loadRecentPosts()
  initEditing()
})

async function loadMyPosts() {
  myPostsLoading.value = true
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(API_URL + "/api/posts/my", {
      headers: { "Authorization": "Bearer " + token },
    })
    if (res.ok) {
      const data = await res.json()
      myPosts.value = data.posts || []
      myPostCount.value = data.total || 0
    }
  } catch (e) {
    console.error("loadMyPosts:", e)
  } finally {
    myPostsLoading.value = false
  }
}

async function loadFollowCounts() {
  try {
    const res = await fetch(API_URL + "/api/auth/users/" + currentUser.value?.id)
    if (res.ok) {
      const data = await res.json()
      followCounts.followers = data.user?.followers_count || 0
      followCounts.following = data.user?.following_count || 0
      myPostCount.value = data.user?.post_count || 0
    }
  } catch {}
}

async function loadBookmarks() {
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(API_URL + "/api/bookmarks", {
      headers: { "Authorization": "Bearer " + token },
    })
    if (res.ok) {
      const data = await res.json()
      myBookmarks.value = data.bookmarks || []
    }
  } catch {}
}

async function removeBookmark(postId) {
  try {
    const token = localStorage.getItem("token")
    await fetch(API_URL + "/api/bookmarks/toggle/" + postId, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
    })
    myBookmarks.value = myBookmarks.value.filter(b => b.id !== postId)
  } catch {}
}

async function loadRecentPosts() {
  recentLoading.value = true
  try {
    const raw = localStorage.getItem("recentViews")
    const ids = raw ? JSON.parse(raw) : []
    if (ids.length === 0) { recentPosts.value = []; recentLoading.value = false; return }
    const res = await fetch(API_URL + "/api/posts")
    if (res.ok) {
      const data = await res.json()
      const allPosts = data.posts || []
      const idSet = new Set(ids)
      const viewedMap = {}
      ids.forEach((id, i) => { viewedMap[id] = i })
      recentPosts.value = allPosts
        .filter(p => idSet.has(p.id))
        .sort((a, b) => (viewedMap[b.id] || 0) - (viewedMap[a.id] || 0))
        .slice(0, 20)
        .map(p => ({
          id: p.id,
          title: p.title,
          category: p.category,
          viewed_at: new Date().toISOString(),
          image: (() => {
            try { const imgs = JSON.parse(p.image_urls); const first = Array.isArray(imgs) ? imgs[0] : null; if (!first) return null; if (first.startsWith('http')) return first; if (first.startsWith('/uploads/')) return API_URL + first; if (first.startsWith('/')) return first; return first } catch { return null }
          })()
        }))
    }
  } catch {}
  recentLoading.value = false
}

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("zh-CN")
}

function confirmDelete(post) {
  deleteTarget.value = post
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleteSaving.value = true
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(API_URL + "/api/posts/" + deleteTarget.value.id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token },
    })
    if (res.ok) {
      deleteTarget.value = null
      await loadMyPosts()
    } else {
      const data = await res.json()
      alert(data.error || "删除失败")
    }
  } catch {
    alert("网络错误")
  } finally {
    deleteSaving.value = false
  }
}

function onAvatarUploaded(urls) {
  if (urls.length > 0) avatarPreview.value = urls[0]
}

async function saveProfile() {
  saving.value = true
  saveMsg.value = ""
  saveError.value = false
  try {
    const body = {
      username: editingUsername.value.trim(),
      bio: editingBio.value.trim(),
      location: editingLocation.value.trim(),
      hikinglevel: editingHikinglevel.value,
      gear_prefs: editingGear.value,
      profile_public: editingProfilePublic.value,
    }
    if (avatarUrls.value.length > 0) {
      body.avatar = avatarUrls.value[0]
    }
    const token = localStorage.getItem("token")
    const res = await fetch(API_URL + "/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "保存失败")
    if (data.user) {
      auth.user.value = { ...auth.user.value, ...data.user }
    }
    saveMsg.value = "保存成功！"
    showAvatarUpload.value = false
    avatarUrls.value = []
  } catch (err) {
    saveMsg.value = err.message
    saveError.value = true
  } finally {
    saving.value = false
  }
}

function exportData() {
  const u = currentUser.value
  if (!u) return
  const data = {
    username: u.username,
    email: u.email,
    bio: u.bio,
    location: u.location,
    hikinglevel: u.hikinglevel,
    gear_prefs: u.gear_prefs,
    created_at: u.created_at,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '个人数据.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleLogout() {
  auth.logout()
}
</script>