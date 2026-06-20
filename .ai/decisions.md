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

## 2026-06-19 — 发帖功能全栈搭建
**Decision:** Express REST API + SQLite + JWT 认证

## 2026-06-19 — 评论系统设计
**Decision:** SQLite comments 表支持 parent_id 自引用实现嵌套回复

## 2026-06-19 — API URL 环境自适应
**Decision:** `import.meta.env.DEV ? "http://localhost:3001" : "https://hiking-china-api.onrender.com"`

## 2026-06-19 — 静态帖子 HTML 迁移到数据库
**Decision:** 编写 Node.js 脚本从 postContent.js 提取纯净正文（.post-content-detail 内部），去除 .post-header、.back-button 等冗余 HTML，写入数据库 posts 表
**Rationale:** 避免前端渲染时显示标题、作者、返回按钮等不应出现的内容
