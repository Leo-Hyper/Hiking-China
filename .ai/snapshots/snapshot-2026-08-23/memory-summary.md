# Memory Summary
**Generated:** 2026-08-21
**Snapshot:** snapshot-2026-08-21

## Project Summary
中国户外徒步社区网站（徒步中国）：徒步路线展示、装备指南、活动召集与论坛交流。
原 Vue 3 前端已由妙搭重制为 React 19 前端并迁移回本地（`hiking-new/frontend/`，Vite 7 + TS + Tailwind 4），
后端为 Express + SQLite（本地）/ Turso（生产）+ JWT + bcrypt，上传走 local（开发）/ Cloudinary（生产）。
2026-08-21 完成「妙搭前端迁移 + 免费部署方案」（Phase 8）：前端 35 个 store 函数全部异步接真实 REST API，
后端补全 events 挂载/建表/种子、JWT_SECRET fail-loud、CORS 多源、status 过滤、原子满员校验、显式级联删除。
部署链路：Netlify（前端）→ Render 免费实例（后端）→ Turso（数据库）+ Cloudinary（图片）。

## Current Status
**Phase:** Phase 8 代码与自测已完成，待上线部署。

### 已完成（2026-08-21）
- 后端存储层双模式（本地 SQLite / Turso 远程），统一 `all/get/run` 接口，模型层零签名改动
- 后端补丁：`/api/events` 挂载、events/event_registrations 建表 + 4 条活动 seed、JWT_SECRET env fail-loud、CORS 逗号多源、帖子 `status=1` 过滤、报名原子满员校验、删除显式级联
- 上传 provider（local/cloudinary，`UPLOAD_PROVIDER` 切换），5MB/9 张限制保留
- 前端迁移：Vite 7 + React 19 骨架、剥离全部 `@lark-apaas`、`http.ts` + `api/index.ts` + `hiking-store.ts` 35 函数异步化、18 个调用方适配
- `npm run type:check` 零错误、`vite build` 成功；后端 curl 全链路（含满员拒绝/取消重报）通过
- 交付《部署指南-免费方案-Render-Turso-Netlify.md》与 `frontend/netlify.toml`
- 本地 DB 保持干净：17 帖 / 3 用户 / 12 评论 / 4 活动

### 数据结构
- `users`（含 location/hikinglevel/gear_prefs/profile_public/status）、`posts`（含 extrainfo/status/comment_closed/likes_count）、`comments`（二级扁平嵌套 + reply_to_username + image_url）
- `events`（含 signup_deadline）+ `event_registrations`（UNIQUE event_id+user_id）
- 互动表：`post_likes`、`comment_likes`、`followers`、`bookmarks`、`search_index`

### API 路由（8 组）
- auth：register/login/me/profile/users/:id
- posts：CRUD + my + user/:userId + like/toggle + like/check
- comments：CRUD + like（toggle）+ like/check
- events：CRUD + join/leave/check
- follow：toggle/check；bookmarks：toggle/check/list
- search：`?q=`；upload：multipart 5MB×9

## Active Tasks
- 上线部署：Turso 建库导入 → Render 后端 → Netlify 前端 → 全链路走查（In Progress）
- Backlog：hero 视频优化、路由 code-split、帖子点赞接 API、安全加固（SQL 参数化/XSS/敏感词/防爆破）、推送 origin

## Key Decisions（最近 5 条）
1. 免费部署方案确定：Turso + Cloudinary（Render 免费实例无持久磁盘）— ✓ 已确认
2. 妙搭只交付前端，后端补丁在本地仓库做（避免两套后端分叉）— ✓ 已确认
3. 删除数据显式级联（sqlite3/Turso 默认 foreign_keys=OFF，CASCADE 不可依赖）— ✓ 已确认
4. 前端迁移用自建 Vite 骨架（妙搭工程私有依赖外部无法安装）— ✓ 已确认
5. 生产 JWT_SECRET fail-loud — ✓ 已确认

## Next Actions
- 用户按部署指南完成 Turso/Render/Netlify/Cloudinary 配置并上线
- 部署后改 `frontend/netlify.toml` 反代目标为实际 Render 域名
- 可选：hero 视频 poster 化、路由级 code-split
- 保持 Vue 旧前端 git 备份；安全加固 backlog
