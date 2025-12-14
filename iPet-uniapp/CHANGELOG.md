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
