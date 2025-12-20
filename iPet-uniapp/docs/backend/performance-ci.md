# 后端性能防回退（看板 + 告警 + CI）

## 规范背景

性能优化如果只停留在“某次优化”，很容易在后续迭代中回退。本规范把 `P95`、错误率、慢查询纳入日常看板与告警，并把性能回归（k6）写进 CI（nightly）。

## 适用对象

- `iPet-BackEnd`（NestJS + Prisma）
- 相关运维配置：`ops/monitoring`
- CI：GitHub Actions（`.github/workflows`）

## 约束规则

### 1) 日常看板与告警必须可运行

- Prometheus 可抓取：`GET /api/metrics`
- Grafana 具备基础看板：P95、5xx 错误率、RPS、慢查询
- Prometheus 具备基础告警规则（至少覆盖 P95、错误率、慢查询）

### 2) 容量基线：连接池默认目标 20

- `DATABASE_URL` 需显式配置 `connection_limit=20`（与容量“升级1/4C8G”一致）
- 示例见：`iPet-BackEnd/.env.example`

### 3) 登录路径需具备防 CPU 打爆的冷却机制

- 失败次数达到阈值后进入冷却（避免持续 bcrypt compare）
- 配置项：
  - `AUTH_LOGIN_MAX_FAILURES`
  - `AUTH_LOGIN_FAIL_WINDOW_MS`
  - `AUTH_LOGIN_COOLDOWN_MS`

### 4) 性能回归需进 CI（nightly 最小集）

- `k6` 场景 nightly 跑一次（或手动触发）
- 阈值最小集：
  - `P95 < 200ms`
  - `错误率 < 0.1%`

## 示例

### 本地启动监控栈

```bash
docker compose -f ops/monitoring/docker-compose.yml up -d
```

### 本地抓取指标

```bash
curl http://localhost:3000/api/metrics
```

### CI（nightly）对应文件

- `iPet-BackEnd/perf/k6/api-smoke.js`
- `iPet-BackEnd/scripts/seed_k6.ts`
- `.github/workflows/perf-nightly.yml`

