## 0.0.5 (2025-12-18)

### 文档更新
- [x] 新增《产品迭代与技术债管理层.md》文档，建立产品路线图与技术债治理体系
  - Roadmap 规划：短期（1-3月）、中期（3-6月）、长期（6-12月）三层规划与里程碑
    - 短期：用户体验优化（登录升级/图表优化/空状态）+ 文档体系建设 + 技术债偿还
    - 中期：智能分析引擎、社区内容平台、三方服务集成、多端协同
    - 长期：平台生态建设（AI 智能层/IoT 接入层/数据服务层/内容生态层）+ 商业化探索
  - 技术债清单：P0-P3 四级分级体系 + 影响面分析 + 改造方案 + 拆分计划
    - 当前 12 项技术债（P1: 4 项 / P2: 4 项 / P3: 4 项）
    - 每项技术债包含：影响范围、优先级、预估工时、改造方案、负责人、状态追踪
    - 强制规则：每个迭代必须分配 20% 时间偿还技术债
  - 变更评审模板：8 大评审维度 + 完整流程 + 验收标准
    - 改动点详述（背景、内容、文件清单）
    - 影响面分析（功能/数据/用户体验/性能/依赖）
    - 风险评估（技术风险/业务风险/合规风险矩阵）
    - 回滚方案（触发条件 + 详细步骤 + 预计时间）
    - 验收标准（功能/性能/质量/灰度四层验收）
    - 监控指标（核心指标 + 告警阈值 + 处理人）
    - 上线计划（时间安排 + 人员分工）
  - 最佳实践：技术债管理原则（及时记录/定期评审/强制偿还/量化影响/根因分析）、变更评审原则（风险优先/可回滚/灰度发布/监控先行/文档同步）、Roadmap 规划原则（目标导向/小步快跑/灵活调整/技术前瞻/平衡发展）
- [x] 新增《安全与合规层.md》文档，系统化定义数据安全、隐私合规和安全审计规范
  - 数据安全：HTTPS 强制加密、Token 存储策略、敏感字段脱敏规范、权限边界控制（public/guest/user 三级）、API 认证与自动 Token 刷新
  - 隐私合规：用户数据保存期限（正式账号永久、游客不持久化）、缓存数据过期策略（健康记录 90 天、图片 30 天）、账号删除流程（二次确认 + 完整数据清除）、隐私政策与用户协议展示、微信小程序权限申请规范
  - 安全审计：依赖漏洞扫描（npm audit + Snyk/Dependabot）、漏洞修复策略（Critical 24h/High 7d/Moderate 30d/Low 下版本）、环境变量与密钥管理、CI 安全检查推荐方案、本地预提交检查配置
  - 安全事件响应：P0-P3 四级分级、应急处理流程（发现→评估→控制→修复→复盘）
  - 安全清单：开发/部署/运行三阶段 Checklist
  - 参考资料：相关文档链接、代码文件索引、外部标准（OWASP/GDPR/个人信息保护法）
- [x] 新增《性能与稳定性层.md》文档，定义项目的性能优化策略和稳定性保障措施
  - 性能预算：首屏时长（小程序 ≤2.5s，H5 ≤3s，APP ≤2s）、包体大小（主包 ≤2MB）、接口耗时（P95 ≤500ms）、列表流畅度（≥50 FPS）目标值
  - 性能优化点位：
    - 双层缓存架构（CacheManager：内存 + localStorage，支持 TTL 和版本控制）
    - 健康数据缓存（LRU 容量控制 ≤5MB + SWR 策略 + 依赖图失效）
    - 图片缓存（H5 端 Base64 存储 ≤500KB，APP 端临时文件，最多 30 张）
    - 分页策略（每页 20 条，onReachBottom 触发）
    - 懒加载（图片 lazy-load、组件动态加载）
    - 降级策略（图表简化、接口降级、缓存兜底）
  - 容灾与限流：
    - 降级开关（Mock 模式、缓存兜底模式）
    - 熔断机制（401 Token 刷新统一处理、防雪崩）
    - 限流策略（GET 请求去重、请求取消 abortKey）
    - 重试与退避（离线队列自动重试、Token 刷新重试队列）
  - 压测与容量规划：
    - 客户端性能指标（页面切换 ≤300ms、内存占用 ≤200MB、缓存占用 ≤10MB、崩溃率 ≤0.1%）
    - 压力测试场景（大数据量测试、弱网测试、离线测试）
    - 性能监控与告警阈值（P95 接口耗时、首屏时长、崩溃率、缓存占用）
  - 最佳实践 Checklist：性能优化与稳定性保障的完整清单
