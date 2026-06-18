# Changelog — 徒步论坛网站

## 2026-06-18 — 方案 A 重构：Vue 3 + Tailwind v4 新设计

### 新增文件
- hiking-new/ 整个项目目录（Vue 3 + Vite + Tailwind CSS 4）
- .ai/ PMM 项目记忆文件

### 修改文件
- 无（原静态站保持不变）

### 内容迁移
- 15 个帖子 HTML → hiking-new/src/data/postContent.js
- 20 张图片 → hiking-new/public/img/

### 设计变更
- 配色：绿色 #2e7d32 → 森林系 #2D5A3D
- 布局：传统 grid → 杂志级非对称排版
- 导航：静态顶栏 → 毛玻璃固定导航
- 首屏：轮播图 → Ken Burns 全屏大图
- 动效：基础 hover → 多层级过渡动画

---

## 2026-06-18 — 代码审查修复

### 修复
- PostCard.vue、RouteCard.vue 路由硬编码 → 动态路由 /post/${id}
- postContent.js 仅 1 条帖子 → 补全至 15 条（从原始 HTML 提取）
- index.html 的 /favicon.svg 不存在 → 创建山形 SVG 图标

### 删除
- Header.vue（死代码，App.vue 内联导航栏）
- BackToTop.vue（死代码，未被引用）
- posts.json（死数据，与 postContent.js 重复）

### Git 初始化
- git init + 首次提交 b40f3e8（109 文件，14,241 行）
