# Outputs — 徒步论坛网站

| Date | Type | File / URL | Description |
|------|------|-----------|-------------|
| 2026-06-18 | 项目 | hiking-new/ | Vue 3 + Vite 重构版 |
| 2026-06-18 | 页面 | src/views/Home.vue | 杂志级首页（动态加载帖子） |
| 2026-06-18 | 页面 | src/views/Routes.vue | 路线列表+筛选 |
| 2026-06-18 | 页面 | src/views/Forum.vue | 动态论坛帖子列表（API + 分类筛选） |
| 2026-06-18 | 页面 | src/views/Gear.vue | 装备指南网格 |
| 2026-06-18 | 页面 | src/views/Events.vue | 活动召集列表 |
| 2026-06-18 | 页面 | src/views/PostDetail.vue | 帖子详情（API 驱动 + 评论懒加载） |
| 2026-06-19 | 页面 | src/views/PublishPost.vue | 发帖页面 |
| 2026-06-18 | 页面 | src/views/auth/AuthPage.vue | 登录/注册 |
| 2026-06-18 | 页面 | src/views/auth/ProfilePage.vue | 个人中心 |
| 2026-06-19 | 组件 | src/components/CommentItem.vue | 评论组件（嵌套回复 + 点赞 + 头像） |
| 2026-06-18 | 组件 | src/components/Footer.vue | 深色页脚 |
| 2026-06-18 | 组件 | src/components/Hero.vue | 全屏沉浸首屏 |
| 2026-06-18 | 组件 | src/components/PostCard.vue | 帖子卡片 |
| 2026-06-18 | 组件 | src/components/RouteCard.vue | 路线卡片 |
| 2026-06-18 | 组件 | src/components/SearchOverlay.vue | 全屏搜索 UI |
| 2026-06-18 | 样式 | src/styles/main.css | 设计系统+Tailwind |
| 2026-06-18 | 样式 | src/styles/design-system.css | CSS 变量定义 |
| 2026-06-18 | 数据 | src/data/postContent.js | 15篇原始 HTML 内容 |
| 2026-06-19 | 数据 | src/data/postContentCleaned.js | 15篇纯净正文（已提取） |
| 2026-06-18 | 数据 | src/data/postIndex.js | 可搜索索引（43条） |
| 2026-06-18 | 逻辑 | src/composables/useSearch.js | 搜索逻辑 composable |
| 2026-06-19 | 逻辑 | src/stores/auth.js | 统一 Auth store（响应式） |
| 2026-06-20 | 逻辑 | src/composables/useComments.js | 评论逻辑 composable |
| 2026-06-20 | 逻辑 | src/composables/useActions.js | 点赞/收藏/分享 composable |
| 2026-06-18 | 图标 | public/favicon.svg | 山形 Logo |
| 2026-06-18 | 配置 | netlify.toml | 前端部署配置 |
| 2026-06-19 | 配置 | .env.development | 开发环境 API URL |
| 2026-06-19 | 配置 | .env.production | 生产环境 API URL |
| 2026-06-19 | 后端 | server/models/post.js | 帖子 CRUD |
| 2026-06-19 | 后端 | server/models/comment.js | 评论 CRUD + 点赞 |
| 2026-06-19 | 后端 | server/routes/posts.js | 帖子 API 路由 |
| 2026-06-19 | 后端 | server/routes/comments.js | 评论 API 路由 |
| 2026-06-18 | 仓库 | GitHub | Leo-Hyper/Hiking-China |
| 2026-06-18 | 前端部署 | Netlify | https://hiking-china.netlify.app |
| 2026-06-18 | 后端部署 | Render | https://hiking-china-api.onrender.com |
