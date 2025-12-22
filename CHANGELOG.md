# Changelog

## v2025.12.22-6 (2025-12-22)

### 🐛 修复 Trends View 数据充足时仍显示"采样中"的问题

**问题背景**：
Trends View 页面在部分指标已满足最小采样要求（≥20 天）时，仍然只显示全局的"正在采集样本，累计采样 XX 天"提示，未进入趋势展示逻辑。

**根本原因**：
页面状态判断使用 `getTrendStatus().status === 'insufficient-data'` 作为分支条件，而 `getTrendStatus` 基于 `totalRecordDays`（全局唯一日期数）判断，而非基于**每个指标的数据点数量**。这导致即使某些指标已有足够数据，只要全局采样天数未达标，页面仍显示采样提示。

**解决方案**：
将判断逻辑从"全局天数是否足够"改为"是否有任何指标达到数据充足状态"：

```typescript
// 核心判断：是否有任何指标达到数据充足状态
const hasAnyMetricWithSufficientData = computed(() => {
    return changedMetricKeys.value.length > 0 || stableMetricsWithData.value.length > 0
})
```

**页面结构调整**：
- 当 `hasAnyMetricWithSufficientData = false`：显示采样提示 + 采集中指标列表
- 当 `hasAnyMetricWithSufficientData = true`：显示三区块布局（存在趋势变化 / 无趋势变化 / 正在采集样本）

**相关文件**：
- `iPet-uniapp/src/pages/trends/trends.vue` - 修复判断逻辑

---

## v2025.12.22-5 (2025-12-22)

### ✨ Summary View 与 Trends View 趋势展示优化

**问题背景**：
- Summary View 中，当没有检测到任何趋势变化时，界面不显示任何卡片，导致用户误以为数据未加载或系统异常
- Trends View 在数据不足时仅显示"正在采集样本中"，无法区分有趋势与无趋势的指标

**解决方案**：

**Summary View 改进**：
- 当存在趋势变化时：仅展示有变化的指标卡片（最多 3 个）
- 当所有指标稳定时：显示"所有指标处于平稳状态"提示卡片（新增 `TrendStatusCard` 组件）
- 当数据不足时：显示采样进度提示

**Trends View 改进**：
- 拆分为三个明确的 Section：
  1. **存在趋势变化**：展示所有检测到趋势变化的指标
  2. **无趋势变化**：展示数据已满足条件（≥20 天）但当前处于平稳状态的指标
  3. **正在采集样本**：展示数据不足（<20 天）的指标标签列表

**Domain/Store 层增强**：
- `getTrendStatus()` 返回结果增加 `changedCount` 和 `stableCount` 字段
- `healthStore` 新增 `getStableMetricsWithSufficientData()` 和 `getMetricsWithInsufficientData()` getters

**新增组件**：
- `TrendStatusCard.vue`：用于展示特殊状态提示（如"平稳状态"）的卡片组件

**相关文件**：
- `iPet-uniapp/src/domain/trend/getTrendStatus.ts` - 扩展返回结果
- `iPet-uniapp/src/stores/healthStore.ts` - 新增 getters
- `iPet-uniapp/src/pages/summary/summary.vue` - 趋势区块三态展示
- `iPet-uniapp/src/pages/trends/trends.vue` - 三区块布局
- `iPet-uniapp/src/components/widgets/TrendStatusCard.vue` - 新组件

---

## v2025.12.22-4 (2025-12-22)

### 🐛 修复 Summary 页面趋势卡片不显示的问题

**问题背景**：
Summary 页面的趋势卡片区块无法显示任何趋势卡片，即使有足够的健康记录数据（≥20天）。

**根本原因**：
趋势卡片的渲染依赖 `healthStore.metricTrendMap`，该数据结构由 `refreshTrendDetection()` 填充。虽然 `fetchHealthRecords()` 在加载记录后会调用 `refreshTrendDetection()`，但 `refreshSummary()` 加载汇总数据后**没有**触发趋势检测，导致在某些场景下（如从缓存恢复、切换宠物等）`metricTrendMap` 保持为空，趋势卡片无法获取数据。

**解决方案**：
在 `refreshSummary()` 函数成功加载汇总数据后，显式调用 `refreshTrendDetection()` 确保 `metricTrendMap` 被正确填充。

**影响范围**：
- ✅ Summary 页面趋势卡片现在能正常显示（有足够数据时）
- ✅ 趋势检测在数据加载的所有路径下都能正确触发
- ⚠️ `refreshTrendDetection()` 有 50ms debounce，多次快速调用会自动合并

