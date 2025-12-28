# Performance Baseline (Admin UI)

## Background
The admin UI should load quickly on first paint and avoid unnecessary work on
route transitions and chart resize.

## Scope
- Backend admin UI (`backend-ui`)
- Route-level code splitting and build chunking

## Rules
- Use `React.lazy` + `Suspense` for route-level pages.
- Configure Vite `manualChunks` to split react/antd/echarts/vendor bundles.
- Use ECharts on-demand imports via a shared `echarts` core module.
- Chart resize should be throttled (e.g., `requestAnimationFrame`) to avoid
  resize storms.

## Example
```ts
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<Spin />}>
  <Routes>...</Routes>
</Suspense>
```

```ts
import { echarts } from '@/core/charts/echarts';

<ReactECharts echarts={echarts} option={option} />
```
