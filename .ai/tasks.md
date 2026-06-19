# Tasks — 徒步论坛网站

## Done
- [x] 审查原站结构（20 个 HTML，14.5MB 图片）
- [x] 选择技术方案 A（Vue 3 + Vite + Tailwind）
- [x] 搭建项目脚手架（hiking-new/）
- [x] 配置 Tailwind CSS 4 + PostCSS
- [x] 设计新视觉系统（森林系杂志风格）
- [x] 创建 6 个页面组件
- [x] 创建 5 个公共组件
- [x] 替换图片为本地素材
- [x] 迁移 15 个帖子详情页内容
- [x] 修复构建错误
- [x] 全栈代码审查 × 2，全部修复
- [x] Git + GitHub 初始化
- [x] Netlify 生产部署
- [x] 图片压缩优化：13MB → 1.8MB（-86%）
- [x] 搜索功能（Ctrl+K + 加权排序）
- [x] 后端 API（Express + SQLite + JWT）
- [x] 前端登录/注册/个人中心
- [x] 搜索 API 集成
- [x] Render 部署 + CORS 配置
- [x] 修复 netlify.toml BOM 问题
- [x] 修复 SPA 路由 404
- [x] Render 冷启动重试机制
- [x] **统一 Auth 状态管理（useAuth store，响应式登录态）**
- [x] **完整发帖功能（CRUD API + PublishPost.vue + 动态列表）**
- [x] **评论系统（创建/点赞/嵌套回复 API + CommentItem 组件）**
- [x] **帖子详情页增强（标签/点赞/收藏/分享/评论）**
- [x] **修复 API URL 环境自适应（DEV → localhost, PROD → Render）**
- [x] **修复数据库 schema（comments parent_id/likes, comment_likes 表）**
- [x] **修复 PostDetail.vue 路由切换加载问题 + loading 状态**

## Todo
- [ ] 设置 UptimeRobot 定时 ping Render 后端（防冷启动）
- [ ] PWA 支持
- [ ] PostDetail.vue 大体积懒加载优化
- [ ] 评估迁移到 Railway/Vercel（替代 Render 免费版休眠）
- [ ] 帖子图片上传功能（当前仅支持外链）
- [ ] 用户评论/帖子编辑/删除功能
