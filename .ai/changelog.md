# Changelog — 徒步论坛网站

## 2026-06-20 — 项目记忆更新
- 更新 context.md：补充数据库实时状态（Posts:15, Comments:1, Users:3, Search Index:16）
- 更新 architecture 图示反映实际数据规模
- 所有记忆文件同步至 2026-06-20

## 2026-06-19 — 静态帖子 HTML 迁移到数据库
- 编写 Node.js 脚本从 postContent.js 提取纯净正文（.post-content-detail 内部）
- 去除 .post-header、.back-button 等冗余 HTML 元素
- 15 篇帖子全部写入数据库 posts 表（id 25-39）
- 修复 SQL 导入时 \n 转义问题（REPLACE(content, '\\n', CHAR(10))）
- 为迁移帖子设置正确的封面图片路径
- 修复 Forum.vue formatPost 中 imageUrls → image_urls 字段名
- 评论输入框支持 Enter 发送、Shift+Enter 换行
- 帖子详情页改为纯 API 驱动，不再依赖静态 fallback

## 2026-06-19 — 发帖功能 + Auth 状态统一
- 统一 useAuth store 替代 localStorage 直接读写
- 完整发帖 CRUD API + PublishPost.vue + 动态帖子列表
- 评论系统（创建/点赞/嵌套回复 API + CommentItem 组件）
- 帖子详情页增强（标签/点赞/收藏/分享/评论）

## 2026-06-18 — 初始重构 & 代码审查修复
- hiking-new/（Vue 3 + Vite + Tailwind CSS 4 项目）
- PostCard.vue、RouteCard.vue 路由硬编码 → 动态路由
- postContent.js 1 条 → 补全 15 条帖子内容
- 删除 Header.vue、BackToTop.vue、posts.json

## 2026-06-18 — 生产部署
- netlify.toml 配置 + Netlify 生产部署上线

## 2026-06-18 — 图片压缩优化
- 20 张图片：13.06MB → 1.81MB（-86.1%）

## 2026-06-18 — 搜索功能
- postIndex.js、useSearch.js、SearchOverlay.vue

## 2026-06-18 — 全栈架构搭建
- server/ — Express API（用户认证 + 搜索）

## 2026-06-19 — 部署修复
- netlify.toml BOM 问题、SPA 路由 404、Render 冷启动重试
