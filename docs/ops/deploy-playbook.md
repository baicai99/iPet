# iPet 后端部署手册

本文档描述 iPet 后端服务的标准部署流程。

## 环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 20.x | LTS 版本 |
| PostgreSQL | 16.x | 主数据库 |
| Redis | 7.x | 缓存 |

## 环境变量

部署前确保以下环境变量已配置：

```bash
# 必需
DATABASE_URL="postgresql://user:password@host:5432/ipet?schema=public"
JWT_SECRET="your-secure-secret"
CLIENT_ORIGIN="https://your-frontend-domain.com"

# 可选
REDIS_URL="redis://host:6379"
PORT="3000"
```

## 部署步骤

### 1. 代码更新

```bash
cd /path/to/iPet-BackEnd
git pull origin main
```

### 2. 安装依赖

```bash
npm ci
```

### 3. 生成 Prisma 客户端

```bash
npx prisma generate
```

### 4. 执行数据库迁移 ⚠️

> [!CAUTION]
> **必须执行此步骤**，否则数据库 schema 可能与代码不一致。

```bash
npx prisma migrate deploy
```

### 5. 构建应用

```bash
npm run build
```

### 6. 启动服务

```bash
# 使用 PM2 (推荐)
pm2 start dist/main.js --name ipet-backend

# 或直接启动
npm run start:prod
```

### 7. 运行冒烟测试 ⚠️

> [!IMPORTANT]
> 部署后**必须**运行冒烟测试验证服务可用性。

```bash
BASE_URL=http://localhost:3000 bash scripts/smoke_test.sh
```

**预期结果**：所有测试通过，输出 `PASS`。

## 回滚流程

如果冒烟测试失败或发现严重问题：

```bash
# 1. 停止服务
pm2 stop ipet-backend

# 2. 回滚代码
git checkout <previous-commit>
npm ci
npm run build

# 3. 回滚数据库（如有必要）
# 注意：需要手动处理数据迁移

# 4. 重启服务
pm2 start ipet-backend
```

## 健康检查端点

| 端点 | 用途 |
|------|------|
| `GET /api/infra/health` | 基础健康检查 |

## 相关文档

- [发布清单](./release-checklist.md)
- [生产拓扑](./production-topology.md)

