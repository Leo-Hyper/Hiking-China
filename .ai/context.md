# Context — 徒步论坛网站

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** ✅ 全栈上线生产环境

已完成：
- Vue 3 + Vite + Tailwind CSS 4 全栈重构
- 杂志级视觉风格重设计
- 15 条帖子数据迁移及补全
- 两次代码审查 + 全部修复
- Git + GitHub 版本控制
- 图片压缩优化：13MB → 1.8MB（-86%）
- 搜索功能：API + 本地双模式
- 用户认证：注册/登录/个人中心 + JWT
- Render 免费后端 + 冷启动重试机制

**前端地址:** https://genuine-meringue-dfd78e.netlify.app/
**后端地址:** https://hiking-china-api.onrender.com
**GitHub 仓库:** https://github.com/Leo-Hyper/Hiking-China
**技术栈:** Vue 3, Vite 8, Tailwind CSS 4, Vue Router 5, Express, SQLite, JWT

## Architecture
```
Netlify (静态前端)  ↔  Render (Express API, free tier)  ↔  SQLite
```

## Known Issues
- Render 免费版空闲休眠导致间歇性 503，已通过 fetch 重试机制缓解
- 建议设置 UptimeRobot 每 5 分钟 ping 后端保持活跃
- 长期建议迁移到 Railway/Vercel 避免休眠问题

## Next Actions
1. PWA 支持
2. PostDetail.vue 大体积懒加载优化
3. 设置 UptimeRobot 定时 ping Render
4. 评估迁移到 Railway/Vercel
