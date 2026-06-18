<template>
  <div class="min-h-screen flex items-center justify-center bg-[#fafaf9] px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg">
          徒步
        </div>
        <h1 class="text-2xl font-bold text-charcoal">个人中心</h1>
        <p class="text-sm text-slate-400 mt-1">管理你的账户信息</p>
      </div>

      <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xl">
            {{ user?.username?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div>
            <h3 class="font-bold text-charcoal">{{ user?.username }}</h3>
            <p class="text-sm text-slate-400">{{ user?.email }}</p>
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex justify-between text-sm py-2 border-b border-slate-50">
            <span class="text-slate-400">注册时间</span>
            <span class="text-slate-600">{{ formatDate(user?.created_at) }}</span>
          </div>
        </div>

        <button @click="handleLogout"
                class="w-full py-3 border border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-all">
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const user = computed(() => {
  const u = localStorage.getItem("user")
  return u ? JSON.parse(u) : null
})

function formatDate(dateStr) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("zh-CN")
}

function handleLogout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  router.push("/")
}
</script>
