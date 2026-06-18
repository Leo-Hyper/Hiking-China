# Tasks — 徒步论坛网站

## Done
- [x] 审查原站结构（20 个 HTML，14.5MB 图片）
- [x] 选择技术方案 A（Vue 3 + Vite + Tailwind）
- [x] 搭建项目脚手架（hiking-new/）
- [x] 配置 Tailwind CSS 4 + PostCSS
- [x] 设计新视觉系统（森林系杂志风格）
- [x] 创建 6 个页面组件（Home/Routes/Forum/Gear/Events/PostDetail）
- [x] 创建 5 个公共组件（Header/Footer/Hero/PostCard/RouteCard）
- [x] 替换 Unsplash 占位图为本地 img/ 素材
- [x] 迁移 15 个帖子详情页内容
- [x] 修复构建错误（模板语法、换行字面量、引号嵌套）
- [x] 构建验证通过
- [x] 全栈代码审查（第 1 轮）：发现 6 个问题
- [x] 修复 PostCard.vue、RouteCard.vue 路由硬编码
- [x] 补全 postContent.js 全部 15 条帖子数据
- [x] 创建 favicon.svg（山形 SVG 图标）
- [x] 删除死代码：Header.vue、BackToTop.vue、posts.json
- [x] 全栈代码审查（第 2 轮）：全部通过
- [x] 初始化 Git 仓库并首次提交
- [x] GitHub 仓库创建：Leo-Hyper/Hiking-China
- [x] Netlify 生产部署上线
- [x] 图片压缩优化：13MB → 1.8MB（-86%）
- [x] 搜索功能：模糊匹配 + 加权排序 + Ctrl+K 快捷键
- [x] 后端 API（Express + SQLite + JWT 认证）
- [x] 前端登录/注册/个人中心
- [x] 搜索 API 集成（替代本地索引）
- [x] Render 后端部署 + CORS 配置
- [x] 修复 netlify.toml BOM 问题
- [x] 修复 SPA 路由 404（netlify.toml redirects）
- [x] 修复 Render 冷启动问题（fetch 重试机制）

## Todo
- [ ] PWA 支持
- [ ] PostDetail.vue 大体积懒加载优化
- [ ] 设置 UptimeRobot 定时 ping Render 后端
- [ ] 评估迁移到 Railway/Vercel（替代 Render 免费版休眠问题）
