# iPet 生产拓扑文档

本文档描述 iPet 项目的完整生产环境拓扑，供新成员快速理解和复现。

---

## 架构概览

```mermaid
graph TB
    subgraph Internet
        User["👤 用户"]
    end

    subgraph DNS
        DNS1["api.zhengjiyuan.top"]
        DNS2["ipet.zhengjiyuan.top"]
    end

    subgraph Server["生产服务器"]
        subgraph Nginx["Nginx :443"]
            API_VHOST["API 虚拟主机"]
            FE_VHOST["前端虚拟主机"]
        end

        subgraph Backend["后端服务"]
            NestJS["NestJS :3000"]
        end

        subgraph Storage["数据存储"]
            PostgreSQL["PostgreSQL :5432"]
            Redis["Redis :6379"]
        end

        subgraph Monitoring["监控 (可选)"]
            Prometheus["Prometheus :9090"]
            Grafana["Grafana :3001"]
            Alertmanager["Alertmanager :9093"]
        end

        FE_STATIC["静态文件 /var/www/ipet"]
    end

    User --> DNS1 --> API_VHOST
    User --> DNS2 --> FE_VHOST
    API_VHOST -->|反向代理| NestJS
    FE_VHOST -->|静态文件| FE_STATIC
    NestJS --> PostgreSQL
    NestJS --> Redis
    Prometheus --> NestJS
```

---

## 请求流程

### API 请求 (api.zhengjiyuan.top)

```
用户 → DNS → Nginx:443 → 反向代理 → NestJS:3000 → PostgreSQL/Redis
```

| 步骤 | 说明 |
|------|------|
| 1 | 用户发起 HTTPS 请求到 `api.zhengjiyuan.top` |
| 2 | DNS 解析到服务器 IP |
| 3 | Nginx 处理 TLS 终止，验证证书 |
| 4 | Nginx 添加/透传 `X-Request-Id` header |
| 5 | 反向代理请求到 `127.0.0.1:3000` |
| 6 | NestJS 处理业务逻辑，访问 PostgreSQL/Redis |
| 7 | 响应原路返回，包含 `X-Request-Id` |

### 前端请求 (ipet.zhengjiyuan.top)

```
用户 → DNS → Nginx:443 → 静态文件 /var/www/ipet
```

| 步骤 | 说明 |
|------|------|
| 1 | 用户访问 `ipet.zhengjiyuan.top` |
| 2 | Nginx 返回静态文件 |
| 3 | SPA 路由使用 `try_files` 回退到 `index.html` |

---

## 组件端口表

| 组件 | 端口 | 监听地址 | 协议 | 说明 |
|------|------|----------|------|------|
| Nginx (HTTP) | 80 | 0.0.0.0 | HTTP | 重定向到 HTTPS |
| Nginx (HTTPS) | 443 | 0.0.0.0 | HTTPS | 入口网关 |
| NestJS 后端 | 3000 | 127.0.0.1 | HTTP | 仅本地访问 |
| PostgreSQL | 5432 | 127.0.0.1 | TCP | 主数据库 |
| Redis | 6379 | 127.0.0.1 | TCP | 缓存/Session |
| Prometheus | 9090 | 127.0.0.1 | HTTP | 监控采集 |
| Grafana | 3001 | 127.0.0.1 | HTTP | 监控面板 |

---

## 域名配置

| 域名 | 用途 | 指向 |
|------|------|------|
| `api.zhengjiyuan.top` | API 服务 | 服务器 IP |
| `ipet.zhengjiyuan.top` | 前端应用 | 服务器 IP |

---

## 目录结构

```
/var/www/
├── ipet/                  # 前端静态文件
│   ├── index.html
│   └── assets/
└── certbot/               # Let's Encrypt 验证

/etc/nginx/
├── nginx.conf             # 主配置
├── sites-available/
│   └── ipet               # iPet 站点配置
├── sites-enabled/
│   └── ipet -> ../sites-available/ipet
└── backups/               # 配置备份

/etc/letsencrypt/live/
├── api.zhengjiyuan.top/   # API 证书
│   ├── fullchain.pem
│   └── privkey.pem
└── ipet.zhengjiyuan.top/  # 前端证书
    ├── fullchain.pem
    └── privkey.pem

/home/deploy/iPet/
└── iPet-BackEnd/          # 后端代码
    ├── dist/              # 编译输出
    └── node_modules/
```

---

## 部署步骤

### 前置条件

- Ubuntu 22.04+ 或 Debian 12+
- Node.js 20.x
- PostgreSQL 16.x
- Redis 7.x
- Nginx 1.24+

### 1. 安装 Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 2. 部署 Nginx 配置

```bash
sudo vi /etc/nginx/sites-available/ipet
sudo ln -s /etc/nginx/sites-available/ipet /etc/nginx/sites-enabled/ipet
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置 TLS 证书

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.zhengjiyuan.top -d ipet.zhengjiyuan.top
```

### 4. 部署后端

```bash
cd /home/deploy/iPet/iPet-BackEnd
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start dist/main.js --name ipet-backend
pm2 save
```

### 5. 部署前端

```bash
cd /path/to/iPet/iPet-uniapp
npm ci
npm run build:h5
sudo cp -r dist/build/h5/* /var/www/ipet/
```

### 6. 验证部署

```bash
# 健康检查
curl https://api.zhengjiyuan.top/api/system/health

# 就绪检查
curl https://api.zhengjiyuan.top/api/system/ready

# X-Request-Id 验证
curl -v https://api.zhengjiyuan.top/api/system/health 2>&1 | grep -i x-request-id
```

---

## 健康检查

| 端点 | 用途 | 预期响应 |
|------|------|----------|
| `/api/system/health` | 存活检查 | `{"status":"ok"}` |
| `/api/system/ready` | 就绪检查 | `{"status":"ok","db":"connected"}` |

---

## 故障排查

### Nginx 无法启动

```bash
# 检查配置语法
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 502 Bad Gateway

```bash
# 检查后端服务
pm2 status ipet-backend
pm2 logs ipet-backend --lines 50

# 检查后端端口
curl http://127.0.0.1:3000/api/system/health
```

### TLS 证书问题

```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew --dry-run
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U zhengjiyuan -d ipet_db -c "SELECT 1"
```

---

## 环境变量

后端服务需要以下环境变量（通过 `.env` 或环境配置）：

```bash
# 必需
DATABASE_URL="postgresql://user:pass@localhost:5432/ipet_db?schema=public"
JWT_SECRET="your-secure-secret"
CLIENT_ORIGIN="https://ipet.zhengjiyuan.top"

# 可选
REDIS_URL="redis://127.0.0.1:6379"
PORT="3000"
NODE_ENV="production"
```

---

## 相关文档

- [部署手册](./deploy-playbook.md)
- [发布清单](./release-checklist.md)
- [健康检查与版本](./health-and-version.md)

---

**最后更新**: 2025-12-25
