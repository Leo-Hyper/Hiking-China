# Context — 徒步论坛网站

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** 已部署 — Netlify 生产环境

已完成：
- Vite + Vue 3 + Tailwind CSS 4 项目脚手架
- 全站视觉风格重设计（杂志级高级感）
- 本地图片替换（21 张素材导入）
- 15 个帖子详情页内容迁移及数据补全
- 两次全栈代码审查，6 个问题全部修复
- 死代码清理：删除 Header.vue、BackToTop.vue、posts.json
- GitHub 仓库初始化：Leo-Hyper/Hiking-China
- Netlify 生产部署，SPA 路由重定向配置

**技术栈:** Vue 3, Vite 8, Tailwind CSS 4, Vue Router 4, PostCSS

**项目路径:**
- 原站点: ./（HTML/CSS/JS 静态站）
- 新版: ./hiking-new/（Vue 3 SPA）
- GitHub: https://github.com/Leo-Hyper/Hiking-China

**版本控制:** Git main 分支，GitHub 远程已关联

## Constraints
- 保留原有图片和内容素材
- 使用 Tailwind CSS v4 新语法（@import "tailwindcss" 代替 @tailwind）
- PostCSS 配置使用 .cjs 后缀以兼容 ESM 项目

## Risks
- PostDetail.vue 体积较大（142KB / gzip 29KB），含 15 篇全文 HTML，后续考虑懒加载优化
- 部分图片文件较大（>1MB），可进一步压缩

## Next Actions
1. 配置自定义域名（可选）
2. 图片压缩优化
3. 搜索功能实现
4. 登录/注册功能
5. PWA 支持
6. PostDetail 懒加载优化
