# 生产上线检查清单

> 目标：让线上站点达到“陌生人可以独立完成注册→验证→发帖→评论→报名”的状态。
> 适用：Render 静态站 + Render API + Turso + Cloudinary。

## 1. 环境变量

### 前端构建期（Render Static Site）

| 变量 | 期望值 | 验证方式 |
|------|--------|----------|
| `VITE_API_BASE_URL` | `https://hiking-china-api-sg.onrender.com` | 浏览器 Network 中 API 请求指向该域名 |
| `VITE_SENTRY_DSN` | Sentry 项目 DSN | 触发测试错误后 Sentry 有事件 |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0.05` | 无需人工验证 |
| `VITE_UMAMI_SCRIPT_URL` | Umami 脚本地址 | Network 中加载成功 |
| `VITE_UMAMI_WEBSITE_ID` | Umami 站点 ID | Umami 看板有访问 |
| `CLIENT_BASE_PATH` | `/` | 静态资源路径无 `//` |

### 后端（Render Web Service）

| 变量 | 期望值 | 验证方式 |
|------|--------|----------|
| `NODE_ENV` | `production` | `/api/health` 返回 environment=production |
| `PORT` | Render 注入 | 无需手动设置 |
| `JWT_SECRET` | 32 字节以上随机值 | 缺失时服务应启动失败 |
| `FRONTEND_URL` | 主站 + 旧入口，逗号分隔 | 浏览器无 CORS 报错 |
| `APP_BASE_URL` | `https://hiking-china.onrender.com` | 邮件链接与 sitemap 指向主站 |
| `TURSO_DATABASE_URL` | libsql URL | `/api/health` database=ok |
| `TURSO_AUTH_TOKEN` | Turso token | 同上 |
| `SENTRY_DSN` | Sentry 项目 DSN | 服务端测试异常可见 |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.05` | 无需人工验证 |
| `SMTP_HOST` | 邮件服务 SMTP 主机 | 验证邮件可收到 |
| `SMTP_PORT` | `465` 或 `587` | 同上 |
| `SMTP_SECURE` | `true` / `false` | 与端口匹配 |
| `SMTP_USER` | SMTP 用户名 | 同上 |
| `SMTP_PASS` | SMTP 密码/授权码 | 同上 |
| `MAIL_FROM` | `徒步中国 <no-reply@...>` | 发件人显示正确 |
| `BREVO_API_KEY` | Brevo v3 API Key（Transactional email 权限） | 注册验证邮件发送成功 |
| `UPLOAD_PROVIDER` | `cloudinary` | 上传返回 https 直链 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | 上传成功 |
| `CLOUDINARY_API_KEY` | Cloudinary key | 同上 |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | 同上 |

## 2. 安全响应头

当前 `client/public/_headers` 是 Netlify 格式，Render 不会自动应用。需要在 Render Static Site 的 Headers 配置或前置 Cloudflare 中设置：

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com https://api.maptiler.com https://tile.openstreetmap.fr https://*.tile.openstreetmap.fr https://tile.openstreetmap.org https://*.tile.openstreetmap.org; media-src 'self' https://res.cloudinary.com; font-src 'self' data:; connect-src 'self' https://hiking-china-api-sg.onrender.com https://api.maptiler.com https://cloud.umami.is https://gateway.umami.is https://*.sentry.io https://*.ingest.sentry.io; worker-src 'self' blob:; upgrade-insecure-requests
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

注意：

- 如果 Umami 是自托管，把 `cloud.umami.is` 换成实际域名。
- 如果 Sentry 使用自建域名，把 `*.sentry.io` 换成实际 ingest 域名。
- 先使用 `Content-Security-Policy-Report-Only` 观察 24 小时，再切换为强制模式。
- 不要直接复制 Netlify 的 `_headers` 到 Render 后假设已生效。

验证：

```powershell
curl -I https://hiking-china.onrender.com
```

应看到 CSP、HSTS、`X-Content-Type-Options`、`Referrer-Policy`。

## 3. Sentry

1. 在 Render 设置 `SENTRY_DSN`，在静态站设置 `VITE_SENTRY_DSN`。
2. 前端在控制台触发一次测试异常，确认 Sentry 收到 `captureException`。
3. 后端调用一个受控的测试路径或临时脚本，确认 Node 端上报。
4. 确认 `environment=production`、`release` 为当前 commit。

## 4. SMTP

> 重要：Render 免费实例的出站 SMTP 连接会被阻断（实测 587 端口 `ETIMEDOUT`）。生产优先使用 `BREVO_API_KEY` 走 Brevo HTTP API（HTTPS 443），SMTP 变量仅作为备用。

1. 配置 SMTP 变量并重新部署 API。
2. 注册一个新账号，确认收到验证邮件。
3. 点击验证链接，确认 `/api/auth/verify-email` 返回成功。
4. 走一次忘记密码→重置密码流程。
5. 检查垃圾箱；如果进入垃圾箱，补充 SPF/DKIM/DMARC。

## 5. Umami

1. 配置 `VITE_UMAMI_SCRIPT_URL` 与 `VITE_UMAMI_WEBSITE_ID`。
2. 打开首页，确认 Umami 看板出现 pageview。
3. 注册/登录，确认 `register_success` / `login_success` 事件出现。
4. 发帖、评论、报名，确认对应事件出现。
5. 确认 CSP 的 `script-src` 与 `connect-src` 已放行 Umami 域名。

## 6. 备份与恢复

1. 在 GitHub Secrets 配置 `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`。
2. 手动运行 `Backup Turso` workflow，确认 artifact 生成。
3. 下载备份，在本地测试库按表导入，确认行数与关键记录一致。
4. 不要把含用户邮箱/密码哈希的备份提交到仓库；artifact 保留 3 天。
5. 恢复前先在测试库演练，禁止直接覆盖生产。

## 7. 可用性监控

- 监控 `https://hiking-china.onrender.com`（HTTP 200）
- 监控 `https://hiking-china-api-sg.onrender.com/api/health`（status=ok、database=ok）
- 告警发送到常用邮箱
- Render 免费实例冷启动 30–60 秒，告警阈值不要设置得过紧

## 8. 演示就绪

- [ ] 首页、路线、论坛、活动、装备均有内容
- [ ] 演示账号已验证邮箱
- [ ] 演示账号可发帖、评论、报名
- [ ] 管理员账号可进入后台
- [ ] 移动端 390px 宽度无横向滚动
- [ ] 站点标题、favicon、OG 图正常

## 9. 发布后验证

```powershell
node scripts/check-production.cjs
```

脚本会检查主站、API 健康、sitemap 与关键安全头。

## 10. 路线/GPX 版本首次部署

1. 先执行一次 Turso 备份，确认快照可下载。
2. 部署 API；`initDb()` 会自动创建 `routes`、`route_favorites` 表，并在空表时写入 10 条种子路线。
3. 验证 `GET /api/routes` 返回 10 条路线，`GET /api/routes/1` 包含 `geojson` 与统计字段。
4. 部署前端，验证 `/routes` 列表和 `/routes/1` 详情；检查地图、海拔剖面、收藏与 GPX 导出。
5. 本次变更为增量建表，不删除旧表；回滚时先回滚前端和 API，再按需保留新表。
