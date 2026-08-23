# Changelog — 徒步论坛网站

## 2026-08-23 — 资源上线准备 + Turso 导入工具

### 资源核查
- 确认 logo/favicon、静态帖图、活动图和既有上传图已在仓库及前端构建输入中。
- React index.html 补充 favicon fallback、apple-touch-icon、OG/Twitter 图片。

### 数据迁移
- 新增 `server/scripts/migrate-local-to-turso.cjs` 与 `migrate:dry-run/check/apply` scripts。
- 导入前自动备份远端数据；单批事务替换；默认隐藏测试帖 16/20 并级联排除 3 条孤儿关系。
- 本地 SQLite 副本完整 apply 测试通过，外键检查为空；前端 type:check/build 通过。

## 2026-06-22 — 功能完善与优化

### Phase 5 — 评论区重构 + 编辑删除
- 二级扁平嵌套评论结构 (parent_id → 顶级评论, reply_to_username 标注)
- 子回复折叠/展开 (默认显示前2条)
- 评论图片上传
- 评论编辑/删除 API (PUT/DELETE /api/comments/:id, 仅作者)
- 级联删除 (删除评论同步清理子回复和点赞)

### Phase 6 — 搜索与导航
- 后端 /api/search 改查 posts 表 (原 search_index 表不存在)
- Forum.vue 搜索栏 + 标签 q 参数跳转
- Footer.vue 热门路线动态 API 加载
- useSearch.js API_URL 添加 DEV 回退
- "户外技巧" → "户外活动"

### 发布流程
- ImageUploader 必填校验 (handleSubmit 阻止)
- PublishPost.vue 标签改为红色星号

### 个人主页优化
- Tab 顺序: 帖子 → 最近浏览 → 收藏 → 资料
- 移除「我的评论」Tab 及依赖 (parseBBCode, parseSimple)
- 新增「最近浏览」: localStorage 追踪 + API 查询
- 修复收藏功能: toggleFavorite 真正调用后台 API

### 基础设施
- 文件写入绕过自动审核: 改用 [IO.File]::WriteAllBytes
- 服务器重写 search.js + posts.js (extrainfo 传递)

## 2026-06-27 — 活动模块完整实现 + 项目分析文档

### Phase 7 — 活动功能
- events 表 + event_registrations 表（报名联合唯一约束）
- server/models/event.js：活动 CRUD + join/leave/check
- server/routes/events.js：8 个活动 API 路由（鉴权 + 作者校验）
- src/views/PublishEvent.vue：发起活动页
- src/utils/image.js：图片 URL 工具函数
- .gitignore：忽略 hiking-new/data/*.db 与 hiking-new/hiking-new_*/ 备份目录
- 提交 c4c487f (2026-06-27)

### 文档
- 输出《徒步论坛网站_项目详情文档.md》（全栈分析：架构/路由/数据库/API/组件/设计系统/安全/部署/待完善项）

## 2026-08-18 — 项目记忆同步

### 记忆更新
- context.md/tasks.md/decisions.md/lessons.md/outputs.md 沉淀 Phase 7 活动功能
- 登记项目详情文档交付物
- 补记 Events.vue 静态数据等接线缺口与安全待办（JWT_SECRET/SQL 拼接/XSS）
- memory-summary.md 按 diff-gated 规则重写（细节文件有实质变化）

## 2026-08-21 — 妙搭前端迁移 + 免费部署方案（Phase 8）

### 后端
- models/db.js 双模式（本地 SQLite / Turso 远程），统一 all/get/run async 接口
- 5 模型 + 4 路由内联 db 改写；services/upload.js provider（local/cloudinary）
- index.js 挂载 /api/events、CORS 多源、initDb→listen 串行；auth.js 生产 JWT_SECRET fail-loud
- post.js status=1 过滤；event.js 原子满员校验；删除显式级联；4 条活动 seed；post17 标记删除
- server/package.json 增加 @libsql/client

### 前端（hiking-new/frontend/ 新建）
- Vite 7 + React 19 + TS + Tailwind 4 骨架，三别名，剥离全部 @lark-apaas 依赖
- utils/http.ts + api/index.ts（8 组路由）+ hiking-store.ts 35 函数异步化 + snake→camel 映射
- 18 个调用方适配 async；useAsyncData hook；PostStats 共享组件；上传/头像改 multipart
- 修复：登录未存 JWT、发布页未 await
- type:check 零错误、vite build 通过、平台/localStorage 验收 grep 通过

### 文档/交付
- 部署指南-免费方案-Render-Turso-Netlify.md
- frontend/netlify.toml（SPA redirect + /api/* 反代）

### 验证
- 后端 curl 全链路（含满员拒绝/取消重报）通过；测试数据已清理，DB 还原 17 帖/3 用户/12 评论/4 活动
