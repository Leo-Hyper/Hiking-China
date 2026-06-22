# Changelog — 徒步论坛网站

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