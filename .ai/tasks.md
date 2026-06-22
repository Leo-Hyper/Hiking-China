# Tasks — 徒步论坛网站 (Updated 2026-06-22)

## ✅ Completed
- [x] Phase 1: 数据层改造 (users/posts 扩展 + post_likes/bookmarks 表 + 索引)
- [x] Phase 1: user.js/post.js 模型适配 (getUserById/updateUserProfile 扩展 new fields)
- [x] Phase 1: auth.js PUT /profile 扩展 (location/hikinglevel/gear_prefs)
- [x] Phase 1: bookmarks.js 路由创建 (toggle/list/check)
- [x] Phase 1: posts.js 点赞路由 (like/toggle)
- [x] Phase 2: Quill WYSIWYG 编辑器 (RichEditor.vue + CDN + 图片粘贴上传)
- [x] Phase 2: 草稿自动保存 (localStorage 30s + beforeunload + 恢复)
- [x] Phase 2: PublishPost/EditPost 替换 BBCode → Quill
- [x] Phase 2: PostDetail 移除 BBCode, 直接 v-html
- [x] Phase 2: 删除 bbcode.js / BBCodeToolbar.vue
- [x] Phase 3: ProfilePage 4Tab 重写 (帖子/收藏/评论/资料)
- [x] Phase 3: 用户等级/所在地/装备偏好/隐私开关
- [x] Phase 3: UserProfilePage 等级徽章 + 装备展示
- [x] Phase 3: GET /api/comments/my 路由
- [x] Phase 4: Leaflet CDN (cdn.bootcdn.net)
- [x] Phase 4: RouteMap/LocationMap/MapPicker 组件
- [x] Phase 4: extrainfo 扩展表单 (路线/装备/活动)
- [x] Phase 4: 路线统计卡片 + 地图渲染

## 🚧 In Progress
- [ ] 发帖 extrainfo 数据链路验证 (buildExtrainfo → DB → PostDetail)

## 📋 Backlog
- [ ] 敏感词过滤 (AC 自动机)
- [ ] 防暴力破解 (登录失败计数)
- [ ] 分页限制
- [ ] 图片上传前端压缩 (Canvas WebP)
- [ ] 数据导出/注销账号
- [ ] 用户足迹地图功能
- [ ] 帖子附加信息表单 (发布页已实现, 编辑页已完成)