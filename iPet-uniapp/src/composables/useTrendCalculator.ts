/**
 * useTrendCalculator - 指标趋势计算
 * 
 * 职责：根据历史记录计算指标的变化趋势
 * 
 * 设计原则：
 * - 单一职责：只负责趋势计算
 * - 纯函数风格：便于测试
 */

import type { HealthRecord } from '@shared/types/health'

export type TrendDirection = 'up' | 'down' | 'stable' | 'none'

export interface TrendResult {
    direction: TrendDirection
    currentValue?: number
    previousValue?: number
    changePercent?: number
}

/**
 * 计算简单趋势（比较最新两条记录）
 */
export function calculateSimpleTrend(history: HealthRecord[]): TrendDirection {
    if (history.length < 2) return 'none'

    const current = Number(history[0].value)
    const previous = Number(history[1].value)

    if (isNaN(current) || isNaN(previous)) return 'none'

    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'stable'
}

/**
 * 计算详细趋势（包含变化百分比）
 */
export function calculateDetailedTrend(history: HealthRecord[]): TrendResult {
    if (history.length < 2) {
        return { direction: 'none' }
    }

    const current = Number(history[0].value)
    const previous = Number(history[1].value)

    if (isNaN(current) || isNaN(previous)) {
        return { direction: 'none' }
    }

    let direction: TrendDirection = 'stable'
    if (current > previous) direction = 'up'
    else if (current < previous) direction = 'down'

    const changePercent = previous !== 0
        ? Math.round(((current - previous) / previous) * 100 * 10) / 10
        : 0

    return {
        direction,
        currentValue: current,
        previousValue: previous,
        changePercent
    }
}

/**
 * Composable 封装
 */
export function useTrendCalculator() {
    return {
        calculate: calculateSimpleTrend,
        calculateDetailed: calculateDetailedTrend
    }
}
