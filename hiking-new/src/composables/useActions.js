import { ref, computed } from 'vue'

export function useActions(API_URL, postId, isLoggedIn, router) {
  const isLiked = ref(false)
  const isFavorited = ref(false)
  const likeCount = ref(0)
  const favoriteCount = ref(0)

  function toggleLike() {
    if (!isLoggedIn.value) { router.push('/login'); return }
    isLiked.value = !isLiked.value
    likeCount.value += isLiked.value ? 1 : -1
  }

  function toggleFavorite() {
    if (!isLoggedIn.value) { router.push('/login'); return }
    isFavorited.value = !isFavorited.value
    favoriteCount.value += isFavorited.value ? 1 : -1
  }

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: '徒步中国帖子', url })
    } else {
      navigator.clipboard.writeText(url).then(() => alert('链接已复制到剪贴板')).catch(() => alert('分享链接：' + url))
    }
  }

  return { isLiked, isFavorited, likeCount, favoriteCount, toggleLike, toggleFavorite, share }
}
