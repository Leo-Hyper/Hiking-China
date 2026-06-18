# Lessons — 徒步论坛网站

## 2026-06-18 — Tailwind CSS v4 语法迁移
**Context:** 从 v3 的 @tailwind 指令迁移到 v4 的 @import 'tailwindcss'

**Lesson:** v4 使用 CSS-first 配置，需要在 @theme 块中定义颜色和字体

**Tags:** tailwindcss, css, migration

## 2026-06-18 — PowerShell heredoc 换行陷阱
**Context:** 多次使用 Set-Content 写入文件时，"n" 字面量未能正确转换为实际换行

**Lesson:** PowerShell heredoc 中的换行处理不可靠，应优先使用 node fs.writeFileSync

**Tags:** powershell, encoding, scripting

## 2026-06-18 — Vite 公共目录图片解析
**Context:** 使用 "/img/xxx.jpg" 引用图片时 Vite 无法解析

**Lesson:** 需要将图片复制到项目的 public/img/ 目录下

**Tags:** vite, images, build-tool
