# Render Static Site 前端

用于在 Netlify 生产部署额度暂停期间继续发布前端。

## 服务配置

- Service: `hiking-china-web`
- Service ID: `srv-dbd5rhgm7kps73bttiv0`
- Repository: `Leo-Hyper/Hiking-China`
- Branch: `main`
- Root Directory: `hiking-new/frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- URL: `https://hiking-china-web.onrender.com`

## 环境变量

```text
VITE_API_BASE_URL=https://hiking-china-api-sg.onrender.com
CLIENT_BASE_PATH=/
NODE_VERSION=22.22.0
```

## SPA 路由

Redirects/Rewrites:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

## 后端 CORS

Render API 的 `FRONTEND_URL` 需要包含：

```text
https://hiking-china.netlify.app,https://hiking-china-web.onrender.com
```

代码中已将临时静态站点 Origin 加入允许列表。

## 图片兼容

前端在配置 `VITE_API_BASE_URL` 后会把 `/uploads/*` 直接解析到 Render API，避免静态站点缺少上传文件代理。

## 回切

Netlify 部署额度恢复后，可以继续使用 Netlify 作为主站，或将自定义域名迁移到 Render Static Site。切换前需要确认 CORS、sitemap、robots 和外部链接。
