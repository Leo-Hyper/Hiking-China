<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-8 py-12">
    <RouterLink to="/profile" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-charcoal transition-colors mb-8 group">
      <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      返回个人中心
    </RouterLink>

    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-8 h-8 border-4 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
      <p class="text-slate-400 mt-4">加载帖子数据...</p>
    </div>

    <div v-else-if="forbidden" class="text-center py-20 bg-white rounded-2xl border border-slate-100">
      <p class="text-slate-500 text-lg">无权编辑此帖子</p>
      <RouterLink to="/profile" class="inline-flex mt-4 px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl">返回个人中心</RouterLink>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
      <div class="mb-2">
        <h1 class="text-3xl font-bold text-charcoal mb-2">编辑帖子</h1>
        <p class="text-slate-500">修改你的帖子内容</p>
      </div>

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

      <div v-if="existingImages.length > 0">
        <label class="block text-sm font-medium text-slate-600 mb-2">现有图片</label>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <div v-for="(img, i) in existingImages" :key="i" class="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square">
            <img :src="img" alt="" class="w-full h-full object-cover" />
            <button type="button" @click="removeExistingImage(i)"
              class="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all">&times;</button>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">添加新图片</label>
        <ImageUploader v-model="newImages" :max-files="Math.max(0, 9 - existingImages.length)" @uploaded="onNewImages" />
      </div>

      <!-- === 附加信息表单 === -->
      <div v-if="form.category === '路线攻略'" class="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
        <p class="text-sm font-bold text-charcoal">路线信息</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">难度 (1-5星)</label>
            <select v-model.number="extra.route.difficulty" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option :value="1">★ 简单</option><option :value="2">★★ 较易</option><option :value="3">★★★ 中等</option><option :value="4">★★★★ 较难</option><option :value="5">★★★★★ 极难</option>
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
          <div><label class="text-xs text-slate-500 mb-1 block">起点</label><input v-model="extra.route.start" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">终点</label><input v-model="extra.route.end" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">路线轨迹（点击地图添加标记点）</label>
          <MapPicker v-model="editRouteCoordinates" />
        </div>
      </div>

      <div v-else-if="form.category === '装备评测'" class="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
        <p class="text-sm font-bold text-charcoal">装备信息</p>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-slate-500 mb-1 block">品牌</label><input v-model="extra.gear.brand" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">型号</label><input v-model="extra.gear.model" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">价格</label><input v-model="extra.gear.price" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">使用时长</label><input v-model="extra.gear.usage" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
        </div>
      </div>

      <div v-else-if="form.category === '户外活动'" class="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
        <p class="text-sm font-bold text-charcoal">活动信息</p>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-slate-500 mb-1 block">活动时间</label><input v-model="extra.activity.time" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">集合地点</label><input v-model="extra.activity.location" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">招募人数</label><input v-model.number="extra.activity.max_people" type="number" min="1" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">报名截止</label><input v-model="extra.activity.deadline" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-slate-500 mb-1 block">纬度</label><input v-model.number="extra.activity.lat" type="number" step="0.00001" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
          <div><label class="text-xs text-slate-500 mb-1 block">经度</label><input v-model.number="extra.activity.lng" type="number" step="0.00001" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" /></div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">内容 *</label>
        <div class="flex gap-1 bg-slate-100 rounded-xl p-1 self-start">
          <button type="button" @click="previewMode = false" class="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
                  :class="!previewMode ? 'bg-white text-charcoal shadow-sm' : 'text-slate-500'">编辑</button>
          <button type="button" @click="previewMode = true" class="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
                  :class="previewMode ? 'bg-white text-charcoal shadow-sm' : 'text-slate-500'">预览</button>
        </div>
        <RichEditor v-if="!previewMode" v-model="form.content" placeholder="开始撰写..." />
        <div v-else class="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[300px] prose prose-sm max-w-none text-slate-700 leading-relaxed bg-white" v-html="previewHtml"></div>
        <span class="text-xs text-slate-400 mt-1 block">{{ form.content.length }}/10000</span>
      </div>

      <div v-if="errorMsg" class="text-sm text-red-500 bg-red-50 p-4 rounded-xl">{{ errorMsg }}</div>
      <div v-if="successMsg" class="text-sm text-green-600 bg-green-50 p-4 rounded-xl">{{ successMsg }}</div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="flex-1 py-3 bg-forest-600 text-white font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50">
          {{ saving ? '保存中...' : '保存修改' }}
        </button>
        <RouterLink to="/profile" class="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all text-center">取消</RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import ImageUploader from '../components/ImageUploader.vue'
