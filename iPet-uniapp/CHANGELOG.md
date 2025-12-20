## 0.0.6 (2025-12-20)

### 构建修复
- [x] **修复 `uni:sourcemap` 偶发崩溃**
  - 根因：上游插件在部分输出为 asset 时，假设 `outputChunk.code` 恒为 string，导致 `Cannot read properties of undefined (reading 'replace')`
  - 修复：新增 `postinstall` 脚本 `scripts/patch-uni-sourcemap.mjs`，为 `outputChunk.code/source` 增加兜底判断，避免构建期崩溃
  - 文档：新增 `docs/dev/dependency-patches.md` 落档依赖补丁机制与约束

### 文档更新
- [x] **新增后端可观测性分析文档**
  - 新增 `docs/BACKEND/可观测性分析.md`: iPet-Backend 可观测性全面分析与改进方案
    - **可观测性目标**: "线上问题 10 分钟内定位到模块/接口/SQL" 的能力现状评估与改进路径
    - **日志系统分析**:
      - 当前实现: 混用 console.log 和 NestJS Logger,日志格式不统一
      - 存在问题: 无 traceId/requestId 追踪、缺少敏感信息脱敏、日志级别不规范
      - 改进方案: 结构化 JSON 日志、RequestId 中间件、日志拦截器、敏感信息 脱敏工具
    - **监控指标分析**:
      - 请求耗时监控: 无运行时监控（仅代码注释中的性能优化记录），建议 PerformanceInterceptor + Prometheus
      - 数据库耗时监控: Prisma 支持但未启用查询日志，建议 Prisma middleware + 慢查询告警
      - 错误率统计: 缺少全局 ExceptionFilter,建议 GlobalExceptionFilter + 错误计数器
      - 队列堆积监控: 无消息队列，GuestCleanupService 使用 setInterval
      - 磁盘空间监控: 无监控机制，建议 DiskMonitorService + Cron 定时检查
    - **告警策略与阈值**:
      - 当前状态: 无告警系统、无健康检查端点
      - 建议阈值: API P95 延迟 (500ms/1000ms)、错误率 (1%/5%)、数据库慢查询 (100ms/1000ms)、磁盘使用率 (75%/90%)、内存使用率 (80%/95%)
      - 告警渠道: Prometheus AlertManager + 钉钉/飞书/邮件/短信
    - **看板设计**:
      - 最小可用看板: API 性能监控、数据库性能、系统资源、业务指标
      - 关键指标: http_request_total、http_request_duration_ms、db_query_duration_ms、error_total 等
      - 可视化方案: Prometheus + Grafana + AlertManager 技术栈
    - **实施建议**:
      - 短期优化 (1-2 周): 健康检查端点、统一日志格式、RequestId 中间件、Prisma 查询日志
      - 中期建设 (1-2 月): Prometheus 集成、Grafana 看板、基础告警
      - 长期演进 (3-6 月): OpenTelemetry 分布式追踪、ELK/Loki 日志聚合、SLO/SLA 体系
    - **技术选型建议**:
      - 日志聚合: Loki + Grafana (推荐) vs ELK Stack vs CloudWatch Logs
      - 链路追踪: OpenTelemetry + Jaeger (推荐) vs Zipkin vs AWS X-Ray
      - 指标收集: Prometheus + Grafana (推荐) vs InfluxDB + Grafana vs Datadog
      -告警系统: AlertManager (初期) → PagerDuty (成熟期)
    - **可观测性成熟度评分**: 总分 2/10 (初级阶段)
      - 日志系统: 3/10 (有基础日志但格式不统一)
      - 链路追踪: 0/10 (完全缺失)
      - 指标监控: 1/10 (仅代码注释)
      - 告警系统: 0/10 (完全缺失)
      - 可视化: 0/10 (无监控看板)
  - 文档特色:
    - 基于实际代码分析 (HealthService、GuestCleanupService、StorageService、PrismaService 等)
    - 15+ 代码改进示例 (RequestId 中间件、LoggingInterceptor、Prometheus 集成等)
    - 完整的 3 级实施路线图 (短期/中期/长期)
    - 技术选型对比矩阵 (优劣势/适用场景)
    - Mermaid 可视化实施流程图
    - 行级代码链接 (精确定位到具体实现)
  - 影响: 提供后端可观测性建设的完整指南,帮助开发团队建立日志、监控、告警和看板体系,实现"10 分钟定位问题"的目标


