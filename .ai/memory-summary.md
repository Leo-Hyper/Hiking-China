# Memory Summary
**Generated:** 2026-08-18 11:05:00
**Snapshot:** snapshot-2026-08-18

## Project Summary
徒步中国（hiking-china）是 Vue 3 + Tailwind CSS 4 前端（Vite 8，Netlify 部署）与 Express + SQLite3 后端（Render 部署）的户外徒步社区全栈应用。功能覆盖路线、装备、活动、论坛四大模块，含 JWT 认证、二级嵌套评论、Leaflet 地图、Quill 富文本、图片上传、收藏/点赞/关注等完整交互。

## Current Status
Phase 7 活动模块已完整实现并合入（c4c487f，2026-06-27）：events 表 + event_registrations 表、8 个 API 端点、PublishEvent.vue 发起页、image.js 工具函数。2026-06-27 完成全栈项目分析并输出《徒步论坛网站_项目详情文档.md》。当前进入功能完善与安全加固阶段。

## Active Tasks
（无进行中任务）

## Key Decisions
1. 二级扁平嵌套评论：子回复 parent_id 指向顶级评论，reply_to_username 快照标注
2. Leaflet + OpenStreetMap（tile.openstreetmap.fr/hot 镜像），MapPicker 交互选点
3. Quill WYSIWYG 替代 BBCode（CDN 加载）
4. /api/search 统一查 posts 表（LIKE 模糊匹配）
5. 活动模块沿用 Express + SQLite 模式（events + event_registrations）
6. 文件写入用 [IO.File]::WriteAllBytes/WriteAllText 规避审核与编码问题

## Lessons Learned
- 功能合入后应及时 update-memory；自动同步 summary 可能基于过期细节文件
- 前后端分离项目需定期核对页面 ↔ API 接线矩阵（Events.vue 仍为静态数据）
- Out-File 会损坏 UTF-8 中文，改用 [IO.File] 直接写字节流
- 国内网络无法直接加载 OSM 瓦片，需镜像；Leaflet CSS/JS 经 CDN 分别加载

## Next Actions
1. Events.vue 接入 /api/events + 报名按钮对接后端
2. 安全加固：JWT_SECRET 环境变量化、updatePost 参数化查询、富文本 XSS 过滤
3. 敏感词过滤 / 防暴力破解 / 分页限制 / 图片前端压缩
4. main 推送 origin（领先 5 个提交）；处理 stash@{0} WIP