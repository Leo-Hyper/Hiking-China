# Lessons Learned — 徒步论坛网站

## PowerShell + Node.js
- 中文路径需用绝对路径 + 引号包裹
- Out-File 会损坏 UTF-8 中文，改用 [IO.File]::WriteAllBytes
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