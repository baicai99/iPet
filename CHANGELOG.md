# Changelog

## 0.0.24 (2025-12-31)

### 🔧 Tooling
- 清空后端 `.env.example` 示例值并补充变量注释（范围：iPet-BackEnd；模块：env；行为变更：否）
- `.env.example` 注释切换为中文（范围：iPet-BackEnd；模块：env；行为变更：否）
- 对齐 `.env` 变量键并补齐缺失项（范围：iPet-BackEnd；模块：env；行为变更：否）
- 后端改为仅使用 `.env` 并移除 `.env.dev` 引用（范围：iPet-BackEnd；模块：env,config；行为变更：是）
- 新增后端 `.env.dev` 作为开发环境配置版本（范围：iPet-BackEnd；模块：env；行为变更：否）
- 后端启动按环境优先加载 `.env.dev`（开发）与 `.env`（生产）（范围：iPet-BackEnd；模块：config；行为变更：否）
- 开发环境仅加载 `.env.dev`，不再回退到 `.env`（范围：iPet-BackEnd；模块：config；行为变更：否）
- 后台管理端开发环境改为仅使用单一 API 地址配置（范围：backend-ui；模块：env；行为变更：是）
- 后台管理端统一使用 `.env` 并移除 `VITE_API_PROXY_TARGET` 代理配置（范围：backend-ui；模块：env,vite,scripts；行为变更：是）
- 移除运维配置目录 `ops`（范围：ops；模块：nginx,monitoring；行为变更：否）
- 移除 Playwright 相关测试脚本与配置（范围：backend-ui,tests；模块：e2e,tooling；行为变更：是）
- 移除 GitHub Actions 工作流与 CI 脚本（范围：.github,iPet-BackEnd,scripts；模块：workflows,ci-gate,contract-validate；行为变更：是）
- 删除根目录 `shared/`（范围：shared；模块：types,validation；行为变更：是）
- 移除前后端对根目录 `shared/` 共享目录的依赖，类型/校验规则改为各自项目内维护（范围：iPet-uniapp,iPet-BackEnd；模块：types,validation,config；行为变更：是）
- iPet-uniapp 仅保留 `.env` 并统一校验脚本/构建流程读取该文件（范围：iPet-uniapp；模块：env,scripts,package；行为变更：是）
- 后端 CORS 响应头支持从环境变量配置（范围：iPet-BackEnd；模块：config,main,env；行为变更：是）
- 后端 CORS 配置仅保留 `CORS_ORIGINS`，移除 `CLIENT_ORIGIN`（范围：iPet-BackEnd；模块：config,env；行为变更：是）
- 后端 CORS 运行时不再内置默认地址，完全由环境配置控制（范围：iPet-BackEnd；模块：main；行为变更：是）

### 📝 Docs
- 更新后台管理端开发指南，改为单一 API 地址配置说明（范围：docs；模块：DEV；行为变更：否）
- 更新后台管理端开发指南，说明统一使用 `.env`（范围：docs；模块：DEV；行为变更：否）
- 新增后台管理端 Nginx 部署规范（范围：backend-ui/docs；模块：backend-ui/nginx；行为变更：否）
- 更新运维与可观测性文档，移除 `ops` 路径引用（范围：docs,iPet-uniapp/docs,iPet-BackEnd；模块：ops/production-topology,backend/observability,backend/performance-ci,AGENTS；行为变更：否）
- 移除 CI 相关文档与引用（范围：docs,iPet-uniapp/docs,iPet-BackEnd；模块：frontend/安全与合规层,frontend/性能与稳定性层,backend/工程化与质量保障,env/README,backend/README；行为变更：否）
- 补充前后端类型与校验归属规范，并更新前端数据/安全/架构文档引用（范围：iPet-uniapp/docs,docs；模块：dev/shared-removal,frontend/数据层,frontend/安全与合规层,frontend/架构与代码组织层；行为变更：否）
- 更新 iPet-uniapp 环境变量文档与示例，说明仅使用 `.env`（范围：iPet-uniapp/docs；模块：env,build-meta,npm-scripts-ci-matrix,env/README；行为变更：否）

## 0.0.23 (2025-12-30)