import MapPicker from "../components/MapPicker.vue"
import RichEditor from '../components/RichEditor.vue'

const route = useRoute()
const postId = computed(() => parseInt(route.params.id))
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

const loading = ref(true)
const forbidden = ref(false)
const saving = ref(false)
const previewMode = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const existingImages = ref([])
const newImages = ref([])

const form = reactive({ title: '', content: '', category: '其他', tagsStr: '' })

const extra = reactive({
  route: { difficulty: 3, duration: '', elevation_gain: '', distance: '', start: '', end: '', coordsStr: '' },
  gear: { brand: '', model: '', price: '', usage: '' },
  activity: { time: '', location: '', max_people: 20, deadline: '', lat: null, lng: null }
})

const tags = computed(() => {
  if (!form.tagsStr.trim()) return []
  return form.tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean)
})

const previewHtml = computed(() => form.content ? form.content.replace(/\n/g, '<br>') : '<p class="text-slate-400">暂无内容</p>')

function buildExtrainfo() {
  if (form.category === '路线攻略') {
    const coords = (editRouteCoordinates.value || []).map(([lat, lng]) => [lat, lng])
    return { route: { ...extra.route, coordinates: coords } }
  } else if (form.category === '装备评测') {
    return { gear: { ...extra.gear } }
  } else if (form.category === '户外活动') {
    const act = { ...extra.activity }; if (!act.lat) delete act.lat; if (!act.lng) delete act.lng
    return { activity: act }
  }
  return {}
}

function onNewImages(urls) { newImages.value = urls }
const editRouteCoordinates = ref([])
function removeExistingImage(index) { existingImages.value.splice(index, 1) }

function normalizeUrl(url) {
  if (url.startsWith('http')) { if (url.startsWith(API_URL)) return url.replace(API_URL, ''); return url }
  return url
}

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(API_URL + '/api/posts/' + postId.value)
    if (!res.ok) { forbidden.value = true; loading.value = false; return }
    const data = await res.json()
    const p = data.post
    if (!p) { forbidden.value = true; loading.value = false; return }
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (currentUser.id !== p.user_id) { forbidden.value = true; loading.value = false; return }

    form.title = p.title || ''
    form.content = p.content || ''
    form.category = p.category || '其他'
    let tagsArr = []
    try { tagsArr = typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (Array.isArray(p.tags) ? p.tags : []) } catch { tagsArr = [] }
    form.tagsStr = tagsArr.join(', ')

    let imgs = []
    try { imgs = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (Array.isArray(p.image_urls) ? p.image_urls : []) } catch { imgs = [] }
    if (!Array.isArray(imgs)) imgs = []
    existingImages.value = imgs.map(img => img.startsWith('http') ? img : (img.startsWith('/uploads/') ? API_URL + img : img))

    // 恢复 extrainfo
    const ei = p.extrainfo || {}
    if (ei.route) {
      Object.assign(extra.route, ei.route)
      editRouteCoordinates.value = ei.route.coordinates || []
    }
    if (ei.gear) Object.assign(extra.gear, ei.gear)
    if (ei.activity) Object.assign(extra.activity, ei.activity)

    loading.value = false
  } catch { loading.value = false }
})

async function handleSubmit() {
  saving.value = true; errorMsg.value = ''; successMsg.value = ''
  try {
    const allImages = [...existingImages.value.map(normalizeUrl), ...newImages.value.map(normalizeUrl)]
    const token = localStorage.getItem('token')
    const res = await fetch(API_URL + '/api/posts/' + postId.value, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title: form.title, content: form.content, category: form.category, tags: tags.value, imageUrls: allImages, extrainfo: buildExtrainfo(), status: 1 }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '保存失败')
    successMsg.value = '保存成功！即将返回...'
    setTimeout(() => { window.location.href = '/profile' }, 1000)
  } catch (err) { errorMsg.value = err.message } finally { saving.value = false }
}
</script>