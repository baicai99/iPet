/**
 * Trend Detection - Pure Domain Logic
 * 
 * 职责：
 * - 检测指标数据的显著变化（纯函数，100% 可测试）
 * - 零依赖，不依赖 Vue/Store/任何框架
 * 
 * 设计原则：
 * - 单一职责：只做趋势检测计算
 * - 纯函数：相同输入永远产生相同输出
 * - 可配置：阈值、窗口大小等参数可调
 */

import {
    TREND_MIN_DATA_POINTS,
    TREND_THRESHOLD_PERCENT,
    TREND_WINDOW_SIZE,
    TREND_WEEKS_FOR_WEEKLY_MODE
} from './trendConstants'

// ============================================================================
// Types
// ============================================================================

/**
 * 趋势检测配置
 */
export interface TrendDetectionConfig {
    /** 显著变化的阈值百分比（默认 30%） */
    thresholdPercent: number
    /** 最少数据点数量（默认 20） */
    minDataPoints: number
    /** 分析窗口大小（默认 40，取最近 40 天） */
    windowSize: number
}

/**
 * 指标记录（输入数据）
 */
export interface MetricRecord {
    value: number
    date?: string
}

/**
 * 趋势分析结果
 */
export interface TrendAnalysis {
    /** 是否有显著变化 */
    hasSignificantChange: boolean
    /** 变化百分比（绝对值） */
    changePercent: number
    /** 前期平均值 */
    previousAvg: number
    /** 近期平均值 */
    recentAvg: number
    /** 有效数据点数量 */
    dataPoints: number
    /** 趋势方向：'up' | 'down' | 'stable' */
    direction: 'up' | 'down' | 'stable'
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: TrendDetectionConfig = {
    thresholdPercent: TREND_THRESHOLD_PERCENT,
    minDataPoints: TREND_MIN_DATA_POINTS,
    windowSize: TREND_WINDOW_SIZE
}

/** 切换到周视图的阈值（与 useTrendCard.ts 保持一致） */
const WEEKS_FOR_WEEKLY_MODE = TREND_WEEKS_FOR_WEEKLY_MODE

// ============================================================================
// Core Functions
// ============================================================================

/**
 * 获取日期的 ISO 周数
 * @param date 日期对象
 * @returns 周数 (1-53)
 */
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * 按日期分组并聚合记录
 * @param records 原始记录
 * @returns 按日期排序的每日总和数组
 */
function aggregateByDate(records: MetricRecord[]): number[] {
    // 按日期分组
    const groups = new Map<string, number[]>()

    for (const record of records) {
        const dateKey = record.date?.split('T')[0] || ''
        if (!dateKey) continue

        if (!groups.has(dateKey)) {
            groups.set(dateKey, [])
        }
        groups.get(dateKey)!.push(record.value)
    }

    // 排序并聚合
    const sortedKeys = Array.from(groups.keys()).sort()
    return sortedKeys.map(key => {
        const values = groups.get(key)!
        return values.reduce((sum, val) => sum + val, 0)
    })
}

/**
 * 按周分组并聚合记录
 * @param records 原始记录
 * @returns 按周排序的每周总和数组及周数
 */
function aggregateByWeek(records: MetricRecord[]): { totals: number[], weekCount: number } {
    const groups = new Map<string, number[]>()

    for (const record of records) {
        if (!record.date) continue

        const date = new Date(record.date)
        const weekKey = `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`

        if (!groups.has(weekKey)) {
            groups.set(weekKey, [])
        }
        groups.get(weekKey)!.push(record.value)
    }

    // 排序并聚合
    const sortedKeys = Array.from(groups.keys()).sort()
    const totals = sortedKeys.map(key => {
        const values = groups.get(key)!
        return values.reduce((sum, val) => sum + val, 0)
    })

    return { totals, weekCount: groups.size }
}

/**
 * 计算数组平均值
 * @param values 数值数组
 * @returns 平均值
 */
function calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((a, b) => a + b, 0)
    return sum / values.length
}

/**
 * 检测单个指标的显著变化
 * 
 * ✅ 自动视图切换：当有 >= 20 周数据时，切换到周聚合（与 TrendCard 保持一致）
 * 
 * @param records 指标记录数组
 * @param config 检测配置（可选）
 * @returns 趋势分析结果
 * 
 * @example
 * ```typescript
 * const records = [
 *   { value: 100, date: '2024-01-01' },
 *   { value: 150, date: '2024-01-02' },
 *   // ... more records
 * ]
 * const result = detectSignificantChange(records)
 * console.log(result.hasSignificantChange) // true/false
 * ```
 */