### ✨ Features
- 新增后台设置入口与设置页，支持用户名/邮箱/密码/端口/路由前缀维护并对接 `/admin/settings`（范围：backend-ui,iPet-BackEnd；模块：features/system,features/layout,router,api/contracts,admin/init；行为变更：是）
- 设置页新增旧密码校验，修改密码需输入旧密码（范围：backend-ui,iPet-BackEnd；模块：features/system,admin/init；行为变更：是）
- 设置页新增旧密码验证按钮并在验证通过后解锁新密码输入（范围：backend-ui,iPet-BackEnd；模块：features/system,api/contracts,admin/init；行为变更：是）
- 优化设置页旧密码验证输入区样式与按钮状态（范围：backend-ui；模块：features/system；行为变更：否）
- Mock 模式登录页新增一键管理员快捷入口（范围：backend-ui；模块：features/auth,mocks；行为变更：是）
- 统一管理员角色为 `admin`，移除 super_admin 概念并调整初始化存在检查接口（范围：backend-ui,iPet-BackEnd；模块：core/auth,features/layout,features/init,admin; 行为变更：是）
- iPet-uniapp 文章数据改为仅使用后端接口，封面与内容素材迁移到根目录 `articles-source/` 供手动上传（范围：iPet-uniapp；模块：modules/articles,docs,package；行为变更：是）

### 🐛 Bug Fixes
- 修复设置页用户名与右上角用户信息不同步的问题（范围：backend-ui；模块：features/system,features/layout；行为变更：否）
- 调整后端部署打包脚本，排除文档/性能产物与环境文件等非运行必需内容（范围：iPet-BackEnd；模块：pack；行为变更：否）
- 修复直接运行产物时未执行 Prisma 同步导致管理端初始化接口报错（范围：iPet-BackEnd；模块：main,prisma-sync；行为变更：是）
- 修复用户管理筛选栏在右侧仍有空间时提前换行的问题，改为自适应换行布局（范围：backend-ui；模块：features/users；行为变更：是）
- 调整筛选栏通用布局为 flex 容器，确保宽度扩展时子项不被 Space 容器收缩（范围：backend-ui；模块：shared/components；行为变更：是）
- 移除文章管理/系统监控/审计日志页面的子容器 padding，避免与父容器叠加（范围：backend-ui；模块：features/articles,features/system,features/audit-logs；行为变更：是）
- 统一系统监控与用户管理统计卡片的最小高度，减少视觉跳高（范围：backend-ui；模块：features/system,shared/components；行为变更：否）
- 修复设置页旧密码/新密码校验提示在未输入新密码时误触发的问题（范围：backend-ui；模块：features/system；行为变更：否）
- 修复趋势图空数据时仍显示 0 折线/柱状的问题（范围：backend-ui；模块：features/dashboard；行为变更：否）
- 修复趋势图无数据时 Y 轴隐藏的问题（范围：backend-ui；模块：features/dashboard；行为变更：否）
- 修复文章新建/编辑路由未拼接入口路径导致的空白页（范围：backend-ui；模块：features/articles；行为变更：否）
- 移除文章新建页内部容器的 margin/padding，避免双层留白（范围：backend-ui；模块：features/articles；行为变更：否）
- 修复入口路径获取失败时根路径与初始化页互相重定向的问题，改为提示并允许已知入口访问登录（范围：backend-ui；模块：core/init,router；行为变更：是）
- 修复 404 “返回首页”跳转未携带入口路径的问题（范围：backend-ui；模块：router；行为变更：否）
- 修复登录成功在缺少入口路径时跳转到无效 `/dashboard` 的问题（范围：backend-ui；模块：features/auth；行为变更：否）
- 修复 dev 模式 `VITE_SKIP_INIT` 仍触发初始化重定向的问题（范围：backend-ui；模块：core/auth,features/auth,router；行为变更：是）
- 修复 Mock 仪表盘统计接口未按标准响应格式返回导致查询数据为空的问题（范围：backend-ui；模块：mocks/dashboard；行为变更：否）
- 修复 AntD 提示/通知静态调用与弃用字段导致的控制台警告（范围：backend-ui；模块：core/notify,features/auth,features/dashboard,features/init,features/system,features/articles；行为变更：否）
- 修复初始化页更新 API 地址后仍使用旧连接导致预览模式无法连通后端（范围：backend-ui；模块：features/init；行为变更：是）
- 修复后端 CORS 默认白名单缺失预览端口导致后台无法连接（范围：iPet-BackEnd；模块：config/main；行为变更：是）
- 修复后台管理端 dev 直连远端 API 被 CORS 拦截的问题，改为通过 Vite 代理转发（范围：backend-ui；模块：vite,env；行为变更：是）
- 修复管理员与审计日志表缺失导致迁移失败的问题，补齐管理端基线迁移（范围：iPet-BackEnd；模块：prisma/migrations；行为变更：是）
- 修复登录页输入框缺少 autocomplete 提示导致浏览器警告（范围：backend-ui；模块：features/auth；行为变更：否）
- 修复登录页英文文案未统一本地化的问题（范围：backend-ui；模块：features/auth；行为变更：否）
- 修复通知桥接类型导入错误导致的构建失败（范围：backend-ui；模块：core/notify；行为变更：否）
- 修复登录接口 401 被统一映射为“登录过期”导致的语义错误提示（范围：backend-ui；模块：api/interceptors；行为变更：否）
- 修复审计日志记录在管理员为空时的类型报错（范围：iPet-BackEnd；模块：admin；行为变更：否）
- 修复管理员角色无法看到审计日志入口的问题（范围：backend-ui；模块：features/layout；行为变更：是）
- 修复后台管理端统计卡片与抽屉的 AntD 弃用警告，并补充系统设置邮箱自动填充提示（范围：backend-ui；模块：features/users,features/dashboard,features/system；行为变更：否）

