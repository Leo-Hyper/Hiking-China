# Decisions — 徒步论坛网站

## 2026-06-18 — 选择方案 A（Vue 3 渐进增强）
**Context:** 需要从纯静态 HTML/CSS/JS 站点升级为现代化前端

**Decision:** 采用 Vue 3 + Vite + Tailwind CSS 4 + Vue Router 4

**Rationale:**
- 学习曲线平缓，Vue 3 中文生态最好
- 组件化消除 15 个重复 HTML 页面
- Tailwind CSS 4 提供原子化样式，彻底解决 CSS 重复问题
- 保留原有内容和图片，渐进式迁移
- 后续可平滑升级到 Nuxt 3 添加 SSR

## 2026-06-18 — 杂志级视觉设计方向
**Context:** 原站设计朴素，需要现代化高级感

**Decision:** 采用杂志级排版 + 沉浸式视觉风格

**Rationale:**
- 森林系配色（#2D5A3D 深绿 + #E8913A 琥珀 + #7BA7BC 雾蓝）
- 衬线标题字体（Noto Serif SC）提升高级感
- Ken Burns 动效 + 毛玻璃导航 + 卡片悬浮交互
- 大量留白 + 非对称布局

## 2026-06-18 — PostCSS 配置使用 .cjs 后缀
**Context:** package.json 设置了 "type": "module"，PostCSS 不支持 ESM

**Decision:** postcss.config.js 重命名为 postcss.config.cjs

**Rationale:** 避免 ESM 兼容性问题

## 2026-06-18 — 死代码清理策略
**Context:** 代码审查发现 Header.vue（App.vue 内联导航）、BackToTop.vue、posts.json 均为冗余

**Decision:** 直接删除，不保留占位

**Rationale:** 组件均无其他引用，保留会增加维护负担和构建体积

## 2026-06-18 — postContent.js 全量数据整合
**Context:** 15 个帖子详情页中只有 1 条有实际内容，其余显示 "内容加载中..."

**Decision:** 从原始 15 个 HTML 文件提取完整内容，一次性写入 postContent.js

**Rationale:** 原始 HTML 文件不可作为运行时数据源，需在 Vue SPA 中内联全部内容
