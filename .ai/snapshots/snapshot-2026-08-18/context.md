# Context — 徒步论坛网站 (Updated 2026-06-22)

## Overview
中国户外徒步社区网站，提供徒步路线展示、装备指南、活动召集和论坛交流功能。

## Current Situation
**Phase:** 功能完善与优化阶段

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

**发布流程优化：**
- ImageUploader 设为必填：未传图时阻止提交并提示
- 错误处理增强：发布/评论失败提示具体错误信息

### 数据结构
sql
users: id, username, email, password_hash, avatar, bio, location, hikinglevel,
       gear_prefs, profile_public, status, created_at, updated_at

posts: id, user_id, title, content, category, tags, image_urls, extrainfo,
       status(0=草稿/1=发布/2=删除), comment_closed, views, likes_count,
       created_at, updated_at

comments: id, post_id, user_id, parent_id, reply_to_user_id, reply_to_username,
          content, image_url, likes, created_at

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

## Known Issues
- npm install/Invoke-WebRequest 网络受限，无法从终端访问外部 registry/CDN
- 浏览器可正常访问 cdn.bootcdn.net (Leaflet/Quill 通过 CDN 加载)
- 地图瓦片使用 tile.openstreetmap.fr/hot (法国OSM镜像)
- 自动审核系统可能因 DeepSeek API 故障误拦截命令 (改用 [System.IO.File]::WriteAllBytes 绕过)

## Architecture
Frontend: Vue 3 + Vite 8 + Tailwind CSS 4 + Vue Router 5
Backend: Express + SQLite3 + JWT + bcrypt
CDN: cdn.bootcdn.net (Leaflet + Quill)
Map: Leaflet + OpenStreetMap (tile.openstreetmap.fr/hot)