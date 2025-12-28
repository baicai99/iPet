# Changelog

## 0.0.21 (2025-12-28)

### 🛡️ Security
- 小程序文章渲染接入 Markdown sanitizer，避免原始 HTML 注入
- 新增 sanitizer 示例到安全基线文档

### ⚡️ Performance
- 后台管理端 ECharts 改为按需引入并通过共享 core 注入
- 性能基线文档补充 ECharts 按需引入示例

### 🔧 Tooling
- 后台管理端新增 `.env` 与 `.env.example`，统一远程 API 地址与 mock 开关

### 🐛 Bug Fixes
- 修复 QueryClient 配置导致的运行时崩溃（QueryCache/MutationCache 实例化）
- MobileDrawer 更新为 `size` 以消除 Drawer width 弃用警告
- 后台管理端开发环境默认启用 mock（VITE_MOCK=1），避免误请求真实服务器
- mock 模式下强制使用同源 `/api`，确保 MSW 能拦截请求
- 修复 LoginPage 缺少默认导出导致的路由懒加载报错

## 0.0.20 (2025-12-27)

### 📝 Docs
- 新增 `docs/DEV.md`，说明后台管理端最小启动与回归路径

### 🔧 Tooling
- 根目录补齐 `typecheck/lint/build` 脚本，统一指向 `backend-ui`
- 后台管理端新增 `typecheck` 脚本
- 后台管理端补齐 `.env.development` 入口（`VITE_API_BASE_URL`/`VITE_MOCK`）

### 🧹 Lint
- 后台管理端 ESLint error 清零：收敛 `any`、移除未使用变量
- 修正 hooks 依赖与 `useEchartsResize` 依赖项写法
- 拆分 `AuthProvider` 与 `useAuthContext`，恢复 Fast Refresh

### 🧩 Frontend
- 后台管理端引入 Query 客户端与 Provider，统一请求缓存与全局错误提示
- Users：列表/详情抽屉/游客统计 Query 化，缓存命中避免重复请求
- Dashboard：统计与趋势请求 Query 化，按 `staleTime` 收敛刷新行为
- 新增 `iPet-uniapp/docs/dev/server-state-layer.md` 规范说明

### 🛡️ Error Handling
- Axios 拦截器统一抛出 `AppError { code, message, requestId, detail }`
- 新增 `core/notify`，统一消息提示入口
- 全局 Query onError 接入 notify
- 新增 `ErrorBoundary` 页面级兜底
- 新增 `iPet-uniapp/docs/dev/error-handling.md` 规范说明

### 🔐 Permissions
- 新增 `core/auth/permissions.ts` 能力矩阵与 `usePermission`
- 用户/文章高危操作按钮接入权限判断，移除硬编码 `isSuperAdmin`
- 新增 `iPet-uniapp/docs/dev/permissions.md` 规范说明

### 🧪 Mock
- 后台管理端登录逻辑改为真实 API 调用，移除内联 mock/明文账号判断
- MSW 仅在 `VITE_MOCK=1` 时启用
- Mock 数据迁移到 `backend-ui/src/mocks/fixtures`
- 新增 `iPet-uniapp/docs/dev/mock-backend-ui.md` 规范说明

### 🔒 Security
- Token 存储迁移至 `sessionStorage`，启动时自动迁移旧的 `localStorage` 数据
- AuthProvider 与 token 管理使用统一存储入口
- 新增 `iPet-uniapp/docs/dev/security-baseline.md` 规范说明

### ⚡️ Performance
- 路由级 `React.lazy` + `Suspense`，按页面拆分首屏负载
- Vite `manualChunks` 拆分 react/antd/echarts/vendor
- ECharts resize 使用 rAF 节流，减少重复重排
- 新增 `iPet-uniapp/docs/dev/performance-backend-ui.md` 规范说明

### 🔒 Security (P0)
- **登录防爆破**: IP/用户名双维度限流，3次失败锁定30分钟
- **RBAC 权限控制**: 新增 `@Roles()` 装饰器 + `RolesGuard`
- **审计日志**: 新增 `AdminAuditLog` 模型，记录所有管理操作
- **Token 撤销**: `Admin.tokenRevokedAt` 字段支持立即失效

### ✨ New Features (P1)
- **软删除**: 用户/文章支持软删除、恢复、永久删除
  - `DELETE /api/admin/users/:id` - 软删除
  - `PATCH /api/admin/users/:id/restore` - 恢复
  - `DELETE /api/admin/users/:id/permanent` - 永久删除
- **API 标准化**: 统一响应格式 `{ success, data, requestId, timestamp }`
- **请求追踪**: 自动分配 `X-Request-Id`
- **业务错误码**: 标准化错误码体系

### 📦 Database Changes
- `User`/`Article` 新增: `deletedAt`, `deletedBy`
- `Admin` 新增: `tokenRevokedAt`
- 新增 `AdminAuditLog` 模型
- 新增索引: `users_is_banned`, `users_deleted_at`, `idx_article_deleted_at`

### 🔧 Infrastructure
- 新增 `TransformInterceptor` - 响应格式包装
- 新增 `HttpExceptionFilter` - 统一异常处理
- 新增 `RequestIdMiddleware` - 请求追踪
- 新增 `PaginationDto` - 分页限制（最大500页）
- 新增 `scripts/prisma-sync.js` - 启动时自动检查 Prisma/DB 同步状态

