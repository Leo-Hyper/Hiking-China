# 预发布环境

预发布环境不接入自动分支部署，避免消耗 Netlify 构建额度和产生不可控生产流量。

## 组成

- 前端：本地 `npm run build` 后手动部署，或使用独立 Netlify 站点手动发布 `dist/`。
- 后端：独立 Render 服务，连接独立 Turso 测试库。
- 数据：只使用脱敏或合成数据，不连接生产 Turso。

## 环境变量

- `APP_BASE_URL`：预发布前端域名
- `FRONTEND_URL`：预发布前端域名，供 CORS 使用
- `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`：独立测试库
- `SMTP_*`：测试邮件或开发模式
- `SENTRY_DSN`：标记为 staging 环境

## 发布流程

1. 本地完成阶段内所有小切片。
2. 本地运行类型检查、构建、后端冒烟和迁移 dry-run。
3. 部署到预发布环境并执行关键 Playwright 用例。
4. 预发布通过后，才允许阶段生产推送。
5. 预发布环境保留最近一个可回滚版本。
