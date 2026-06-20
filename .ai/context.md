# Context — 徒步论坛网站

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** ✅ 全栈上线生产环境（含完整社交功能）

已完成：
- Vue 3 + Vite + Tailwind CSS 4 全栈重构
- 杂志级视觉风格重设计
- 15 条静态帖子 HTML 迁移到数据库（纯净正文提取，去除冗余 HTML）
- 两次代码审查 + 全部修复
- Git + GitHub 版本控制
- 图片压缩优化：13MB → 1.8MB（-86%）
- 搜索功能：API + 本地双模式
- 用户认证：注册/登录/个人中心 + JWT
- **发帖功能：完整 CRUD API + 发帖页面 + 动态帖子列表**
- **评论系统：创建/点赞/嵌套回复 + CommentItem 组件**
- **帖子详情页：标签、点赞、收藏、分享、评论列表**
- Render 免费后端 + 冷启动重试机制

**前端地址:** https://hiking-china.netlify.app/
**后端地址:** https://hiking-china-api.onrender.com
**GitHub 仓库:** https://github.com/Leo-Hyper/Hiking-China
**技术栈:** Vue 3, Vite 8, Tailwind CSS 4, Vue Router 5, Express, SQLite, JWT

## Architecture
```
Netlify (前端 SPA)  ↔  Render (Express API, free tier)  ↔  SQLite
                                          ├─ users (JWT auth, 3 用户)
                                          ├─ posts (15 篇迁移)
                                          ├─ comments (嵌套回复 + 点赞)
                                          ├─ comment_likes
                                          └─ search_index (16 条目)
```

## Database Status (2026-06-20)
- Posts: 15 条（15 篇静态帖子迁移）
- Comments: 1 条（测试评论）
- Users: 3 个（测试用户）
- Comment Likes: 2 条
- Search Index: 16 条

## Known Issues
- Render 免费版空闲休眠导致间歇性 503，已通过 fetchWithRetry（2 次重试）缓解
- 建议设置 UptimeRobot 每 5 分钟 ping `/api/health` 保持活跃
- 长期建议迁移到 Railway/Vercel 避免休眠问题

## Next Actions
1. 设置 UptimeRobot 监控 Render 后端
2. PWA 支持（manifest + service worker）
3. PostDetail.vue 大体积懒加载优化（当前 142KB）
4. 评估迁移到 Railway/Vercel
5. 帖子图片上传功能（当前仅支持外链）
