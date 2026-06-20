import { ref, reactive } from 'vue'

export function useComments(API_URL, postId) {
  const comments = ref([])
  const loading = ref(false)
  const newComment = ref('')
  const submitting = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetch(${API_URL}/api/comments?post_id=)
      if (res.ok) {
        const data = await res.json()
        comments.value = data.comments || []
      }
    } catch (err) {
      console.error('[useComments] load error:', err)
    } finally {
      loading.value = false
    }
  }

  async function submit() {
    if (!newComment.value.trim()) return
    submitting.value = true
    try {
      const res = await fetch(${API_URL}/api/comments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': Bearer ,
        },
        body: JSON.stringify({
          post_id: postId.value,
          content: newComment.value.trim(),
        }),
      })
      if (res.ok) {
        newComment.value = ''
        await load()
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

  return { comments, loading, newComment, submitting, load, submit }
}