**相关文件**：
- `iPet-uniapp/src/stores/healthStore.ts` - 在 `refreshSummary()` 中添加 `refreshTrendDetection()` 调用

---

## v2025.12.22-3 (2025-12-22)

### 🔧 修复 HBuilderX 调试环境下 Preview Mock 认证缺失问题

**问题背景**：
在 HBuilderX 调试微信小程序时（develop/trial 环境），出现两个关键问题：
- 游客登录无响应或失败
- 应用初始化失败，表现为"Mock 不加载"

**根本原因**：
系统在 develop/trial 环境使用轻量级 Preview Mock（`previewMock.ts`），但该模块仅实现了宠物和健康相关接口，缺失：
- `POST /auth/guest` - 游客登录必需接口
- `GET /users/me` - 应用初始化必需接口

当这些接口被调用时，请求穿透到真实网络层，在调试环境中连接失败。

**解决方案**：
为 `previewMock.ts` 补充缺失的认证和用户接口，参考完整 mock 实现：
- 扩展 `PreviewMockState` 类型，新增 `currentUser` 字段跟踪当前用户
- 移除 GET-only 限制，支持 POST 请求
- 实现 `POST /auth/guest`：生成游客用户并返回 mock token
- 实现 `GET /users/me`：返回当前用户资料
- 初始化时创建默认游客用户，确保应用可立即使用

**影响范围**：
- ✅ HBuilderX 调试环境游客登录恢复正常
- ✅ 应用初始化流程正常执行
- ✅ 宠物和健康数据正常加载
- ✅ 不影响生产环境（Preview Mock 仅在 develop/trial 环境启用）

**相关文件**：
- `iPet-uniapp/src/utils/common/previewMock.ts` - 补充认证和用户接口

---

## v2025.12.22-2 (2025-12-22)


### 🔧 修复分包配置导致的系统性问题

**问题背景**：
在引入 UniApp 分包配置后，出现了三个严重的系统性问题：
- Mock 系统完全失效，无法加载 Mock 数据
- 用户登录状态丢失，无法保持会话
- 大部分功能失效，应用基本不可用

**根本原因**：
1. **Mock 模块解析失败**：`mockRegistry.ts` 使用静态导入 (`import`) 加载 mock handlers，在微信小程序分包环境下，`@mock` 路径别名无法正确解析，导致模块加载失败
2. **状态持久化失效**：Pinia 的 `pinia-plugin-persistedstate` 在分包上下文中无法正确读写 `uni.storage`，导致跨包状态丢失
3. **模块依赖链断裂**：分包懒加载机制导致核心依赖（Pinia stores、Mock handlers）在需要时尚未初始化完成

**解决方案**：
采用**策略 A：回退分包配置**，恢复为单包模式（快速恢复功能）

**变更内容**：
- 移除 `pages.json` 中的 `subPackages` 配置（8个分包，共14个页面）
- 将所有分包页面迁移回主 `pages` 数组
- 创建配置备份 `pages.json.backup`

**影响范围**：
- ✅ Mock 系统恢复正常
- ✅ 登录状态持久化恢复
- ✅ 所有功能恢复可用
- ⚠️ 主包大小可能增加（待后续优化）

**后续计划**：
- 探索其他包大小优化方案（代码分割、按需加载、Tree Shaking 优化）
- 如需分包，需先重构 Mock 系统和状态管理以支持分包环境

**相关文件**：
- `iPet-uniapp/src/pages.json` - 移除分包配置
- `iPet-uniapp/src/pages.json.backup` - 分包配置备份

---

## v2025.12.22 (2025-12-22)

- 前端（uni-app）:修复微信小程序分包场景下动态导入失败的问题，将 mock handlers 从动态导入（`import()`）改为静态导入，解决游客登录时的 `".then is not a function"` 错误。静态导入通过 Vite tree-shaking 确保仅在非生产模式打包。在 `tsconfig.json` 和 `vite.config.js` 中新增 `@mock` 路径别名以简化导入路径。
- 前端（uni-app）：修复微信小程序/开发环境中游客登录因为 mock 逻辑找不到 `handleMockRequest` 导致的 `_r2 is not a function` 异常，将 `request` 的 mock/preview 分支改为显式导入 `mockRegistry` 和 `previewMock`，确保 mp 运行时代码总能拿到正确的 mock 处理函数。

## v2025.12.21 (2025-12-21)

