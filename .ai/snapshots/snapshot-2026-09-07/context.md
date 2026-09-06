# Context — 徒步论坛网站 (Updated 2026-08-21)

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** 功能完善与优化阶段（Phase 7 活动模块已完成）

### 已完成功能模块：

**Phase 1 - 数据层改造：**
- users 表扩展：location, hikinglevel, gear_prefs, profile_public, status
- posts 表扩展：extrainfo, status(草稿/发布), comment_closed, likes_count
- 新增 post_likes 表 + bookmarks 表
- 9 个数据库索引
- user.js/post.js 模型层适配

**Phase 2 - WYSIWYG 编辑器 + 草稿：**
- Quill 富文本编辑器 (CDN: cdn.bootcdn.net)
- 图片粘贴上传 + 手动插入
- 草稿自动保存到 localStorage (30s + beforeunload)
- 发布页「保存草稿」/「发布」分按钮

**Phase 3 - 个人主页增强（已优化）：**
- 4 个 Tab：我的帖子(草稿/发布分组)、最近浏览、我的收藏、个人资料
- 最近浏览：localStorage 追踪 + API 查询帖子信息
- 收藏功能：PostDetail 调用 /api/bookmarks/toggle 持久化
- 个人资料编辑：所在地、徒步等级(新手/进阶/资深)、装备偏好(12项)、隐私开关
- 数据导出功能
- 公开主页：等级徽章、装备偏好展示
- 作者名/头像点击跳转用户主页 (PostCard + PostDetail)
- 已移除：我的评论 Tab 及依赖 (parseBBCode, parseSimple)

**Phase 4 - 地图系统：**
- Leaflet + OpenStreetMap (CDN: cdn.bootcdn.net, Tile: tile.openstreetmap.fr/hot)
- RouteMap.vue：路线轨迹地图(折线+起终标记)
- LocationMap.vue：活动地点地图(单点标记)
- MapPicker.vue：地图交互选点组件(点击添加路径点)
- 路线信息统计卡片(难度/耗时/爬升/距离)
- extrainfo 正确传递到后端存储 (POST/PUT /api/posts 均已修复)

**Phase 5 - 评论系统重构：**
- 二级扁平嵌套结构：parent_id 指向顶级评论，reply_to_username 标注回复对象
- 子回复平铺展示，默认折叠显示前 2 条，点击展开
- 评论图片上传 (ImageUploader)
- 评论编辑/删除功能 (PUT/DELETE /api/comments/:id，仅作者)
- 级联删除：删除评论时同步删除子回复及点赞记录

**Phase 6 - 搜索与导航优化：**
- 导航栏搜索覆盖层 (SearchOverlay.vue) 修复：后端 /api/search 改查 posts 表
- Forum.vue 添加搜索栏，支持 q 参数标签跳转
- Footer.vue 热门路线动态化（API 获取最新帖子替代硬编码 ID）
- "户外技巧" 重命名为 "户外活动"

**Phase 7 - 活动模块完整实现 (2026-06-27 提交 c4c487f)：**
- events 表 + event_registrations 表（报名，联合唯一 event_id+user_id）
- server/models/event.js：活动 CRUD + 报名/取消/检查
- server/routes/events.js：8 个活动 API 路由（含鉴权与作者校验）
- src/views/PublishEvent.vue：发起活动页（标题/日期/难度/地点/人数/图片）
- src/utils/image.js：图片 URL 工具（resolveImageUrl/parseImageUrls/stripHtml）
- .gitignore：忽略数据库文件与备份目录 (hiking-new/hiking-new_*/)

**文档与交付 (2026-06-27)：**
- 全栈项目分析完成，输出《徒步论坛网站_项目详情文档.md》（架构/目录/路由/数据库/API/组件/设计系统/安全/部署/功能矩阵/待完善项）

### 数据结构
sql
users: id, username, email, password_hash, avatar, bio, location, hikinglevel,
       gear_prefs, profile_public, status, created_at, updated_at

posts: id, user_id, title, content, category, tags, image_urls, extrainfo,
       status(0=草稿/1=发布/2=删除), comment_closed, views, likes_count,
       created_at, updated_at

comments: id, post_id, user_id, parent_id, reply_to_user_id, reply_to_username,
          content, image_url, likes, created_at

