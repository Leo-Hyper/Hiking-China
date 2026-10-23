# P0 / P1 实施计划

> 制定日期：2026-10-23
> 范围：E2E + CI、生产可用性与演示就绪、路线 GPX + 海拔剖面 + 收藏
> 预估：约 15 个工作日（按每天 4–6 小时有效开发）；全职投入可压缩到 2 周左右
> 原则：先加安全网，再动数据模型；每个阶段都必须可回滚、可验收

## 执行状态（2026-10-23）

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 0 | 完成 | 实施分支、测试库隔离、环境清单 |
| Phase 1 | 完成 | Playwright 11 条用例、CI e2e job、失败产物 |
| Phase 2 | 完成 | 生产清单、CSP/安全头、备份 workflow、检查脚本；线上变量与响应头已配置 |
| Phase 3 | 完成 | `routes` / `route_favorites` 表、API、静态路线迁移 |
| Phase 4 | 完成 | GPX 解析、简化、距离/爬升统计、管理员录入 |
| Phase 5 | 完成 | 路线详情、轨迹地图、海拔剖面、收藏与个人中心 Tab |
| Phase 6 | 完成 | 已合并到 main、部署到 Render，并完成线上验收 |

---

## 一、目标与边界

### 本期目标

1. 把 CI 从“静态检查”升级为“运行时门禁”，覆盖 6 条核心用户路径。
2. 让线上站点达到“陌生人可以独立完成注册→发帖→评论→报名”的演示状态。
3. 把路线从静态 `ROUTES_LIST` 升级为数据库实体，支持 GPX 解析、海拔剖面、自动统计和收藏。

### 本期不做

- 推荐系统 / 相似路线算法
- 技术博客与对外宣传
- 原生 App、实时聊天、微服务拆分
- 大规模内容运营和商业化

---

## 二、当前基线

| 项目 | 现状 | 对计划的影响 |
|------|------|--------------|
| CI | 已有 `type:check`、`build`、`node --check`、`npm audit` | 不需要从零建 CI，只需增加 E2E job |
| 自动化测试 | 无 Playwright / Vitest / Jest | 需要新增测试依赖与测试库 |
| 路线数据 | `RoutesPage` 直接 import 静态 `ROUTES_LIST` | GPX 前必须先做路线数据层 |
| 路线统计 | 距离、爬升为手填字符串 | 需要改为解析计算 + 可编辑 |
| 地图 | 帖子有 `RouteMap`，路线页无 GPX 轨迹 | 可复用 Leaflet，但要新增轨迹组件 |
| 收藏 | 只有帖子 `bookmarks` | 需要新增 `route_favorites` |
| 分析 | 已有 Umami 接入和 8 个埋点 | 缺环境配置、事件字典和看板 |
| 监控 / 邮件 | Sentry 与 Nodemailer 均按环境变量启用 | 需要在 Render 逐项验证 |
| CSP | `_headers` 已写，但 Render 未下发 | 需要改用 Render/Cloudflare 配置 |
| 数据库 | 本地 SQLite / 生产 Turso 双模式，支持 `LOCAL_DB_PATH` | E2E 可用独立测试库，不影响开发数据 |

---

## 三、总体排期

| 周次 | 阶段 | 主要产出 |
|------|------|----------|
| 第 1 周 | Phase 0–2 | 测试基线、E2E + CI、生产配置与演示数据 |
| 第 2 周 | Phase 3–4 | 路线数据表/API、GPX 解析与统计 |
| 第 3 周 | Phase 5–6 | 地图/海拔/收藏 UI、回归、上线、文档更新 |

建议按以下顺序推进，不并行改数据模型和测试基础设施：

```text
Phase 0 准备
  ↓
Phase 1 E2E + CI ─────┐
  ↓                   │
Phase 2 生产与演示 ───┘（可与 Phase 1 后半段并行）
  ↓
Phase 3 路线数据层
  ↓
Phase 4 GPX 解析与统计
  ↓
Phase 5 地图 / 海拔 / 收藏
  ↓
Phase 6 回归与发布
```

---