- [x] **新增后端工程化与质量保障文档**
  - 新增 `docs/backend/工程化与质量保障.md`: iPet-Backend 工程化实践与质量保障完整指南
    - **工程化成熟度评估**: 6 个维度评分（项目结构 5/5、编码规范 4/5、测试体系 1/5、CI/CD 2/5）
    - **项目结构与编码规范**: NestJS 标准架构、模块组织原则、分层设计、改进建议
    - **Lint/Format 约定**: ESLint + Prettier + TypeScript 配置分析、规则集说明、自动化工具链
    - **测试策略**: 当前缺失分析、推荐测试金字塔（单元 80% + 集成 15% + E2E 5%）、Jest + Supertest 方案、数据工厂 + Prisma Mock 示例、Pact.js 契约测试
    - **CI/CD 流程**: 当前手动部署分析、GitHub Actions / GitLab CI 推荐方案（5 阶段流水线）、Prisma Migration 策略、蓝绿部署 + 健康检查
    - **ADR 管理**: ADR 模板与流程、现有决策补录（NestJS / Prisma / JWT 认证）
    - **技术债清单**: 11 项后端技术债（P1: 4 项 / P2: 4 项 / P3: 3 项），涵盖测试、CI/CD、监控、类型安全等
    - **质量保障流程**: Code Review 清单、发布检查清单、工具链推荐（开发/质量/运维三类）
    - **最佳实践**: NestJS / Prisma / TypeScript 最佳实践代码示例
    - **改进路线图**: 5 个阶段实施计划（基础设施加固 → 测试体系 → CI/CD → 监控 → 性能优化）
  - 文档特色
    - 11 项可落地的后端技术债（P1-P3 分级）
    - 完整的 CI/CD 流水线配置示例（GitHub Actions + Dockerfile + 蓝绿部署）
    - 6 个 NestJS/Prisma/TypeScript 最佳实践代码示例
    - 测试覆盖率路线图（30% → 50% → 70%）与质量门禁配置
    - ADR 模板与 3 个核心架构决策补录
  - 影响: 提供后端工程化加固的完整路线图，帮助团队建立测试体系、CI/CD 流程、质量门禁，提升代码质量和发布效率

- [x] **新增后端性能与容量分析文档**

  - 新增 `docs/backend/性能与容量分析.md`: iPet-Backend 系统性能优化与容量规划完整指南
    - **核心链路性能指标**: 关键接口P95/P99目标、已实施优化案例（Health Summary 89%提升、Metric Series服务端聚合）、潜在瓶颈、慢查询监控
    - **缓存策略**: 当前状态分析、推荐分层架构、高价值缓存目标、击穿/雪崩防护、监控指标
    - **聚合计算策略**: 服务端vs DB vs预计算对比、优化建议（90%性能提升）、预计算设计
    - **容量模型**: 数据量增长预估、存储分层、归档策略、QPS评估、扩容方案、压测脚本
    - **优化路线图**: P0-P3分级（立即执行/1个月/3个月/长期规划）
    - 影响: 为性能调优和容量扩容提供完整指导，识别瓶颈、优化策略、规划容量

