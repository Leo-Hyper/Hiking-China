# Changelog — 徒步论坛网站

## 2026-06-18 — 初始重构 & 代码审查修复

### 新增
- hiking-new/（Vue 3 + Vite + Tailwind CSS 4 项目）
- .ai/ PMM 项目记忆文件
- public/favicon.svg（山形 Logo）

### 变更
- PostCard.vue、RouteCard.vue 路由硬编码 → 动态路由
- postContent.js 1 条 → 补全 15 条帖子内容

### 删除
- Header.vue、BackToTop.vue（死代码）
- posts.json（死数据）

---

## 2026-06-18 — 生产部署

### 新增配置
- netlify.toml（base: hiking-new, command: npm run build, publish: dist）

### 部署
- Git 仓库初始化 + GitHub 远程
- Netlify 生产部署上线
- 持续部署已启用

### 站点
- 地址: https://genuine-meringue-dfd78e.netlify.app/
- 仓库: https://github.com/Leo-Hyper/Hiking-China

---

## 2026-06-18 — 图片压缩优化

### 工具
- sharp 批量压缩脚本

### 结果
- 20 张图片：13.06MB → 1.81MB（-86.1%）
- JPEG 压缩 quality 80，PNG quality 80，最大宽度 1920px
