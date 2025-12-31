# Backend UI Nginx 部署规范

## 规范背景
后台管理端为静态站点，生产部署需要明确 Nginx 的静态托管、SPA 回退与运行时配置缓存策略，避免刷新 404 与配置不生效。

## 适用对象
- 后台管理端（backend-ui）部署与运维
- 负责 Nginx 站点配置的环境

## 约束规则
1. **静态站点托管**
   - `root` 指向构建产物目录（如 `/www/sites/backendui.zhengjiyuan.top/index`）
   - `index` 仅需 `index.html`
2. **SPA 路由回退**
   - `location /` 使用 `try_files $uri $uri/ /index.html`
3. **运行时配置文件**
   - `config.json` 必须放在站点根目录
   - `/config.json` 必须禁止缓存（`Cache-Control: no-store`）
4. **证书与域名**
   - `server_name`、`ssl_certificate`、`ssl_certificate_key` 必须与实际域名/证书路径一致
5. **可选反向代理**
   - 若需同域 `/api`，在 Nginx 添加反向代理配置并透传常用请求头

## 示例
```nginx
server {
    listen 80;
    server_name backendui.zhengjiyuan.top;

    location /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name backendui.zhengjiyuan.top;

    root /www/sites/backendui.zhengjiyuan.top/index;
    index index.html;

    ssl_certificate     /www/sites/backendui.zhengjiyuan.top/ssl/fullchain.pem;
    ssl_certificate_key /www/sites/backendui.zhengjiyuan.top/ssl/privkey.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /config.json {
        default_type application/json;
        add_header Cache-Control "no-store";
        try_files /config.json =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 如需同域代理 API，可按需启用：
    # location /api/ {
    #     proxy_pass https://api.zhengjiyuan.top;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    # }
}
```