- [x] **新增后端稳定性与容错分析文档**
  - 新增 `docs/BACKEND/稳定性与容错分析.md`: iPet-Backend 系统稳定性与容错机制全面分析
    - **失败模式分析**:
      - 数据库连接失败：缺少重试机制、连接池配置未显式声明、无健康检查端点
      - 磁盘满/IO 慢：文件删除失败不阻塞（正确设计）、缺少磁盘空间检查和 IO 超时控制
      - 定时任务重入：单实例防重入已实现（running 标志）、缺少多实例并发保护
      - 多实例并发：限流仅基于内存（多实例无法全局限流）、缺少分布式锁、缺少乐观锁
    - **重试/超时/熔断机制**:
      - 重试机制：全局缺失，仅 GuestCleanup 有手动补偿
      - 超时机制：HTTP 和数据库超时均未显式配置
      - 熔断机制：全局缺失，StorageService 文件删除失败不抛异常（被动"熔断"）
    - **最终一致性方案**:
      - 文件删除与 DB 事务分离：设计正确（文件删除在事务外），但存在不一致风险
      - 用户账户删除：先删除文件 → 后删除 DB，可能导致文件丢失或泄漏
      - 改进方案：补偿型清理（先删 DB 后删文件 + 失败队列）、预删除标记（异步清理）
    - **任务调度与幂等**:
      - GuestCleanup 幂等性：基于 lastActiveAt 时间窗口（天然幂等）+ running 标志（单实例防重入）
      - 多实例并发处理：两种方案（分布式锁 Redis、按用户 ID 分片）
    - **容错能力评分**: 10 个维度评分（总评 3/5 星），关键短板：重试、超时、熔断、多实例并发控制
    - **改进优先级**: P0-P2 三级共 9 项改进建议（数据库连接重试、HTTP 超时、分布式锁、通用重试装饰器等）
    - **实施路线图**: 三阶段实施计划（基础防护 1-2 周 → 完善机制 2-3 周 → 优化提升 1 个月）
  - 文档特色:
    - 6 个核心容错机制深度剖析（代码示例 + 风险识别 + 改进建议）
    - 容错能力评分矩阵（现状/评分/备注）
    - 15+ 代码改进示例（连接重试、超时中间件、熔断器、分布式锁等）
    - 代码文件链接（行级精确定位）
    - 监控与可观测性建议（结构化指标日志）
  - 影响: 提供后端系统稳定性加固的完整路线图，帮助开发团队识别容错短板、制定改进优先级、落地实施

- [x] **新增后端安全与合规分析文档**

  - 新增 `docs/BACKEND/安全与合规.md`: iPet-Backend 系统安全分析与风险控制方案
    - **认证 (Authentication)**:
      - JWT 生命周期与刷新机制分析（30天有效期、Token 刷新策略）
      - 风险识别：accessToken/refreshToken 未分离、无撤销机制、无轮换策略
      - 控制项 AUTH-C01-C04：双 Token 机制、Token 黑名单、Secret 强度验证、Secret 轮换方案
    - **鉴权 (Authorization)**:
      - 当前鉴权模型分析（全局 Guard、白名单机制、资源级 userId 匹配）
      - 风险识别：白名单硬编码、路径匹配绕过漏洞、缺乏 RBAC/ABAC、Guest 权限边界不清
      - 控制项 AUTHZ-C01-C04：路径匹配修复、装饰器路由管理、资源所有权验证管道、Guest 权限边界
    - **上传安全**:
      - 文件上传实现分析（类型白名单、日期隔离路径、CUID2 文件名）
      - 风险识别：仅依赖 MIME 类型、缺少文件大小限制、无病毒扫描、路径遍历风险
      - 控制项 UPLOAD-C01-C04：文件魔数验证、文件大小限制、路径遍历防护、病毒扫描集成
    - **敏感信息管理**:
      - 日志脱敏：混用 Logger 和 console.log 的风险
      - 配置管理：.env 文件保护、JWT_SECRET 强制要求、密钥管理服务
      - 密码存储：bcrypt (cost=12) 已符合最佳实践
      - 控制项 LOG-C01-C02：日志脱敏工具、移除调试 console.log
      - 控制项 CONFIG-C01-C02：Git 预提交检查、云密钥管理服务
    - **综合风险矩阵**: 8 个核心控制项的优先级、实施难度、预期收益评估
    - **实施路线图**: Phase 1-3 分阶段实施计划（关键风险修复 → 重要优化 → 长期规划）
    - **监控与审计建议**: 关键指标、审计日志、告警规则
  - 文档特色:
    - 22 个可落地控制项（P0-P3 分级）
    - 每个控制项包含：优先级、实施方案、代码示例、验证标准
    - 完整的风险矩阵和实施路线图
    - 代码文件链接（行级精确定位）
    - 参考 OWASP Top 10、RFC 8725、CWE-22 等标准
  - 影响: 提供后端系统安全加固的完整路线图，帮助开发团队识别风险、制定优先级、落地实施