## 四、Phase 0：准备（0.5–1 天）

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P0-01 | 创建实施分支 | `codex/p0-p1-routes` | 不影响 `main` |
| P0-02 | 备份生产数据库 | Turso 快照 / `npm run backup:turso` | 快照可下载 |
| P0-03 | 建立测试环境约定 | `LOCAL_DB_PATH=.tmp/e2e.db`、`PORT=3101`、`NODE_ENV=test` | 测试库与开发库隔离 |
| P0-04 | 记录环境变量清单 | 本文档附录 A | 不含任何密钥值 |
| P0-05 | 建立测试运行说明 | `docs/TESTING.md` | 本地一条命令能跑 |

---

## 五、Phase 1：E2E + CI（3–4 天）

### 目标

在现有 CI 基础上增加 Playwright 运行时测试，覆盖核心路径；任何一条核心路径失败时，PR 不能合并。

### 任务

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P1-01 | 安装并配置 Playwright | `playwright.config.ts` | `npx playwright test` 可运行 |
| P1-02 | 配置双 webServer | API 3101 + 前端 5173/4173 | 测试自动启动，不依赖手工开服务 |
| P1-03 | 测试数据与登录态工具 | `tests/e2e/fixtures.ts` | 每个用例独立用户，互不污染 |
| P1-04 | 认证用例 | `auth.spec.ts` | 注册→登录→刷新仍登录→退出 |
| P1-05 | 内容用例 | `post.spec.ts` | 发帖→详情→评论→点赞→收藏 |
| P1-06 | 活动用例 | `event.spec.ts` | 发起→报名→取消；满员拒绝 |
| P1-07 | 后台用例 | `admin.spec.ts` | 举报→处理；用户状态变更 |
| P1-08 | 移动端用例 | `mobile.spec.ts` | 底部导航、个人中心 Tab 不溢出 |
| P1-09 | CI 增加 e2e job | `.github/workflows/ci.yml` | PR 与 main 都运行 |
| P1-10 | 失败产物 | report / trace / screenshot | CI 页面可下载 |
| P1-11 | 反向验证 | 故意改坏一个选择器 | CI 必须变红 |

### 关键实现约定

- 测试使用独立 SQLite 文件，通过 `LOCAL_DB_PATH` 指向 `.tmp/e2e.db`。
- 前端使用 `VITE_API_BASE_URL=http://127.0.0.1:3101`，避免依赖生产 API。
- 所有测试数据通过 API 或 seed 脚本创建，不手点页面准备数据。
- 选择器优先使用 `getByRole` / `getByLabel` / `data-testid`，不用脆弱的 CSS 层级。
- 禁止 `waitForTimeout` 作为主要等待手段；用可见状态或网络响应等待。
- CI 只跑 Chromium；本地可选 Chromium + Mobile Safari 视口。

### 验收标准

- 6 个 spec 本地稳定通过。
- CI 的 `frontend`、`server`、`e2e` 三个 job 全绿。
- 故意制造回归时，E2E job 能失败并保留 trace。

---

## 六、Phase 2：生产可用性与演示就绪（1–2 天）

> 这一阶段有一部分需要在 Render / 邮件服务 / 监控面板里操作，代码侧只做配置与验证脚本。

### 任务

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P2-01 | 环境变量核对 | 附录 A 勾选表 | 每一项有值或明确未启用 |
| P2-02 | Sentry 验证 | 测试异常 | 前端/后端各收到 1 条事件 |
| P2-03 | SMTP 验证 | 验证邮件 / 重置邮件 | 真实收件箱可收到 |
| P2-04 | Umami 验证 | 页面访问 + 自定义事件 | 看板能看到 `register_success` 等 |
| P2-05 | CSP / 安全头 | Render 或 Cloudflare 配置 | `curl -I` 可见 CSP、HSTS、nosniff、Referrer-Policy |
| P2-06 | 备份定时任务 | `.github/workflows/backup-turso.yml` | 每日备份，保留 14 天 |
| P2-07 | 恢复演练 | 从备份恢复测试库 | 数据完整，记录耗时 |
| P2-08 | 演示数据 | 15–20 条路线、20 条帖子、6 个活动 | 首页/列表不空 |
| P2-09 | 演示账号 | 已验证邮箱的普通用户 | 可走完整社区流程 |
| P2-10 | 可用性监控 | UptimeRobot / Better Stack | `/api/health` 与首页告警 |

### CSP 注意项

当前 `_headers` 里的 CSP 只允许 `'self'`，如果直接启用会拦截：

