/**
 * useMetricViewModel - 指标数据 ViewModel 层
 * 
 * 职责：
 * - 将 MetricSeriesResponse 转换为 UI 组件可直接使用的格式
 * - 纯计算，无副作用
 * - 保持图表组件"傻白甜"，所有业务逻辑在此处理
 * 
 * 对应 PRD 8.2.2 节：Composable 瘦身
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import dayjs from 'dayjs'
import type { MetricSeriesResponse, MetricStats } from '@shared/types/health'

// ============================================================================
// Types
// ============================================================================

/** 指标元信息 */
export interface MetricMeta {
    key: string
    title: string
    unit: string
    displayUnit?: string
    tickFormat?: string  // 图表 X 轴时间格式
    valueFormat?: string // 数值格式
    color?: string
    decimals?: number
}

/** ViewModel 输出：图表可直接使用的数据 */
export interface MetricChartData {
    labels: string[]
    values: number[]
    unit: string
    displayUnit: string
    stats: MetricStats
    hasData: boolean
    isEmpty: boolean
}

/** ViewModel 输出：卡片可直接使用的数据 */
export interface MetricCardData {
    latestValue: string
    latestLabel: string
    trend: 'up' | 'down' | 'stable'
    trendValue: string
    unit: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 根据时间戳格式化标签
 */
function formatLabel(ts: number, format?: string): string {
    const date = dayjs(ts)

    if (format) {
        return date.format(format)
    }

    const now = dayjs()
    const diffDays = now.diff(date, 'day')

    // 智能格式化
    if (diffDays === 0) {
        return '今天'
    } else if (diffDays === 1) {
        return '昨天'
    } else if (diffDays < 7) {
        return date.format('ddd')  // 周几
    } else if (date.year() === now.year()) {
        return date.format('M/D')
    } else {
        return date.format('YY/M/D')
    }
}

/**
 * 格式化数值
 */
function formatValue(value: number, decimals: number = 1): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--'
    }
    return value.toFixed(decimals).replace(/\.0+$/, '')
}

/**
 * 计算趋势
 */
function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; percent: string } {
    if (values.length < 2) {
        return { direction: 'stable', percent: '0%' }
    }

    const recent = values.slice(-3)
    const previous = values.slice(-6, -3)

    if (previous.length === 0) {
        return { direction: 'stable', percent: '0%' }
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length

    if (previousAvg === 0) {
        return { direction: 'stable', percent: '0%' }
    }

    const change = ((recentAvg - previousAvg) / previousAvg) * 100
    const absChange = Math.abs(change).toFixed(1)

    if (change > 5) {
        return { direction: 'up', percent: `+${absChange}%` }
    } else if (change < -5) {
        return { direction: 'down', percent: `-${absChange}%` }
    } else {
        return { direction: 'stable', percent: '0%' }
    }
}

// ============================================================================
// Composable
// ============================================================================

/**
 * useMetricViewModel - 指标 ViewModel Composable
 * 
 * @param series - MetricSeriesResponse 数据
 * @param meta - 指标元信息
 * @returns 转换后的 UI 数据
 * 
 * @example
 * ```ts
 * const { series } = useMetricData('weight', 'last7d')
 * const { chartData, cardData } = useMetricViewModel(series, { 
 *   key: 'weight', 
 *   title: '体重', 
 *   unit: 'kg' 
 * })
 * ```
 */
export function useMetricViewModel(
    series: Ref<MetricSeriesResponse | null>,
    meta: MetricMeta
) {
    /**
     * 图表数据
     */
    const chartData: ComputedRef<MetricChartData> = computed(() => {
        if (!series.value || !series.value.points || series.value.points.length === 0) {
            return {
                labels: [],
                values: [],
                unit: meta.unit || '',
                displayUnit: meta.displayUnit || meta.unit || '',
                stats: { min: 0, max: 0, avg: 0 },
                hasData: false,
                isEmpty: true
            }
        }

        // 过滤掉 null 值的点，确保 values 是 number[] 而非 (number | null)[]
        const validPoints = series.value.points.filter((p): p is { ts: number; value: number } => p.value !== null)
        const labels = validPoints.map(p => formatLabel(p.ts, meta.tickFormat))
        const values = validPoints.map(p => p.value)

        return {
            labels,
            values,
            unit: meta.unit || '',
            displayUnit: meta.displayUnit || meta.unit || '',
            stats: series.value.stats,
            hasData: true,
            isEmpty: false
        }
    })

    /**
     * 卡片数据（最新值 + 趋势）
     */
    const cardData: ComputedRef<MetricCardData> = computed(() => {
        const defaultData: MetricCardData = {
            latestValue: '--',
            latestLabel: '',
            trend: 'stable',
            trendValue: '0%',
            unit: meta.displayUnit || meta.unit || ''
        }

        if (!series.value || !series.value.points || series.value.points.length === 0) {
            return defaultData
        }

        const points = series.value.points
        // 过滤掉 null 值，确保 values 是 number[]
        const validPoints = points.filter((p): p is { ts: number; value: number } => p.value !== null)
        if (validPoints.length === 0) {
            return defaultData
        }
        const lastPoint = validPoints[validPoints.length - 1]
        const values = validPoints.map(p => p.value)
        const trend = calculateTrend(values)

        return {
            latestValue: formatValue(lastPoint.value, meta.decimals),
            latestLabel: formatLabel(lastPoint.ts),
            trend: trend.direction,
            trendValue: trend.percent,
            unit: meta.displayUnit || meta.unit || ''
        }
    })

    /**
     * 统计数据（格式化后）
     */
    const formattedStats = computed(() => {
        const stats = series.value?.stats || { min: 0, max: 0, avg: 0 }
        const decimals = meta.decimals ?? 1

        return {
            min: formatValue(stats.min, decimals),
            max: formatValue(stats.max, decimals),
            avg: formatValue(stats.avg, decimals),
            latest: stats.latest !== undefined ? formatValue(stats.latest, decimals) : '--',
            total: stats.total !== undefined ? formatValue(stats.total, 0) : undefined,
            count: stats.count
        }
    })

    /**
     * 是否有数据
     */
    const hasData = computed(() => {
        return series.value?.points && series.value.points.length > 0
    })

    return {
        chartData,
        cardData,
        formattedStats,
        hasData
    }
}

// ============================================================================
// Utility Exports
// ============================================================================

export {
    formatLabel,
    formatValue,
    calculateTrend
}

export default useMetricViewModel
