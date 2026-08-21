# 徒步中国 · 免费方案部署指南（Turso + Cloudinary + Render + Netlify）

> 结论：Render 免费实例无持久磁盘（SQLite 文件与本地 uploads 会在每次重新部署后丢失），
> 因此免费方案把「数据库」迁到 **Turso**（SQLite 兼容远程库），把「上传图片」迁到 **Cloudinary**（对象存储直链）。
> 后端代码模型层零改造：本地开发仍读 `server/data/hikingchina.db`，生产只需设置环境变量即自动切远程模式。

---

## 一、架构总览

| 组件 | 服务 | 说明 |
|------|------|------|
| 前端静态站 | Netlify | 构建 `hiking-new/frontend` → `dist`，SPA redirect + `/api/*` 反代 |
| 后端 API | Render（免费 Web Service） | `hiking-new/server`，`node index.js`，端口由 Render 注入 |
| 数据库 | Turso（libsql） | 免费额度足够本项目；本地 `hikingchina.db` 可整库导入 |
| 图片存储 | Cloudinary（免费档） | 上传走 `POST /api/upload`，返回 https 直链，跨部署持久 |

前端请求链路（方式一·推荐，免 CORS）：
`浏览器 → Netlify /api/* → Render /api/* → Turso / Cloudinary`

---

## 二、Turso 建库并导入现有数据

1. 安装 CLI 并登录（本机已装可跳过）：
   ```bash
   curl -sSfL https://get.turso.tech/install.sh | bash
   turso auth login
   ```
2. 建库：
   ```bash
   turso db create hiking-china
   ```
3. 导出本地库并导入（本地库位置 `hiking-new/data/hikingchina.db`，含 17 帖 / 12 评论 / 3 用户 / 4 活动）：
   ```bash
   sqlite3 hiking-new/data/hikingchina.db .dump > hikingchina.sql
   turso db shell hiking-china < hikingchina.sql
   ```
   > 不导入也行：后端启动时会自动建全部表并 seed 4 条活动 + 搜索索引，只是没有旧帖子数据。
4. 拿连接信息（填到 Render 环境变量）：
   ```bash
   turso db show hiking-china        # 得到 libsql:// URL
   turso db tokens create hiking-china   # 得到 TURSO_AUTH_TOKEN
   ```

## 三、Cloudinary 开通图片存储

1. 注册 https://cloudinary.com （免费档 25 万张/月，足够）。
2. Dashboard 拿到 `Cloud name`、`API Key`、`API Secret`。
3. 三个值填到 Render 环境变量（见下）。

## 四、Render 部署后端

1. 仓库推送到 GitHub（本项目需先 `git remote add` 并推送，见项目记忆「配置远程」）。
2. Render → **New → Web Service** → 选该仓库。
3. 关键配置：
   - **Root Directory**：`hiking-new/server`
   - **Build Command**：`npm install`
   - **Start Command**：`node index.js`
   - 实例类型：Free（冷启动约 30-60s 属正常）
4. 环境变量（必填）：
   | 变量 | 值 |
   |------|-----|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | 随机长字符串（`openssl rand -hex 32`） |
   | `TURSO_DATABASE_URL` | 上一步的 `libsql://...` |
   | `TURSO_AUTH_TOKEN` | 上一步生成的 token |
   | `UPLOAD_PROVIDER` | `cloudinary` |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API Key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
   | `FRONTEND_URL` | 你的 Netlify 域名（逗号分隔可多个，如 `https://xxx.netlify.app,http://localhost:5173`） |

5. 部署后验证：
   ```bash
   curl https://<your-app>.onrender.com/api/health
   # {"status":"ok",...}
   curl https://<your-app>.onrender.com/api/events
   # events 数组（若库为空会自动 seed 4 条活动）
   ```

> 备注：免费实例磁盘是临时的，本地 `local` 上传模式在重部署后图片会丢——所以生产必须 `UPLOAD_PROVIDER=cloudinary`。

## 五、Netlify 部署前端

1. Netlify → **Add new site → Import an existing project** → 选同一 GitHub 仓库。
2. 构建配置（也可用仓库内 `hiking-new/frontend/netlify.toml`）：
   - **Base directory**：`hiking-new/frontend`
   - **Build command**：`npm run build`
   - **Publish directory**：`dist`
   - 无需额外环境变量（`VITE_API_BASE_URL` 留空走同源反代）
3. `netlify.toml` 已内置：
   - `/* → /index.html 200`：SPA 路由回退
   - `/api/* → https://<your-app>.onrender.com/api/:splat`：API 反代（免 CORS）
   - 记得把 `netlify.toml` 里的反代目标改成你自己的 Render 域名（或改用方式二）。
4. 方式二（不用反代）：在 Netlify 环境变量设 `VITE_API_BASE_URL = https://<your-app>.onrender.com`，删除 `netlify.toml` 中 `/api/*` 反代段，并确保后端 `FRONTEND_URL` 包含 Netlify 域名。

## 六、上线走查清单

- [ ] 注册 → 登录 → 个人信息（含头像上传）→ 资料保存
- [ ] 发帖（含图片上传、路线 extrainfo）→ 列表/详情可见，浏览量自增
- [ ] 评论 → 回复 → 评论点赞 toggle → 编辑/删除
- [ ] 收藏/取消收藏 → 个人中心「我的收藏」
- [ ] 关注/取关 → 用户主页按钮状态
- [ ] 活动列表（4 条种子）→ 创建活动 → 报名/取消 → 满员拒绝
- [ ] 搜索关键词命中帖子
- [ ] 重新部署后端后：帖子/评论/活动/图片 URL 仍在（Turso + Cloudinary 持久）

## 七、本地开发（不变）

```bash
# 终端 1：后端（不设置 TURSO 环境变量即读本地 SQLite）
cd hiking-new/server && npm install && npm start

# 终端 2：前端（VITE_API_BASE_URL 可留空走 vite proxy，或指向本地 3001）
cd hiking-new/frontend && npm install && npm run dev
```

前端 `utils/http.ts` 的 baseURL 规则：`import.meta.env.VITE_API_BASE_URL` 非空用它，否则同源相对路径。
