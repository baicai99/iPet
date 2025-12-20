# 后端缓存规范（NestJS CacheManager + Redis L2）

## 规范背景

后端已接入 NestJS `CacheModule`，并支持 **L1 内存 + L2 Redis** 的分层缓存，以降低只读热点接口的数据库压力。

## 适用对象

- 后端（`iPet-BackEnd/src-backend`）所有只读接口（优先高 QPS / 高耗时聚合）
- 需要明确 Key、TTL、失效策略的缓存接入点

## 约束规则

### 1) 存储层（L1/L2）启用规则

- **L1（内存）**：默认启用
- **L2（Redis）**：仅当配置 `REDIS_URL` 时启用

相关环境变量（后端）：

- `REDIS_URL`: Redis 连接串
- `CACHE_DEFAULT_TTL_MS`: CacheModule 默认 TTL（毫秒，默认 `60000`）
- `CACHE_NAMESPACE`: Key 命名空间/前缀（默认 `ipet`）

### 2) Key 命名规则

- Key 必须具备业务语义与层级：
  - `articles:category:{cat}`
  - `article:id:{id}`
  - `health:summary:{petId}:v:{version}`
  - `health:series:{petId}:{metricKey}:{range}:{bucket}:v:{version}`

### 3) TTL 策略（毫秒）

- 文章列表：`5 * 60 * 1000`
- 文章详情：`10 * 60 * 1000`
- 健康摘要：`30 * 1000`
- 健康聚合序列：`60 * 1000`
- 建议统一增加 TTL 抖动（±10%）降低雪崩风险

### 4) 写入时失效（必须）

#### 文章

- 写入后失效：
  - `articles:category:{category}`
  - `articles:category:all`

#### 健康（摘要/聚合）

- 采用 **pet 维度版本号**（`health:version:{petId}`）做失效：
  - 读接口 Key 必须包含 `:v:{version}`
  - 写入（新增/更新/删除/Pin 变更）后递增版本号，旧缓存自然过期

### 5) L3 预聚合/物化（可选，降峰优先）

- 对 `GET /health/series` 的常用桶（`day/week/month`）支持 **物化桶表** `HealthMetricBucket`（数据库侧，非 TTL 缓存）
- 与缓存一致使用 `health:version:{petId}`：
  - 桶表行包含同一 `version`
  - 读路径优先读桶表；未命中则重建（rebuild）再读
  - 写路径仅 bump version（避免写放大）
- 规范与回填脚本见：`iPet-uniapp/docs/backend/preaggregation.md`

## 示例

### 示例 1：文章列表（只缓存热点）

- 仅缓存 `page=1 && limit=20` 的列表（避免分页 Key 爆炸）
- Key：`articles:category:{cat}`
- TTL：5 分钟（带抖动）

### 示例 2：健康摘要（P1 优先级）

- Key：`health:summary:{petId}:v:{version}`
- TTL：30 秒（带抖动）
- 写入后：递增 `health:version:{petId}`
