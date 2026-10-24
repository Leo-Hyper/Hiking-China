# Render Static Site 前端

用于在 Netlify 生产部署额度暂停期间继续发布前端。

## 服务配置

- Service: `hiking-china`
- Service ID: `srv-dbdflngae00c7381pogg`
- Repository: `Leo-Hyper/Hiking-China`
- Branch: `main`
- Root Directory: `hiking-new/frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- URL: `https://hiking-china.onrender.com`

## 环境变量

```text
VITE_API_BASE_URL=https://hiking-china-api-sg.onrender.com
VITE_MAPTILER_KEY=你的 MapTiler API Key
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

## CSP

地图使用 MapTiler Outdoor + MapLibre GL，需要在
`Content-Security-Policy` 中允许：

```text
img-src https://api.maptiler.com
connect-src https://api.maptiler.com
worker-src 'self' blob:
```

MapTiler Key 的允许域名同时保留当前 Render 生产域名和仍可访问的 Netlify 旧域名：

```text
hiking-china.onrender.com
hiking-china-web.onrender.com
hiking-china.netlify.app
localhost
127.0.0.1
```

## 后端 CORS

Render API 的 `FRONTEND_URL` 需要包含：

```text
https://hiking-china.netlify.app,https://hiking-china.onrender.com,https://hiking-china-web.onrender.com
```

代码中已将新站点和旧临时站点 Origin 均加入允许列表。

Render API 的 `APP_BASE_URL` 应设置为 `https://hiking-china.onrender.com`，用于生成 sitemap
和邮件中的验证/重置链接。未设置或仍为旧的 Netlify 域名时，服务端会回退到当前 Render 主站。

旧站点 `hiking-china-web.onrender.com` 保留为回滚入口。

## 图片兼容

前端在配置 `VITE_API_BASE_URL` 后会把 `/uploads/*` 直接解析到 Render API，避免静态站点缺少上传文件代理。

## 回切

Netlify 部署额度恢复后，可以继续使用 Netlify 作为主站，或将自定义域名迁移到 Render Static Site。切换前需要确认 CORS、sitemap、robots 和外部链接。
