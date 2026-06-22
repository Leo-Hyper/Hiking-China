<template>
  <RouterLink :to="`/post/${post.id}`" class="group block">
    <div class="magazine-card">
      <div class="flex flex-col sm:flex-row">
        <div class="sm:w-48 sm:h-36 flex-shrink-0 img-container">
          <img :src="post.image" :alt="post.title" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <div class="p-5 flex-1 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-medium text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full">{{ post.category }}</span>
            <span class="text-xs text-slate-400">{{ post.date }}</span>
            <RouterLink v-if="post.authorId" :to="`/user/${post.authorId}`" @click.stop
                        class="text-xs text-forest-600 hover:text-forest-700 font-medium">
              {{ post.author }}
            </RouterLink>
            <span v-else class="text-xs text-slate-400">{{ post.author }}</span>
          </div>
          <h3 class="font-bold text-charcoal group-hover:text-forest-700 transition-colors line-clamp-2 mb-2"
              style="font-size: 1.125rem; line-height: 1.4;">
            {{ post.title }}
          </h3>
          <p class="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">{{ post.excerpt }}</p>
          <div class="flex items-center gap-4 text-xs text-slate-400">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              {{ post.views }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
              {{ post.comments }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
defineProps({ post: { type: Object, required: true } })
</script>