- [x] **新增后端接口契约文档**
  - 新增 `docs/BACKEND/接口契约.md`: iPet-Backend API 接口契约完整规范
    - REST 路由清单: 9 大模块共 40+ 接口详细定义（认证、用户、宠物、健康记录、健康计划、文章、洞察、系统配置、上传）
    - 请求/响应结构规范: 分页、排序、过滤、时间格式、空值约定
    - 错误码体系: HTTP 状态码 + NestJS 异常映射,包含错误响应示例
    - 认证与授权: JWT 令牌机制（30天有效期）、游客会话策略、权限验证规则
    - 版本策略: 当前版本状态、未来版本规划、兼容性原则、灰度发布策略
    - 幂等性与一致性: 幂等接口识别、幂等键建议方案、事务边界、乐观锁实现
    - 限流与安全: 端点级限流配置（基于 @nestjs/throttler）、CORS 策略、反重放攻击建议
    - 性能优化: 数据库索引清单、批量查询替代 N+1、服务端聚合
    - 维护建议: 统一响应格式、业务错误码、幂等键支持、OpenAPI 集成、日志追踪
  - 架构特色总结:
    - 清晰的 RESTful 设计、完善的认证机制、合理的限流策略
    - 性能优化措施（索引、批量查询、服务端聚合）
    - 软删除设计、级联删除、乐观锁并发控制
  - 文档特色:
    - 完整的路由表格（方法、路径、认证、限流、功能）
    - 请求/响应示例（JSON 格式）
    - ER 图（Mermaid 可视化）
    - 环境变量配置清单、维护流程与责任定义
  - 影响: 提供前后端协作的"唯一真相",帮助前端开发理解 API 契约、后端维护者同步文档、测试人员编写用例

- [x] **新增后端业务域分析文档**
  - 新增 `docs/BACKEND/业务域与边界分析.md`: iPet-BackEnd 系统架构与业务域完整分析
    - 业务域划分: 5 个核心业务域（认证与授权、宠物管理、健康追踪、内容管理、基础设施）
    - 模块职责边界: 11 个核心模块的详细职责定义（auth, pets, health, health-schedule, article, users, insight, uploads, storage, system-config, guest）
    - 核心用例与业务流程: 6 个关键用例的 Mermaid 序列图（游客会话、账号升级、Token刷新、健康数据追踪、文件上传等）
    - 依赖关系: 模块依赖图、表依赖 ER 图、服务间调用关系表
    - 领域模型与约束: 数据不变量、校验规则、权限规则、性能约束、数据一致性保证
    - 风险与改进建议: 当前限制、技术债、扩展性建议
  - 架构优势总结:
    - 清晰的模块边界、成熟的技术栈（NestJS + Prisma）
    - 性能优化（批量查询、索引优化、服务端聚合）
    - 游客友好（低门槛体验、平滑升级）
    - JWT Stateless 认证、软删除设计、客户端生成 ID、级联删除
  - 文档特色:
    - 7 个 Mermaid 可视化图表（架构图、序列图、依赖图、ER 图）
    - 清晰的职责边界对比表格
    - 代码示例（DTO 验证、事务使用）
    - 实用的性能指标、索引清单、改进建议
  - 影响: 提供后端系统全面视图,帮助开发人员理解业务边界、架构师规划重构、管理者评估风险

