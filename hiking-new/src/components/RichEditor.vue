<template>
  <div class="rich-editor-wrapper">
    <!-- 图片上传按钮 -->
    <div class="editor-toolbar-extra">
      <button type="button" @click="triggerImageUpload" title="上传图片"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        插入图片
      </button>
      <input ref="imgInput" type="file" accept="image/*" @change="onImageSelected" class="hidden" />
    </div>
    <div ref="editorEl" class="quill-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '开始撰写...' },
  maxSize: { type: Number, default: 5 }, // MB
})

const emit = defineEmits(['update:modelValue'])

const editorEl = ref(null)
const imgInput = ref(null)
let quill = null

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://hiking-china-api.onrender.com')

onMounted(() => {
  if (typeof Quill === 'undefined') {
    console.error('Quill not loaded')
    return
  }

  quill = new Quill(editorEl.value, {
    theme: 'snow',
    placeholder: props.placeholder,
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ]
    }
  })

  // Set initial content
  if (props.modelValue) {
    quill.root.innerHTML = props.modelValue
  }

  // Sync changes back
  quill.on('text-change', () => {
    const html = quill.root.innerHTML
    // Only emit if content actually changed (avoid empty <p><br></p> noise)
    const cleaned = html === '<p><br></p>' ? '' : html
    emit('update:modelValue', cleaned)
  })

  // Handle image paste
  quill.root.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  if (quill && quill.root) {
    quill.root.removeEventListener('paste', handlePaste)
  }
})

// Watch for external modelValue changes
watch(() => props.modelValue, (val) => {
  if (quill && val !== quill.root.innerHTML) {
    const cursorPos = quill.getSelection()
    quill.root.innerHTML = val || ''
    if (cursorPos) quill.setSelection(cursorPos)
  }
})

function triggerImageUpload() {
  imgInput.value?.click()
}

async function onImageSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > props.maxSize * 1024 * 1024) {
    alert('图片大小不能超过 ' + props.maxSize + 'MB')
    return
  }
  await uploadAndInsert(file)
  imgInput.value.value = ''
}

async function handlePaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file && file.size <= props.maxSize * 1024 * 1024) {
        await uploadAndInsert(file)
      }
    }
  }
}

async function uploadAndInsert(file) {
  try {
    // Show placeholder while uploading
    const range = quill.getSelection(true)
    const placeholder = '图片上传中...'
    quill.insertText(range.index, placeholder, { color: '#999' })
    quill.setSelection(range.index + placeholder.length)

    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')
    const res = await fetch(API_URL + '/api/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData
    })

    // Remove placeholder
    quill.deleteText(range.index, placeholder.length)

    if (!res.ok) throw new Error('上传失败')

    const data = await res.json()
    const url = data.url || data.urls?.[0]
    if (!url) throw new Error('No URL returned')

    const fullUrl = url.startsWith('http') ? url : (API_URL + url)
    quill.insertEmbed(range.index, 'image', fullUrl)
    quill.setSelection(range.index + 1)
  } catch (err) {
    alert('图片上传失败: ' + (err.message || '未知错误'))
  }
}

function getContent() {
  return quill ? quill.root.innerHTML : ''
}

function setContent(html) {
  if (quill) {
    quill.root.innerHTML = html || ''
  }
}

defineExpose({ getContent, setContent })
</script>

<style scoped>
.rich-editor-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.editor-toolbar-extra {
  padding: 6px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.quill-container {
  min-height: 300px;
}
.quill-container :deep(.ql-editor) {
  min-height: 300px;
  font-size: 15px;
  line-height: 1.8;
}
.quill-container :deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid #e2e8f0;
}
.quill-container :deep(.ql-container) {
  border: none;
  font-family: inherit;
}
.hidden { display: none; }
</style>