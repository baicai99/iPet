# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Infrastructure**: Use Vite env detection for MSW bootstrap and render UI even if MSW fails to start.
- **Dashboard**: Guard pet distribution access when stats payload lacks `pets` to avoid runtime crash.
- **Dashboard**: Guard overview card stats access when nested fields are missing.
- **Dashboard**: Normalize trend and distribution data to arrays to prevent map crashes.
- **Layout**: Hide default Sider trigger to remove the bottom collapse bar.
- **Dashboard**: Auto-resize ECharts on container size changes to prevent initial mislayout and double-loading flicker.
- **Dashboard**: Re-enable chart animations now that resize stabilization is in place.

### Added
- **Dashboard**: Added MSW mock endpoints for admin stats and trends with sample data.
- **Users**: Added MSW mock endpoints for admin user list, detail, and guest stats with compatible payloads.

### Changed
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
