# Lessons — 徒步论坛网站

## 2026-06-18 — Tailwind CSS v4 语法迁移
**Lesson:** v4 使用 CSS-first 配置，@theme 块定义颜色和字体

## 2026-06-18 — PowerShell heredoc 换行陷阱
**Lesson:** PowerShell heredoc 中的换行处理不可靠，应优先使用 node fs.writeFileSync

## 2026-06-18 — Vite 公共目录图片解析
**Lesson:** 图片需复制到 public/img/ 目录

## 2026-06-18 — postContent.js 数据完整性检查
**Lesson:** 数据迁移后必须逐一验证 key 与内容的匹配完整性

## 2026-06-18 — 图片压缩优化
**Lesson:** sharp 批量压缩 quality 80 + 1920px 最大宽度，节省 86%

## 2026-06-18 — Netlify 部署配置陷阱
**Lesson:** TOML 文件不能有 BOM，需放在仓库根目录

## 2026-06-18 — 搜索数据层抽象
**Lesson:** postIndex.js 抽象层便于后续替换为 API

## 2026-06-19 — localStorage 不触发 Vue 响应式
**Lesson:** localStorage.setItem 不会触发 computed/watch，必须用 Vue ref 管理状态并通过 watch 同步

## 2026-06-19 — SQLite 数组字段必须 JSON 序列化
**Lesson:** SQLite 不原生支持数组，tags 和 image_urls 必须用 JSON.stringify/JSON.parse 转换，否则存为 "[object Object]"

## 2026-06-19 — SQLite IS NULL 查询陷阱
**Lesson:** `WHERE parent_id IS 'NULL'` 永远匹配不到 NULL 值，必须用 `IS NULL` 关键字而非字符串

## 2026-06-19 — Vite HMR 不会重新读取 .env
**Lesson:** 修改 .env.development 后必须完全重启 Vite 进程才能生效

## 2026-06-19 — onMounted 不响应路由参数变化
**Lesson:** Vue Router 同组件路由切换（/post/1 → /post/2）不触发 onMounted，必须用 watch(route.params.id)
