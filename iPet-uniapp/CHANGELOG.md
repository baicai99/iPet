## 0.0.4 (2025-12-11)

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

## 0.0.3 (2025-12-10)

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

## 0.0.2 (2025-12-06)

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
