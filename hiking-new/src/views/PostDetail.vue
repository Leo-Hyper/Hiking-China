<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-8 py-16">
    <RouterLink to="/" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-charcoal transition-colors mb-8 group">
      <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      返回首页
    </RouterLink>
    <article v-if="post" class="max-w-4xl mx-auto">
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-xs font-medium text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full">{{ post.category }}</span>
          <span class="text-xs text-slate-400">{{ post.date }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal leading-tight mb-6" style="font-family: 'Noto Serif SC', serif;">{{ post.title }}</h1>
        <div class="flex items-center gap-6 text-sm text-slate-500">
          <span>{{ post.author }}</span>
          <span>{{ post.views }} 阅读</span>
          <span>{{ post.comments }} 评论</span>
        </div>
      </div>
      <div class="rounded-3xl overflow-hidden mb-10 img-container aspect-21/9">
        <img v-bind:src="post.image" v-bind:alt="post.title" class="w-full h-full object-cover" loading="eager" />
      </div>
      <div class="prose prose-lg max-w-none text-slate-700 leading-loose" v-html="post.bodyHtml" />
      <div class="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-200">
        <span v-for="tag in post.tags" v-bind:key="tag" class="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium"># {{ tag }}</span>
      </div>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { postContents } from '@/data/postContent.js'

const route = useRoute()
const postId = parseInt(route.params.id)

const postMap = {
  1: { key: "四姑娘山", title: "四姑娘山大峰攀登全记录", category: "登山经验", date: "2024-01-15", author: "山野行者", views: 1256, commentList: [{id:1,author:"户外小白",date:"2024-01-16",text:"太棒了！"},{id:2,author:"登山达人",date:"2024-01-17",text:"写得非常详细！"}], tags: ["雪山","入门级"] },
  2: { key: "虎跳峡", title: "虎跳峡高路徒步", category: "徒步路线", date: "2024-01-12", author: "江河漫步", views: 987, commentList: [{id:1,author:"旅行家",date:"2024-01-13",text:"去年刚走完，确实震撼！"}], tags: ["云南","经典路线"] },
  3: { key: "秋季徒步装备指南", title: "秋季徒步装备指南", category: "装备评测", date: "2024-01-08", author: "装备控", views: 1542, commentList: [{id:1,author:"新手徒步",date:"2024-01-09",text:"太实用了！"}], tags: ["秋季","装备"] },
  4: { key: "贡嘎转山", title: "贡嘎转山", category: "登山经验", date: "2024-01-05", author: "高原狼", views: 892, commentList: [], tags: ["贡嘎","重装"] },
  5: { key: "稻城亚丁徒步", title: "稻城亚丁徒步", category: "徒步路线", date: "2024-01-03", author: "香格里拉", views: 1103, commentList: [], tags: ["稻城亚丁"] },
  6: { key: "雨崩村徒步", title: "雨崩村徒步", category: "徒步路线", date: "2024-01-01", author: "雪山飞狐", views: 756, commentList: [], tags: ["雨崩","梅里雪山"] },
  7: { key: "喀纳斯徒步", title: "喀纳斯徒步", category: "徒步路线", date: "2023-12-28", author: "北疆行者", views: 1321, commentList: [], tags: ["喀纳斯","新疆"] },
  8: { key: "墨脱徒步", title: "墨脱徒步", category: "徒步路线", date: "2023-12-25", author: "秘境探索者", views: 645, commentList: [], tags: ["墨脱","西藏"] },
  9: { key: "黄山徒步", title: "黄山徒步", category: "徒步路线", date: "2023-12-20", author: "安徽行者", views: 890, commentList: [], tags: ["黄山","安徽"] },
  10: { key: "露营装备", title: "徒步露营装备指南", category: "装备评测", date: "2023-12-18", author: "露营达人", views: 1050, commentList: [], tags: ["露营","帐篷"] },
  11: { key: "徒步鞋履", title: "徒步鞋履指南", category: "装备评测", date: "2023-12-15", author: "鞋控", views: 780, commentList: [], tags: ["鞋履","选购"] },
  12: { key: "服装系统", title: "徒步服装系统指南", category: "装备评测", date: "2023-12-12", author: "装备控", views: 920, commentList: [], tags: ["服装","分层"] },
  13: { key: "导航与安全", title: "徒步导航与安全装备", category: "装备评测", date: "2023-12-10", author: "安全队长", views: 660, commentList: [], tags: ["导航","安全"] },
  14: { key: "背包装备", title: "徒步背包装备指南", category: "装备评测", date: "2023-12-08", author: "背包客", views: 840, commentList: [], tags: ["背包","重装"] },
  15: { key: "其他配件", title: "徒步其他配件指南", category: "装备评测", date: "2023-12-05", author: "装备控", views: 530, commentList: [], tags: ["配件","小物"] },
}

const post = computed(() => {
  const meta = postMap[postId]
  if (!meta) return null
  const content = postContents[meta.key]
  let bodyHtml = content ? content.html : "<p>内容加载中...</p>"
  const bodyMatch = bodyHtml.match(/<body[^>]*>([\\s\\S]*)<\/body>/)
  if (bodyMatch) bodyHtml = bodyMatch[1]
  bodyHtml = bodyHtml.replace(/<script[\\s\\S]*?<\/script>/gi, "")
  bodyHtml = bodyHtml.replace(/class="post-detail"/g, "class='max-w-4xl mx-auto'")
  bodyHtml = bodyHtml.replace(/class="container"/g, "")
  return { ...meta, image: content ? content.image : "/img/四姑娘山.jpg", bodyHtml }
})
</script>
