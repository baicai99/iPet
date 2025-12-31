# 后端可观测性（最小闭环）

## 规范背景

当前后端可观测性存在定位与量化能力不足的问题（缺少 `traceId/requestId`、运行时 P95/P99、慢查询识别、告警基础数据）。

本规范目标是先落地“能定位 + 能量化 + 可告警”的最小闭环：让每一次请求、每一次慢查询都能被关联与量化，并进入日常看板与告警，防止性能回退。

## 适用对象

- `iPet-BackEnd`（NestJS + Prisma）所有 HTTP 请求与数据库访问

## 约束规则

### 1) RequestId（请求关联）

- 服务端为每个请求生成或复用 `requestId`：
  - 若客户端传入 `X-Request-Id`（且满足安全校验），则复用
  - 否则服务端生成新的 `requestId`
- 服务端在响应头返回 `X-Request-Id`，并确保跨域可见（`exposedHeaders`）
- 所有结构化日志必须包含 `requestId` 字段，用于跨层关联（HTTP 日志、慢查询日志等）

### 2) Prisma 慢查询识别（> 100ms）

- 当单次 Prisma 操作耗时大于等于 `OBS_PRISMA_SLOW_QUERY_MS`（默认 `100` ms）时，输出结构化告警日志：
  - `type: "db.slow_query"`
  - `model`、`action`、`durationMs`
  - 可选字段：`whereKeys`（仅记录 where 字段名，避免泄漏敏感数据）

### 3) HTTP 性能指标（P95/P99）

- 每个 HTTP 请求在服务端记录耗时，并按 `METHOD + 路由` 聚合
- 同时提供两种出口：
  - Prometheus exporter（用于看板/告警）：`GET /api/metrics`
  - 内存暂存摘要（用于快速排查）：支持查询与重置
    - `GET /api/observability/http-metrics`：返回 `count/avg/p95/p99/max` 等摘要
    - `DELETE /api/observability/http-metrics`：清空指标
- Prometheus 指标按 `METHOD + 路由 + status` 聚合，支持从直方图计算 P95/P99

#### Prometheus 指标命名（后端）

- `ipet_http_requests_total{method,route,status}`
- `ipet_http_request_duration_ms_bucket{method,route,status,le}`（用于 `histogram_quantile`）
- `ipet_db_query_duration_ms_bucket{model,action,ok,le}`
- `ipet_db_slow_queries_total{model,action}`

#### 指标安全（可选）

- 若配置 `OBS_METRICS_TOKEN`，则抓取 `GET /api/metrics` 需要携带：
  - `X-Metrics-Token: <token>` 或 `Authorization: Bearer <token>`
  - `GET /api/observability/http-metrics`：返回 `count/avg/p95/p99/max` 等摘要
  - `DELETE /api/observability/http-metrics`：清空指标
- 每个聚合 Key 保留最近 `OBS_HTTP_METRICS_MAX_SAMPLES`（默认 `500`）条样本用于分位数计算

## 示例

### 请求返回 `X-Request-Id`

```bash
curl -i http://localhost:3000/api/health
```

响应头示例：

```text
X-Request-Id: 2f3b7f6e-1b6a-4c40-8c8e-9d2e6d0c8f5a
```

### 结构化日志示例

HTTP 请求日志：

```json
{"ts":"2025-12-19T00:00:00.000Z","level":"info","requestId":"...","type":"http.request","method":"GET","url":"/api/health","statusCode":200,"durationMs":12.34}
```

慢查询日志：

```json
{"ts":"2025-12-19T00:00:00.000Z","level":"warn","requestId":"...","type":"db.slow_query","model":"User","action":"findMany","durationMs":123.45,"whereKeys":["id"]}
```

## 日常看板与告警（Prometheus + Grafana）

- 监控栈位置：由部署环境提供
- Grafana 预置看板：`iPet Backend Overview`（包含 P95、5xx 错误率、RPS、慢查询）
- Prometheus 预置告警：
  - `IPetBackendHighLatencyP95`：P95 > 200ms（5m）
  - `IPetBackendHighErrorRate`：5xx 错误率 > 0.1%（5m）
  - `IPetBackendSlowQueriesDetected`：5m 内出现慢查询
