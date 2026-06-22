<template>
  <div v-if="hasData" class="mt-8 bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div class="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
      <svg class="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <h3 class="text-sm font-bold text-charcoal">{{ title }}</h3>
    </div>
    <div ref="mapContainer" class="w-full h-[400px]"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'

const props = defineProps({
  coordinates: { type: Array, default: () => [] },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  title: { type: String, default: '路线轨迹' },
  routeInfo: { type: Object, default: null },
})

const mapContainer = ref(null)
const hasData = computed(() => (props.coordinates && props.coordinates.length > 0) || (props.lat && props.lng))

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value || typeof L === 'undefined') return

  let centerLat = 30.5, centerLng = 104.0, zoom = 10
  if (props.coordinates?.length > 0) {
    centerLat = props.coordinates[0][0]
    centerLng = props.coordinates[0][1]
  } else if (props.lat && props.lng) {
    centerLat = props.lat
    centerLng = props.lng
    zoom = 14
  }

  const map = L.map(mapContainer.value).setView([centerLat, centerLng], zoom)

  // 使用法国 OSM 社区的 HOT 风格镜像（国内可访问）
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
    subdomains: 'abc'
  }).addTo(map)

  // 路线折线
  if (props.coordinates?.length > 1) {
    const polyline = L.polyline(props.coordinates, {
      color: '#16a34a', weight: 4, opacity: 0.8
    }).addTo(map)

    const start = props.coordinates[0]
    const end = props.coordinates[props.coordinates.length - 1]

    if (start) {
      L.marker(start, {
        icon: L.divIcon({ className: '', html: '<div style="background:#16a34a;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">起</div>', iconSize: [24,24], iconAnchor: [12,12] })
      }).addTo(map)
    }
    if (end) {
      L.marker(end, {
        icon: L.divIcon({ className: '', html: '<div style="background:#ef4444;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">终</div>', iconSize: [24,24], iconAnchor: [12,12] })
      }).addTo(map)
    }

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
  }

  // 单点
  if (!props.coordinates?.length && props.lat && props.lng) {
    L.marker([props.lat, props.lng]).addTo(map)
  }
})
</script>