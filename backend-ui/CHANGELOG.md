# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Config**: 简化环境配置为纯环境变量方式
  - 移除 runtime config (`/config.json`) 机制
  - 仅保留 `.env.dev`（开发）和 `.env`（生产）两个配置文件
  - 修改 `npm run dev` 使用 `--mode dev` 读取 `.env.dev`
  - `npm run build` 直接从 `.env` 读取配置
  - 删除 `scripts/generate-config.mjs`（不再需要）
  - 简化 `runtimeConfig.ts` 直接使用环境变量
  - 更新 README.md 环境配置章节，说明新的配置方式
  - dev 和 prod 环境配置完全独立，互不干扰


### Fixed
- **Build**: Exclude `mockServiceWorker.js` from production builds to prevent mock loading in production environments.
- **Build**: Generate production-ready `config.json` with `mockEnabled: false` during build process.
- **Routing**: Avoid `/`↔`/init` redirect loop when entry path is unavailable by rendering a warning state instead of bouncing.
- **Routing**: Keep login accessible even when entry path cannot be fetched by skipping path validation until it exists.
- **Routing**: 404 “back to home” now routes through `/` so entry-based redirects work correctly.
- **Auth**: Login success falls back to entry path from init state or `/` instead of `/dashboard`.
- **API**: Align contracts with interceptor `{data, meta}` unwrap to avoid undefined payloads in login/stats/system/articles.
- **Articles/Users**: Normalize list pagination payloads to support flat API responses and prevent runtime crashes.
- **System**: Use admin system endpoints and App message instance to avoid JSON parse failures and AntD warning.
- **Init**: Use fullscreen Spin while loading init state to remove `tip` warning.
- **Audit**: Load audit logs via paginated admin endpoint to avoid 404s.
- **Auth**: Separate token/admin snapshot dirtiness to avoid stale login state.
- **Lint**: Remove unused eslint-disable directive from `mockServiceWorker.js`.
- **Build**: Fixed TypeScript error in `InitGuard.tsx` where undefined variable `storedEntryPath` was referenced instead of `initState.entryPath`, preventing production builds.
- **Auth/Routing**: Prevent login redirect loops by matching actual login paths and redirecting to entry-specific login.
- **Routing**: Handle root path under `InitGuard` so dev entry `/` redirects instead of showing 404.
- **Init**: Replace deprecated Ant Design `Card` `bordered` prop with `variant="borderless"` to remove console warning.
- **Init/System**: Add password `autocomplete` hints and migrate Progress sizing to `size` to silence browser/AntD warnings.
- **Init**: Add email `autocomplete="username"` hint to remove browser warning.
- **System**: Replace deprecated Ant Design `Card` `bordered` prop in settings panels to remove console warning.
- **Infrastructure**: Use Vite env detection for MSW bootstrap and render UI even if MSW fails to start.
- **Dashboard**: Guard pet distribution access when stats payload lacks `pets` to avoid runtime crash.
- **Dashboard**: Guard overview card stats access when nested fields are missing.
- **Dashboard**: Normalize trend and distribution data to arrays to prevent map crashes.
- **Layout**: Hide default Sider trigger to remove the bottom collapse bar.
- **Dashboard**: Auto-resize ECharts on container size changes to prevent initial mislayout and double-loading flicker.
- **Dashboard**: Re-enable chart animations now that resize stabilization is in place.
- **Users**: Allow user list filters to wrap on smaller viewports to prevent overflow.
- **Users**: Let user list filters flex-wrap at any width to handle narrow content areas.
- **Users**: Prevent filter selects from expanding so the reset button stays on the same row when space allows.
- **Layout**: Let filter bar content span full width when no right-side actions are present.

### Added
- **Build**: Added `generate-config.mjs` script to create environment-specific `config.json` during build process.
- **Config**: Added `public/config.json.production` template for production deployment reference.
- **Dashboard**: Added MSW mock endpoints for admin stats and trends with sample data.
- **Users**: Added MSW mock endpoints for admin user list, detail, and guest stats with compatible payloads.

### Changed
- **Config**: Enhanced README with detailed runtime configuration documentation explaining dev/production/preview modes.
- **Users**: Refined user list filter layout into a single-line row with reset inline.
- **Users**: Localized user management UI strings to Chinese.
- **Table**: Centered pagination and enabled quick jump input for data tables.
- **Dashboard**: Decoupled user/record trend range selectors so each chart has its own range.

### Fixed
- **Dashboard**: Changing one trend range no longer refreshes the other chart.
- **Dashboard**: Reduce chart flicker by keeping ECharts mounted and updating data only.
- **Dashboard**: Disable update animation to avoid charts animating twice on range switch.
- **App**: Avoid dev-only double mount by disabling StrictMode in development.
- **Dashboard**: Disable initial chart animation to avoid double-play caused by ECharts init.
- **Dashboard**: Prevent chart overflow by clipping chart containers.

### Added
- **Dashboard (Agent-5)**: Implemented Dashboard page with Overview Cards and Trend Charts.
- **Dashboard**: Added `echarts-for-react` and `echarts` dependencies.
- **Dashboard**: Implemented `OverviewCards` with responsive layout (using shared `StatCard`).
- **Dashboard**: Implemented `UserTrendChart` and `HealthTrendChart` with ECharts and 7d/30d switching mock logic.
- **Dashboard**: Implemented `PetDistributionChart`.
- **System (Agent-8)**: Implemented `SystemMonitor` page with CPU/Memory/Disk stats (Mocked).
- **Audit (Agent-8)**: Implemented `AuditLogs` page with mocked data table.
- **Infrastructure (Agent-8)**: Setup MSW (Mock Service Worker) for development.
- **Infrastructure (Agent-8)**: Setup basic Playwright E2E configuration and `login.spec.ts`.
- **Articles (Agent-7)**: Implemented Article List, Create, Edit, and Delete features with responsive design.
- **Users (Agent-6)**: Implemented Users Module with List, Visitor Statistics, and Detail Drawer.
- **Users**: Implemented `UserTable` with mobile responsiveness and "More" action dropdown.
- **Users**: Implemented `UserFilter` with search and role/status filtering.
- **Users**: Implemented `UserDetailDrawer` showing profile info and pet list.
- **Users**: Added `RecycleBinPage` placeholder (pending API).
