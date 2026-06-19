<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-8 py-12">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-charcoal mb-2">发布帖子</h1>
      <p class="text-slate-500">分享你的徒步经验、装备评测或路线攻略</p>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
      <!-- 标题 -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">标题 *</label>
        <input
          v-model="form.title"
          type="text"
          required
          maxlength="100"
          placeholder="请输入帖子标题"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all text-lg"
        />
        <span class="text-xs text-slate-400 mt-1 block">{{ form.title.length }}/100</span>
      </div>

      <!-- 分类 -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">分类</label>
        <select v-model="form.category" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all bg-white">
          <option value="登山经验">登山经验</option>
          <option value="路线攻略">路线攻略</option>
          <option value="装备评测">装备评测</option>
          <option value="摄影分享">摄影分享</option>
          <option value="户外技巧">户外技巧</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <!-- 标签 -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">标签（用逗号分隔）</label>
        <input
          v-model="form.tagsStr"
          type="text"
          placeholder="例如: 四川, 雪山, 入门"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all"
        />
      </div>

      <!-- 图片URL -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">图片（每行一个URL）</label>
        <textarea
          v-model="form.imageUrlsStr"
          rows="3"
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none text-sm"
        ></textarea>
        <p class="text-xs text-slate-400 mt-1">暂不支持本地上传，请提供图片外链地址</p>
      </div>

      <!-- 内容 -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-2">内容 *</label>
        <textarea
          v-model="form.content"
          required
          maxlength="10000"
          placeholder="开始撰写你的帖子..."
          rows="16"
          class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition-all resize-none leading-relaxed"
        />
        <span class="text-xs text-slate-400 mt-1 block">{{ form.content.length }}/10000</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="text-sm text-red-500 bg-red-50 p-4 rounded-xl">{{ errorMsg }}</div>

      <!-- 成功提示 -->
      <div v-if="successMsg" class="text-sm text-green-600 bg-green-50 p-4 rounded-xl">{{ successMsg }}</div>

      <!-- 提交按钮 -->
      <div class="flex gap-3">
        <button type="submit" :disabled="loading"
                class="flex-1 py-3 bg-forest-600 text-white font-medium rounded-xl hover:bg-forest-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? '发布中...' : '发布帖子' }}
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
import { ref, reactive, computed } from "vue"
import { useRouter } from "vue-router"
import { useAuth } from "../stores/auth"

const router = useRouter()
const auth = useAuth()
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com")

const loading = ref(false)
const errorMsg = ref("")
const successMsg = ref("")

const form = reactive({
  title: "",
  content: "",
  category: "登山经验",
  tagsStr: "",
  imageUrlsStr: "",
})

const tags = computed(() => {
  if (!form.tagsStr.trim()) return []
  return form.tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean)
})

const imageUrls = computed(() => {
  if (!form.imageUrlsStr.trim()) return []
  return form.imageUrlsStr.split(/\n/).map(u => u.trim()).filter(Boolean)
})

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ""
  successMsg.value = ""

  try {
    const res = await fetchWithRetry(`${API_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth.token.value}`,
      },
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        category: form.category,
        tags: tags.value,
        imageUrls: imageUrls.value,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    successMsg.value = "发布成功！即将跳转到帖子列表..."
    setTimeout(() => {
      router.push("/forum")
    }, 1500)
  } catch (err) {
    errorMsg.value = err.message || "发布失败，请重试"
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.title = ""
  form.content = ""
  form.category = "登山经验"
  form.tagsStr = ""
  form.imageUrlsStr = ""
  errorMsg.value = ""
  successMsg.value = ""
}

// 带重试的 fetch
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 503 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      return res
    } catch (err) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      throw new Error("网络连接失败，请检查网络后重试")
    }
  }
  throw new Error("请求失败")
}
</script>
