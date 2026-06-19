# Decisions — 徒步论坛网站

## 2026-06-18 — 选择方案 A（Vue 3 渐进增强）
**Decision:** Vue 3 + Vite + Tailwind CSS 4 + Vue Router 5

## 2026-06-18 — 杂志级视觉设计方向
**Decision:** 森林系配色 + 衬线字体 + 沉浸式动效

## 2026-06-18 — PostCSS 使用 .cjs
**Decision:** 重命名为 postcss.config.cjs（ESM 兼容）

## 2026-06-18 — 死代码清理
**Decision:** 删除 Header.vue、BackToTop.vue、posts.json

## 2026-06-18 — postContent.js 全量数据整合
**Decision:** 从 15 个原始 HTML 提取全部内容

## 2026-06-18 — 部署平台
**Decision:** GitHub + Netlify（前端）+ Render（后端）

## 2026-06-19 — 统一 Auth 状态管理
**Decision:** 使用 Vue ref + watch 的 useAuth store 替代 localStorage 直接读写
**Rationale:** localStorage 变化不触发 Vue 响应式更新，导致导航栏登录态不刷新

## 2026-06-19 — 发帖功能全栈搭建
**Decision:** Express REST API + SQLite + JWT 认证
- posts 表存储标题/内容/分类/标签/图片URL
- tags 存储为逗号分隔字符串，image_urls 存储为 JSON 字符串
- 前端 PublishPost.vue 支持分类/标签/多图片外链

## 2026-06-19 — 评论系统设计
**Decision:** SQLite comments 表支持 parent_id 自引用实现嵌套回复
- comment_likes 表记录点赞关系
- 评论 API 自动加载子评论（replies 数组）
- CommentItem 组件递归渲染嵌套回复

## 2026-06-19 — API URL 环境自适应
**Decision:** `import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com"`
**Rationale:** 避免开发环境和生产环境硬编码冲突
