# Summary View 趋势状态规范

## 规范背景
Summary View 负责在首页向用户迅速呈现健康趋势的快照。最近在“无变化/稳定”与“数据不足”之间的文案混用，导致用户误以为仍在采集阶段，影响信任与后续扩展。为了保持 UI 语义准确、便于扩展，我们需要在 Summary 端对趋势状态进行三态区分并统一文案。

## 适用对象
- `iPet-uniapp/src/pages/summary/summary.vue`（Summary 视图的趋势区块）
- `iPet-uniapp/src/domain/trend/getTrendStatus.ts`（趋势状态判定函数）
- 复用 `TrendHintCard.vue` 与 `TrendStatusCard.vue` 组件的文案与导航逻辑
- `iPet-uniapp/src/stores/healthStore.ts`（提供趋势数量/采样天数、changedMetricKeys 等派生数据）

## 约束规则
### 1) 状态定义（三态互斥）
| 状态 | 描述 | 显示组件 | 主要文案 |
| --- | --- | --- | --- |
| `DATA_INSUFFICIENT`（采样不足） | 当前累计采样天数未达到最小门槛（默认 20 天），无法做趋势判定 | `TrendHintCard` | 标题：“正在采集样本”，说明：“累计采样 xx 天”、可选“需至少 xx 天可分析” |
| `STABLE`（稳定/无变化） | 满足采样门槛且变化检测未返回趋势 | `TrendStatusCard` | 标题：“当前所有趋势趋于稳定”，说明：“暂无明显上升或下降趋势” |
| `HAS_TRENDS`（存在趋势） | 满足采样门槛且检测返回至少一个趋势 | `TrendCard` 列表 | 展示每个指标卡片内容，保持现有趋势文案 |

### 2) 判定逻辑（按流水顺序执行）
1. 读取 `healthStore.getTotalRecordDays()` 与趋势分析结果（`metricTrendMap`、`changedMetricKeys`）。
2. 若采样天数 < 最少门槛（默认 20 天）→ 进入 `DATA_INSUFFICIENT`。
3. 否则：
   * 若 `changedMetricKeys.length === 0` → `STABLE`。
   * 若 `changedMetricKeys.length > 0` → `HAS_TRENDS`。

> 关键：`trend list empty`（无变化）并不等价于“数据不足”，需要通过上述采样判断先区分再走稳定分支。

### 3) 文案与交互要求
* “正在采集样本”卡片必须包含累计采样天数（`getTrendStatus` 返回的文案）并继续指向 `/pages/trends/trends`。
* 稳定状态卡片标题使用 `getTrendStatus` 返回文案，副标题建议：“当前暂无趋势变化，继续保持吧！”。
* “存在趋势”时仅展示 `TrendCard`，不渲染 Hint/Status 卡片。
* 所有提示均可跳转至 Trends 页面，方便用户进一步查看。

### 4) 交叉验证与纠错
* 文档/代码改动完成后，用 `getTrendStatus` 单元测试覆盖三种场景（数据不足、稳定、有趋势）。
* 当用户反馈文案不一致时，优先同步 `getTrendStatus` 的 `message` 再调整组件描述。

## 示例场景
1. **数据不足**：采样 7/10/19 天，`changedMetricKeys` 为空 → Summary 显示“正在采集样本，累计采样 xx 天”。
2. **稳定无变化**：采样 ≥20 天，`changedMetricKeys` 为空 → Summary 展示“当前所有趋势趋于稳定”状态卡片。
3. **存在趋势**：采样 ≥20 天，且 `changedMetricKeys` 非空 → 仅渲染趋势卡片列表。

## 验收标准
1. Summary 只有在采样天数 <20 天时才显示采样提示卡片（文案含“正在采集样本” + 天数）。
2. 满足采样门槛且无趋势时，Summary 展示稳定卡片（标题“当前所有趋势趋于稳定”，不出现“正在采集样本”）。
3. 满足采样门槛且存在趋势时，Summary 展示趋势卡片列表。3 个状态互斥。
4. `getTrendStatus` 单元测试覆盖上述三个场景，确保未来改动不回退。
