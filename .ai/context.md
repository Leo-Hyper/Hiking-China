# Context — 徒步论坛网站

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** 方案 A — Vue 3 渐进增强重构
- 已完成 Vite + Vue 3 + Tailwind CSS 4 项目脚手架搭建
- 已完成全站视觉风格重设计（杂志级高级感）
- 已完成本地图片替换（20 张素材导入）
- 已完成 15 个帖子详情页内容迁移
- 构建验证通过，生产就绪

**技术栈:** Vue 3, Vite 8, Tailwind CSS 4, Vue Router 4, PostCSS

**项目路径:**
- 原站点: ./（HTML/CSS/JS 静态站）
- 新版: ./hiking-new/（Vue 3 SPA）

## Constraints
- 保留原有图片和内容素材
- 使用 Tailwind CSS v4 新语法（@import 'tailwindcss' 代替 @tailwind）
- PostCSS 配置使用 .cjs 后缀以兼容 ESM 项目

## Risks
- 帖子详情页 PostDetail.js 体积较大（143KB），后续考虑懒加载优化
- 部分图片文件较大（>1MB），可进一步压缩

## Next Actions
1. 启动开发服务器预览效果
2. 调整配色/间距细节
3. 生产部署
