# Changelog — 徒步论坛网站

## 2026-06-18 — 初始重构 & 代码审查修复

### 新增
- hiking-new/（Vue 3 + Vite + Tailwind CSS 4 项目）
- .ai/ PMM 项目记忆文件
- public/favicon.svg（山形 Logo）

### 变更
- PostCard.vue、RouteCard.vue 路由硬编码 → 动态路由
- postContent.js 1 条 → 补全 15 条帖子内容

### 删除
- Header.vue、BackToTop.vue（死代码）
- posts.json（死数据）

---

## 2026-06-18 — 生产部署

### 新增配置
- netlify.toml（base: hiking-new, command: npm run build, publish: dist）

### 部署
- Git 仓库初始化 + GitHub 远程
- Netlify 生产部署上线
- 持续部署已启用

---

## 2026-06-18 — 图片压缩优化

### 结果
- 20 张图片：13.06MB → 1.81MB（-86.1%）

---

## 2026-06-18 — 搜索功能

### 新增
- postIndex.js、useSearch.js、SearchOverlay.vue

---

## 2026-06-18 — 全栈架构搭建

### 后端
- server/ — Express API（用户认证 + 搜索）

---

## 2026-06-19 — 部署修复

### 修复
- netlify.toml BOM 问题
- SPA 路由 404
- Render 冷启动重试机制

---

## 2026-06-19 — 发帖功能 + Auth 状态统一

### 新增
- server/models/post.js — 帖子 CRUD 模型
- server/routes/posts.js — 帖子 API 路由（GET/POST/DELETE）
- src/views/PublishPost.vue — 发帖页面
- src/views/Forum.vue — 动态帖子列表（API 加载 + 分类筛选 + 分页）
- src/views/Home.vue — 首页最新精选动态加载
- src/views/PostDetail.vue — API 优先 + 静态 fallback

### 变更
- src/stores/auth.js — 重写为 Vue ref + watch 响应式 store
- src/App.vue — 改用 useAuth store 管理登录态
- src/views/auth/AuthPage.vue — 使用 store 登录/注册
- src/views/auth/ProfilePage.vue — 使用 store 用户状态
- server/models/db.js — 扩展 comments 表（parent_id, likes）
- server/index.js — 注册 posts 路由

### 修复
- localStorage 不触发 Vue 响应式 → 改用 ref + watch
- API URL 硬编码 → 环境自适应（DEV/PROD）
- image_urls/tags 序列化 → JSON.stringify + JSON.parse
- onMounted 不响应路由变化 → watch(route.params.id)
- loading 状态在 API 成功分支未重置

---

## 2026-06-19 — 评论系统 + 帖子详情增强

### 新增
- server/models/comment.js — 评论 CRUD + 点赞
- server/routes/comments.js — 评论 API（GET/POST/:id/like）
- src/components/CommentItem.vue — 评论组件（嵌套回复 + 点赞 + 头像）
- 数据库：comment_likes 表、comments.parent_id/likes 字段

### 变更
- PostDetail.vue — 添加点赞/收藏/分享按钮 + 评论列表 + 评论表单
- server/models/post.js — 修复 tags/image_urls 序列化（逗号分隔 + JSON）
- server/models/db.js — 完整 schema（users/posts/comments/comment_likes/search_index）
- server/routes/posts.js — 改用 authMiddleware + 调试日志

### 修复
- comments.parent_id 列缺失 → ALTER TABLE 添加
- SQLite IS NULL 查询使用字符串 'NULL' → 改为 IS NULL
- JSON.parse("[object Object]") 异常 → try-catch 容错
- 帖子详情页路由切换不重新加载 → watch route.params.id
