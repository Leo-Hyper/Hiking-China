<template>
  <div class="image-uploader">
    <!-- 已上传图片预览 -->
    <div v-if="uploadedUrls.length > 0" class="grid gap-3 mb-3" :class="multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1'">
      <div v-for="(url, i) in uploadedUrls" :key="i" class="relative group rounded-xl overflow-hidden bg-slate-100"
           :class="multiple ? 'aspect-square' : 'max-w-[200px]'">
        <img :src="url" alt="" class="w-full h-full object-cover" />
        <button @click="removeImage(i)"
                class="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all">
          &times;
        </button>
      </div>
    </div>

    <!-- 上传区域 -->
    <div
      v-if="(!maxFiles || uploadedUrls.length < maxFiles) && !(multiple && uploadedUrls.length > 0)"
      class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
      :class="[
        isDragging
          ? 'border-forest-500 bg-forest-50'
          : 'border-slate-200 hover:border-forest-400 hover:bg-slate-50',
        compact ? 'p-3' : 'p-6'
      ]"
      @click="triggerInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <!-- 隐藏的 file input -->
      <input ref="fileInput" type="file" :accept="accept" :multiple="multiple" class="hidden" @change="handleFiles" />

      <!-- 上传中 -->
      <div v-if="uploading" class="flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-3 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
        <span class="text-sm text-slate-500">上传中 {{ uploadProgress }}%</span>
        <div class="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
          <div class="h-full bg-forest-500 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
        </div>
      </div>

      <!-- 默认状态 -->
      <div v-else>
        <svg v-if="!compact" class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p v-if="!compact" class="text-sm text-slate-400 mb-1">点击选择或拖拽图片到此处</p>
        <p class="text-xs text-slate-400">
          {{ compact ? '上传图片' : '支持 JPG、PNG、WebP、GIF，单张不超过 5MB' }}
          <span v-if="multiple">，最多 {{ maxFiles }} 张</span>
        </p>
      </div>
    </div>

    <!-- 多图模式：已选图片后再加图的快捷入口 -->
    <div v-if="multiple && uploadedUrls.length > 0 && (!maxFiles || uploadedUrls.length < maxFiles)" class="mt-3">
      <div
        class="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all border-slate-200 hover:border-forest-400 hover:bg-slate-50"
        @click="triggerInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <p v-if="!uploading" class="text-xs text-slate-400">+ 添加更多图片</p>
        <div v-else class="flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-forest-500/30 border-t-forest-500 rounded-full animate-spin"></div>
          <span class="text-xs text-slate-500">{{ uploadProgress }}%</span>
        </div>
      </div>
    </div>

    <!-- 手动输入 URL -->
    <div v-if="allowUrl" class="mt-3">
      <div class="flex gap-2">
        <input
          v-model="urlInput"
          type="text"
          placeholder="或粘贴图片链接..."
          class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-forest-500 focus:ring-1 focus:ring-forest-500/20 outline-none transition-all"
          @keydown.enter.prevent="addUrl"
        />
        <button @click="addUrl" :disabled="!urlInput.trim()"
                class="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50">
          添加
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <p v-if="errorMsg" class="text-xs text-red-500 mt-2">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: true },
  maxFiles: { type: Number, default: 9 },
  maxSize: { type: Number, default: 5 },
  accept: { type: String, default: 'image/jpeg,image/png,image/webp,image/gif' },
  compact: { type: Boolean, default: false },
  allowUrl: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

const fileInput = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref('')
const urlInput = ref('')
const uploadedUrls = ref([...props.modelValue])

watch(() => props.modelValue, (val) => {
  uploadedUrls.value = [...val]
})

function triggerInput() {
  fileInput.value?.click()
}

function handleDrop(e) {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    processFiles(e.dataTransfer.files)
  }
}

function handleFiles(e) {
  if (e.target.files) {
    processFiles(e.target.files)
    e.target.value = ''
  }
}

async function processFiles(fileList) {
  errorMsg.value = ''
  const files = Array.from(fileList)

  // 验证明细
  const allowedTypes = props.accept.split(',').map(s => s.trim())
  for (const f of files) {
    if (!allowedTypes.includes(f.type)) {
      errorMsg.value = `不支持的文件格式: ${f.name}`
      return
    }
    if (f.size > props.maxSize * 1024 * 1024) {
      errorMsg.value = `文件过大: ${f.name}（限制 ${props.maxSize}MB）`
      return
    }
  }

  if (props.maxFiles && uploadedUrls.value.length + files.length > props.maxFiles) {
    errorMsg.value = `最多只能上传 ${props.maxFiles} 张图片`
    return
  }

  // 上传
  uploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    files.forEach(f => formData.append('images', f))

    const urls = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_URL}/api/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const data = JSON.parse(xhr.responseText)
          // 将相对路径转为完整URL
          const fullUrls = (data.urls || []).map(u => {
            if (u.startsWith('http')) return u
            return `${API_URL}${u}`
          })
          resolve(fullUrls)
        } else if (xhr.status === 401) {
          reject(new Error('请先登录'))
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.error || '上传失败'))
          } catch {
            reject(new Error('上传失败'))
          }
        }
      }

      xhr.onerror = () => reject(new Error('网络错误'))
      xhr.send(formData)
    })

    uploadedUrls.value = [...uploadedUrls.value, ...urls]
    emit('update:modelValue', [...uploadedUrls.value])
    emit('uploaded', [...uploadedUrls.value])
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

function removeImage(index) {
  uploadedUrls.value.splice(index, 1)
  emit('update:modelValue', [...uploadedUrls.value])
  emit('uploaded', [...uploadedUrls.value])
}

function addUrl() {
  const url = urlInput.value.trim()
  if (!url) return
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    errorMsg.value = '请输入有效的图片链接'
    return
  }
  uploadedUrls.value = [...uploadedUrls.value, url]
  emit('update:modelValue', [...uploadedUrls.value])
  emit('uploaded', [...uploadedUrls.value])
  urlInput.value = ''
}
</script>