- [x] 新增《运维与可观测性层.md》文档，系统化定义系统的可观测性与运维规范
  - 日志规范：日志分级（DEBUG/INFO/WARN/ERROR/FATAL）、关键字段定义、TraceId 追踪、数据脱敏规则、环境输出策略
    - 结构化日志格式 + 模块标识
    - 分布式追踪 TraceId 生成与传递
    - 敏感信息脱敏（邮箱/手机号/Token/身份证）
    - 开发/生产环境日志输出差异化策略
  - 监控指标：成功率、性能、错误率、资源、业务指标全覆盖
    - API 请求成功率/缓存命中率监控
    - 性能指标（P50/P95/P99 耗时、FCP/LCP/TTI）
    - 错误率监控（4xx/5xx 分类统计）
    - 资源监控（内存使用、缓存容量、LRU 清理）
    - 业务指标（DAU、健康记录创建成功率、数据同步成功率、离线队列处理成功率）
  - 告警策略：阈值定义、升级路径、值班轮换、责任人分配
    - P0/P1/P2 三级告警体系 + 响应时间要求
    - 告警升级流程（5min/15min/1h 超时自动升级）
    - 值班轮换表 + 模块责任人矩阵
    - 多渠道通知（短信/电话/钉钉/邮件）
  - 排障手册（Runbook）：5+ 常见故障场景完整处理流程
    - 登录失败率异常 → 定位步骤 → 处理动作 → 回滚方案
    - 健康记录无法创建 → 乐观更新回滚 → 缓存失效检查
    - Token 刷新失败 → RefreshToken 验证 → 静默刷新方案
    - 缓存雪崩 → TTL 配置 → 多级缓存 → 布隆过滤器
    - 图片上传失败 → 压缩优化 → 断点续传 → 分片上传
  - 最佳实践：日志规范、监控配置、故障处理、自动化运维
  - 工具集成：Sentry/阿里云 SLS/Grafana/钉钉机器人配置示例
- [x] 新增《工程化与开发指南层.md》文档，涵盖完整的工程化流程与规范
  - 快速启动：本地启动步骤、环境要求、依赖安装、环境变量配置、5+ 常见问题解决方案
  - 构建与发布：构建命令全集、产物目录结构、环境差异对比、微信小程序/H5/App 回滚流程
  - 配置策略：.env/config/远端配置三层架构职责边界、配置选择决策表、敏感配置保护方案
  - 代码规范：TypeScript + Husky + lint-staged 工具链、Conventional Commits 规范、Git Flow 分支策略、目录约定、命名规范 (BEM/PascalCase/camelCase)
