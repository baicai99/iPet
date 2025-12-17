/**
 * uCharts Runtime Bridge
 *
 * qiun-data-charts 会从 `@/components/u-charts/u-charts.js` 导入 uCharts。
 * 某些构建场景下 default export 可能被包装成 `{ default: ... }`，这里做一次解包。
 *
 * 同时兼容不同构建产物里对默认导出的命名引用（如 `uChartsMp` / `uCharts`）。
 */

import uChartsModule from '@qiun/uni-ucharts/components/u-charts/u-charts.js'

const maybeNamespace = uChartsModule && typeof uChartsModule === 'object' ? uChartsModule : null
const uCharts =
  maybeNamespace && Object.prototype.hasOwnProperty.call(maybeNamespace, 'default')
    ? maybeNamespace.default
    : uChartsModule

const uChartsMp = uCharts

export { uCharts, uChartsMp }
export default uChartsMp