events: id, user_id, title, content, location, location_lat, location_lng,
        event_date, difficulty, max_participants, image_url, status,
        created_at, updated_at

event_registrations: id, event_id, user_id, created_at (UNIQUE event_id+user_id)

likes/收藏: post_likes, bookmarks, comment_likes, followers

### API 路由
- GET/POST/PUT/DELETE /api/posts
- GET /api/posts/my, /api/posts/like/toggle, /api/posts/like/check
- GET /api/posts/user/:userId
- POST /api/auth/register/login, PUT /api/auth/profile, GET /api/auth/users/:id
- GET/POST/PUT/DELETE /api/comments, GET /api/comments/my
- POST /api/comments/:id/like
- GET/POST /api/follow/toggle, GET /api/follow/check
- GET/POST /api/bookmarks, /api/bookmarks/toggle/:postId, /api/bookmarks/check/:postId
- GET /api/search?q=
- POST /api/upload
- GET/POST/PUT/DELETE /api/events, GET /api/events/:id
- POST /api/events/:id/join|leave|check

## Known Issues
- 活动列表页 Events.vue 仍为前端静态数据，报名按钮未接后端（后端 /api/events 已完整）
- npm install/Invoke-WebRequest 网络受限，无法从终端访问外部 registry/CDN
- 浏览器可正常访问 cdn.bootcdn.net (Leaflet/Quill 通过 CDN 加载)
- 地图瓦片使用 tile.openstreetmap.fr/hot (法国OSM镜像)
- JWT_SECRET 硬编码默认值，生产需环境变量覆盖
- updatePost 动态字段 SQL 拼接存在注入风险，应参数化
- 富文本内容直接 v-html 渲染，未做 XSS 过滤
- main 分支领先 origin/main 5 个 [PMM] 同步提交，未推送
- stash@{0} 为已删除分支 codex/visual-design-upgrade 的 WIP，待处理

## Architecture
Frontend: Vue 3 + Vite 8 + Tailwind CSS 4 + Vue Router 5
Backend: Express + SQLite3 + JWT + bcrypt
CDN: cdn.bootcdn.net (Leaflet + Quill)
Map: Leaflet + OpenStreetMap (tile.openstreetmap.fr/hot)

## Phase 8 (2026-08-21) — 妙搭前端迁移 + 免费部署方案落地

**背景：** 用户将原站功能用妙搭重制为 React 19 前端（hiking-frontend-source.zip），确认走免费部署方案（Render 免费实例 + Turso + Cloudinary），后端留在本地仓库打补丁，前端迁移回本地 Vite 工程后按原架构部署（Netlify + Render）。

**后端改造（server/，已全链路验证）：**
- models/db.js 双模式：本地无 env 读 data/hikingchina.db；生产 TURSO_DATABASE_URL+TURSO_AUTH_TOKEN 走远程 libsql。统一 all/get/run async 接口，模型层签名不变
- 5 个模型 + 4 个路由内联 db（bookmarks/comments/posts/search）全部改为统一接口；rg 无残留
- services/upload.js provider：local 写盘 / cloudinary 直链（UPLOAD_PROVIDER 切换），5MB/9 张限制保留
- 补丁：/api/events 挂载、CORS 逗号分隔多域名（FRONTEND_URL）、生产 JWT_SECRET fail-loud、帖子查询补 status=1、events 建表 + signup_deadline 迁移、4 条活动 seed、旧 post17 标记删除、报名原子满员校验、删除帖子/活动显式级联清理
- 新依赖 @libsql/client 已加入 package.json 并安装验证