- [x] 新增《接口契约层.md》文档，定义前后端协作核心契约
  - API 文档规范：请求/响应格式、错误码体系、分页规范、时间格式约定、空值处理
    - 统一响应结构 `ApiResponse<T>`
    - HTTP 状态码 + 业务错误码双层体系
    - 完整的错误分类（认证/权限/资源/业务错误）
    - 分页请求/响应标准格式
    - ISO 8601 时间格式 + UTC 时区约定
    - NULL vs undefined 空值语义
  - 鉴权与签名：JWT Token 机制、Token 刷新策略、权限校验、回放攻击保护
    - 邮箱密码登录 + 游客登录 + 账号升级流程
    - 自动 Token 刷新机制（401 自动重试）
    - 角色权限模型（GUEST/USER/PREMIUM/ADMIN）
    - 时间戳验证 + 幂等性键去重
  - 版本与兼容：API 版本管理、字段废弃策略、灰度发布机制
    - 路径版本控制（v1/v2）
    - 版本生命周期管理（STABLE/DEPRECATED/BETA）
    - 字段废弃标记与警告响应
    - Feature Flag 流量控制
  - Webhook/第三方对接：事件通知、签名校验、超时/重试策略、验收用例
    - Webhook 配置管理 + 事件订阅
    - HMAC-SHA256 签名生成与验证
    - 指数退避重试机制（最大 3 次）
    - 完整的测试场景与 Mock Server 示例
  - 离线与网络容错：离线队列、请求去重、幂等性保证
    - 离线请求队列自动重发
    - GET 请求去重优化
    - Idempotency Key 防重复提交
- [x] 新增《数据层.md》文档，系统化梳理数据架构与管理策略
  - 数据模型：ER 图、Schema 定义、约束与索引设计
    - User/Pet/HealthRecord 完整实体关系图
    - 主键、外键、复合索引配置
    - 字段验证规则与约束说明
  - 指标领域模型：4 种指标分类（快照/累积/连续/离散）及聚合策略
  - 数据生命周期：创建/更新/删除/归档/过期全流程管理
    - 乐观更新与回滚机制
    - 软删除 vs 硬删除策略
    - 游客数据 30 天过期与转正迁移
  - 一致性与幂等：多端同步冲突解决、重试机制、去重策略
    - 幂等键设计（客户端 + 服务端）
    - Last-Write-Wins (LWW) 冲突解决
    - 指数退避重试机制
  - 统计与聚合：指标口径定义、计算方式、采样窗口、变更流程
    - 8+ 核心指标计算口径（体重趋势、饮食总量、步数统计等）
    - 客户端索引优化 + 服务端预聚合
    - 缓存 Schema 版本控制机制
- [x] 新增《架构与代码组织层.md》文档，全面梳理项目架构设计
  - 总体架构图：包含客户端、服务端、存储和第三方依赖的完整视图
  - 数据流向图：展示从用户交互到数据持久化的完整流程
  - 分层与依赖规则：定义前后端分层架构和单向依赖原则
  - 模块划分与职责：清单化 28+ 核心模块的入口、API 和变更影响面
  - 关键技术决策（ADR）：记录 8 个核心技术选型的理由、代价与替代方案
    - ADR-001: 选择 UniApp 作为跨平台框架
    - ADR-002: 选择 Pinia 而非 Vuex
    - ADR-003: 选择 qiun-uni-ucharts 而非 ECharts
    - ADR-004: 选择 NestJS 作为后端框架
    - ADR-005: 选择 Prisma 而非 TypeORM
    - ADR-006: 乐观更新 (Optimistic UI) 策略
    - ADR-007: 多级缓存架构
    - ADR-008: JWT Token 过期策略

### Added
- [x] 新增游客模式（Guest）登录与账号升级能力
  - 后端：新增 guest users 迁移、游客清理服务、认证/守卫适配
  - 前端：新增游客模式登录流程、认证服务封装与 Mock 拦截支持
- [x] 引入 Design Tokens 主表与生成脚本
  - `src/design/tokens.json` 作为设计令牌单一事实来源
  - `npm run tokens:build` 生成主题变量与排版 mixins
- [x] 新增统一图表规范与 `BaseCanvasChart`，标准化图表渲染
- [x] 集成 u-charts / echarts，增强指标可视化能力（趋势折线、状态网格、风险网格等）

