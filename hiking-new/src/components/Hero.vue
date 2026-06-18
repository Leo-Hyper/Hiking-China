<template>
  <section class="relative h-[85vh] min-h-[550px] overflow-hidden">
    <!-- 大图背景 -->
    <div class="absolute inset-0">
      <img src="/img/首页.jpeg" alt="" class="w-full h-full object-cover scale-105"
           style="animation: kenburns 25s ease-in-out infinite alternate;" />
      <div class="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
    </div>

    <!-- 装饰元素 -->
    <div class="absolute top-20 right-20 w-72 h-72 bg-forest-500/10 rounded-full blur-3xl animate-float" />
    <div class="absolute bottom-32 right-40 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-float" style="animation-delay: -3s;" />

    <!-- 内容 -->
    <div class="relative max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center">
      <div class="max-w-2xl">
        <!-- 标签 -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse-slow" />
          <span class="text-sm text-white/90 font-medium">中国徒步社区</span>
        </div>

        <!-- 大标题 -->
        <h1 class="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6"
            style="font-family: 'Noto Serif SC', 'Songti SC', serif;">
          探索<br/>
          <span class="italic font-light">中国</span> 最美的<br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-forest-400 to-amber-400">山川湖海</span>
        </h1>

        <!-- 副标题 -->
        <p class="text-lg text-white/70 max-w-lg mb-10 leading-relaxed">
          与数万名徒步爱好者一起，发现被遗忘的足迹，记录每一段行走的故事。从入门路线到极限挑战，总有一条路等你出发。
        </p>

        <!-- CTA -->
        <div class="flex flex-wrap gap-4">
          <RouterLink to="/routes"
            class="group inline-flex items-center gap-2 px-8 py-4 bg-white text-charcoal font-semibold rounded-2xl hover:bg-forest-50 transition-all duration-300 shadow-2xl shadow-black/20">
            探索路线
            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </RouterLink>
          <RouterLink to="/forum"
            class="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
            进入论坛
          </RouterLink>
        </div>

        <!-- 统计数据 -->
        <div class="flex gap-10 mt-14 pt-8 border-t border-white/10">
          <div>
            <div class="text-2xl font-bold text-white">500+</div>
            <div class="text-xs text-white/50 mt-1">徒步路线</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">12万</div>
            <div class="text-xs text-white/50 mt-1">徒步爱好者</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">800+</div>
            <div class="text-xs text-white/50 mt-1">原创攻略</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动提示 -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
      <span class="text-xs text-white/40 tracking-widest uppercase">Scroll</span>
      <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </div>
  </section>
</template>

<style>
  @keyframes kenburns {
    0% { transform: scale(1.05) translate(0, 0); }
    100% { transform: scale(1.15) translate(-2%, -1%); }
  }
</style>

<script setup>
import { RouterLink } from 'vue-router'
</script>