---

## 更新日志

## 2025-12-20

### 📚 文档更新
- **新增**: 后端数据设计文档 (`docs/BACKEND/数据设计.md`)
  - 实体关系图(ERD)与 8 个核心数据模型
  - 字段语义、类型规范、时间字段策略(DateTime vs String)
  - 索引策略:覆盖索引、部分索引、查询驱动的索引设计
  - 事务边界与最终一致性决策矩阵
  - 软删除 / 级联删除 / 乐观锁实现细节
  - Prisma Migration 迁移规范与回滚策略
  - 备份/恢复/归档策略及 HealthRecord 冷热数据分层建议
  - 数据治理、容量规划、性能监控指标
  - 已知技术债与优化路线图

## 0.0.5 (2025-12-19)

### Backend
- [x] **补齐分页/查询形态（防止大数据量全量拉取）**
  - `GET /health` / `GET /pets` / `GET /articles` / `GET /health-schedules/:petId` 统一启用分页（默认值 + 最大值限制）
  - `GET /health`：当传 `petId`（并在需要时传 `type`）时，查询形态对齐覆盖索引 `(petId, type, deleted, date DESC)`，降低大数据量扫描风险
  - `GET /articles`：列表不再返回正文 `content`，避免列表场景传输过大
  - 文档同步：更新 `docs/backend/接口契约.md` 的分页参数与说明

### Frontend Performance
- [x] **HealthStore：实体层 shallowRef + 替换引用更新**
  - 写入/删除/清理路径统一用替换引用，避免深层响应式与漏更新风险
- [x] **趋势检测：O(N) 扫描优化为 O(k)**
  - `refreshTrendDetection` 优先走 `metricIndex[key] -> recordIds[]`，避免每次按 key 全量筛 records
- [x] **趋势检测：数据量 > 100 自动切 Worker（默认启用）**
  - 新增 `WorkerExecutor` + `trendDetection.worker.ts`，Worker 不可用/失败时自动降级主线程
- [x] **refreshTrendDetection：Debounce 合并**
  - 短时间内多次触发合并为一次批量计算，降低重复计算
- [x] **缓存失效按文档执行**
  - 切宠物：全量失效 + 重新拉取
  - 写入/更新/删除：精准失效（仅清该指标 cache）

### Frontend Network
- [x] **request.ts：补齐指数退避重试（按契约）**
  - `src/utils/common/request.ts`：可重试状态码（408/429/500/502/503/504）与网络/超时失败，最多重试 3 次（1s/2s/4s）
  - 行为约束：默认仅对幂等方法启用；POST 仅在携带 `X-Idempotency-Key` 时允许重试，避免重复写入风险
  - 工具链：补充 `vitest` devDependency，用于运行/维护工具函数单测