### Changed
- [x] 重构登录/注册等认证相关 UI（AuthLayout / 输入框 / 社交按钮等），提升一致性与可维护性
- [x] 指标详情页图表区域重构：统一 chart options 生成逻辑与组件接口
- [x] 统一各页面 AppNavbar 使用方式并改进用户会话校验流程

### Fixed
- [x] 修复 Summary 趋势区块空状态误判导致的展示异常
- [x] 修复 Summary i18n 标题缺失与样式兜底问题，提升小程序端鲁棒性
- [x] 统一 Summary 页面背景色写法，避免不同平台显示不一致

---

## 0.0.4 (2025-12-14)

### Added
- [x] 实现全新模块化文章系统，包含专用服务、内容管理、缓存和相关工具
  - 新增文章服务层，支持本地和远程内容管理
  - 新增内容缓存机制，提升加载性能
  - 新增文章相关工具函数
- [x] 新增 `TrendHintCard` 趋势提示卡片组件
- [x] 新增 `getTrendStatus` 工具函数，统一趋势状态显示逻辑
- [x] 新增健康服务模式就绪检查和日志记录功能
- [x] 新增 `AppSectionState.vue` 组件，采用叠加层架构防止累积布局偏移 (CLS)
  - 支持 `minHeight` 属性确保骨架屏到数据的平滑过渡
  - 使用 `v-show` 替代 `v-if` 避免 DOM 销毁
  - 内置 overlay 架构实现无缝状态切换
- [x] 新增 `TrendNoChangeCard.vue` 趋势无变化卡片，用于稳定的趋势展示
- [x] 新增 `useSectionState.ts` composable，统一管理区块状态 (loading/ready/empty/error)
- [x] 新增健康数据新架构，独立的实体存储、查询存储和事件总线
  - `entityStore.ts` - 管理原始健康数据实体
  - `queryStore.ts` - 管理派生数据和查询缓存
  - `eventBus.ts` - 处理数据变更事件
- [x] 新增 5 阶段纯函数数据处理管线
  - Stage 1: Data Loading
  - Stage 2: Data Filtering
  - Stage 3: Data Aggregation
  - Stage 4: Chart Model Building
  - Stage 5: Chart Options Generation
- [x] 新增统一的图表模型构建器 (`chartModelBuilder.ts`)
  - 坐标轴生成工具
  - 数据点对齐算法
  - 统计计算功能
- [x] 新增元数据驱动的健康指标处理系统
  - 支持动态图表选项生成
  - 支持数据聚合配置
- [x] 新增风险网格可视化功能
  - 新的趋势图表类型
  - 语义标签处理
  - 更新 Mock 数据生成
- [x] 新增状态网格图表组件，整合状态和状态网格图表为单一通用组件
- [x] 新增便便状态详细配置和状态网格图表组件重构
- [x] 新增文章推荐系统
  - 新增文章数据类型定义
  - 增强文章卡片组件
  - 指标详情页集成推荐文章
- [x] 新增 V2 指标系列数据聚合
  - 使用新的 composables
  - 智能缓存机制
  - Summary 自动刷新
- [x] 新增健康指标时间范围配置
- [x] 新增 Vitest 配置和单元测试
  - 时间工具函数测试
  - 增量聚合器测试
- [x] 新增 Mock 健康记录数据生成系统 (CRUD 操作)
  - 扩展指标类型支持
  - 混沌注入功能

### Changed
- [x] 统一趋势状态显示，使用 `TrendHintCard` 和 `getTrendStatus` 工具替代 `TrendNoChangeCard`
- [x] 增强 Store 重置安全性，防止数据丢失
- [x] 优化宠物切换数据加载逻辑
  - 改进健康服务 API 调用
  - 增强后端健康检查的鲁棒性
- [x] 更新文章配图资源
- [x] 重构加载状态管理
  - 使用统一的加载状态替代骨架屏
  - 动态渲染趋势卡片
- [x] 重构 `AppSectionState` 组件，采用叠加层架构防止累积布局偏移 (CLS)
  - 新增 `minHeight` 属性支持
  - 使用 `v-show` 替代 `v-if` 避免 DOM 销毁
