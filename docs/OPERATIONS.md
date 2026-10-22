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
