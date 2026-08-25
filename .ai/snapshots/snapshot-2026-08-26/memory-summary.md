# Memory Summary
**Generated:** 2026-08-24
**Snapshot:** snapshot-2026-08-24

## Project Summary
中国户外徒步社区网站（徒步中国）：徒步路线展示、装备指南、活动召集与论坛交流。
原 Vue 3 前端已由妙搭重制为 React 19 前端并迁移回本地（`hiking-new/frontend/`，Vite 7 + TS + Tailwind 4），
后端为 Express + SQLite（本地）/ Turso（生产）+ JWT + bcrypt，上传走 local（开发）/ Cloudinary（生产）。
2026-08-21 完成「妙搭前端迁移 + 免费部署方案」（Phase 8）：前端 35 个 store 函数全部异步接真实 REST API，
后端补全 events 挂载/建表/种子、JWT_SECRET fail-loud、CORS 多源、status 过滤、原子满员校验、显式级联删除。
部署链路：Netlify（前端）→ Render 免费实例（后端）→ Turso（数据库）+ Cloudinary（图片）。

## Current Status
**Phase:** Phase 8.2 全链路体检完成；前端资源已恢复，安全轮换和 Turso 导入待处理。

### 已完成（2026-08-23）
- 后端存储层双模式（本地 SQLite / Turso 远程），统一 `all/get/run` 接口，模型层零签名改动
- 后端补丁：`/api/events` 挂载、events/event_registrations 建表 + 4 条活动 seed、JWT_SECRET env fail-loud、CORS 逗号多源、帖子 `status=1` 过滤、报名原子满员校验、删除显式级联
- 上传 provider（local/cloudinary，`UPLOAD_PROVIDER` 切换），5MB/9 张限制保留
- 前端迁移：Vite 7 + React 19 骨架、剥离全部 `@lark-apaas`、`http.ts` + `api/index.ts` + `hiking-store.ts` 35 函数异步化、18 个调用方适配
- `npm run type:check` 零错误、`vite build` 成功；后端 curl 全链路（含满员拒绝/取消重报）通过
- 交付《部署指南-免费方案-Render-Turso-Netlify.md》与 `frontend/netlify.toml`
- 本地 DB 保持干净：17 帖 / 3 用户 / 12 评论 / 4 活动
- 线上核查：API 正常、4 活动已 seed、posts 为空；logo/favicon 和静态图片已在仓库与构建输入中
- 新增备份型 SQLite→Turso 导入工具，默认隐藏测试帖并级联清理孤儿关系；本地副本 apply 冒烟通过
- 修复 `//img/...` 破图、代理限流和旧上传反流；全部 20 张 Git 内图片线上 200 且 MIME 正确
- Render 所连库仍是 seed/API 测试数据；Cloudinary/JWT Secret 已随截图暴露，公开 Git 历史含 SQLite 快照

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
- 立即轮换 Cloudinary API Secret 和 JWT_SECRET；设置生产 FRONTEND_URL
- 使用 Render 完全相同的 Turso URL/Token 执行 migrate:check/migrate:apply
- 清理公开 Git 历史中的 SQLite 快照并重置受影响账号
- 修复存储型 XSS、上传 MIME 校验、hero 视频和 bundle 体积
- Backlog：hero 视频优化、路由 code-split、帖子点赞接 API、安全加固（SQL 参数化/XSS/敏感词/防爆破）、推送 origin

## Key Decisions（最近 5 条）
1. 旧库导入使用远端备份 + 单事务批处理工具，默认隐藏测试帖并级联排除孤儿数据 — ✓ 冒烟通过
2. 免费部署方案确定：Turso + Cloudinary（Render 免费实例无持久磁盘）— ✓ 已确认
3. 妙搭只交付前端，后端补丁在本地仓库做（避免两套后端分叉）— ✓ 已确认
4. 删除数据显式级联（sqlite3/Turso 默认 foreign_keys=OFF，CASCADE 不可依赖）— ✓ 已确认
5. 前端迁移用自建 Vite 骨架（妙搭工程私有依赖外部无法安装）— ✓ 已确认

## Next Actions
- 用户在本地会话设置 Turso 连接变量，执行 migrate:check/migrate:apply 导入旧帖
- 推送提交后验证 Netlify 构建产物与线上帖子/图片/logo
- 部署后改 `frontend/netlify.toml` 反代目标为实际 Render 域名
- 可选：hero 视频 poster 化、路由级 code-split
- 保持 Vue 旧前端 git 备份；安全加固 backlog