- [x] 改进 UI 状态转换和响应式时机
  - 使用 `nextTick` 优化渲染时序
  - 移除 `PinnedMetricsWidget` 内部空状态处理逻辑
- [x] 优化 Shell-first 加载策略，实现骨架屏优先渲染
- [x] 优化健康数据检索和处理
  - 批量查询支持
  - 服务端聚合
  - 智能缓存策略
  - 新性能工具函数
- [x] 集中化趋势检测逻辑
  - 实现请求取消机制
  - 改进数据加载和生命周期管理
- [x] 优化图表渲染和数据计算，统一使用 `null` 值处理缺失数据
- [x] 整合图表渲染逻辑到 `chartCore.ts`
  - 删除环形图表组件
  - 更新 `TrendCard` UI
  - 增强 Mock 数据生成工具和类型
- [x] 优先使用 `config.displayUnit` 作为指标显示单位
- [x] 数值统计格式化为一位小数

### Fixed
- [x] 修复 Summary Snapshot Mock 契约验证问题
- [x] 增强健康摘要 Mock 数据生成的可靠性

### Removed
- [x] 移除 `TrendNoChangeCard` 组件（功能已被 `TrendHintCard` 替代）
- [x] 删除 `TimelineSection` 组件及其在指标详情页的使用

### Refactor
- [x] 重构趋势状态显示逻辑，统一使用 `getTrendStatus` 工具
- [x] 重构健康服务操作，增加模式检查和日志
- [x] 重构 `AppSectionState` 采用叠加层架构防止 CLS
- [x] 重构趋势检测逻辑，集中管理
- [x] 重构状态网格图表组件和工具函数

### Test
- [x] 新增 Vitest 单元测试覆盖时间工具和增量聚合器

---

## 0.0.3 (2025-12-11)

### Added
- [x] 新增 `TrendCard.vue` 通用趋势卡片组件，支持显示健康指标的趋势变化
  - 支持两种模式：有变化模式（双线对比）和稳定模式（单线显示）
  - 动态主题色，与指标分类颜色保持一致
  - 智能文案生成，根据趋势方向和幅度显示不同提示
  - 最小 20 个数据点阈值，不足时不显示
  - 支持日视图/周视图自动切换
- [x] 新增 `useTrendCard.ts` composable，封装趋势卡片的核心业务逻辑
  - 数据聚合与分组
  - 趋势计算与对比
  - 变化阈值判定（默认 30%）
- [x] 新增 `trendCopywriting.ts` 配置文件，定义智能文案模板和情感映射
- [x] 新增 Mock 数据生成系统 (`mock/generators/`)
  - `timeUtils.ts` 时间工具函数
  - `highFrequencyGenerator.ts` 高频指标数据生成（每日多次记录）
  - `lowFrequencyGenerator.ts` 低频指标数据生成（周期性记录）
  - `chaosEngine.ts` 异常数据注入引擎
- [x] 新增运行时 Mock 注册表 (`mockRegistry.ts`)，支持 API 请求拦截
- [x] 新增 Mock 模式自动跳过登录流程

### Changed
- [x] 重构 `trends.vue` 页面：分为"有趋势变化"和"无趋势变化"两个区块
- [x] 重构 `summary.vue` 页面：趋势区块现在显示有趋势变化的指标（最多 3 个）
- [x] 优化 `theme.ts`：新增 `TOKENS_DARK` 深色模式色彩配置
- [x] 优化 Mock 处理器：支持 `/health`、`/health/summary` 等 API 端点

### Fixed
- [x] 修复趋势卡片右侧平均值不显示单位的问题
- [x] 修复趋势卡片颜色不统一的问题（标题、平均线、数字现在使用同一主题色）
- [x] 修复 TypeScript 类型错误（MetricKey 类型断言）
- [x] 修复 Detail 详情页图表在「月」、「半年」、「年」视图下数据被错误截断的问题，现已支持完整展示最近30天、6个月和12个月的数据
- [x] 优化 `NumericStatsSection.vue` 数值统计区块，统一将平均值、最大值、最小值格式化为一位小数

