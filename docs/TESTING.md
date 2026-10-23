# 测试运行说明

## 前置条件

- Node.js 22+
- 已完成 `hiking-new/frontend` 与 `hiking-new/server` 的依赖安装
- 已安装 Playwright Chromium：

```powershell
cd hiking-new/frontend
npx playwright install chromium
```

如果官方下载源较慢，可使用镜像：

```powershell
$env:PLAYWRIGHT_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors/playwright'
npx playwright install chromium
```

## 运行 E2E

```powershell
cd hiking-new/frontend
npm run e2e
```

Playwright 会自动：

1. 启动 `hiking-new/server/scripts/e2e-server.cjs`，在 `.tmp/` 下创建独立 SQLite 测试库；
2. 启动 Vite 开发服务器；
3. 依次运行 13 条核心用例（验证码注册、发帖与路线关联、活动、后台、移动端、路线详情、GPX 解析、路线管理、结伴统计）。

验证码流程在测试环境会从注册响应读取 `dev_verification_code`，生产环境不会返回该字段。

常用命令：

```powershell
npm run e2e -- tests/e2e/auth.spec.ts
npm run e2e:ui
npm run e2e:report
```

## 端口约定

| 服务 | 端口 |
|------|------|
| 测试 API | 3101 |
| 测试前端 | 5173 |

运行 E2E 前不要占用这两个端口。Playwright 配置为不复用已有服务，避免误连到开发库或生产 API。

## 测试账号

仅存在于本地测试库：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 普通用户 | `e2e-user@example.com` | `E2ePassw0rd!` |
| 另一普通用户 | `e2e-other@example.com` | `E2ePassw0rd!` |
| 管理员 | `e2e-admin@example.com` | `E2ePassw0rd!` |

这些账号不会写入生产数据库，也不要用于线上环境。

## 测试数据

`e2e-server.cjs` 每次运行会创建新的 `.tmp/e2e-*.db`，包含：

- 3 个已验证邮箱用户（含 1 个管理员）
- 4 篇帖子（含 1 篇草稿、1 篇结伴帖，其中 1 篇关联四姑娘山路线）
- 2 个活动（其中 1 个满员）
- 1 条待处理举报

测试库与开发库通过 `LOCAL_DB_PATH` 隔离，不会修改 `hiking-new/data/hikingchina.db`。

## CI

`.github/workflows/ci.yml` 中的 `e2e` job 会：

- 安装前后端依赖
- 安装 Chromium
- 运行 `npm run e2e`
- 失败时上传 `playwright-report` 与 `test-results`

CI 使用独立的 SQLite 测试库，不连接 Turso 或生产 API。

## 常见问题

### 端口被占用

关闭本地 3101 / 5173 上的进程后重试。E2E 不复用已有服务，避免测试数据写错库。

### 浏览器未安装

```powershell
cd hiking-new/frontend
npx playwright install chromium
```

### 用例在发帖步骤失败

- 确认使用 preset 图片，不依赖 Cloudinary。
- Quill 是 contenteditable，测试通过点击 `.ql-editor` 后键盘输入。

### 活动用例找不到目标活动

活动列表每页 3 条，E2E 活动排在第二页。用例已点击“下一页”，如果数据顺序变化需要同步调整。
