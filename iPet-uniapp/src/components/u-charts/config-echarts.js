/**
 * ECharts Config Bridge (H5/APP)
 *
 * 同 config-ucharts.js：做一次 default 解包，避免某些构建场景下导出形态不一致。
 */

import cfeModule from '@qiun/uni-ucharts/components/u-charts/config-echarts.js'

const maybeNamespace = cfeModule && typeof cfeModule === 'object' ? cfeModule : null
const cfe =
  maybeNamespace && Object.prototype.hasOwnProperty.call(maybeNamespace, 'default')
    ? maybeNamespace.default
    : cfeModule

export default cfe