### 🐛 Bug Fixes
- 小程序文章封面统一使用 `/static/images/articles/`
- 文章封面产物切换为 JPG，避免真机 WebP 兼容问题
- 头像上传改为仅接受 JPG/JPEG
- 统一本地日键计算，消除 UTC 折叠导致的采样天数偏差
- 后台管理端补齐 `AuthProvider` 包裹，避免 `AuthGuard` 上下文缺失报错
- 后台管理端登录流程接入 `AuthProvider` 状态，修复登录后被守卫重定向
- 后台管理端趋势图表随容器尺寸变化自动 resize，避免初次错位与重复加载闪烁
- 后台管理端趋势图表恢复动画展示
- 后台管理端清理无用 `React` 导入并收敛 ECharts ref 类型
- DataTable 分页合并逻辑修正，避免 pagination 类型分支与 position 只读问题

---

## 0.0.19 (2025-12-27)

### ✨ New Features
- **管理员认证模块**: 独立的管理员登录体系
- **用户管理 API**: 用户列表、详情、封禁/解封、删除
- **文章 CRUD API**: 完整的文章管理功能
- **统计聚合 API**: Dashboard 数据统计
- **系统监控 API**: 系统信息、存储统计

### 📦 Database Changes
- 新增 `Admin` 模型
- `User` 新增: `isBanned`, `bannedAt`, `bannedReason`

### 🐛 Bug Fixes
- 完成 `missingPolicy=carry` 的轴对齐逻辑
- 修正 `six_month` 轴配置为按月分段
- 为 `MiniTrendChart` 增加小程序端渲染分支
- 迷你图表容器增加裁切

---

## 0.0.18 (2025-12-25)

### ✨ Features
- **Build Meta Traceability**: 生成 `dist/build-meta.json`
- **Production Logging**: 添加生产级日志工具
- **Guest Login Revamp**: 增强游客登录流程
- **Visualization Enhancement**: 集成 u-charts 和 echarts

### 🎨 Refactors
- 重构 `ArticleRecommendations.vue` 和 `MetricWiki.vue`
- 统一趋势评估逻辑到 `trendEvaluator.ts`
- 迁移设计令牌到 SCSS 变量

### 🐛 Bug Fixes
- 解决微信小程序生产构建后端访问问题
- 修复 `BaseChart.vue` 中的声明冲突
- 修复开发模式下引导页被跳过的问题

---

## 0.0.17 (2025-12-25)

### 🐛 Bug Fixes
- `GET /health/summary` 在缺失 `petId` 时返回空数据
- 移除详情页趋势点位常驻数值标签
- 修复微信小程序头像上传域名限制
- 修复指标详情页智能分析气泡文本不显示

---

## 0.0.16 (2025-12-24)

### 🧩 环境配置简化
- 将 `.env.preview` 合并回 `.env.development`
- Mock 模式只在显式开启时切换
- Dev 模式自动游客登录

---

## 0.0.15 (2025-12-23)

### 🛠️ 开发环境优化
- 开发 fallback API 统一指向稳定的预览/生产域名

---

## 0.0.14 (2025-12-22)

### 🔧 Mock 模式
- Mock 数据仅在 `VITE_MOCK=true` 时生效

---

## 0.0.13 ~ 0.0.9 (2025-12-22)

### 🐛 Bug Fixes
- 修复 Trends View 数据充足时仍显示"采样中"的问题
- Summary View 与 Trends View 趋势展示优化
- 修复分包配置导致的系统性问题
- 修复游客登录异常

---

## 0.0.8 ~ 0.0.7 (2025-12-21)

### 性能优化
- **主包体积优化**: 从 2.33MB 减少至 1.48MB (36.5%)
- **vendor.js优化**: 从 1.05MB 减少至 469KB (56%)

### Mock 模式增强
- Mock 开关改为由运行模式控制

---

## 0.0.6 (2025-12-20)

### 构建修复
- 修复 `uni:sourcemap` 偶发崩溃
- Mock 系统重构

### 📚 文档更新
- 新增后端可观测性分析文档
- 新增后端工程化与质量保障文档
- 新增后端性能与容量分析文档
- 新增后端稳定性与容错分析文档
- 新增后端安全与合规分析文档
- 新增后端接口契约文档

---

## 0.0.5 (2025-12-19)

### 性能优化
- 补齐分页/查询形态
- 多级缓存与可观测性
- HealthStore：实体层 shallowRef + 替换引用更新
- 趋势检测：O(N) 扫描优化为 O(k)
- 趋势检测：数据量 > 100 自动切 Worker

---

## 0.0.5 (2025-12-28)

### 🐛 Bug Fixes
- 统一解包 API `success/data` 响应，避免登录后 token 解析为空导致停留在登录页
- 修复后台仪表盘因全局样式导致的布局挤压/黑边问题，并重构仪表盘模块

---

## 0.0.4 (2025-12-14)

### ✨ Features
- 实现全新模块化文章系统
- 新增健康数据新架构
- 新增 5 阶段纯函数数据处理管线
- 新增风险网格可视化功能
- 新增文章推荐系统

---

## 0.0.3 (2025-12-11)

### ✨ Features
- 新增 `TrendCard.vue` 通用趋势卡片组件
- 新增 Mock 数据生成系统

---

## 0.0.2 (2025-12-10)

### ✨ Features
- 新增多个 composables 封装业务逻辑
- 新增健康记录服务
- 新增多个 UI 组件

---

## 0.0.1 (2025-12-06)

### ✨ Features
- 新增指标时间范围配置功能
- 新增深色模式支持
- 头像上传组件集成裁剪功能

### 🐛 Bug Fixes
- 修复详情页事件时间轴显示原始 JSON 对象的问题
- 修复编辑宠物时会错误新增宠物的问题
- 头像上传仅允许 JPG/JPEG
