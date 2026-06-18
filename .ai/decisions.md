# Decisions — 徒步论坛网站

## 2026-06-18 — 选择方案 A（Vue 3 渐进增强）
**Context:** 从纯静态 HTML/CSS/JS 站点升级为现代化前端
**Decision:** Vue 3 + Vite + Tailwind CSS 4 + Vue Router 4
**Rationale:** 学习曲线平缓，组件化消除重复 HTML，Tailwind v4 原子化样式解决 CSS 重复

## 2026-06-18 — 杂志级视觉设计方向
**Context:** 原站设计朴素，需要高级感
**Decision:** 杂志级排版 + 森林系配色 + 衬线字体 + 沉浸式动效
**Rationale:** 森林系配色（#2D5A3D / #E8913A / #7BA7BC），Ken Burns 动效，毛玻璃导航

## 2026-06-18 — PostCSS 使用 .cjs
**Context:** package.json "type": "module" 与 PostCSS 不兼容
**Decision:** 重命名为 postcss.config.cjs

## 2026-06-18 — 死代码清理
**Context:** 审查发现 Header.vue、BackToTop.vue、posts.json 冗余
**Decision:** 直接删除

## 2026-06-18 — postContent.js 全量数据整合
**Context:** 仅 1 条有内容，14 条显示"内容加载中..."
**Decision:** 从 15 个原始 HTML 提取全部内容

## 2026-06-18 — 部署平台 & 策略
**Context:** 需要生产环境部署
**Decision:** GitHub + Netlify 持续部署
**Rationale:** 免费额度充足，Git push 自动构建发布，支持 SPA 路由重定向
