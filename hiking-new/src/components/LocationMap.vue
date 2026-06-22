<template>
  <div v-if="hasData" class="mt-8 bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div class="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
      <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <h3 class="text-sm font-bold text-charcoal">{{ title || '活动地点' }}</h3>
    </div>
    <div ref="mapContainer" class="w-full h-[300px]"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  title: { type: String, default: '' }
})

const mapContainer = ref(null)
const hasData = computed(() => props.lat && props.lng)

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value || typeof L === 'undefined' || !props.lat || !props.lng) return

  const map = L.map(mapContainer.value).setView([props.lat, props.lng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
    subdomains: 'abc'
  }).addTo(map)

  L.marker([props.lat, props.lng]).addTo(map)
})
</script>