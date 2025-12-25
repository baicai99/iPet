/**
 * Trend Evaluator - Single Source of Truth for Trend Determination
 * 
 * 职责：
 * - 统一趋势判定逻辑（direction / status / changePercent）
 * - 输出 TrendResult，供 TrendCard 和 InsightBubble 消费
 * 
 * 设计原则：
 * - 纯函数：零副作用，100% 可测试
 * - 单一职责：只做趋势判定，不参与文案生成或 UI 渲染
 * - 零依赖：不依赖 Vue/Store/任何框架
 */

import type { TrendResult, TrendStatus, TrendDirection, EvaluatorInput } from './trendTypes'
import {
    TREND_MIN_DATA_POINTS,
    TREND_THRESHOLD_PERCENT,
    TREND_DEFAULT_WINDOW_DAYS,
    TREND_DEFAULT_COMPARE_LABEL
} from './trendConstants'

// ============================================================================
// Core Evaluation Function
// ============================================================================

/**
 * 趋势判定引擎（单一事实源）
 * 
 * @param input 评估输入数据
 * @returns TrendResult 趋势判定结果
 * 
 * @example
 * ```typescript
 * // 场景 1: 数据不足
 * const result = evaluateTrend({ values: [1, 2, 3], totalRecordDays: 10 })
 * // => { status: 'insufficient', direction: 'unknown', ... }
 * 
 * // 场景 2: 稳定
 * const result = evaluateTrend({ values: [...], totalRecordDays: 25 })
 * // => { status: 'stable', direction: 'flat', changePercent: 2, ... }
 * 
 * // 场景 3: 有趋势
 * const result = evaluateTrend({ values: [...], totalRecordDays: 25 })
 * // => { status: 'trending', direction: 'up', changePercent: 35, ... }
 * ```
 */
export function evaluateTrend(input: EvaluatorInput): TrendResult {
    const {
        values,
        totalRecordDays,
        windowDays = TREND_DEFAULT_WINDOW_DAYS,
        compareLabel = TREND_DEFAULT_COMPARE_LABEL
    } = input

    const minRequired = TREND_MIN_DATA_POINTS

    // ========================================================================
    // 1. 数据不足判定
    // ========================================================================
    if (totalRecordDays < minRequired || values.length < 2) {
        return {
            status: 'insufficient',
            direction: 'unknown',
            compareLabel,
            totalRecordDays,
            minRequiredDays: minRequired,
            windowDays
        }
    }

    // ========================================================================
    // 2. 计算窗口平均值
    // ========================================================================
    const recentAvg = calculateWindowAverage(values, windowDays, 0)
    const previousAvg = calculateWindowAverage(values, windowDays, windowDays)

    // ========================================================================
    // 3. 计算变化百分比
    // ========================================================================
    if (previousAvg === 0) {
        // 避免除零错误
        return {
            status: 'stable',
            direction: 'flat',
            changePercent: 0,
            compareLabel,
            totalRecordDays,
            minRequiredDays: minRequired,
            windowDays,
            recentAvg,
            previousAvg
        }
    }

    const rawChangePercent = ((recentAvg - previousAvg) / previousAvg) * 100
    const changePercent = Math.round(rawChangePercent) // 统一取整
    const absChange = Math.abs(changePercent)

    // ========================================================================
    // 4. 判定趋势方向与状态
    // ========================================================================
    let direction: TrendDirection = 'flat'
    let status: TrendStatus = 'stable'

    if (absChange >= TREND_THRESHOLD_PERCENT) {
        status = 'trending'
        direction = changePercent > 0 ? 'up' : 'down'
    } else if (absChange > 0) {
        // 有变化但不显著
        direction = changePercent > 0 ? 'up' : 'down'
    }

    return {
        status,
        direction,
        changePercent,
        compareLabel,
        totalRecordDays,
        minRequiredDays: minRequired,
        windowDays,
        prevWindowDays: windowDays,
        recentAvg,
        previousAvg
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 计算指定窗口的平均值
 * 
 * @param values 数据数组（按时间排序，旧→新）
 * @param windowSize 窗口大小
 * @param offset 偏移量（从数组末尾向前偏移）
 * @returns 窗口内的平均值
 */
function calculateWindowAverage(
    values: number[],
    windowSize: number,
    offset: number
): number {
    const end = values.length - offset
    const start = Math.max(0, end - windowSize)

    if (start >= end) {
        return 0
    }

    const slice = values.slice(start, end)
    if (slice.length === 0) {
        return 0
    }

    const sum = slice.reduce((acc, val) => acc + val, 0)
    return sum / slice.length
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * 从健康记录数组中提取数值并评估趋势
 * 
 * @param records 健康记录数组
 * @param valueExtractor 值提取函数
 * @returns TrendResult
 */
export function evaluateTrendFromRecords<T>(
    records: T[],
    valueExtractor: (record: T) => number,
    options: Partial<EvaluatorInput> = {}
): TrendResult {
    const values = records.map(valueExtractor).filter(v => !isNaN(v) && isFinite(v))

    return evaluateTrend({
        values,
        totalRecordDays: values.length,
        ...options
    })
}

/**
 * 判断趋势是否为"好"趋势（基于指标情绪）
 * 
 * @param result 趋势结果
 * @param sentiment 指标情绪（'positive' = 上升是好事, 'negative' = 下降是好事）
 * @returns 是否为好趋势
 */
export function isPositiveTrend(
    result: TrendResult,
    sentiment: 'positive' | 'negative' | 'neutral'
): boolean {
    if (result.status !== 'trending') {
        return result.status === 'stable'
    }

    switch (sentiment) {
        case 'positive':
            return result.direction === 'up'
        case 'negative':
            return result.direction === 'down'
        case 'neutral':
        default:
            return true
    }
}
