/**
 * uCharts Config Bridge
 *
 * `@qiun/uni-ucharts` 的 qiun-data-charts 组件会从 `@/components/u-charts/config-ucharts.js` 读取配置对象（cfu）。
 * 在小程序端构建时，存在某些情况下 default export 会被包装成 `{ default: ... }`，
 * 从而导致运行时出现 `cfu.option`/`cfu.type` 为 undefined 的报错。
 *
 * uni-app 小程序端还会把 `export default X` 编译成 `exports.X = ...`（而不是常见的 `exports.default`），
 * 因此这里同时导出 `uChartsConfig` / `normalized` 两种命名，兼容不同构建产物中对默认导出的引用方式。
 *
 * 这里做一次“解包 + 兜底字段补齐”，确保 qiun-data-charts 始终拿到结构完整的配置对象。
 */

import cfuModule from '@qiun/uni-ucharts/components/u-charts/config-ucharts.js'

const maybeNamespace = cfuModule && typeof cfuModule === 'object' ? cfuModule : null
const cfu =
  maybeNamespace && Object.prototype.hasOwnProperty.call(maybeNamespace, 'default')
    ? maybeNamespace.default
    : cfuModule

const DEFAULT_TYPES = [
  'pie',
  'ring',
  'rose',
  'word',
  'funnel',
  'map',
  'arcbar',
  'line',
  'column',
  'mount',
  'bar',
  'area',
  'radar',
  'gauge',
  'candle',
  'mix',
  'tline',
  'tarea',
  'scatter',
  'bubble',
  'demotype'
]

const DEFAULT_CATEGORIES = [
  'line',
  'column',
  'mount',
  'bar',
  'area',
  'radar',
  'gauge',
  'candle',
  'mix',
  'demotype'
]

const uChartsConfig = cfu && typeof cfu === 'object' ? cfu : {}

if (!Array.isArray(uChartsConfig.type)) uChartsConfig.type = DEFAULT_TYPES
if (!Array.isArray(uChartsConfig.categories)) uChartsConfig.categories = DEFAULT_CATEGORIES
if (!uChartsConfig.option || typeof uChartsConfig.option !== 'object') uChartsConfig.option = {}
if (!uChartsConfig.instance || typeof uChartsConfig.instance !== 'object') uChartsConfig.instance = {}
if (!uChartsConfig.formatter || typeof uChartsConfig.formatter !== 'object') uChartsConfig.formatter = {}

const normalized = uChartsConfig

export { uChartsConfig, normalized }
export const type = uChartsConfig.type
export const categories = uChartsConfig.categories
export const option = uChartsConfig.option
export const instance = uChartsConfig.instance
export const formatter = uChartsConfig.formatter

export default uChartsConfig
