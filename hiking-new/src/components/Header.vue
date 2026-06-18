<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div class="container-custom py-4 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500
                    flex items-center justify-center text-white text-base font-bold
                    group-hover:scale-105 transition-transform">
          徒步
        </div>
        <span class="text-xl font-bold text-gray-900">
          徒步<span class="text-amber-500">中国</span>
        </span>
      </RouterLink>

      <nav class="hidden md:flex items-center gap-1">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
                 hover:bg-gray-100"
          :class="route.path === item.path ? 'text-green-700 bg-green-50' : 'text-gray-600'">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="flex items-center gap-3">
        <button class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
        <button class="hidden sm:inline-flex px-4 py-2 bg-green-700 text-white text-sm font-medium
                       rounded-lg hover:bg-green-800 transition-colors">
          登录
        </button>
        <button class="md:hidden p-2 rounded-lg hover:bg-gray-100" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-100 py-4 px-4 space-y-1">
      <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
        class="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        :class="route.path === item.path ? 'text-green-700 bg-green-50' : 'text-gray-600'"
        @click="mobileMenuOpen = false">
        {{ item.label }}
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const mobileMenuOpen = ref(false)
const route = useRoute()
function isActive(path) { return route.path === path }

const navItems = [
  { path: '/', label: '首页' },
  { path: '/routes', label: '徒步路线' },
  { path: '/gear', label: '装备指南' },
  { path: '/events', label: '活动召集' },
  { path: '/forum', label: '徒步论坛' },
]
</script>
