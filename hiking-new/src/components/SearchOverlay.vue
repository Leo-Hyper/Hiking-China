<template>
  <!-- 搜索覆盖层 -->
  <Teleport to="body">
    <Transition name="search-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
           @click.self="close">
        <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[60vh] shadow-2xl overflow-hidden flex flex-col">
          <!-- 搜索输入 -->
          <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <svg class="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input ref="inputRef" v-model="query" type="text" placeholder="搜索路线、装备、经验..."
                   class="flex-1 text-lg outline-none text-charcoal placeholder:text-slate-300"
                   @keydown.escape="close"
                   @keydown.enter.prevent="navigateFirst" />
            <kbd class="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded-md">ESC</kbd>
          </div>

          <!-- 搜索结果 -->
          <div class="overflow-y-auto flex-1 p-6">
            <!-- 无结果 -->
            <div v-if="isSearching && !results.length" class="text-center py-12 text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/>
              </svg>
              <p>没有找到匹配 "<strong>{{ query }}</strong>" 的结果</p>
            </div>

            <!-- 有结果 -->
            <div v-else-if="isSearching">
              <div v-for="(items, group) in groupedResults" :key="group" class="mb-6">
                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ group }} ({{ items.length }})</h3>
                <div class="space-y-2">
                  <RouterLink v-for="item in items" :key="item.id" :to="item.route"
                              class="block p-4 rounded-2xl border border-slate-100 hover:border-forest-200 hover:bg-forest-50/30 transition-all group"
                              @click="close">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-[10px] font-medium text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full">{{ item.category }}</span>
                          <span class="text-[10px] text-slate-300 capitalize">{{ item.type }}</span>
                        </div>
                        <p class="text-sm font-semibold text-charcoal group-hover:text-forest-700 transition-colors"
                           v-html="highlightText(item.title, query)"></p>
                        <p class="text-xs text-slate-400 mt-1 line-clamp-1"
                           v-html="highlightText(item.excerpt, query)"></p>
                        <div class="flex gap-1.5 mt-2">
                          <span v-for="tag in item.tags" :key="tag" class="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            #{{ tag }}
                          </span>
                        </div>
                      </div>
                      <svg class="w-4 h-4 text-slate-300 group-hover:text-forest-500 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="text-center py-12 text-slate-300">
              <p class="text-sm">输入关键词开始搜索</p>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="px-6 py-3 border-t border-slate-50 text-[10px] text-slate-300 flex items-center justify-between">
            <span>{{ results.length }} 个结果</span>
            <span>Enter 跳转 · ESC 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useSearch } from "@/composables/useSearch.js"

const props = defineProps({ isOpen: { type: Boolean, default: false } })
const emit = defineEmits(["close"])

const router = useRouter()
const inputRef = ref(null)
const { query, isSearching, results, groupedResults, highlightText } = useSearch()

watch(() => props.isOpen, (val) => {
  if (val) {
    setTimeout(() => inputRef.value?.focus(), 100)
  } else {
    emit("close")
  }
})

function close() {
  emit("close")
  query.value = ""
}

function navigateFirst() {
  if (results.value.length > 0) {
    router.push(results.value[0].route)
    close()
  }
}
</script>

<style scoped>
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.2s ease;
}
.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
</style>
