# 服务端预聚合/物化（HealthMetricBucket）

## 规范背景

`GET /health/series` 已实现“服务端聚合 + 缓存”，将客户端主线程处理压到毫秒级；当健康记录量增长或峰值并发上升时，冷缓存（或频繁失效）仍会触发对 `HealthRecord` 的扫描与分桶聚合，带来峰值数据库压力。

因此对常用时间桶（`day/week/month`）引入 **预聚合缓存/物化桶表**，把“每次请求都要做的分桶”下沉为可复用的结果集，进一步降本与削峰。

## 适用对象

- 后端（`iPet-BackEnd/src-backend`）健康指标时序接口：`GET /health/series`
- 任何需要 `day/week/month` 分桶且读多写少的指标序列

## 约束规则

### 1) 物化桶表定义（L3）

- 表名：`HealthMetricBucket`
- 语义：按 `petId + metricKey + bucket + bucketKey` 存 **每个桶的最新记录**（与现有聚合逻辑一致）
- 支持桶：
  - `day`：`bucketKey=YYYY-MM-DD`
  - `week`：`bucketKey=YYYY-MM-DD`（周一为周起始）
  - `month`：`bucketKey=YYYY-MM`

### 2) 与缓存的关系（版本化）

- 缓存版本仍以 `health:version:{petId}` 为准（见 `iPet-uniapp/docs/backend/cache.md`）
- `HealthMetricBucket` 行包含同一 `version`
- 读路径（`GET /health/series`）优先读取 `HealthMetricBucket(version=current)`：
  - 命中：直接返回桶结果（再计算 stats）
  - 未命中：触发重建（rebuild）后再读
- 写路径（新增/更新/删除/Pin）**只递增版本号**；不强制同步更新桶表（避免写放大）

### 3) 重建窗口（horizon）

为避免桶表无限增长，同时覆盖常用范围：

- `day/week`：最近 `400` 天
- `month`：最近 `24` 个月

## 示例

### 示例 1：后端读路径（接口侧）

- 请求：`GET /health/series?petId=...&metricKey=weight&range=year&bucket=month`
- 行为：读 `HealthMetricBucket(petId,metricKey,bucket=month,version=current)`，按 `bucketKey>=cutoffMonth` 过滤并返回

### 示例 2：离线回填（运维/初始化）

在已有大量历史数据、希望提前填充桶表时：

- 命令：`cd iPet-BackEnd && npm run backfill:health-buckets`
- 可选 env：
  - `HEALTH_BUCKETS=day,week,month`
  - `HEALTH_BUCKET_VERSION=1`

