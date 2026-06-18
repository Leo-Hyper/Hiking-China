<template>
  <button v-show="visible" @click="scrollToTop"
    class="fixed bottom-6 right-6 w-12 h-12 bg-green-700 text-white rounded-full shadow-lg
           flex items-center justify-center hover:bg-green-800 transition-all hover:scale-110 z-50">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
    </svg>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const visible = ref(false)

const handleScroll = () => { visible.value = window.scrollY > 300 }
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => { window.addEventListener('scroll', handleScroll) })
onUnmounted(() => { window.removeEventListener('scroll', handleScroll) })
</script>
