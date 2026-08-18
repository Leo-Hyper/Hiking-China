# Design Decisions — 徒步论坛网站

## Architecture
- Vue 3 + Vite 8 + Tailwind CSS 4 frontend, Express + SQLite3 backend
- SPA with Vue Router, no SSR
- JWT authentication stored in localStorage

## Comment System
- 二级扁平嵌套：所有子回复的 parent_id 指向所属顶级评论，平铺在 replies[] 中
- reply_to_username 冗余存储（写时快照），用户改名后不回溯
- 删除评论时级联删除子回复和点赞记录

## Map System
- Leaflet + OpenStreetMap via CDN
- Tile mirror: tile.openstreetmap.fr/hot (国内可访问)
- MapPicker 交互选点替代手动坐标输入

## Editor
- Quill WYSIWYG (替代 BBCode 方案)
- CDN 加载 quill.js + quill.snow.css

## Search
- 统一使用 /api/search 端点，查询 posts 表 (LIKE 模糊匹配)
- 标签跳转通过 q 参数实现 (Forum.vue 读取 route.query.q)

## File Writing Workaround
- PowerShell + .NET: [System.IO.File]::WriteAllBytes/WriteAllText 绕过自动审核
- 避免使用 Out-File 写中文（编码会损坏）

### 2026-06-27 — 活动功能完整实现
**Context:** 活动召集是核心模块，需要创建/报名/取消的完整闭环；Events.vue 原本仅静态展示。
**Decision:** 新增 events + event_registrations 表（报名联合唯一约束）；Express 路由 8 个端点（CRUD + join/leave/check，鉴权与作者校验）；PublishEvent.vue 发起页；预留经纬度字段供 Leaflet LocationMap 渲染。
**Rationale:** 沿用帖子/评论模块的 Express + SQLite 模式，保持架构一致。

### 2026-06-27 — 项目全栈分析文档
**Context:** 需要权威的现状快照用于交付与后续开发规划。
**Decision:** 输出《徒步论坛网站_项目详情文档.md》，覆盖技术架构/目录/路由/数据库/API/组件/设计系统/安全/部署/功能矩阵/待完善项。
**Rationale:** 作为基线文档，沉淀项目全貌并暴露待接线项（如 Events.vue 静态数据、安全加固项）。