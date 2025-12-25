/**
 * Trend Types - Unified Type Definitions
 * 
 * 职责：
 * - 定义趋势判定的统一类型接口
 * - 作为 TrendCard 和 InsightBubble 的共享契约
 * 
 * 设计原则：
 * - 单一事实源：所有趋势相关的类型定义都从这里导出
 * - 最小必需字段：后续可扩展，但不破坏兼容性
 */

// ============================================================================
// Basic Types
// ============================================================================

/**
 * 趋势状态
 * - insufficient: 数据样本不足，无法判定趋势
 * - stable: 数据充足，但变化不显著
 * - trending: 数据有显著趋势变化
 */
export type TrendStatus = 'insufficient' | 'stable' | 'trending'

/**
 * 趋势方向
 * - up: 上升趋势
 * - down: 下降趋势
 * - flat: 平稳（无显著变化）
 * - unknown: 无法判定（通常因数据不足）
 */
export type TrendDirection = 'up' | 'down' | 'flat' | 'unknown'

// ============================================================================
// Core Result Interface
// ============================================================================

/**
 * 趋势判定结果（单一事实源）
 * 
 * 此接口是 TrendCard 和 InsightBubble 共同消费的数据结构。
 * 任何趋势相关的判定逻辑都应该输出此类型。
 * 
 * @example
 * ```typescript
 * const result: TrendResult = {
 *   status: 'trending',
 *   direction: 'up',
 *   changePercent: 5,
 *   compareLabel: '相比上周',
 *   totalRecordDays: 25,
 *   minRequiredDays: 20
 * }
 * ```
 */
export interface TrendResult {
    /** 趋势状态：数据不足 | 稳定 | 有趋势 */
    status: TrendStatus

    /** 趋势方向 */
    direction: TrendDirection

    /** 
     * 变化百分比
     * - 正数表示增长（如 +5 表示增长 5%）
     * - 负数表示下降（如 -3 表示下降 3%）
     * - 统一取整（由 trendEvaluator 负责）
     */
    changePercent?: number

    /** 比较标签（如"相比上周"、"相比上月"） */
    compareLabel: string

    /** 已采集的记录天数 */
    totalRecordDays: number

    /** 最少需要的天数（用于不足样本提示） */
    minRequiredDays: number

    /** 当前窗口天数（可选，便于解释比较逻辑） */
    windowDays?: number

    /** 对比窗口天数（可选） */
    prevWindowDays?: number

    /** 当前窗口平均值（可选，用于图表展示） */
    recentAvg?: number

    /** 对比窗口平均值（可选） */
    previousAvg?: number
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * 趋势评估器输入
 */
export interface EvaluatorInput {
    /** 历史数据值数组（按时间排序，旧→新） */
    values: number[]

    /** 总记录天数 */
    totalRecordDays: number

    /** 比较窗口大小（天），默认 7 */
    windowDays?: number

    /** 比较标签（如"相比上周"），默认自动生成 */
    compareLabel?: string
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * 兼容旧版 InsightState 的映射类型
 * 用于渐进式迁移
 */
export type LegacyInsightStatus = 'excellent' | 'good' | 'warning' | 'danger' | 'insufficient'

/**
 * 将 TrendResult 映射到旧版 InsightStatus
 */
export function mapToLegacyStatus(result: TrendResult): LegacyInsightStatus {
    if (result.status === 'insufficient') {
        return 'insufficient'
    }

    if (result.status === 'stable') {
        return 'excellent'
    }

    // trending
    const absChange = Math.abs(result.changePercent ?? 0)
    if (absChange >= 30) {
        return 'danger'
    } else if (absChange >= 10) {
        return 'warning'
    } else {
        return 'good'
    }
}