### Bug Fixes
- [x] **趋势卡片显示与趋势判定问题修复**
  - 修复趋势检测阈值配置不符合需求的问题
    - 更新 `src/domain/trend/detectSignificantChanges.ts`: 将默认阈值从 30% 调整为 20%
    - 更新相关文档注释，确保代码与文档一致性
    - 影响：趋势检测更敏感，能够捕捉到更多有意义的变化（20%-30% 区间的变化现在会被识别为趋势）
  - **修复趋势分组 Bug：无趋势卡片错误归类到"有趋势变化"分区**
    - **根本原因**: Domain 层 (`detectSignificantChanges.ts`) 始终按**日**聚合，而 TrendCard 层 (`useTrendCard.ts`) 在数据 ≥20 周时自动切换到**周**聚合。不同聚合粒度导致计算出的变化百分比不一致。
    - 修复方案:
      - 更新 `src/domain/trend/detectSignificantChanges.ts`: 新增 `getWeekNumber()` 和 `aggregateByWeek()` 函数，实现自动视图切换逻辑（与 TrendCard 一致）
      - 更新 `src/composables/useTrendCard.ts`: 将默认阈值从 5% 改为 20%，比较运算符从 `>=` 改为 `>`
      - 更新 `src/components/widgets/TrendCard.vue`: 将 `thresholdPercent` prop 默认值从 5 改为 20
    - 影响：Domain 层和 TrendCard 层现在使用完全相同的聚合逻辑和阈值，确保分区归类与卡片显示一致
    - ⚠️ **重要提示**：首次使用时需要刷新数据以应用新算法
      - 方法1：下拉刷新 Summary 页面
      - 方法2：切换宠物后再切换回来
      - 方法3：退出登录后重新登录
  - 增强趋势页面视觉区分度
    - 更新 `src/pages/trends/trends.vue`: 为"有趋势变化"和"无趋势变化"分区添加色彩区分
    - 新增分区图标（trending-up / checkmark-circle）
    - 新增计数徽章显示每个分区的指标数量
    - 新增渐变背景和彩色边框提升视觉对比度
    - 影响：用户能够更快速地识别和区分不同类型的趋势数据

- [x] **趋势 View 趋势分区阈值修复（仅 >30% 才算趋势变化）**
  - 业务规则：仅当前后对比差值 **> 30%** 时，才认定为"有趋势变化"（严格 `>`）
  - 修复方案：
    - 新增 `src/domain/trend/trendConstants.ts`：统一阈值/窗口/数据点等默认参数，避免 Domain/UI 口径漂移
    - 更新 `src/domain/trend/detectSignificantChanges.ts`：默认阈值调整为 30%
    - 更新 `src/composables/useTrendCard.ts` + `src/components/widgets/TrendCard.vue`：默认阈值同步为 30%，并将均值显示格式统一为最多 1 位小数
    - 更新 `docs/frontend/产品与业务层.md`：补充趋势阈值口径与配置参数
  - 影响：趋势 View 与 Summary View 中复用的趋势分区判断口径统一，变化幅度 ≤ 30% 不再误归入"有趋势变化"

- [x] **Summary View：趋势区块移除强制 min-height**
  - 更新 `src/pages/summary/summary.vue`：去除 trends section 的 `min-height` 绑定与相关 computed，避免不必要的留白与布局约束

- [x] **Summary View：简化趋势区块标题**
  - 更新 `src/pages/summary/summary.vue`：移除 trends section 的额外 header 容器，仅保留单一文字标题

- [x] **Summary View：回滚趋势区块标题简化**
  - 更新 `src/pages/summary/summary.vue`：恢复为 `section-header` 包裹标题的结构（避免与其它 section 标题样式/结构不一致）

- [x] **趋势 View：简化趋势分区标题**
  - 更新 `src/pages/trends/trends.vue`：移除分区标题中的图标/徽章等复杂结构，仅保留文字标题

- [x] **Iconfont 图标引用统一为 Unicode**
  - 变更范围：健康指标卡片/趋势卡片/关联指标等 Iconfont 图标渲染
  - 影响模块：
    - `src/App.vue`：全局引入 `src/static/icon/iconfont.css`
    - `src/data/metricMetadata.ts`：新增 `iconUnicode` 字段，并补齐各指标的 Unicode 映射
    - `src/components/widgets/TrendCard.vue` + `src/components/widgets/BaseTrendCard.vue`：移除 SVG symbol 方式，改为 Unicode 渲染
    - `src/components/business/health/MetricItemCard.vue` + `src/pages/metrics/detail.vue`：指标卡片与关联指标图标改为 Unicode 渲染
  - 行为变更：项目内不再依赖 `iconfont.js`/`<svg><use /></svg>` 的 symbol 引用方式
  - 规范文档：新增 `docs/iconfont/Unicode.md`