- API：`https://hiking-china-api-sg.onrender.com`
- Umami：实际脚本与上报域名
- Sentry：`https://*.sentry.io`、`https://*.ingest.sentry.io`
- 地图瓦片：OpenStreetMap 镜像
- 图片：Cloudinary

建议先在 `Content-Security-Policy-Report-Only` 下观察 24 小时，再切换为强制模式。不要直接在生产启用未验证的 CSP。

### 验收标准

- 新用户 5 分钟内完成：注册→验证邮箱→发帖→评论→报名活动。
- Sentry 能看到测试异常；Umami 能看到页面与事件；SMTP 能收到邮件。
- 线上响应头包含 CSP、HSTS、`X-Content-Type-Options`、`Referrer-Policy`。
- 备份任务成功执行，恢复演练通过。

---

## 七、Phase 3：路线数据层（2–3 天）

### 目标

把路线从静态数组升级为数据库实体，为 GPX、收藏、筛选和后续推荐打基础。

### 数据表

```sql
routes (
  id, user_id, title, slug, summary, content,
  region, difficulty, distance_km, ascent_m, descent_m,
  min_elevation, max_elevation, duration_hours,
  start_point, end_point, geojson, cover_image, tags,
  status, created_at, updated_at
)

route_favorites (
  id, user_id, route_id, created_at,
  UNIQUE(user_id, route_id)
)
```

### API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/routes` | 列表、筛选、分页 |
| GET | `/api/routes/:id` | 详情 |
| POST | `/api/routes` | 创建（先限管理员/已验证用户） |
| PUT | `/api/routes/:id` | 编辑（作者/管理员） |
| DELETE | `/api/routes/:id` | 删除（作者/管理员） |
| POST | `/api/routes/:id/favorite` | 收藏切换 |
| GET | `/api/routes/favorites` | 我的收藏 |
| GET | `/api/routes/:id/export.gpx` | 导出 GPX |

### 任务

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P3-01 | 建表与索引 | `models/db.js` | 本地/Turso 都能初始化 |
| P3-02 | 路线模型 | `models/route.js` | CRUD + 收藏 + 统计 |
| P3-03 | 路线路由 | `routes/routes.js` | 鉴权、归属校验、分页 |
| P3-04 | 静态数据迁移 | `scripts/seed-routes.cjs` | 幂等，保留现有标题/坐标 |
| P3-05 | 前端 API 层 | `api/index.ts`、`hiking-store.ts` | 统一错误处理 |
| P3-06 | 列表页改用 API | `RoutesPage.tsx` | 加载/空态/错误态 |
| P3-07 | 路线详情页 | `/routes/:id` | 可访问、可分享 |

### 验收标准

- 路线列表来自数据库，刷新后数据一致。
- 收藏切换持久化，重启服务后仍存在。
- 旧静态路线数据全部迁移，无重复、无丢失。
- 现有路线对比功能不回归。

---

## 八、Phase 4：GPX 解析与统计（2–3 天）

### 技术选择

- 解析：`fast-xml-parser`（服务端解析，避免浏览器兼容差异）。
- 简化：自实现 Douglas-Peucker（约 40 行），不引入额外依赖。
- 海拔图：自实现 SVG 面积图，避免为一张图引入大型图表库。
- 原始 GPX：不长期存储；解析后存简化 GeoJSON，导出时再生成 GPX。

### 任务

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P4-01 | GPX 解析工具 | `utils/gpx.js` | 支持 trkpt / rtept / 多段轨迹 |
| P4-02 | 输入校验 | 扩展名、大小、点数、坐标范围 | 非法文件返回 400 |
| P4-03 | 轨迹简化 | Douglas-Peucker | 点数下降但形状保持 |
| P4-04 | 统计算法 | 距离、爬升、下降、最高/最低海拔 | 与参考值误差在阈值内 |
| P4-05 | 上传/预览接口 | `POST /api/routes/parse-gpx` | 返回 GeoJSON + 统计 |
| P4-06 | 保存接口 | 创建/更新路线时写入 | 数据一致 |
| P4-07 | 路线编辑器 | 管理员上传 GPX、预览、编辑 | 可完成一条路线录入 |
| P4-08 | 单元测试 | 平地、山地、缺失海拔、损坏文件 | 全部通过 |

### 统计口径