### 🎨 Frontend
- 文章封面上传改为卡片式占位与预览，自动转 JPG 并压缩（范围：backend-ui；模块：features/articles；行为变更：是）
- 初始化向导重构为双栏主任务布局，收拢主 CTA 并补充步骤摘要与只读信息区（范围：backend-ui；模块：features/init；行为变更：是）
- 初始化向导首步输入区对齐入口路径样式，统一表单视觉（范围：backend-ui；模块：features/init；行为变更：否）
- 入口路径步骤改为自动生成/手动填写二选一并收拢高级设置，结果地址提升为可复制结果卡（范围：backend-ui；模块：features/init；行为变更：是）
- 初始化向导管理员密码规则改为待办清单式提示，满足项高亮展示（范围：backend-ui；模块：features/init；行为变更：否）
- 初始化向导新增确认信息步骤，汇总参数并支持一键复制提醒保存（范围：backend-ui；模块：features/init；行为变更：是）
- 用户管理顶部摘要条替代游客统计卡片，筛选栏展示已筛选摘要并优化搜索提示，操作列改为主动作+更多，表格改为最近活跃列（范围：backend-ui；模块：features/users,shared/components；行为变更：是）
- 用户管理表格支持密度切换与排序提示，分页补充总量与每页条数切换，角色标签改为中性样式（范围：backend-ui；模块：features/users,shared/components；行为变更：是）
- 用户管理支持多选批量操作、空状态清除筛选入口，新增批量封禁原因输入弹窗（范围：backend-ui；模块：features/users；行为变更：是）
- 用户管理批量操作改为后端批量接口，列表支持服务端排序参数（范围：backend-ui,iPet-BackEnd；模块：features/users,admin；行为变更：是）
- 审计日志补充登录失败记录与访问 IP 展示（范围：backend-ui,iPet-BackEnd；模块：features/audit-logs,admin；行为变更：是）

### 🧹 Lint
- 修复 InitGuard effect 内 setState、补全 hooks 依赖并收敛 any 报错（范围：backend-ui；模块：core/init,features/articles,features/system,features/dashboard；行为变更：否）

