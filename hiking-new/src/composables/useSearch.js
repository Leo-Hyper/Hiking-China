import { ref, computed } from "vue"
import { searchIndex, SEARCH_FIELDS } from "@/data/postIndex.js"

// 搜索 composable — 支持模糊匹配 + 高亮
// 后续接入 API 时，只需替换 searchIndex 数据源
export function useSearch() {
  const query = ref("")
  const isSearching = ref(false)

  // 移除 HTML 标签，提取纯文本
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, "")
  }

  // 中文分词：简单字符级匹配
  function tokenize(text) {
    return text.toLowerCase().split("").filter(c => c.trim())
  }

  // 计算相关性分数
  function scoreResult(item, queryTokens) {
    if (!queryTokens.length) return 0

    let score = 0
    const searchable = SEARCH_FIELDS.map(f => stripHtml(String(item[f] || ""))).join(" ").toLowerCase()

    for (const token of queryTokens) {
      // 标题精确匹配（最高权重）
      if (item.title.toLowerCase().includes(token)) score += 10
      // 分类/标签匹配
      if (item.category?.toLowerCase().includes(token)) score += 5
      if (item.tags?.some(t => t.includes(token))) score += 5
      // 摘要匹配
      if (searchable.includes(token)) score += 2
    }

    return score
  }

  // 搜索结果
  const results = computed(() => {
    if (!query.value.trim()) return []

    const tokens = tokenize(query.value.trim())
    const scored = searchIndex
      .map(item => ({ item, score: scoreResult(item, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)

    return scored
  })

  // 高亮匹配文本
  function highlightText(text, query) {
    if (!query) return text
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escaped})`, "gi")
    return text.replace(regex, '<mark class="bg-amber-200 text-charcoal rounded px-0.5">$1</mark>')
  }

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

  function setSearchQuery(val) {
    query.value = val
    isSearching.value = !!val.trim()
  }

  function clearSearch() {
    query.value = ""
    isSearching.value = false
  }

  return {
    query,
    isSearching,
    results,
    groupedResults,
    highlightText,
    setSearchQuery,
    clearSearch,
  }
}