- [x] **Tabbar 图标切换为 Iconfont Unicode（like / my）**
  - 变更范围：Tabbar 图标渲染从 PNG 切换为 Iconfont Unicode
  - 影响模块：
    - `src/pages.json`：使用原生 `tabBar.iconfontSrc` + `list[].iconfont`
    - `src/utils/ui/iconfont.ts`：补齐 tabbar Unicode 映射
  - 行为变更：tabbar 不再使用 `static/tabbar/*.png`，也不再使用 `custom-tab-bar`
  - 规范文档：更新 `docs/iconfont/Unicode.md`
  - 修复：切换为 uni-app 原生 tabBar iconfont 配置，避免自定义 tabbar 不显示

- [x] **Tabbar 图标回退为 PNG**
  - 变更范围：Tabbar 图标恢复使用 `src/static/tabbar/*.png`
  - 影响模块：`src/pages.json`（移除 `tabBar.iconfontSrc` / `list[].iconfont`，恢复 `iconPath/selectedIconPath`）
  - 行为变更：`pages.json` 不再引用字体文件作为 tabbar 图标来源
  - 文档更新：`docs/iconfont/Unicode.md` 同步说明 tabbar 当前使用 PNG
  - 修复：更新 tabbar 图片路径为 `static/tabbar/like.png` / `static/tabbar/likefill.png` / `static/tabbar/my.png` / `static/tabbar/myfill.png`

### 工程化
- [x] **TD-008: 数据库索引未优化** - 添加关键数据库索引，防止数据量增长后的性能问题
  - 更新 `prisma/schema.prisma`: 为 Pet、HealthRecord、Article、HealthSchedule 添加 4 个性能索引
  - 新增 `prisma/migrations/20251219_add_missing_indexes/migration.sql`: 索引创建 SQL
  - 更新 `src-backend/health/health.service.ts`: 扩展 `ensureHealthIndexes()` 方法作为运行时保障
  - 索引覆盖：
    - `idx_pet_user_active`: 用户宠物查询优化 (~70% 提升)
    - `idx_health_record_pet_date`: 日期范围查询优化 (~60% 提升)
    - `idx_health_schedule_pet_active`: 健康计划查询优化 (~67% 提升)
    - `idx_article_category_created`: 文章分类查询优化 (~68% 提升)

- [x] **TD-007: 缺少性能监控** - 实现统一的性能监控系统，解决"只能感觉卡，无法量化定位"问题
  - 新增 `src/utils/performance/performanceMonitor.ts`: 核心性能监控服务
    - API 请求耗时追踪（集成到 request.ts）
    - 缓存命中率追踪（集成到 healthCacheService.ts）
    - 页面加载时间追踪（FCP/LCP）
    - 错误追踪（集成到 errorHandler.ts + Vue 全局错误捕获）
    - P50/P95/P99 百分位数自动计算
    - 开发环境彩色控制台输出
    - 预留远程上报接口（Sentry/阿里云 ARMS）
  - 新增 `src/composables/usePerformanceTracker.ts`: 页面性能追踪 Composable
  - 更新 `src/utils/config.ts`: 添加 ENABLE_PERFORMANCE_MONITOR 和 PERFORMANCE_REPORT_URL 配置
  - 更新 `src/main.ts`: 初始化全局错误捕获

- [x] **TD-006: 代码重复率高** - 提取公共工具函数和组件，降低代码重复率
  - 新增 `src/utils/common/toast.ts`: 统一 Toast 工具（showToast/showSuccess/showError/showLoading/showModal）
  - 新增 `src/utils/validation/auth.ts`: 统一认证验证工具（validateEmail/validatePassword/validateLoginForm/validateRegisterForm + 错误处理工具）
  - 新增 `src/components/widgets/BaseTrendCard.vue`: 趋势卡片基础组件（提取 TrendCard 和 StepCountTrendCard 共享逻辑）
  - 新增 `src/components/layout/AuthLayout.vue`: 认证页面通用布局组件（渐变背景、卡片容器、社交登录、游客登录、页脚插槽）
  - 重构 `src/pages/login/index.vue`: 使用 AuthLayout + 统一工具函数，从 540 行减少到 ~270 行
  - 重构 `src/pages/register/index.vue`: 使用 AuthLayout + 统一工具函数，从 511 行减少到 ~280 行
  - 总计减少代码行数 ~500 行