---

## 0.0.2 (2025-12-10)

### Added
- [x] 新增 `useSummaryData.ts` composable，封装 Summary 页面的趋势数据处理和加载逻辑
- [x] 新增 `useMetricDetail.ts` composable，封装指标详情页的业务逻辑
- [x] 新增 `useMetricTrend.ts` composable，提供趋势数据分析功能
- [x] 新增 `useTrendCalculator.ts` composable，计算指标变化趋势
- [x] 新增 `useMetricConfig.ts` composable，统一指标配置管理
- [x] 新增 `useMetricData.ts` composable，封装指标数据获取逻辑
- [x] 新增 `useChartDataBuilder.ts` composable，构建图表数据
- [x] 新增 `healthRecordService.ts` 服务，处理健康记录的 CRUD 操作
- [x] 新增 `StepCountTrendCard.vue` 步数趋势卡片组件
- [x] 新增 `NumericStatsSection.vue` 数值统计区块组件
- [x] 新增 `ScheduleSection.vue` 日程区块组件
- [x] 新增 `TaskModeSection.vue` 任务模式区块组件
- [x] 新增 `TimelineSection.vue` 时间线区块组件
- [x] 新增 `src/types/article.ts` 文章类型定义
- [x] 新增 `src/types/insight.ts` 洞察类型定义
- [x] 新增 `src/types/dto/` DTO 类型定义目录

### Changed
- [x] 重构 `summary.vue`：抽取数据处理逻辑到 `useSummaryData` composable，代码从 374 行减少到 268 行
- [x] 重构 `PetSelectorBar.vue`：删除 13 个冗余 computed 属性，添加 `isSelected` helper，使用 CSS 级联选择器
- [x] 重构 `detail.vue`：集成新的业务组件和 composables
- [x] 优化 `metricMetadata.ts`：更新疫苗类型配置（狂犬疫苗、六联疫苗、八联疫苗）
- [x] 优化 `healthStore.ts`：改进 Summary 数据管理
- [x] 优化 `MetricScheduleCard.vue`：增强任务卡片功能
- [x] 优化 `BigDetailCard.vue`：改进详情卡片展示
- [x] 优化 `PinnedMetricsWidget.vue`：改进置顶指标组件
- [x] 优化 `useChartOptions.ts`：改进图表配置
- [x] 优化 `useMetricProcessor.ts`：改进指标处理逻辑
- [x] 优化 `useMetricList.ts`：改进指标列表逻辑

### Removed
- [x] 删除 `refactor.md` 临时重构文档
- [x] 删除 `TrendAnalysisCard.vue` 组件（功能已整合到新组件）

---

## 0.0.1 (2025-12-06)

### Added
- [x] 新增指标时间范围配置功能，支持为不同指标自定义 mini 图表显示天数和详情页 Tab 选项
- [x] 新增 `src/types/ui.ts` 类型定义文件，包含 `MetricCardConfig` 接口
- [x] 新增深色模式支持（`UserStatsRow.vue` 组件已完整实现深色/亮色切换）
- [x] 新增 `useCropperLoader` composable，用于 Cropper 组件的懒加载和单例管理
- [x] 新增 `useThemeStyles` composable，统一主题样式计算属性
- [x] 新增 `SearchablePickerPopup.vue` 可复用搜索选择弹窗组件
- [x] 新增 `sensitiveWords.ts` 敏感词配置文件
- [x] 新增 `genderConfig.ts` 性别显示配置文件
- [x] 新增 `src/types/pet.ts` 表单类型定义（复用 shared Pet 类型）
- [x] 新增 `shared/validation/` 模块：提取前后端共用的验证规则（EMAIL_REGEX, PASSWORD_REGEX 等）和敏感词过滤
- [x] 头像上传组件集成 `up-cropper` 裁剪功能，支持正方形头像裁剪


