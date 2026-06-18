import { ref, computed, watch } from "vue"
import { searchIndex, SEARCH_FIELDS } from "@/data/postIndex.js"

// 搜索 composable — 支持流式实时搜索 + 高亮
export function useSearch() {
  const query = ref("")
  const isSearching = ref(false)
  const debounceTimer = ref(null)

  // 移除 HTML 标签
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, "")
  }

  // 计算相关性分数
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

  // 搜索函数
  function performSearch(q) {
    if (!q.trim()) return []
    const tokens = q.toLowerCase().split("").filter(c => c.trim())
    return searchIndex
      .map(item => ({ item, score: scoreResult(item, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  }

  // 实时搜索结果（流式）
  const liveResults = ref([])
  const hasQueried = ref(false)

  watch(query, (newQ) => {
    if (debounceTimer.value) clearTimeout(debounceTimer.value)

    if (!newQ.trim()) {
      liveResults.value = []
      isSearching.value = false
      hasQueried.value = false
      return
    }

    hasQueried.value = true
    isSearching.value = true

    // 即时反馈：输入时立即显示结果（无延迟）
    liveResults.value = performSearch(newQ)
  })

  // 搜索结果
  const results = computed(() => liveResults.value)

  // 按类型分组
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

  // 高亮匹配文本
  function highlightText(text, q) {
    if (!q) return text
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escaped})`, "gi")
    return text.replace(regex, '<mark class="bg-amber-200 text-charcoal rounded px-0.5">$1</mark>')
  }

  function clearSearch() {
    query.value = ""
    liveResults.value = []
    isSearching.value = false
    hasQueried.value = false
  }

  return {
    query,
    isSearching,
    results,
    liveResults,
    groupedResults,
    highlightText,
    clearSearch,
    performSearch,
  }
}