### 文档结构
- [x] 重组 `/docs` 目录结构，分为 `frontend/` 和 `api/` 两个子目录
  - `api/`: API-Reference.md、接口契约层.md
  - `frontend/`: 产品与业务层.md、架构与代码组织层.md、数据层.md、设计规范.md、性能与稳定性层.md、工程化与开发指南层.md、产品迭代与技术债管理层.md、运维与可观测性层.md、安全与合规层.md

### 工程化
- [x] 新增 GitHub Actions CI/CD 工作流 (`.github/workflows/build-check.yml`)
  - 微信小程序包体大小检测（主包 ≤2MB，超 90% 警告）
  - TypeScript 类型检查
  - 依赖安全审计（PR 时运行）
  - 触发条件：push 到 main/develop，PR 到 main

### 文档更新
- [x] 新增《API-Reference.md》接口详细文档（TD-005 技术债偿还进行中）
  - 6 大模块完整接口定义：认证、宠物管理、健康记录、用户资料、数据同步、其他接口
  - 每个接口包含：请求方法、参数表、请求/响应示例、错误码说明
  - 3 个核心类型定义（Pet、HealthRecord、AccountInfo）
  - TODO 标记：计划迁移到 OpenAPI/Swagger 规范
  - 更新 `接口契约层.md` 添加到 API Reference 的引用链接
  - 更新技术债清单 TD-005 状态为「进行中」


### Added
- [x] 新增统一错误处理机制（TD-002 技术债偿还）
  - `src/types/error.ts`: AppError 类 + ErrorCode 枚举（对齐接口契约层 10000-60004 错误码）
  - `src/utils/common/errorHandler.ts`: showError / withErrorHandler / 错误判断工具
  - 更新 `src/utils/common/request.ts`: handleError 返回 AppError，fail 回调使用 AppError
  - 中文友好错误消息映射（22 种错误类型）

### 文档更新
- [x] 新增错误处理规范章节（工程化与开发指南层.md）
  - 错误码分类表、使用示例、最佳实践
- [x] 更新 TD-002 改造进度（产品迭代与技术债管理层.md）
  - 标记各 Phase 为已完成
  - 更新 Roadmap：qiun-data-charts、API 错误处理 → ✅
- [x] 修复 P1 样式规范冲突：工程化与开发指南层.md 示例代码从 CSS 变量改为 Sass 变量
  - 删除 `var(--color-danger)` → `$color-danger`
  - 删除 `var(--color-primary-light)` → `$color-primary-light`
  - 删除 `var(--color-text-tertiary)` → `$color-text-tertiary`
  - 说明：设计规范明确禁止 CSS 变量，本次修正使文档保持一致
- [x] 同步技术债清单状态（产品迭代与技术债管理层.md）
  - TD-003: 描述修正为"单元测试覆盖率不足"（Vitest 已配置，但覆盖率待提升）
  - TD-004: 标记为 ✅ 已完成（Mock 机制已实现，17 个 API 处理器）
  - TD-005: 标记为 ✅ 已完成（图片优化脚本已实现，构建已集成）
- [x] 统一跨端存储方案术语，修复 P0 文档口径冲突问题
  - 接口契约层.md: Token 存储策略/离线队列 localStorage → uni.storage / uni.setStorageSync
  - 性能与稳定性层.md: L2 缓存描述 localStorage → uni.storage（含平台说明）
  - 数据层.md: Token 安全描述 Keychain/EncryptedSharedPreferences → uni.setStorageSync
  - 说明：代码实现已正确使用 UniApp 跨端 API，本次仅修正文档术语
- [x] 更新 CI/CD 配置状态描述（性能与稳定性层.md、安全与合规层.md）

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