**前端迁移（hiking-new/frontend/，全新 Vite 7 + React 19 + TS + Tailwind 4 骨架）：**
- 三别名 @/@client/@shared 配齐；剥离全部 @lark-apaas 平台依赖（business-ui/入口/index.css/resolveAppUrl/avatar-service）
- utils/http.ts（VITE_API_BASE_URL + JWT hiking_token + 401 清会话）、api/index.ts（8 组路由）、hiking-store.ts 35 个函数改异步 API 调用（snake→camel 映射）
- 18 个调用方文件适配 async + loading/空态；新增 useAsyncData hook、共享 PostStats（异步评论数/作者头像）
- 图片上传改 multipart POST /api/upload；登录/注册存 JWT；localStorage 仅保留会话/草稿/最近浏览
- npm run type:check 零错误、vite build 成功；netlify.toml（SPA redirect + /api/* 反代到 Render）
- 修复 2 个运行时隐患：store 登录后未存 JWT token；发布页 createPost/createEvent 未 await

**交付物：** 部署指南-免费方案-Render-Turso-Netlify.md（Turso 建库导入/Render/Netlify/Cloudinary 配置 + 走查清单）

## Next Actions（2026-08-23）
- [ ] 立即轮换已截图暴露的 Cloudinary API Secret 和 JWT_SECRET，并更新 Render
- [ ] 将 Render `FRONTEND_URL` 改为 `https://hiking-china.netlify.app`
- [ ] 用 Render 中完全相同的 Turso URL/Token 执行 `npm run migrate:check` 和 `npm run migrate:apply`
- [ ] 清理公开 Git 历史中的数据库快照，并重置受影响用户密码
- [ ] 修复富文本存储型 XSS、上传 MIME 校验、hero 视频和 bundle 体积
- [ ] 上线前可选优化：hero 视频 16.9MB 改 poster 首屏 + 点击播放；单 chunk >500KB 做路由级 code-split
- [ ] 旧 Vue 前端保留于 git 历史（当前 Netlify 域名若在跑 Vue 版，替换前确认备份）
- [ ] 安全加固 backlog：updatePost SQL 参数化、富文本 XSS 过滤、敏感词、防爆破
- [ ] main 分支推送 origin

## Phase 8.1 (2026-08-23) — 资源上线准备

- 线上健康检查正常、4 条活动已 seed，但 `/api/posts` 返回空数组；确认旧帖未导入 Turso。
- Git 树核对完成：logo、favicon、静态帖图、活动图和既有上传图均已在 `origin/main` 与 React 前端 public 目录中。
- React `index.html` 补充 favicon fallback、apple-touch-icon、OG/Twitter 图片元数据。
- 新增 `server/scripts/migrate-local-to-turso.cjs` 和 npm migrate dry-run/check/apply 命令；导入前自动备份远端 JSON 快照，单批事务替换数据。
- 导入器默认隐藏本地测试帖 16/20，级联排除 3 条孤儿关系记录，保留 15 篇正式帖发布状态。
- 使用本地 `file:` SQLite 副本完成完整 apply 冒烟测试：外键检查为空，17 帖/11 评论/3 用户/4 活动/16 搜索索引导入成功。

## Phase 8.2 (2026-08-24) — 全链路体检

- 前端根路径 `CLIENT_BASE_PATH="/" 导致 withBasePath 生成协议相对地址 `//img/...`，是截图破图的根因；已改为根部署时使用空串并上线。
- 最新 Netlify 构建无 `//img/` 命中；Git 内全部 20 张前端图片在线上均为 HTTP 200 且 MIME 为 image/*。
- Render API 正常但冷启动约 22.7 秒；`/api/posts` 为空，用户仍是 `system` 和两个 API smoke 用户，证明 Render 所连库未收到本地快照导入。
- Render/Netlify 代理链路补充 `trust proxy`，避免全站共享一个限流桶；Netlify 增加 `/uploads/*` 反代，旧上传已返回 image/png。
- 公开 GitHub 仓库曾跟踪 SQLite 快照；当前 HEAD 已停止跟踪，但历史仍含用户邮箱/密码哈希，需要清理历史并轮换凭据。
- Render 环境截图暴露 Cloudinary API Secret 和 JWT_SECRET；必须立即轮换。`FRONTEND_URL` 仍为 localhost，生产 Origin 的 CORS 未放行。
- React 帖子/活动/编辑预览仍直接渲染数据库 HTML，存在存储型 XSS；上传解析只校验扩展名，未校验 MIME/文件头。

## Risks（2026-08-23 更新）
- Render 免费实例：15 分钟空闲休眠 → 首次访问冷启动 30-60s；无持久磁盘 → 已用 Turso+Cloudinary 规避
- 新前端依赖真实后端：本地无 API 时页面显示空态/错误（静态种子已删除）
- 帖子点赞按钮当前为本地语义（未接 API），后端 like/toggle 已具备，后续可接线
- frontend/ 尚未提交 git（含 node_modules 需 gitignore）