- 前端（uni-app）：Mock 开关改为由运行模式控制（`mode=production` 关闭；`preview/development` 开启），与接口环境（`VITE_API_BASE_URL`）解耦，修复预览环境无法加载 mock 数据导致页面无数据的问题。
- 前端（uni-app）：为支持 HBuilderX/微信开发者工具在 `develop|trial` 环境预览时也能使用 mock，增加 `mp-weixin` 运行时 `envVersion` 判断与轻量 mock 兜底（`release` 不启用）。
- 前端（uni-app）：为了兼容 HBuilderX 预览会把 `envVersion` 设为 `release` 的情况，新增 `VITE_FORCE_ENABLE_MOCK` 开关（`.env.preview` 默认 `true`）用于强制在非生产构建中路由到 mock。
- 前端（uni-app）：新增微信小程序预览模式命令 `dev:mp-weixin:preview` / `build:mp-weixin:preview`，并保留 `build:mp-weixin:mock` 作为别名。
- 文档：新增 `iPet-uniapp/docs/dev/mock-mode.md` 落档 Mock 模式规范；同步修正工程化/安全/API 契约文档中已过时的 `VITE_USE_MOCK` 说明。

## v2025.12.20 (2025-12-20)

- 前端（uni-app）：修复 mock 消失问题，将 `mockRegistry.ts` 的静态 import 改为动态 `await import()`，确保 mock handlers 仅在开发模式按需加载，避免打包进生产构建，同时解决微信小程序路径解析问题。

- 后端：为 `GET /api/health/series` 增加 `day/week/month` 物化桶表 `HealthMetricBucket`（版本化按 `health:version:{petId}`），冷缓存优先读桶表、未命中则重建再读，以进一步降低峰值扫描/聚合压力。
- 后端：启动时自动建表/建索引（`HealthMetricBucket` + lookup/unique index），与现有 `HealthService.ensureSchemaReady()` 机制一致。
- 后端：新增回填脚本 `iPet-BackEnd/scripts/backfill_health_metric_buckets.ts`，用于在存量数据场景提前生成桶表（`npm run backfill:health-buckets`）。
- 文档：新增 `iPet-uniapp/docs/backend/preaggregation.md` 落档“预聚合/物化”规范；补充 `iPet-uniapp/docs/backend/cache.md` 的 L3 预聚合说明。
- 前端（uni-app）：增加 postinstall 补丁脚本，修复 `uni:sourcemap` 在某些 bundle chunk 为 asset 时对 `outputChunk.code.replace` 的崩溃（`Cannot read properties of undefined (reading 'replace')`）。
- 文档：新增 `iPet-uniapp/docs/dev/dependency-patches.md`，落档依赖补丁（postinstall）机制与约束。
- 前端（uni-app）：CI 增加微信小程序“主包”体积校验（不含分包），主包必须 `< 1.5MB`（90% 阈值 `1.35MB` 预警）。
- 前端（uni-app）：为满足主包预算，mp-weixin 构建后将文章封面图从 `static/images/articles` 归并到 `pages/articles` 分包目录，并在文章封面渲染时对 mp-weixin 平台做路径兼容映射。
- 文档：新增 `iPet-uniapp/docs/performance/package-size.md`，并同步修正前端性能/工程化/安全相关文档中的包体阈值描述。
- 前端（uni-app）：微信小程序启用组件按需注入（`lazyCodeLoading=requiredComponents`），降低启动注入耗时与运行时内存占用（启用后需回归页面渲染/交互）。
- 文档：新增 `iPet-uniapp/docs/performance/lazy-code-loading.md`，落档按需注入配置位置、约束与回归要点。
- 前端（uni-app）：Pinia 改为具名引入 `createPinia`，并移除 `createApp()` 返回的 `Pinia` 命名空间，避免 namespace 导入导致 tree-shaking 失效，降低 `vendor.js` 引入冗余。
- 前端（uni-app）：将 mock 处理改为编译期常量 `USE_MOCK` + 按需 `import()`，避免生产构建把 `mock/handlers/**` 全量打入 `vendor.js`。
- 前端（uni-app）：清理会被打包进主包的非运行时静态资源（iconfont demo/js/json、重复 tabbar 图标），并将 iconfont 资源迁移到 `src/styles/iconfont` / `docs/assets/iconfont`，主包体积恢复至 `< 1.5MB`。
- 文档：新增 `iPet-uniapp/docs/performance/on-demand-imports.md`，补充“依赖按需引入”规范并在包体规范中引用。

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
