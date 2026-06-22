<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-8 py-12">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-charcoal mb-2">发布帖子</h1>
      <p class="text-slate-500">分享你的徒步经验、装备评测或路线攻略</p>
    </div>

    <!-- 草稿恢复提示 -->
    <div v-if="draftAvailable" class="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-amber-800 text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3l9.66 4.73a1 1 0 01.34 1.46l-9.66 16.27a1 1 0 01-1.46-.34L3 9.19a1 1 0 01.34-1.46L12 3z"/></svg>
        检测到未发布的草稿
      </div>
      <div class="flex gap-2">
        <button type="button" @click="restoreDraft" class="px-3 py-1.5 bg-forest-600 text-white text-xs font-medium rounded-lg hover:bg-forest-700">恢复</button>
        <button type="button" @click="discardDraft" class="px-3 py-1.5 text-slate-500 text-xs hover:text-slate-700">忽略</button>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">标题 *</label>
        <input v-model="form.title" type="text" required maxlength="100" placeholder="请输入帖子标题"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all text-lg" />
        <span class="text-xs text-slate-400 mt-1 block">{{ form.title.length }}/100</span>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">分类</label>
        <select v-model="form.category" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all bg-white">
          <option value="登山经验">登山经验</option>
          <option value="路线攻略">路线攻略</option>
          <option value="装备评测">装备评测</option>
          <option value="摄影分享">摄影分享</option>
          <option value="户外活动">户外活动</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">标签（用逗号分隔）</label>
        <input v-model="form.tagsStr" type="text" placeholder="例如: 四川, 雪山, 入门"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">图片 *</label>
        <ImageUploader v-model="imageUrls" :max-files="9" @uploaded="onImagesUploaded" />
      </div>

      <!-- === 附加信息表单（按分类动态展示） === -->
      <div v-if="form.category === '路线攻略'" class="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
        <p class="text-sm font-bold text-charcoal flex items-center gap-1.5">
          <svg class="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          路线信息
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">难度 (1-5星)</label>
            <select v-model.number="extra.route.difficulty" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option :value="1">★ 简单</option>
              <option :value="2">★★ 较易</option>
              <option :value="3">★★★ 中等</option>
              <option :value="4">★★★★ 较难</option>
              <option :value="5">★★★★★ 极难</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">预计耗时</label>
            <input v-model="extra.route.duration" placeholder="例如：4小时" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">累计爬升</label>
            <input v-model="extra.route.elevation_gain" placeholder="例如：800m" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">全程距离</label>
            <input v-model="extra.route.distance" placeholder="例如：12km" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">起点</label>
            <input v-model="extra.route.start" placeholder="例如：成都" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">终点</label>
            <input v-model="extra.route.end" placeholder="例如：四姑娘山" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">路线轨迹（点击地图添加标记点）</label>
          <MapPicker v-model="extra.routeCoordinates" />
        </div>
      </div>

      <div v-else-if="form.category === '装备评测'" class="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
        <p class="text-sm font-bold text-charcoal">装备信息</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">品牌</label>
            <input v-model="extra.gear.brand" placeholder="例如：始祖鸟" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">型号</label>
            <input v-model="extra.gear.model" placeholder="例如：Alpha SV" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">价格</label>
            <input v-model="extra.gear.price" placeholder="例如：¥5999" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">使用时长</label>
            <input v-model="extra.gear.usage" placeholder="例如：2年" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
      </div>

      <div v-else-if="form.category === '户外活动'" class="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
        <p class="text-sm font-bold text-charcoal">活动信息</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">活动时间</label>
            <input v-model="extra.activity.time" placeholder="例如：2025-07-15 08:00" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">集合地点</label>
            <input v-model="extra.activity.location" placeholder="例如：成都茶店子客运站" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">招募人数</label>
            <input v-model.number="extra.activity.max_people" type="number" min="1" placeholder="例如：20" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">报名截止</label>
            <input v-model="extra.activity.deadline" placeholder="例如：2025-07-10" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">纬度</label>
            <input v-model.number="extra.activity.lat" type="number" step="0.00001" placeholder="例如：30.57" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">经度</label>
            <input v-model.number="extra.activity.lng" type="number" step="0.00001" placeholder="例如：104.06" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">内容 *</label>
        
        <RichEditor v-model="form.content" placeholder="开始撰写你的帖子..." />


        <span class="text-xs text-slate-400 mt-1 block">{{ form.content.length }}/10000</span>
      </div>

      <div v-if="errorMsg" class="text-sm text-red-500 bg-red-50 p-4 rounded-xl">{{ errorMsg }}</div>
      <div v-if="successMsg" class="text-sm text-green-600 bg-green-50 p-4 rounded-xl">{{ successMsg }}</div>

      <div class="flex gap-3">
        <button type="submit" :disabled="loading"
                class="flex-1 py-3 bg-forest-600 text-white font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? '发布中...' : '发布帖子' }}
        </button>
        <button type="button" @click="saveAsDraft"
                class="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all">
          保存草稿
        </button>
        <button type="button" @click="resetForm"
                class="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all">
          重置
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue"
import { useRouter } from "vue-router"
import { useAuth } from "../stores/auth"
import ImageUploader from "../components/ImageUploader.vue"
import MapPicker from "../components/MapPicker.vue"
import RichEditor from "../components/RichEditor.vue"

const router = useRouter()
const auth = useAuth()
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")

const loading = ref(false)
const errorMsg = ref("")
const successMsg = ref("")
const imageUrls = ref([])
const draftAvailable = ref(false)
const DRAFT_KEY = "publish_draft"