### Fixed
- [x] 修复详情页事件时间轴显示原始 JSON 对象的问题，现已正确格式化为标题和时间
- [x] 修复编辑宠物时点击“保存修改”会错误新增一只宠物的问题，现已正确更新原有记录
- [x] 修复宠物详情页“归档”和“删除”按钮无响应的问题，现已正常生效
- [x] 修复注销账号/删除宠物时仅删除数据库记录，未同步清理关联静态资源（图片等）的 bug
- [x] 修复更换头像后旧头像文件未被删除，仍占用存储空间的问题
- [x] 修复用户注销账号后，服务器未彻底清除该用户所有上传的静态资源的问题
- [x] 修复开发环境下 `.env` 文件中目录路径配置错误导致的资源加载失败问题
- [x] 修复喝水、进食等当日累计类指标（如今日喝水、今日饭量、步行时长等）错误显示为最新一次记录的问题，现已改为显示当日累计总和
- [x] 优化健康数据处理逻辑，支持按日累计计算 (sum) 和最新值 (latest) 两种显示模式，并修复详情页数值格式化异常
- [x] 修复周数据柱状图 (MiniBarChart) 在存在未来数据时显示异常导致只有6根柱子的问题，现已支持自动锚定到最新数据日期以显示完整的7天趋势
- [x] 修复 `PetProfileForm.vue` 中重复的 `.form-content` 样式定义
- [x] 移除多个组件中未使用的导入 (`uploadService`, `watch`, `getCurrentInstance` 等)
- [x] 修复后端上传服务在处理 H5 canvas 裁剪图片时无法正确识别文件扩展名的问题，现已支持根据 mimetype 自动推断扩展名

### Changed
- [x] 洗澡/刷牙指标：mini 图表显示 30 天数据，详情页默认显示"月"Tab
- [x] 驱虫指标：mini 图表显示 90 天数据，详情页默认显示"半年"Tab
- [x] 狂犬疫苗：mini 图表显示 180 天数据，详情页默认显示"年"Tab
- [x] 呕吐指标：mini 图表显示 30 天数据，详情页默认显示"月"Tab
- [x] 将“今日饭量”指标的展示形式从进度环 (Progress Ring) 修改为周柱状图 (Daily Bar)，以便更直观地查看最近一周的进食趋势
- [x] 全量迁移前端代码至 TypeScript，将 src 目录下所有 .js 文件重构为 .ts
- [x] 更新项目配置 (package.json, tsconfig.json) 以支持 TypeScript
- [x] 为核心工具函数 (formatHelper, uiMapper) 添加类型定义
- [x] 重构 `src/utils` 目录结构，拆分为 `common` (通用工具) 和 `business` (业务逻辑) 子目录，以优化项目结构
- [x] 统一常量管理：将 `src/config/constants.ts` 中的常量重构为 TypeScript Enums (`PetType`, `PetGender` 等)，并更新相关业务代码
- [x] 重构 `PetSelectorBar.vue`：添加 TypeScript 支持，使用 shared Pet 类型，合并主题计算属性
- [x] 重构 `AvatarUploader.vue`：抽取 Cropper 加载逻辑到 composable
- [x] 重构 `UserProfileForm.vue`：使用集中式敏感词配置
- [x] 重构 `UserProfileCard.vue`：使用集中式 gender 配置

### Removed
- [x] 删除通知中心以及相关代码。
- [x] 删除联系客服页面。
- [x] 删除后端健康报告生成的接口
- [x] 删除后端冗余的 `src-backend/upload/` 模块，保留功能完善的 `src-backend/uploads/`

### Refactor
- [x] 重构并重写 `pages/metrics/add` 页面（包含 UI、表单验证与提交逻辑优化）

### Todo
