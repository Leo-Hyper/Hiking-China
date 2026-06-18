<template>
  <div class="min-h-screen bg-[#fafaf9]">
    <!-- 固定导航栏 -->
    <header class="fixed top-0 left-0 right-0 z-50 nav-glass transition-all duration-500"
            :class="{ 'py-2': scrolled, 'py-4': !scrolled }">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <RouterLink to="/" class="flex items-center gap-3 group">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-500 flex items-center justify-center text-white font-bold text-sm
                        shadow-lg shadow-forest-500/20 group-hover:shadow-forest-500/40 transition-shadow duration-500">
              徒步
            </div>
            <div>
              <span class="text-lg font-bold text-charcoal tracking-tight">徒步<span class="text-amber-500">中国</span></span>
              <span class="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase -mt-1">Hiking China</span>
            </div>
          </RouterLink>

          <!-- Desktop Nav -->
          <nav class="hidden lg:flex items-center gap-1">
            <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
              class="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-charcoal transition-colors duration-300"
              :class="{ 'text-charcoal': routePath === item.path }">
              {{ item.label }}
              <span v-if="routePath === item.path"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gradient-to-r from-forest-600 to-amber-500 rounded-full" />
            </RouterLink>
          </nav>

          <!-- Right Actions -->
          <div class="flex items-center gap-3">
            <button class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-charcoal hover:bg-slate-100 transition-all duration-300"
                    @click="searchOpen = true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <!-- 未登录：显示登录/注册 -->
            <template v-if="!isLoggedIn">
              <RouterLink to="/login" class="hidden sm:inline-flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-charcoal transition-colors">
                登录
              </RouterLink>
              <RouterLink to="/register" class="hidden sm:inline-flex items-center px-5 py-2.5 bg-forest-600 text-white text-sm font-medium rounded-xl hover:bg-forest-700 transition-all shadow-lg shadow-forest-500/20">
                注册
              </RouterLink>
            </template>
            <!-- 已登录：显示用户头像 -->
            <template v-else>
              <RouterLink to="/profile" class="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all">
                <div class="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-sm">
                  {{ user?.username?.charAt(0)?.toUpperCase() || '?' }}
                </div>
                <span class="hidden sm:inline text-sm font-medium text-charcoal">{{ user?.username }}</span>
              </RouterLink>
            </template>
            <!-- Mobile menu -->
            <button class="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    @click="mobileMenu = !mobileMenu">
              <svg v-if="!mobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition>
        <div v-if="mobileMenu" class="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl">
          <div class="px-6 py-4 space-y-1">
            <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
              class="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-charcoal hover:bg-slate-50 transition-colors"
              @click="mobileMenu = false">
              {{ item.label }}
            </RouterLink>
            <div class="border-t border-slate-100 my-2 pt-2">
              <template v-if="!isLoggedIn">
                <RouterLink to="/login" class="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-charcoal hover:bg-slate-50">
                  登录
                </RouterLink>
                <RouterLink to="/register" class="block px-4 py-3 rounded-xl text-sm font-medium text-forest-600 hover:bg-forest-50">
                  注册
                </RouterLink>
              </template>
              <template v-else>
                <RouterLink to="/profile" class="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-charcoal hover:bg-slate-50">
                  个人中心
                </RouterLink>
                <button @click="handleLogout" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                  退出登录
                </button>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <!-- 主内容 -->
    <main class="pt-20 lg:pt-22">
      <RouterView />
    </main>

    <!-- 页脚 -->
    <Footer />

    <!-- 搜索覆盖层 -->
    <SearchOverlay :is-open="searchOpen" @close="searchOpen = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import Footer from './components/Footer.vue'
import SearchOverlay from './components/SearchOverlay.vue'

const route = useRoute()
const router = useRouter()
const routePath = computed(() => route.path)
const mobileMenu = ref(false)
const scrolled = ref(false)
const searchOpen = ref(false)

const isLoggedIn = computed(() => !!localStorage.getItem("token"))
const user = computed(() => {
  const u = localStorage.getItem("user")
  return u ? JSON.parse(u) : null
})

const navItems = [
  { path: '/', label: '首页' },
  { path: '/routes', label: '路线' },
  { path: '/gear', label: '装备' },
  { path: '/events', label: '活动' },
  { path: '/forum', label: '论坛' },
]

const handleScroll = () => { scrolled.value = window.scrollY > 50 }

const handleLogout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  router.push("/")
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
  })
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