### 📝 Docs
- 新增后台设置 API 与管理后台 UI 需求说明（范围：docs；模块：backend/管理后台API,backend/管理后台UI功能需求；行为变更：否）
- 更新后端 CORS 默认白名单说明，补充 preview 端口（范围：iPet-BackEnd；模块：后端架构总结；行为变更：否）
- 记录登录页文案统一使用中文（范围：docs；模块：backend/管理后台UI功能需求；行为变更：否）
- 补充初始化向导的布局与主动作规范（范围：docs；模块：backend/管理后台UI功能需求；行为变更：否）
- 更新用户管理模块文档以匹配摘要条与最近活跃列（范围：docs；模块：backend/管理后台UI功能需求；行为变更：否）
- 新增用户管理 UI 规范补充与密度/分页说明（范围：iPet-uniapp/docs,docs；模块：backend/admin-user-management-ui,backend/管理后台UI功能需求；行为变更：否）
- 更新用户管理文档以补充批量操作与空状态规则（范围：iPet-uniapp/docs,docs；模块：backend/admin-user-management-ui,backend/管理后台UI功能需求；行为变更：否）
- 更新用户管理 API 文档补充批量接口与排序参数（范围：docs；模块：backend/管理后台API；行为变更：否）
- 更新审计日志文档以补充登录失败与 IP 字段（范围：iPet-uniapp/docs,docs；模块：backend/admin-audit-log-ui,backend/管理后台API,backend/管理后台UI功能需求；行为变更：否）
- 统一管理员权限与初始化接口命名说明（范围：iPet-uniapp/docs,docs；模块：backend/admin-init-api,backend/管理后台UI功能需求,backend/管理后台API,frontend/init-wizard；行为变更：否）
- 更新开发指南，补充 dev 代理与环境变量配置（范围：docs；模块：DEV；行为变更：否）

## 0.0.22 (2025-12-29)

### 🎨 Frontend
- 后台管理端初始化向导改为单步主表单展示，辅以轻量说明区
- 精简入口路径/管理员步骤文案与提示，统一校验提示风格
- 初始化向导移除访问配置，端口迁移到入口路径并支持随机生成
- 入口路径随机生成移除固定前缀，支持 1-16 位长度配置
- 底部固定操作区与按钮可用状态，强化主流程与移动端可用性
- 初始化向导新增欢迎页，密码规则升级
- 初始化向导登录地址默认使用当前访问域名
- 初始化完成后停留在 /init 结果页，不再被 AuthProvider 自动跳转
- 初始化向导底部操作区改为普通流布局，移除 sticky
- 新增 `VITE_SKIP_INIT` 以便开发环境跳过初始化守卫
- 优化初始化向导密码规则提示文案
- 初始化成功后不再自动跳转，需手动复制或点击前往登录
- 初始化向导端口默认使用当前开发端口，避免登录地址缺失端口
- 初始化状态改为从 API 获取，移除对浏览器存储的依赖
- 初始化向导新增后端连接检测提示卡片，未连接时禁用下一步/完成初始化

