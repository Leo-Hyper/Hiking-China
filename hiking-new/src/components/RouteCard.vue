<template>
  <RouterLink :to="`/post/${routeData.id}`" class="group block h-full">
    <div class="magazine-card h-full flex flex-col">
      <div class="img-container h-52">
        <img :src="routeData.image" :alt="routeData.name" class="w-full h-full object-cover" loading="lazy" />
      </div>
      <div class="p-6 flex-1 flex flex-col">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-medium text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full">{{ routeData.region }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="{
                  'bg-emerald-50 text-emerald-700': routeData.difficulty === '初级',
                  'bg-amber-50 text-amber-700': routeData.difficulty === '中级',
                  'bg-red-50 text-red-700': routeData.difficulty === '高级'
                }">
            {{ routeData.difficulty }}
          </span>
        </div>
        <h3 class="font-bold text-charcoal group-hover:text-forest-700 transition-colors mb-2 text-lg"
            style="font-family: 'Noto Serif SC', serif;">
          {{ routeData.name }}
        </h3>
        <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed">{{ routeData.description }}</p>
        <div class="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-100">
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            {{ routeData.distance }}km
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ routeData.duration }}
          </span>
          <span class="flex items-center gap-1.5 ml-auto">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {{ routeData.rating }}
          </span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
defineProps({ routeData: { type: Object, required: true } })
</script>