- 距离：Haversine 累加。
- 爬升/下降：相邻点高差超过 3 米才计入，过滤 GPS 噪声。
- 海拔：缺失 `ele` 时允许为空，图表显示“无海拔数据”。
- 点数上限：建议 50,000 点，超出则提示简化或拒绝。
- 文件上限：建议 10MB。

### 验收标准

- 一条 10km 左右的样例轨迹，距离误差 ≤ 2%，爬升误差 ≤ 5%。
- 损坏 XML、空轨迹、无坐标点均返回明确错误。
- 解析 5 万点文件在 2 秒内完成（本地基准）。

---

## 九、Phase 5：地图 / 海拔 / 收藏 UI（2–3 天）

### 任务

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P5-01 | 轨迹地图 | `RouteTrackMap.tsx` | 轨迹、起终点、自动 fitBounds |
| P5-02 | 海拔剖面 | `ElevationProfile.tsx` | 面积图、最高/最低、hover |
| P5-03 | 路线详情页 | 头图、统计、地图、剖面、正文 | 桌面/移动端可用 |
| P5-04 | 收藏按钮 | 详情页 + 列表卡片 | 状态持久化 |
| P5-05 | 个人中心收藏 Tab | `RouteFavoritesTab.tsx` | 空态/列表/取消收藏 |
| P5-06 | 对比接入 | 路线对比使用 DB 数据 | 不回归 |
| P5-07 | SEO | 路线详情 title/description/OG | 可分享 |
| P5-08 | sitemap | 动态包含路线详情 | 可访问 |
| P5-09 | E2E | 路线详情、收藏、导出 | 通过 |

### UI 验收

- 375px、768px、1440px 三档不溢出、不遮挡。
- 地图容器有固定高度，加载失败有占位。
- 海拔图在无数据时显示空态，不出现空白大块。
- 收藏按钮有登录引导；未登录点击跳登录并回跳。

---

## 十、Phase 6：回归与发布（1 天）

| ID | 任务 | 验收 |
|----|------|------|
| P6-01 | 全量 E2E | 所有 spec 通过 |
| P6-02 | `type:check` + `build` | 零错误 |
| P6-03 | `npm audit --omit=dev` | 0 漏洞 |
| P6-04 | 性能检查 | 路线详情首屏可接受，JS 无异常膨胀 |
| P6-05 | 生产部署 | Render 部署成功 |
| P6-06 | 线上验收 | 安全头、Sentry、Umami、SMTP 均正常 |
| P6-07 | 文档更新 | 更新 `简历素材-徒步中国.md` 指标 |
| P6-08 | 发布记录 | `CHANGELOG` / Git tag |

---

## 十一、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| CSP 拦截 Umami/Sentry/地图 | 页面功能失效 | 先 Report-Only，逐项放行，24 小时后再强制 |
| E2E 不稳定 | CI 失去可信度 | API 造数、稳定选择器、失败重试 1 次、禁止固定 sleep |
| 路线迁移破坏现有页面 | 线上白屏/空列表 | 先加 API 与 seed，再切页面；保留短期 fallback |
| GPX 边界情况多 | 统计错误/崩溃 | 固定测试样例、输入上限、明确错误码 |
| 大文件拖慢服务 | 请求超时 | 10MB/5 万点限制，流式/内存保护 |
| Render 冷启动 | 演示首访慢 | 健康检查预热，演示前手动访问一次 |
| 生产密钥误入仓库 | 安全事故 | 只用 GitHub Secrets / Render 环境变量，提交前扫描 |

---

## 十二、Definition of Done

本期完成的标志：

- [ ] CI 包含 `frontend`、`server`、`e2e` 三个 job，且全部通过。
- [ ] 6 条核心路径有 Playwright 覆盖，失败可下载 trace。
- [ ] 线上安全头、Sentry、Umami、SMTP、备份全部验证。
- [ ] 路线列表与详情来自数据库，收藏持久化。
- [ ] GPX 上传、解析、简化、统计、地图、海拔图全部可用。
- [ ] 路线详情有 E2E 覆盖，移动端不溢出。
- [ ] 演示数据与演示账号可用。
- [ ] 简历素材更新了新增能力与指标。

---

## 十三、Phase 0/1 文件级执行清单（计划模式产出）

### 13.1 测试拓扑

```text
Playwright (Chromium)
  ├── http://127.0.0.1:5173   Vite 前端
  └── http://127.0.0.1:3101   Express API
        └── SQLite: .tmp/e2e.db（每次运行重建）
```

