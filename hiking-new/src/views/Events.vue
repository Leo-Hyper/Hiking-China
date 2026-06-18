<template>
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16">
    <div class="mb-12">
      <div class="accent-line mb-4" />
      <h1 class="text-4xl md:text-5xl font-bold text-charcoal mb-3" style="font-family: 'Noto Serif SC', serif;">活动召集</h1>
      <p class="text-lg text-slate-500">参加线下徒步活动，结识志同道合的朋友</p>
    </div>

    <div class="space-y-4 max-w-4xl">
      <div v-for="event in events" :key="event.id" class="magazine-card p-6">
        <div class="flex flex-col md:flex-row md:items-center gap-5">
          <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-forest-100 to-forest-50 rounded-2xl flex flex-col items-center justify-center border border-forest-100">
            <span class="text-xl font-bold text-forest-700">{{ event.day }}</span>
            <span class="text-[10px] text-forest-500 font-medium">{{ event.month }}</span>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-charcoal mb-1">{{ event.title }}</h3>
            <p class="text-sm text-slate-500 mb-2">{{ event.description }}</p>
            <div class="flex flex-wrap gap-3 text-xs text-slate-400">
              <span class="flex items-center gap-1">📍 {{ event.location }}</span>
              <span class="flex items-center gap-1">👥 {{ event.participants }}人已报名</span>
              <span class="flex items-center gap-1">🏷 {{ event.difficulty }}</span>
            </div>
          </div>
          <button class="flex-shrink-0 px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl hover:bg-graphite transition-colors shadow-lg shadow-charcoal/10">
            立即报名
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const events = [
  { id: 1, day: '15', month: '2月', title: '周末·西山国家森林公园徒步', description: '轻松休闲的周末徒步活动，适合新手参与', location: '北京西山', participants: 23, difficulty: '初级' },
  { id: 2, day: '22', month: '2月', title: '长城徒步·慕田峪至司马台', description: '穿越长城精华段，感受千年历史与自然美景', location: '北京怀柔', participants: 18, difficulty: '中级' },
  { id: 3, day: '08', month: '3月', title: '春季赏花·桃花源徒步之旅', description: '春天来了，一起去桃花丛中徒步赏花', location: '北京平谷', participants: 35, difficulty: '初级' },
]
</script>
