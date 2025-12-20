# Changelog

## v2025.12.20 (2025-12-20)

- 后端：为 `GET /api/health/series` 增加 `day/week/month` 物化桶表 `HealthMetricBucket`（版本化按 `health:version:{petId}`），冷缓存优先读桶表、未命中则重建再读，以进一步降低峰值扫描/聚合压力。
- 后端：启动时自动建表/建索引（`HealthMetricBucket` + lookup/unique index），与现有 `HealthService.ensureSchemaReady()` 机制一致。
- 后端：新增回填脚本 `iPet-BackEnd/scripts/backfill_health_metric_buckets.ts`，用于在存量数据场景提前生成桶表（`npm run backfill:health-buckets`）。
- 文档：新增 `iPet-uniapp/docs/backend/preaggregation.md` 落档“预聚合/物化”规范；补充 `iPet-uniapp/docs/backend/cache.md` 的 L3 预聚合说明。
- 前端（uni-app）：增加 postinstall 补丁脚本，修复 `uni:sourcemap` 在某些 bundle chunk 为 asset 时对 `outputChunk.code.replace` 的崩溃（`Cannot read properties of undefined (reading 'replace')`）。
- 文档：新增 `iPet-uniapp/docs/dev/dependency-patches.md`，落档依赖补丁（postinstall）机制与约束。
- 前端（uni-app）：CI 增加微信小程序“主包”体积校验（不含分包），主包必须 `< 1.5MB`（90% 阈值 `1.35MB` 预警）。
- 前端（uni-app）：为满足主包预算，mp-weixin 构建后将文章封面图从 `static/images/articles` 归并到 `pages/articles` 分包目录，并在文章封面渲染时对 mp-weixin 平台做路径兼容映射。
- 文档：新增 `iPet-uniapp/docs/performance/package-size.md`，并同步修正前端性能/工程化/安全相关文档中的包体阈值描述。

## v2025.12.19 (2025-12-19)

- 后端：`CacheModule` 改为 `Keyv` L1 + 可选 Redis L2（配置 `REDIS_URL` 生效），并统一默认 TTL 配置项。
- 后端：为高价值只读热点接入缓存：文章列表（仅 `page=1&limit=20`）、文章详情、健康摘要、健康聚合序列。
- 后端：写入时失效：文章写入精准删除列表 Key；健康写入通过 `health:version:{petId}` 版本号递增失效摘要/聚合缓存。
- 文档：更新 `docs/backend/性能与容量分析.md` 的缓存现状；新增 `iPet-uniapp/docs/backend/cache.md` 作为缓存规范落档；补充 `iPet-BackEnd/.env.example` 的缓存相关 env。
- 后端：增加 `RequestIdMiddleware`，为每个请求返回 `X-Request-Id` 并在结构化日志中注入 `requestId`，用于请求链路关联定位。
- 后端：Prisma 增加慢查询识别（默认阈值 `100ms`），输出 `type=db.slow_query` 结构化日志（含 `model/action/durationMs/requestId`）。
- 后端：增加 HTTP 性能指标采集（内存暂存），提供 `GET /api/observability/http-metrics` 输出接口级 `P95/P99` 摘要，后续可接 Prometheus。
- 文档：新增 `iPet-uniapp/docs/backend/observability.md` 作为可观测性最小闭环规范落档；补充 `iPet-BackEnd/.env.example` 的可观测性相关 env。
- 运维：新增 `ops/monitoring`（Prometheus + Grafana + Alertmanager），预置基础看板与告警规则（P95、错误率、慢查询）。
- 后端：新增 Prometheus exporter：`GET /api/metrics`，输出 `ipet_http_*` / `ipet_db_*` 指标；支持 `OBS_METRICS_TOKEN` 可选鉴权。
- 后端：Prisma 查询耗时接入 Prometheus（直方图 + 慢查询计数），用于慢查询看板与告警。
- 后端：登录失败计数 + 冷却保护（基于 Cache），新增 `AUTH_LOGIN_*` 配置避免 bcrypt 被持续打爆。
- 后端：连接池基线在示例配置中提升至 `connection_limit=20`（见 `iPet-BackEnd/.env.example`）。
- CI：新增 GitHub Actions nightly `k6` 性能回归（`P95<200ms`、错误率 `<0.1%`），并提供 seed 脚本与最小压测场景。
- 文档：新增 `iPet-uniapp/docs/backend/performance-ci.md`，落档“看板 + 告警 + CI”性能防回退规范。