- 前端通过 `VITE_API_BASE_URL=http://127.0.0.1:3101` 访问测试 API。
- 现有 CORS 已允许 `localhost:5173` / `127.0.0.1:5173`，无需改端口。
- 不连接 Turso、Cloudinary、生产 API；测试只使用本地 SQLite 和 preset 图片。

### 13.2 新增 / 修改文件

| 文件 | 动作 | 说明 |
|------|------|------|
| `hiking-new/frontend/playwright.config.ts` | 新增 | 双 webServer、Chromium、报告与 trace |
| `hiking-new/frontend/tests/e2e/fixtures.ts` | 新增 | 登录、API 造数、唯一邮箱工具 |
| `hiking-new/frontend/tests/e2e/auth.spec.ts` | 新增 | 登录、刷新保持、退出、注册 |
| `hiking-new/frontend/tests/e2e/post.spec.ts` | 新增 | 发帖、评论、点赞、收藏 |
| `hiking-new/frontend/tests/e2e/event.spec.ts` | 新增 | 报名、取消、满员拒绝 |
| `hiking-new/frontend/tests/e2e/admin.spec.ts` | 新增 | 后台导航、举报处理 |
| `hiking-new/frontend/tests/e2e/mobile.spec.ts` | 新增 | 移动端导航、个人中心不溢出 |
| `hiking-new/server/scripts/e2e-server.cjs` | 新增 | 重建测试库、造数、启动 API |
| `hiking-new/server/index.js` | 修改 | 测试模式可关闭限流 |
| `hiking-new/frontend/package.json` | 修改 | 增加 Playwright 与 e2e scripts |
| `.github/workflows/ci.yml` | 修改 | 增加 `e2e` job 与失败产物 |
| `.gitignore` | 修改 | 忽略 `/.tmp/` 测试库 |
| `docs/TESTING.md` | 新增 | 本地运行与排错说明 |

Phase 2 相关文件：

| 文件 | 动作 | 说明 |
|------|------|------|
| `docs/PRODUCTION_CHECKLIST.md` | 新增 | Render / Sentry / SMTP / Umami / 备份逐项清单 |
| `.github/workflows/backup-turso.yml` | 新增 | 每日 Turso 备份 |
| `hiking-new/server/scripts/seed-demo.cjs` | 新增 | 演示路线/帖子/活动 |

### 13.3 测试数据策略

`e2e-server.cjs` 在启动前完成：

1. 删除旧 `.tmp/e2e.db`。
2. 调用 `initDb()` 建表并加载现有 seed。
3. 创建 3 个用户：

```text
e2e-user@example.com    普通用户，email_verified=1
e2e-other@example.com   普通用户，email_verified=1
e2e-admin@example.com   admin，email_verified=1
密码统一为 E2ePassw0rd!（仅本地测试使用）
```

4. 创建 3 篇已发布帖子、1 篇草稿、2 个活动（其中一个 max_participants=1 且已满员）、1 条待处理举报。

原则：

- 不在仓库写生产密钥或真实用户信息。
- 每个 spec 使用独立邮箱或独立数据，避免顺序依赖。
- 测试图片使用 `ImageUrlPicker` 的 preset，不触发 Cloudinary 上传。

### 13.4 用例与断言

| Spec | 流程 | 关键断言 |
|------|------|----------|
| `auth.spec.ts` | 登录种子用户 → 刷新 → 退出 | 登录后出现用户菜单；刷新仍保持登录；退出后回到登录入口 |
| `auth.spec.ts` | 注册唯一新用户 | 显示注册成功；不依赖真实邮件送达 |
| `post.spec.ts` | 发布页填标题/正文 → 选 preset 图片 → 发布 | 跳转详情页，标题可见 |
| `post.spec.ts` | 详情页评论 → 点赞 → 收藏 | 评论出现；点赞态变化；收藏出现在个人中心 |
| `event.spec.ts` | 活动列表报名 → 取消 | 出现“报名成功”/“已取消报名”提示 |
| `event.spec.ts` | 满员活动报名 | 返回明确错误，不产生报名记录 |
| `admin.spec.ts` | 管理员登录 → 后台各 Tab | Tab 可切换，列表不报错 |
| `admin.spec.ts` | 处理种子举报 | 状态变为已处理/已忽略 |
| `mobile.spec.ts` | 390×844 视口访问首页/路线/装备/活动/个人中心 | 底部导航可见；页面无横向溢出 |

