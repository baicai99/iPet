# Trend Detection 性能规范（P0）

## 规范背景

健康模块的趋势检测与图表数据处理在数据量上升时容易卡顿。为确保 UI 流畅度与可扩展性，本规范将“数据处理”从主线程移走，并将高频路径从 O(N) 扫描优化为 O(k) 直接索引读取。

## 适用对象

- `iPet-uniapp/src/stores/healthStore.ts`（HealthStore 实体层与趋势刷新入口）
- `iPet-uniapp/src/utils/performance/TrendEngine.ts`（趋势执行器选择）
- `iPet-uniapp/src/utils/performance/WorkerExecutor.ts` + `iPet-uniapp/src/workers/trendDetection.worker.ts`（Worker 计算链路）

## 约束规则

### 1) 实体层必须使用 `shallowRef` + 替换引用更新

- `entities` 使用 `shallowRef<Record<string, HealthRecord>>({})`
- 任何新增/更新/删除记录必须通过替换引用触发更新：
  - ✅ `entities.value = { ...entities.value, [id]: record }`
  - ✅ `const next = { ...entities.value }; delete next[id]; entities.value = next`
  - ❌ `entities.value[id] = record`（不会触发 `shallowRef` 的响应式更新）

### 2) 趋势结果与缓存对象必须隔离响应式系统

- 趋势结果容器使用 `shallowRef(markRaw({}))`
- 缓存 Map 使用 `shallowRef(markRaw(new Map()))`

### 3) 必须构建 `metricIndex`，避免 O(N) 扫描

- `metricIndex: metricKey -> recordIds[]` 由 Store 在数据装载/变更后构建
- 趋势刷新与历史查询优先使用 `metricIndex[key]` 取记录 ID 列表
- 复杂度目标：从“每次筛 records”的 O(N) 降为按 key 取列表的 O(k)

### 4) 数据量 > 100 时趋势检测强制走 Worker（可用则用）

- `TrendEngine` 默认启用 Worker
- 当 `records.length >= 100` 且 Worker 可用时选择 `WorkerExecutor`
- Worker 不可用/失败时自动降级主线程（保证可用性）

### 5) `refreshTrendDetection` 必须做 debounce 合并

- 多次 `refreshTrendDetection(['a'])` / `refreshTrendDetection(['b'])` 触发时应合并为一次批量执行
- 实现要求：
  - 以 `Set` 收集待刷新指标
  - 通过 `setTimeout`（短延迟窗口）合并执行

### 6) 缓存失效必须严格执行

- 切宠物：全量失效（内存缓存 + 本地持久化缓存）+ 重新拉取
- 写入/更新/删除：精准失效（只清该指标相关 cache）

## 示例

### 趋势刷新（合并多次调用）

```ts
refreshTrendDetection(['weight'])
refreshTrendDetection(['body_temp'])
// -> 合并为一次执行，避免重复计算
```

### Worker 阈值

```ts
// records.length >= 100 -> WorkerExecutor（若可用）
const { result } = await TrendEngine.run(metricKey, records)
```

