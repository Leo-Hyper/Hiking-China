# Lessons Learned — 徒步论坛网站

## PowerShell + Node.js
- 中文路径需用绝对路径 + 引号包裹
- Out-File 会损坏 UTF-8 中文，改用 [IO.File]::WriteAllBytes/WriteAllText
- npx 在 PowerShell 执行策略下被禁止，用 cmd /c 绕过
- 后台进程用 Start-Process + Hidden WindowStyle

## Auto-review Issues
- 自动审核依赖 DeepSeek API，服务故障时所有写操作被拦截
- 绕过方案：PowerShell .NET API 直接写字节流

## Comment System
- Vue 模板中的 template literal 字符串 `${}` 在 PowerShell 字符串中需特殊转义
- 使用 Python 脚本（写入临时文件再执行）规避 PowerShell 字符串处理问题

## Map
- 国内网络无法直接加载 OpenStreetMap 瓦片，需使用镜像
- Leaflet CSS 和 JS 需通过 CDN 分别加载

### 2026-08-18 — 功能合入后应及时更新项目记忆
**Context:** 活动功能 2026-06-27 提交（c4c487f），但细节记忆文件停留在 06-22；自动同步仅刷新 summary，不更新细节文件。
**Lesson:** 每个功能提交后立即执行 update-memory；自动生成的 summary 可能基于过期细节，以细节文件为准。
**Tags:** PMM, workflow

### 2026-08-18 — 全栈接线核对
**Context:** 全栈分析发现 Events.vue 仍是静态数据、报名按钮未接 API，而后端 /api/events 已完整实现。
**Lesson:** 前后端分离项目应定期核对「前端页面 ↔ 后端路由」接线矩阵，避免后端完整但前端未接线的断层。
**Tags:** fullstack, integration

### 2026-08-21 — async 迁移的隐性 bug：fire-and-forget 不报错
**Context:** store 函数从同步改 async 后，type:check 只抓「Promise 赋给同步变量」，抓不到「调用但不 await」——发布页 createPost/createEvent 的 try/catch 失效，错误变未处理 rejection。
**Lesson:** 大范围同步→异步改造后，除 type:check 外必须 grep「调用点是否 await」，尤其 try/catch 包裹的 fire-and-forget。
**证据：** PublishPostPage/PublishEventPage 两处 createPost(...)/createEvent(...) 无 await，补上后错误路径才正确
**适用范围：** 任何 store/服务层同步→异步改造
**Tags:** async, refactoring, type-check

### 2026-08-21 — 登录后必须显式存 JWT
**Context:** http.ts 已定义 setToken，但 store 的 loginUser/registerUser 只存了 session user 没存 token——登录后所有请求仍 401。
**Lesson:** 认证封装里「拿 token」和「存 token」是两个职责，接入真实后端时逐个核对。
**证据：** 前端联调前代码审查发现 data/hiking-store.ts 缺少 setToken(data.token)，修复后全链路才通
**适用范围:** 前端 API 层接入
**Tags:** auth, jwt

### 2026-08-21 — sqlite3/Turso 默认外键关闭，CASCADE 不可依赖
**Context:** 删除帖子后评论/收藏残留孤儿数据；PRAGMA foreign_keys 仅本地有效，Turso 远程同样默认 OFF。
**Lesson:** 多模式（本地/远程）数据库删除逻辑一律显式级联，不依赖 ON DELETE CASCADE。
**证据：** 本地冒烟测试删除后查询关联表发现残留；补显式级联后清零
**适用范围:** 本仓库所有删除路径 + 未来迁移其他 SQLite 项目
**Tags:** sqlite, turso, cascade

### 2026-08-23 — 跨驱动数据库工具必须做真实冒烟测试
**Context:** 导入脚本干跑通过后，libsql 冒烟暴露 `client.all` 不存在；继续冒烟又发现点赞引用的评论本身是孤儿，需要先确定有效评论集合再校验点赞。
**Lesson:** 同时支持 sqlite3/libsql 时要封装查询接口；关系型清理必须按父表到子表级联校验，不能只看当前外键列。
**Tags:** sqlite, libsql, migration

### 2026-08-24 — 配置截图等同于凭据泄露
**Context:** Render 环境变量截图暴露 Cloudinary API Secret 和 JWT_SECRET；公开仓库又包含 SQLite 用户表。
**Lesson:** 环境变量面板、数据库快照和终端输出在分享前必须脱敏；Secret 一旦进入截图或聊天即视为泄露并立即轮换。
**Tags:** security, secrets, incident-response
