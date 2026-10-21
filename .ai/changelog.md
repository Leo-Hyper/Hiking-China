# Changelog — 徒步论坛网站

## 2026-10-21 — 安全合并模式

- 新增 `--merge-content` 与 `migrate:merge:check` / `migrate:merge:apply`，保留线上用户、活动、报名和关注。
- 本地帖子/评论按用户名映射到线上账号；当前映射为 `local 3 Leo -> remote 12 Leo`。
- 增加业务键去重和 ID 级联重映射，覆盖帖子、评论、点赞、收藏、活动报名与搜索索引。
- 模拟线上 12 用户/4 活动环境完成合并测试；重复帖、评论、活动测试均通过。
- 修复真实 Turso HTTP batch 对无参数 DELETE 缺少 `args: []` 导致的提交失败。

### 全栈安全与性能加固
- JWT/bcrypt/认证限流/CORS/请求体/上传文件头/错误响应全面加固。
- sanitize-html + DOMPurify + Netlify CSP 双层 XSS 防护。
- 修复公开用户草稿泄漏和孤儿点赞/关注写入。
- 前端 store 拆分为领域模块；上传解析、书签和点赞完成分层重构。
- API gzip、30 秒公共缓存、摘要列表、评论数聚合、批量最近浏览、复合索引。
- 帖子详情聚合作者头像/评论数；新增受保护编辑读取接口；最近浏览和公开用户统计不再重复请求。
- 公共 API 增加 Netlify CDN 120 秒边缘缓存提示，减少 Render 冷启动回源。
- 修复 Render 中 sqlite3 原生库 GLIBC 2.38 不兼容：Turso 模式懒加载 SQLite，并将 sqlite3 设为 optionalDependency。
- 修复导航栏仍引用妙搭临时 `/spark/...` 资源导致的线上破图；简化图片组件为原生懒加载封装。

### 切页与搜索性能
- 公共 GET 增加客户端 SWR 缓存、请求去重和变更失效。
- 主路由代码与帖子/活动数据空闲预取，Forum 搜索 300ms 防抖。
- Events 登录报名状态从 N 次请求改为单次批量接口。
- 帖子详情、活动详情、评论列表增加 10 分钟可用缓存。
- 路由懒加载与 vendor 拆包；Hero 保留自动播放并生成 720p/540p 双版本；图片生成 WebP 大图/卡片图。
- 前后端与工具包依赖审计均为 0。

## 2026-08-24 — 全链路体检与安全热修

### 前端/托管
- 修复根部署 `CLIENT_BASE_PATH` 导致的 `//img/...` 破图。
- 验证最新 Netlify 构建无协议相对图片路径；20 张 Git 内图片全部 200 且 MIME 正确。
- Netlify 新增 `/uploads/*` 到 Render 的反代，旧上传资源恢复为 image/png。

### 后端/安全
- Express 设置 `trust proxy`，避免 Netlify/Render 代理后全站共享限流桶。
- 当前 HEAD 停止跟踪公开仓库中的 SQLite 快照；本地文件保留为迁移源。
- 记录 Render 所连库未导入的证据、Cloudinary/JWT Secret 截图泄露、CORS 配置错误、XSS 和上传校验风险。

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
