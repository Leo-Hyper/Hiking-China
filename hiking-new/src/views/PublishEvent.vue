<template>
  <div class="max-w-2xl mx-auto px-6 lg:px-8 py-12">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-charcoal mb-2">发起活动</h1>
      <p class="text-slate-500">组织线下徒步活动，号召伙伴一起出发</p>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">活动标题 *</label>
        <input v-model="form.title" type="text" required maxlength="100" placeholder="例如：周末·西山国家森林公园徒步"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-2">活动日期 *</label>
          <input v-model="form.event_date" type="datetime-local" required
            class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-2">难度</label>
          <select v-model="form.difficulty" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all bg-white">
            <option value="初级">初级</option>
            <option value="中级">中级</option>
            <option value="高级">高级</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">集合地点 *</label>
        <input v-model="form.location" type="text" required placeholder="例如：北京市海淀区西山国家森林公园东门"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">人数上限</label>
        <input v-model.number="form.max_participants" type="number" min="1" max="500" placeholder="不填则不限人数"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">活动封面图</label>
        <ImageUploader v-model="imageUrls" :max-files="1" :multiple="false" :compact="false" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">活动详情</label>
        <textarea v-model="form.content" rows="6" placeholder="描述活动路线、注意事项、所需装备等..."
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-y"></textarea>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-sm text-green-600">{{ successMsg }}</p>

      <div class="flex gap-4 pt-2">
        <RouterLink to="/events" class="flex-1 px-5 py-3 text-center text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">取消</RouterLink>
        <button type="submit" :disabled="loading"
          class="flex-1 px-5 py-3 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50 shadow-lg shadow-forest-500/20">
          {{ loading ? '发布中...' : '发布活动' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ImageUploader from '@/components/ImageUploader.vue'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')
const router = useRouter()

const form = reactive({
  title: '',
  event_date: '',
  location: '',
  difficulty: '中级',
  max_participants: 0,
  content: '',
})

const imageUrls = ref([])
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.title.trim() || !form.event_date || !form.location.trim()) {
    errorMsg.value = '请填写标题、活动日期和集合地点'
    return
  }
  if (form.title.length > 100) {
    errorMsg.value = '标题不能超过100个字符'
    return
  }

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(API_URL + '/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({
        title: form.title.trim(),
        event_date: form.event_date,
        location: form.location.trim(),
        difficulty: form.difficulty,
        max_participants: form.max_participants || 0,
        content: form.content.trim(),
        image_url: imageUrls.value[0] || '',
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '发布失败')
    successMsg.value = '发布成功！即将跳转...'
    setTimeout(() => { router.push('/events') }, 1500)
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}
</script>