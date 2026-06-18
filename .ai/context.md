# Context — 徒步论坛网站

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** ✅ 已上线生产环境

已完成：
- Vue 3 + Vite + Tailwind CSS 4 全栈重构
- 杂志级视觉风格重设计
- 15 条帖子数据迁移及补全
- 两次代码审查 + 全部修复
- Git + GitHub 版本控制
- Netlify 生产部署上线（持续部署已启用）
- 图片压缩优化：13MB → 1.8MB（-86%）

**站点地址:** https://genuine-meringue-dfd78e.netlify.app/
**GitHub 仓库:** https://github.com/Leo-Hyper/Hiking-China
**技术栈:** Vue 3, Vite 8, Tailwind CSS 4, Vue Router 4, PostCSS

## Constraints
- 使用 Tailwind CSS v4 新语法（@import "tailwindcss" 代替 @tailwind）
- PostCSS 配置使用 .cjs 后缀

## Risks
- PostDetail.vue 体积 142KB（gzip 29KB），后续可懒加载优化

## Next Actions
1. 搜索功能实现
2. 登录/注册功能
3. PWA 支持
