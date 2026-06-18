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

### 站点
- 地址: https://genuine-meringue-dfd78e.netlify.app/
- 仓库: https://github.com/Leo-Hyper/Hiking-China

---

## 2026-06-18 — 图片压缩优化

### 工具
- sharp 批量压缩脚本

### 结果
- 20 张图片：13.06MB → 1.81MB（-86.1%）
- JPEG 压缩 quality 80，PNG quality 80，最大宽度 1920px

---

## 2026-06-18 — 搜索功能

### 新增
- src/data/postIndex.js — 可搜索索引（43 条数据）
- src/composables/useSearch.js — 搜索逻辑 composable
- src/components/SearchOverlay.vue — 全屏搜索 UI
- App.vue 集成搜索入口 + Ctrl+K 快捷键

### 特性
- 模糊匹配 + 加权排序（标题 > 分类/标签 > 摘要）
- 按类型分组展示
- 搜索词高亮
- 数据层抽象，便于后续替换为 API

---

## 2026-06-18 — 全栈架构搭建

### 后端（Render）
- server/ — Express API 服务
- models/user.js — 用户模型（bcrypt 密码加密）
- models/db.js — SQLite 数据库初始化
- models/seed.js — 搜索数据种子
- middleware/auth.js — JWT 认证中间件
- routes/auth.js — 认证路由（注册/登录/登出/获取用户）
- routes/search.js — 搜索 API 路由
- server/package.json — 后端依赖

### 前端
- src/views/auth/AuthPage.vue — 登录/注册页面
- src/views/auth/ProfilePage.vue — 个人中心
- src/stores/auth.js — Auth composable
- src/composables/useSearch.js — 升级为 API + 本地双模式

### 部署
- 前端: Netlify（genuine-meringue-dfd78e.netlify.app）
- 后端: Render（hiking-china-api.onrender.com）
- CORS: FRONTEND_URL 环境变量配置

### 构建
- 43 → 45 模块
- CSS +40KB → +41KB
- JS +129KB → +132KB
