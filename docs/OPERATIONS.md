# 徒步中国运维手册

## 健康检查

- 接口：`GET /api/health`
- 检查内容：数据库连接、服务版本、提交 SHA、运行环境。
- 生产探针建议：Better Stack 或 UptimeRobot，每 5 分钟检查一次首页和健康接口。
- 告警：通过 `OPS_FEISHU_WEBHOOK` 发送到飞书。

## 错误监控

- 后端：`SENTRY_DSN`
- 前端：`VITE_SENTRY_DSN`
- 可选采样率：`SENTRY_TRACES_SAMPLE_RATE`、`VITE_SENTRY_TRACES_SAMPLE_RATE`
- 每个 API 响应包含 `X-Request-Id`，错误响应包含 `request_id`。

## 邮箱验证码

- 注册、未验证账号登录、个人中心重发都会走 6 位邮箱验证码。
- 验证码有效期 10 分钟，最多尝试 5 次，同一账号 60 秒内只能重发一次。
- 数据库只保存 `HMAC-SHA256(user_id + code)`，不保存明文验证码。
- 生产环境使用 `EMAIL_CODE_SECRET`；未配置时回退到 `JWT_SECRET`。两者都未配置时服务会在生产启动阶段拒绝启动。
- 邮件通过 Brevo HTTPS API 发送，需要 `BREVO_API_KEY` 与已验证的 `MAIL_FROM`。
- `dev_verification_code` 只在 `NODE_ENV=development|test` 时返回，生产环境不会返回。
- 旧的 `/verify-email?token=...` 链接仍保留兼容，但新流程不再生成链接。

## 路线轨迹与数据来源

- `routes.data_source`：`''` 表示未上传轨迹，`osm+srtm` 表示 OSM 路径 + SRTM 30m 高程，`gpx` 表示管理员/作者上传的 GPX。
- 没有轨迹的路线（例如四姑娘山大峰）显示“该路线暂未上传 GPX 轨迹”，不再生成示例轨迹。
- OSM 数据由 `scripts/fetch-osm-cache.ps1` 缓存原始 relation，再由 `scripts/build-osm-routes.cjs` 聚合并采样高程，最终写入 `models/osm-routes.json`。
- 服务启动时 `applyOsmRoutes()` 按路线名称导入或更新，`data_version=1` 后不会重复覆盖；如需重新导入，把对应路线的 `data_version` 置为 0。
- OSM 路径遵循 ODbL，页面与地图保留 OpenStreetMap 署名；底图使用 MapTiler Outdoor，需配置 `VITE_MAPTILER_KEY`。
- `routes.is_sample` 仅作为历史兼容字段保留，新数据不再使用示例轨迹。

## 备份

环境变量：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BACKUP_DIR`
- `BACKUP_ENCRYPTION_RECIPIENT`，配置后使用 `age` 加密

执行：

```powershell
npm run backup:turso
```

保留策略：

- 每日备份保留 30 天
- 每月备份保留 12 个月
- 备份文件不得提交到 Git

## 恢复流程

1. 停止写入或进入维护模式。
2. 选择最近可用的备份并解密。
3. 在独立 Turso 测试库先执行恢复演练。
4. 验证用户、帖子、评论、活动和互动关系数量。
5. 通过迁移脚本切换生产数据源。
6. 运行健康检查和关键 E2E。
7. 记录恢复时间、原因和影响范围。

## 发布门禁

每个阶段只推送一次 `main`。推送前必须通过：

- 前端 `npm run type:check`
- 前端 `npm run build`
- 后端语法检查
- 迁移 dry-run 和回滚检查
- 本阶段 Playwright 回归
- `npm audit --omit=dev`

只有线上不可用、数据损坏或安全问题时才允许额外 hotfix。