const form = reactive({
  title: "",
  content: "",
  category: "登山经验",
  tagsStr: "",
})

// 附加信息
const extra = reactive({
  route: { difficulty: 3, duration: "", elevation_gain: "", distance: "", start: "", end: "" },
  routeCoordinates: [],
  gear: { brand: "", model: "", price: "", usage: "" },
  activity: { time: "", location: "", max_people: 20, deadline: "", lat: null, lng: null }
})

function buildExtrainfo() {
  if (form.category === "路线攻略") {
    const coords = (extra.routeCoordinates || []).map(c => [c[0], c[1]])
    return { route: { ...extra.route, coordinates: coords } }
    } else if (form.category === "装备评测") {
    return { gear: { ...extra.gear } }
  } else if (form.category === "户外活动") {
    const act = { ...extra.activity }
    if (!act.lat) delete act.lat
    if (!act.lng) delete act.lng
    return { activity: act }
  }
  return {}
}

const tags = computed(() => {
  if (!form.tagsStr.trim()) return []
  return form.tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean)
})

function onImagesUploaded(urls) { imageUrls.value = urls }

function normalizeImageUrls(urls) {
  return urls.map(u => {
    if (u.startsWith(API_URL)) return u.replace(API_URL, '')
    if (u.startsWith('http')) return u
    return u
  })
}

function saveDraftToStorage() {
  if (!form.title && !form.content && !form.tagsStr && imageUrls.value.length === 0) return
  const draft = { title: form.title, content: form.content, category: form.category, tagsStr: form.tagsStr, imageUrls: imageUrls.value, extra: JSON.parse(JSON.stringify(extra)), timestamp: Date.now() }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

function restoreDraft() {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return
  try {
    const draft = JSON.parse(raw)
    form.title = draft.title || ''; form.content = draft.content || ''; form.category = draft.category || '登山经验'; form.tagsStr = draft.tagsStr || ''; imageUrls.value = draft.imageUrls || []
    if (draft.extra) { Object.assign(extra.route, draft.extra.route || {}); Object.assign(extra.gear, draft.extra.gear || {}); Object.assign(extra.activity, draft.extra.activity || {}) }
    if (draft.extra?.routeCoordinates) extra.routeCoordinates = draft.extra.routeCoordinates
    localStorage.removeItem(DRAFT_KEY); draftAvailable.value = false
  } catch(e) {}
}

function discardDraft() { localStorage.removeItem(DRAFT_KEY); draftAvailable.value = false }

function checkDraft() {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return
  try { const draft = JSON.parse(raw); if (Date.now() - draft.timestamp > 24 * 3600 * 1000) { localStorage.removeItem(DRAFT_KEY); return }; draftAvailable.value = true } catch(e) {}
}

async function saveAsDraft() {
  loading.value = true; errorMsg.value = ""
  try {
    const res = await fetchWithRetry(API_URL + "/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
      body: JSON.stringify({ title: form.title || "未命名草稿", content: form.content, category: form.category, tags: tags.value, imageUrls: normalizeImageUrls(imageUrls.value), extrainfo: buildExtrainfo(), status: 0 }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.removeItem(DRAFT_KEY); draftAvailable.value = false; successMsg.value = "草稿已保存！"; setTimeout(() => { successMsg.value = "" }, 2000)
  } catch (err) { errorMsg.value = err.message || "保存草稿失败" } finally { loading.value = false }
}

watch(() => [form.title, form.content, form.category, form.tagsStr, imageUrls.value], () => { saveDraftToStorage() }, { deep: true })

onMounted(() => { checkDraft(); window.addEventListener("beforeunload", saveDraftToStorage) })
onBeforeUnmount(() => { window.removeEventListener("beforeunload", saveDraftToStorage) })

async function handleSubmit() {
  if (imageUrls.value.length === 0) { errorMsg.value = "请至少上传一张图片"; loading.value = false; return }
  loading.value = true; errorMsg.value = ""; successMsg.value = ""
  try {
    const res = await fetchWithRetry(API_URL + "/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
      body: JSON.stringify({ title: form.title, content: form.content, category: form.category, tags: tags.value, imageUrls: normalizeImageUrls(imageUrls.value), extrainfo: buildExtrainfo(), status: 1 }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.removeItem(DRAFT_KEY); draftAvailable.value = false
    successMsg.value = "发布成功！即将跳转到帖子列表..."
    setTimeout(() => { router.push("/forum") }, 1500)
  } catch (err) { errorMsg.value = err.message || "发布失败，请重试" } finally { loading.value = false }
}

function resetForm() { form.title = ""; form.content = ""; form.category = "登山经验"; form.tagsStr = ""; imageUrls.value = []; errorMsg.value = ""; successMsg.value = ""; extra.route.difficulty = 3; extra.route.duration = ""; extra.route.elevation_gain = ""; extra.route.distance = ""; extra.route.start = ""; extra.route.end = ""; ; extra.gear.brand = ""; extra.gear.model = ""; extra.gear.price = ""; extra.gear.usage = ""; extra.activity.time = ""; extra.activity.location = ""; extra.activity.max_people = 20; extra.activity.deadline = ""; extra.activity.lat = null; extra.activity.lng = null }

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try { const res = await fetch(url, options); if (res.status === 503 && i < retries) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); continue }; return res }
    catch (err) { if (i < retries) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); continue }; throw new Error("网络连接失败，请检查网络后重试") }
  }
  throw new Error("请求失败")
}
</script>