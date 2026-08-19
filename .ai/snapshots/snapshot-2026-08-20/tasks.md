# Tasks — 徒步论坛网站 (Updated 2026-08-18)

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
- [x] Phase 5: 评论二级扁平嵌套重构 + 编辑/删除 + 级联清理
- [x] Phase 6: 搜索/导航优化 (SearchOverlay 修复 + Forum 搜索栏 + Footer 动态化)
- [x] Phase 7: 活动功能完整实现 (events 表 + event_registrations 表 + CRUD/报名 API)
- [x] Phase 7: 发起活动页 PublishEvent.vue
- [x] Phase 7: 图片 URL 工具函数 src/utils/image.js
- [x] 发帖 extrainfo 数据链路验证（2026-06-27 全栈分析确认 buildExtrainfo → DB → PostDetail 链路完整）
- [x] 项目全栈分析 + 输出项目详情文档 (徒步论坛网站_项目详情文档.md)

## 🚧 In Progress
（无）

## 📋 Backlog
- [ ] 活动列表页 Events.vue 接入 /api/events（当前为静态数据）+ 报名按钮对接后端
- [ ] 安全加固：JWT_SECRET 移至环境变量
- [ ] 安全加固：updatePost SQL 拼接改参数化查询
- [ ] 安全加固：富文本 v-html 增加 XSS 过滤
- [ ] 敏感词过滤 (AC 自动机)
- [ ] 防暴力破解 (登录失败计数)
- [ ] 分页限制
- [ ] 图片上传前端压缩 (Canvas WebP)
- [ ] 数据导出/注销账号
- [ ] 用户足迹地图功能
- [ ] 帖子附加信息表单 (发布页已实现, 编辑页已完成)
- [ ] main 分支推送 origin（领先 5 个提交）
- [ ] 处理 stash@{0}（visual-design-upgrade WIP）或清理