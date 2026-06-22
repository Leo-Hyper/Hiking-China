<template>
  <div class="border border-slate-200 rounded-xl overflow-hidden">
    <div id="mapPicker" ref="mapContainer" class="w-full h-[350px]" style="cursor:crosshair"></div>
    <div class="flex items-center gap-2 px-4 py-2.5 bg-white border-t border-slate-100">
      <button type="button" @click="undoLastPoint" :disabled="markers.length === 0"
              class="px-2.5 py-1 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg disabled:opacity-30">撤销</button>
      <button type="button" @click="clearAll" :disabled="markers.length === 0"
              class="px-2.5 py-1 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg disabled:opacity-30">清空</button>
      <span class="text-xs text-slate-400 ml-auto">{{ markers.length }} 个标记点</span>
    </div>
    <div v-if="markers.length > 0" class="px-4 py-2 bg-slate-50 border-t border-slate-100 max-h-[100px] overflow-y-auto">
      <div v-for="(m, i) in markers" :key="i" class="flex items-center gap-2 py-0.5 text-xs text-slate-600">
        <span class="font-mono text-forest-600 w-4">#{{ i + 1 }}</span>
        <span class="font-mono">{{ m.lat.toFixed(4) }}, {{ m.lng.toFixed(4) }}</span>
        <button type="button" @click="removePoint(i)" class="ml-auto text-slate-300 hover:text-red-400">&times;</button>
      </div>
    </div>
    <div v-else class="px-4 py-3 text-xs text-slate-400 text-center bg-slate-50 border-t border-slate-100">
      点击地图添加路线标记点
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])

const mapContainer = ref(null)
let mapInstance = null
let markerLayer = null
let polyline = null
const markers = ref([])

function syncToModel() {
  emit('update:modelValue', markers.value.map(m => [m.lat, m.lng]))
}

function redraw() {
  if (!markerLayer || !polyline) return
  markerLayer.clearLayers()
  polyline.setLatLngs(markers.value.map(m => [m.lat, m.lng]))

  markers.value.forEach((m, i) => {
    const isStart = i === 0, isEnd = i === markers.value.length - 1
    const color = isStart ? '#16a34a' : isEnd ? '#ef4444' : '#3b82f6'
    const label = isStart ? '起' : isEnd ? '终' : String(i + 1)
    L.marker([m.lat, m.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="background:${color};color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">${label}</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11]
      })
    }).addTo(markerLayer)
  })
}

function undoLastPoint() {
  if (markers.value.length === 0) return
  markers.value.pop()
  redraw()
  syncToModel()
}

function removePoint(idx) {
  markers.value.splice(idx, 1)
  redraw()
  syncToModel()
}

function clearAll() {
  markers.value = []
  redraw()
  syncToModel()
}

onMounted(async () => {
  await nextTick()
  if (typeof L === 'undefined') return

  mapInstance = L.map(mapContainer.value).setView([30.5, 104.0], 11)
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM',
    maxZoom: 19,
    subdomains: 'abc'
  }).addTo(mapInstance)

  markerLayer = L.layerGroup().addTo(mapInstance)
  polyline = L.polyline([], { color: '#16a34a', weight: 4, opacity: 0.8 }).addTo(mapInstance)

  // Restore existing points
  if (props.modelValue.length > 0) {
    markers.value = props.modelValue.map(([lat, lng]) => ({ lat, lng }))
    redraw()
    if (markers.value.length > 0) {
      const bounds = L.latLngBounds(markers.value.map(m => [m.lat, m.lng]))
      mapInstance.fitBounds(bounds, { padding: [40, 40] })
    }
  }

  mapInstance.on('click', (e) => {
    markers.value.push({ lat: e.latlng.lat, lng: e.latlng.lng })
    redraw()
    syncToModel()
  })
})

onBeforeUnmount(() => { if (mapInstance) mapInstance.remove() })
</script>