Quill 编辑器的处理：

- 不使用隐藏 textarea 的 `fill`。
- 点击 `.ql-editor` 后使用 `keyboard.type`，再断言编辑器文本。

### 13.5 CI job 草案

```yaml
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    defaults:
      run:
        working-directory: hiking-new/frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: |
            hiking-new/frontend/package-lock.json
            hiking-new/server/package-lock.json
      - run: npm ci
      - run: npm --prefix ../server ci --omit=optional
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            hiking-new/frontend/playwright-report
            hiking-new/frontend/test-results
          retention-days: 7
```

### 13.6 已识别的阻塞项与处理

| 阻塞项 | 影响 | 处理 |
|--------|------|------|
| 注册默认 `email_verified=0` | 新用户不能发帖/评论/报名 | 测试直接 seed 已验证用户 |
| 登录限流 10 次/15 分钟 | 多 spec 并行会误伤 | 测试模式增加 `RATE_LIMIT_DISABLED=1` |
| 发帖强制至少 1 张图片 | 上传会依赖 Cloudinary | 使用 `ImageUrlPicker` 的 preset 图片 |
| `initDb` 只 seed 活动/搜索数据 | 没有测试用户 | `e2e-server.cjs` 补充用户/帖子/举报 |
| 管理员需要 `role=admin` | 后台用例无法进入 | seed 一个 admin 用户 |
| Quill 是 contenteditable | 普通 `fill` 不稳定 | 点击 `.ql-editor` + `keyboard.type` |
| 测试库路径 | 可能污染开发库 | `LOCAL_DB_PATH=.tmp/e2e.db`，并加入 `.gitignore` |
| 端口冲突 | webServer 启动失败 | 固定 3101 / 5173，CI 独占 |

### 13.7 执行检查点

按顺序验收，不跳步：

1. `e2e-server.cjs` 能重建测试库并启动 API；`curl /api/health` 返回 200。
2. Playwright 能打开首页并看到品牌标题。
3. `auth.spec.ts` 通过。
4. `post.spec.ts` 通过（preset 图片，无上传）。
5. `event.spec.ts` 与 `admin.spec.ts` 通过。
6. `mobile.spec.ts` 通过，`scrollWidth <= clientWidth + 1`。
7. CI 的 `e2e` job 通过；故意改坏选择器时 job 变红。

### 13.8 Phase 2 进入条件

- Phase 1 的 auth/post 用例稳定通过。
- `docs/PRODUCTION_CHECKLIST.md` 已列出全部环境变量。
- 你能提供 Render、SMTP、Sentry、Umami 的配置权限。
- CSP 允许域名已确认（API、Umami、Sentry、Cloudinary、OSM）。

### 13.9 Phase 3 进入条件

- Phase 1 的 E2E 基线全绿。
- 路线表字段与 API 契约评审通过。
- `ROUTES_LIST` 到 `routes` 表的字段映射确认完毕。
- 生产 Turso 已有可恢复快照。

### 13.10 Phase 1 明确不做的事

- 不改路线数据模型。
- 不改生产环境变量。
- 不启用 CSP 强制模式。
- 不引入 Vitest / 单元测试框架（先做 E2E，避免范围膨胀）。

---

## 附录 A：环境变量清单（只列名称，不填值）

### 前端构建期

- `VITE_API_BASE_URL`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `VITE_UMAMI_SCRIPT_URL`
- `VITE_UMAMI_WEBSITE_ID`
- `CLIENT_BASE_PATH`

### 后端

- `NODE_ENV`
- `PORT`
- `JWT_SECRET`
- `FRONTEND_URL`
- `APP_BASE_URL`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `UPLOAD_PROVIDER`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `LOCAL_DB_PATH`（仅测试/本地）

---

## 附录 B：建议的提交拆分

```text
test: add playwright e2e foundation
test: cover auth and post flows
test: cover event and admin flows
ci: add e2e job and artifacts
chore: add turso backup workflow
feat: add routes and route_favorites schema
feat: add routes api and seed migration
refactor: load routes page from api
feat: parse gpx and compute route stats
feat: add route track map and elevation profile
feat: add route favorites and profile tab
test: cover route detail and favorites
docs: update project metrics and runbooks
```