### 🐛 Bug Fixes
- 修复后台管理端 API 契约未对齐 `{data, meta}` 解包导致的数据读取异常（范围：backend-ui；模块：api/contracts；行为变更：否）
- 修复后台管理端文章/用户列表分页响应字段不一致导致的分页读取异常（范围：backend-ui；模块：api/contracts；行为变更：否）
- 修复系统监控页请求错误接口导致返回 HTML 解析失败（范围：backend-ui；模块：features/system；行为变更：否）
- 修复初始化加载态 Spin 使用方式触发 AntD 提示警告（范围：backend-ui；模块：core/init；行为变更：否）
- 补齐后台管理端审计日志列表接口，前端分页加载避免 404（范围：iPet-BackEnd, backend-ui；模块：admin/audit-logs,features/audit-logs；行为变更：是）
- 修复后台管理端 token/admin 订阅缓存共用 dirty 标记导致的登录态不同步（范围：backend-ui；模块：core/auth；行为变更：否）
- 移除 mockServiceWorker.js 中无效的 ESLint 禁用注释以消除构建告警（范围：backend-ui；模块：public；行为变更：否）
- 修复后台管理端预览根路径未按初始化/登录状态自动跳转导致的 404（范围：backend-ui；模块：router/core/init；行为变更：是）
- 修复后台管理端开发环境 `VITE_MOCK` 显式配置被运行时配置覆盖导致的 Mock 状态误判（范围：backend-ui；模块：core/config；行为变更：是）
- 修复后台管理端初始化向导无法连通后端（缺少初始化相关接口）（范围：iPet-BackEnd；模块：admin/init；行为变更：是）
- 修复后台管理端初始化相关接口被全局 JWT 守卫拦截导致 401（范围：iPet-BackEnd；模块：auth/jwt-auth.guard；行为变更：是）
- 修复后台管理端刷新或新开登录页时初始化状态未及时拉取导致跳回 /init（范围：backend-ui；模块：core/init；行为变更：是）
- 支持后台管理员使用用户名或邮箱登录（范围：iPet-BackEnd；模块：admin/auth；行为变更：是）
- 后台服务在 start/start:dev/start:debug/start:prod 前自动执行 Prisma 迁移与生成（生产环境走 migrate deploy）（范围：iPet-BackEnd；模块：scripts/prisma-sync；行为变更：是）
- Prisma 自动同步在开发环境下遇到未知迁移状态时回退到 `db push`（范围：iPet-BackEnd；模块：scripts/prisma-sync；行为变更：是）
- 初始化流程在配置持久化失败时回滚管理员创建，避免账号缺失导致登录失败（范围：iPet-BackEnd；模块：admin/init；行为变更：是）
- 后台管理端初始化完成后禁止访问 `/init`，未初始化时登录页自动重定向到初始化（范围：backend-ui；模块：core/init/router；行为变更：是）
- 登录页与初始化页主动刷新初始化状态，避免未触发守卫导致跳转失效（范围：backend-ui；模块：features/init,features/auth；行为变更：是）
- 修复后台管理端初始化配置拉取失败导致 init=true 仍跳回 /init（范围：backend-ui；模块：core/init；行为变更：否）
- 修复后台管理端登录成功后跳转为 `/login/dashboard` 的路由拼接错误（范围：backend-ui；模块：features/auth；行为变更：否）
- 修复后台管理端菜单路由未拼接入口路径导致页面 404（范围：backend-ui；模块：features/layout；行为变更：否）
- 增加后台管理端 API 失败请求日志输出便于排查（范围：backend-ui；模块：api/interceptors；行为变更：否）
- 增加文章管理/系统监控/审计日志页面获取失败日志便于排查（范围：backend-ui；模块：features/articles,features/system,features/audit-logs；行为变更：否）

### 📝 Docs
- 新增管理后台初始化向导规范（字段边界/文案/错误提示/交互/响应式）
- 修正管理后台 API 分页响应示例与实际接口字段保持一致
- 更新管理后台系统监控与审计日志接口文档示例
- 移除审计日志模块“待后端实现”标记
- 记录后台管理端 ESLint 基线错误清单（lint-baseline-2025-12-29）
- 固化用户 Schema 单测失败输入（users-schema-test-failures-2025-12-29）
- 明确后台管理端运行时配置来源与生产最小变量清单
- 记录 npm audit 高危阻断结果（npm-audit-2025-12-29）
- 管理后台 Token 存储策略改为 sessionStorage（文档对齐）

### 🔧 Tooling
- **BREAKING**: 后台管理端环境变量 `VITE_MOCK` 格式从数字（`0`/`1`）改为布尔值（`false`/`true`）
  - 更新 `config.ts`、`main.tsx`、`runtimeConfig.ts` 中的判断逻辑
  - 更新 `.env.example` 示例值
  - 更新相关文档（`DEV.md`、`mock-backend-ui.md`）
- 后台管理端构建前加入质量门禁与 Mock 开关校验

### 🧹 Lint
- 后台管理端修复 Hooks 条件调用与测试工具 any 类型
- 收敛 init 流程未使用的错误变量
- 测试工具文件禁用 Fast Refresh 导出限制
- ESLint 禁止 console.log（允许 warn/error/info）

### 🧪 Tests
- 用户 Schema 单测对齐真实 API 字段与访客统计键名

### 🛡️ Security
- 移除后台管理端密码与初始化流程的 console.log

---

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
- 初始化完成后不自动跳转登录页，保留复制与手动打开入口

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

## 0.0.5 (2025-12-31)

### 🐛 Bug Fixes
- backend-ui: 移除未使用的配置/类型引用以通过 typecheck
- backend-ui: 菜单权限过滤使用当前用户角色
- backend-ui: 清理 Vite 配置中未使用的构建参数

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
