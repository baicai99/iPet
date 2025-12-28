# P0 图表契约（Axis / MissingPolicy / Plain 序列化 / 事件）

## 规范背景

P0 并行开发需要统一图表口径与序列化边界，避免不同模块对 timeRange、缺失值策略与点击事件输出产生漂移。本契约用于固化公共接口，确保各 agent 在不互相改动代码的前提下仍可按同一标准实现。

## 适用对象

- 轴配置统一入口：`src/utils/charts/chartAxisConfig.ts`（新建）
- 轴口径调用方：`src/utils/charts/chartModelBuilder.ts`、`src/utils/charts/statusGridUtils.ts`、`src/utils/charts/riskGridUtils.ts`
- 缺失值策略调用方：`src/utils/charts/chartCore.ts`、`src/utils/business/metricPipeline.ts`、`src/composables/useChartOptions.ts`
- Plain 序列化与适配层：`src/utils/charts/toPlainObject.ts`（新建）、`src/composables/useChartAdapter.ts`、`src/components/BaseCanvasChart.vue`
- 事件消费方：`src/components/BaseCanvasChart.vue` 与上层业务组件

## 约束规则

### 1) getAxisConfig(timeRange, chartType?)

**签名**

- `getAxisConfig(timeRange: MetricRange, chartType?: AxisChartType): AxisContract`
- `AxisChartType = 'standard' | 'status_grid' | 'risk_grid'`

**返回结构（AxisContract）**

- `range`: `MetricRange`（输入原值）
- `bucket`: `'day' | 'calendarWeek' | 'calendarMonth'`
- `tickCount`: number
- `tickFormat`: string（dayjs 格式化字符串，仅用于 tooltip/格式化）
- `timestamps`: number[]（毫秒时间戳，与 labels 一一对应）
- `labels`: string[]（轴显示文案，允许空字符串占位）
- `segmentCount`: number（网格/柱状分段数；对 standard 可等于 labels.length）

**timeRange → bucket 规则**

- `day` → `day`
- `week`/`month`/`last7d`/`last30d` → `day`
- `six_month`/`year`/`last12m` → `calendarMonth`
- `last40w` → `calendarWeek`

**标准图表（chartType=standard）**

- `day`
  - `tickCount = 25`（00:00 → 24:00）
  - `labels = ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', '', '24']`
  - `tickFormat = 'HH:mm'`（tooltip 使用，24:00 需特判）
- `week`
  - `tickCount = 7`
  - `labels = ['一','二','三','四','五','六','日']`
  - `tickFormat = 'M-D'`
- `month`
  - `tickCount = daysInMonth`
  - `labels` 仅在 `1 / 7 / 13 / 19 / 25 / ... / lastDay` 出现文本，其余为空字符串
  - `tickFormat = 'M-D'`
- `six_month`
  - `tickCount = 6`
  - `labels` 为最近 6 个月的月份数字（1-12）
  - `tickFormat = 'YYYY-M'`
- `year`
  - `tickCount = 12`
  - `labels = ['1','2',...,'12']`
  - `tickFormat = 'YYYY-M'`

**StatusGrid（chartType=status_grid）**

- `segmentCount` 必须保持：`day=3`, `week=7`, `month=30`, `six_month=6`, `year=12`
- `labels` 可为空数组或空字符串占位（当前 UI 不渲染 X 轴标签）

**RiskGrid（chartType=risk_grid）**

- `segmentCount` 必须保持：`day=24`, `week=7`, `month=30`, `six_month=6`, `year=12`
- `labels` 作为 X 轴显示文案：
  - `day`: `['0时','6时','12时','18时','24时']`
  - `week`: `['一','二','三','四','五','六','日']`
  - `month`: `['1日','8日','15日','22日', '${daysInMonth}日']`
  - `six_month`: 最近 6 个月（`1月`-`12月`）
  - `year`: `['1月','4月','7月','10月','12月']`

### 2) MissingPolicy

**枚举**

- `null`: 缺失值保留 `null`，图表断开
- `zero`: 缺失值填充 `0`
- `carry`: 使用前一个有效值填充（仅白名单启用）

**默认映射规则**

1. 若 `MetricMetadata.missingPolicy` 已显式配置，直接使用该值。
2. 若未配置，当前默认回退为 `null`（保持现有行为，避免 UI 口径变化）。
3. `carry` 不得作为默认策略，仅允许通过“指标白名单/图表类型白名单”显式启用。

### 3) toPlainObject()

**目的**

- 移除 Proxy/响应式引用与不可序列化结构，保证小程序端 uCharts 输入稳定。
- 替代 `JSON.parse(JSON.stringify())` 的全量深拷贝，避免性能回退。

**输入约束**

- 允许：`number | string | boolean | null | Array | plain object`
- 丢弃：`undefined | function | symbol | Date | class instance | Proxy`
- 若对象含循环引用，必须安全返回（不抛异常），优先丢弃循环字段。

**输出约束**

- 只保留 uCharts 必需字段：
  - `chartData`: `categories`, `series[].name`, `series[].data`, `series[].color`
  - `chartOpts`: 仅保留可 JSON 序列化的配置字段
- 数组保持顺序；空数组保持为空，不补默认值（默认值由上游补齐）。

**性能约定**

- 对大数组避免重复拷贝：输入引用未变化时可直接返回缓存结果。
- 对象层级只做白名单字段提取，禁止无差别深拷贝。

### 4) 事件参数（BaseCanvasChart）

- `point-click`：
  - `dataIndex`: number
  - `name`: string（来自 `categories[index]`，无则回退）
  - `value`: number | null | undefined
  - `seriesName`: string | undefined
- `chart-ready`：无参数

## 一致性断言点（TrendCard vs MetricChartArea）

- **日期边界一致**：`TrendCard` 的 daily 分组以本地日期 `YYYY-MM-DD` 为边界；`getAxisConfig(week|month)` 需与该边界一致（当天 00:00 对齐）。
- **周边界一致**：`TrendCard` weekly 使用 ISO week（周一为周起点）；`getAxisConfig(week)` 必须同样以 ISO week 起点生成 timestamps。
- **标签一致**：`MetricChartArea` 的 `categories` 必须直接来自 `getAxisConfig(...).labels`，避免自行生成造成漂移。
- **分段一致**：StatusGrid/RiskGrid 的 `segmentCount` 只能来自 `getAxisConfig`，禁止本地常量常驻。

## 示例

**示例：标准图表 week 轴配置（部分字段）**

```ts
getAxisConfig('week', 'standard')
// => {
//   bucket: 'day',
//   tickCount: 7,
//   labels: ['一','二','三','四','五','六','日'],
//   segmentCount: 7,
//   ...
// }
```

**示例：RiskGrid month 轴标签**

```ts
getAxisConfig('month', 'risk_grid').labels
// => ['1日','8日','15日','22日','30日'] // 具体末日随月份变化
```

**示例：toPlainObject**

```ts
toPlainObject({
  categories: ['一', '二'],
  series: [{ name: 'Value', data: [1, null], color: '#3b82f6', extra: () => {} }]
})
// => { categories: ['一', '二'], series: [{ name: 'Value', data: [1, null], color: '#3b82f6' }] }
```

**示例：point-click 事件**

```ts
{
  dataIndex: 3,
  name: '四',
  value: 42,
  seriesName: '体重'
}
```