export function detectSignificantChange(
    records: MetricRecord[],
    config: Partial<TrendDetectionConfig> = {}
): TrendAnalysis {
    // 合并配置
    const finalConfig: TrendDetectionConfig = {
        ...DEFAULT_CONFIG,
        ...config
    }

    // 默认结果（无显著变化）
    const defaultResult: TrendAnalysis = {
        hasSignificantChange: false,
        changePercent: 0,
        previousAvg: 0,
        recentAvg: 0,
        dataPoints: records.length,
        direction: 'stable'
    }

    // 检查数据点是否足够
    if (records.length < finalConfig.minDataPoints) {
        return defaultResult
    }

    // ✅ 自动视图切换：检查是否有足够多周的数据
    const weeklyResult = aggregateByWeek(records)
    const useWeeklyView = weeklyResult.weekCount >= WEEKS_FOR_WEEKLY_MODE

    // 根据视图选择聚合数据
    let aggregatedData: number[]
    if (useWeeklyView) {
        // 周视图：使用周聚合数据
        aggregatedData = weeklyResult.totals
    } else {
        // 日视图：使用日聚合数据
        aggregatedData = aggregateByDate(records)
    }

    if (aggregatedData.length < finalConfig.minDataPoints) {
        return { ...defaultResult, dataPoints: aggregatedData.length }
    }

    // 取最近的窗口数据
    const limitedPoints = aggregatedData.slice(-finalConfig.windowSize)

    // 分割为前期和近期（各占一半）
    const midpoint = Math.floor(limitedPoints.length / 2)
    const previous = limitedPoints.slice(0, midpoint)
    const recent = limitedPoints.slice(midpoint)

    // 计算平均值
    const prevAvg = calculateAverage(previous)
    const recentAvg = calculateAverage(recent)

    // 避免除零
    if (prevAvg === 0) {
        return {
            ...defaultResult,
            previousAvg: prevAvg,
            recentAvg: recentAvg,
            dataPoints: limitedPoints.length
        }
    }

    // 计算变化百分比
    const changePercent = Math.abs((recentAvg - prevAvg) / prevAvg * 100)
    const hasSignificantChange = changePercent > finalConfig.thresholdPercent  // 使用 > 而非 >=

    // 确定趋势方向
    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (hasSignificantChange) {
        direction = recentAvg > prevAvg ? 'up' : 'down'
    }

    return {
        hasSignificantChange,
        changePercent,
        previousAvg: prevAvg,
        recentAvg: recentAvg,
        dataPoints: limitedPoints.length,
        direction
    }
}

/**
 * 批量检测多个指标的显著变化
 * 
 * @param metricRecords 指标记录映射（key: metricKey, value: records）
 * @param config 检测配置（可选）
 * @returns 趋势分析结果映射
 * 
 * @example
 * ```typescript
 * const metricRecords = {
 *   'step_count': [{ value: 100, date: '2024-01-01' }, ...],
 *   'water_intake': [{ value: 200, date: '2024-01-01' }, ...]
 * }
 * const results = detectSignificantChanges(metricRecords)
 * console.log(results['step_count'].hasSignificantChange)
 * ```
 */
export function detectSignificantChanges(
    metricRecords: Record<string, MetricRecord[]>,
    config: Partial<TrendDetectionConfig> = {}
): Record<string, TrendAnalysis> {
    const results: Record<string, TrendAnalysis> = {}

    for (const [metricKey, records] of Object.entries(metricRecords)) {
        results[metricKey] = detectSignificantChange(records, config)
    }

    return results
}

/**
 * 从分析结果中筛选出有显著变化的指标键
 * 
 * @param analysisResults 趋势分析结果映射
 * @returns 有显著变化的指标键数组
 */
export function filterChangedMetrics(
    analysisResults: Record<string, TrendAnalysis>
): string[] {
    return Object.entries(analysisResults)
        .filter(([_, analysis]) => analysis.hasSignificantChange)
        .map(([key, _]) => key)
}

/**
 * 从分析结果中筛选出稳定的指标键
 * 
 * @param analysisResults 趋势分析结果映射
 * @returns 稳定的指标键数组
 */
export function filterStableMetrics(
    analysisResults: Record<string, TrendAnalysis>
): string[] {
    return Object.entries(analysisResults)
        .filter(([_, analysis]) => !analysis.hasSignificantChange)
        .map(([key, _]) => key)
}
