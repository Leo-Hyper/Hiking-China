import { ref, computed, watch } from "vue"
import { searchIndex, SEARCH_FIELDS } from "@/data/postIndex.js"

const API_URL = import.meta.env.VITE_API_URL || "https://hiking-china-api.onrender.com"

// 搜索 composable — 支持本地 + API 双模式
export function useSearch() {
  const query = ref("")
  const isSearching = ref(false)
  const useApi = ref(true) // 默认使用 API，可切换为本地

  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, "")
  }

  function scoreResult(item, tokens) {
    if (!tokens.length) return 0
    let score = 0
    const searchable = SEARCH_FIELDS.map(f => stripHtml(String(item[f] || ""))).join(" ").toLowerCase()
    for (const token of tokens) {
      if (item.title.toLowerCase().includes(token)) score += 10
      if (item.category?.toLowerCase().includes(token)) score += 5
      if (item.tags?.some(t => t.includes(token))) score += 5
      if (searchable.includes(token)) score += 2
    }
    return score
  }

  // API 搜索
  const apiResults = ref([])
  const apiLoading = ref(false)

  async function searchApi(q) {
    if (!q.trim()) { apiResults.value = []; return }
    apiLoading.value = true
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      apiResults.value = data.results || []
    } catch {
      apiResults.value = []
    } finally {
      apiLoading.value = false
    }
  }

  // 本地搜索
  function searchLocal(q) {
    if (!q.trim()) return []
    const tokens = q.toLowerCase().split("").filter(c => c.trim())
    return searchIndex
      .map(item => ({ item, score: scoreResult(item, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  }

  // 实时搜索结果
  const liveResults = ref([])
  const hasQueried = ref(false)

  let searchTimer = null
  watch(query, (newQ) => {
    if (searchTimer) clearTimeout(searchTimer)

    if (!newQ.trim()) {
      liveResults.value = []
      isSearching.value = false
      hasQueried.value = false
      return
    }

    hasQueried.value = true
    isSearching.value = true

    if (useApi.value) {
      // API 模式：防抖搜索
      searchTimer = setTimeout(() => {
        searchApi(newQ).then(() => {
          liveResults.value = apiResults.value
        })
      }, 200)
    } else {
      // 本地模式：即时显示
      liveResults.value = searchLocal(newQ)
    }
  })

  const results = computed(() => liveResults.value)

  const groupedResults = computed(() => {
    const groups = {}
    results.value.forEach(r => {
      const typeLabel = {
        post: "帖子详情",
        forum: "论坛帖子",
        gear: "装备",
        route: "路线",
      }[r.type] || r.type
      if (!groups[typeLabel]) groups[typeLabel] = []
      groups[typeLabel].push(r)
    })
    return groups
  })

  function highlightText(text, q) {
    if (!q) return text
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escaped})`, "gi")
    return text.replace(regex, '<mark class="bg-amber-200 text-charcoal rounded px-0.5">$1</mark>')
  }

  function clearSearch() {
    query.value = ""
    liveResults.value = []
    apiResults.value = []
    isSearching.value = false
    hasQueried.value = false
  }

  return {
    query,
    isSearching,
    results,
    groupedResults,
    highlightText,
    clearSearch,
    useApi,
    apiLoading,
  }
}
