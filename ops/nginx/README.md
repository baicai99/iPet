# iPet Nginx 配置说明

## 目录结构

```
ops/nginx/
├── production.conf    # 主生产配置
├── deploy.sh          # 一键部署脚本
└── README.md          # 本文档
```

## 快速开始

### 1. 部署配置

```bash
# 模拟运行（查看将执行的操作）
sudo bash deploy.sh --dry-run

# 正式部署
sudo bash deploy.sh
```

### 2. 配置 TLS 证书

```bash
# 使用 Certbot 获取 Let's Encrypt 证书
sudo certbot --nginx -d api.zhengjiyuan.top -d ipet.zhengjiyuan.top
```

### 3. 验证部署

```bash
# 检查 Nginx 状态
systemctl status nginx

# 测试健康检查
curl https://api.zhengjiyuan.top/api/system/health

# 检查 X-Request-Id 透传
curl -v https://api.zhengjiyuan.top/api/system/health 2>&1 | grep -i x-request-id
```

## 配置要点

| 特性 | 说明 |
|------|------|
| TLS 版本 | TLSv1.2, TLSv1.3 |
| Gzip 压缩 | 启用，最小 1024 字节 |
| X-Request-Id | 透传客户端 ID 或自动生成 |
| 超时设置 | 连接 30s，读写 60s |
| 健康检查 | 不记录访问日志 |
| SPA 支持 | 前端使用 try_files 回退 |

## 回滚

```bash
# 回滚到上一个备份
sudo bash deploy.sh --rollback
```

## 相关文档

- [生产拓扑](../../docs/ops/production-topology.md)
- [部署手册](../../docs/ops/deploy-playbook.md)
