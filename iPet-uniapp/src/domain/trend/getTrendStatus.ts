/**
 * Trend Status Detection - Pure Domain Logic
 * 
 * 职责：
 * - 判断当前趋势数据处于哪个状态（数据不足 / 全部稳定 / 有趋势）
 * - 生成对应的用户友好提示文案
 * 
 * 设计原则：
 * - 纯函数：零副作用，100% 可测试
 * - 单一职责：只做状态判断，不参与 UI 渲染
 * - 零依赖：不依赖 Vue/Store/任何框架
 */

import type { TrendAnalysis } from './detectSignificantChanges'

// ============================================================================
// Types
// ============================================================================

/**
 * 趋势数据状态类型
 */
export type TrendStatus =
    | 'insufficient-data'  // 数据采样不足（< 20 天）
    | 'all-stable'         // 所有指标趋于稳定
    | 'has-trends'         // 存在趋势变化

/**
 * 趋势状态判断结果
 */
export interface TrendStatusResult {
    /** 当前状态 */
    status: TrendStatus
    /** 用户友好的提示文案 */
    message: string
    /** 采样天数（仅 insufficient-data 状态） */
    samplingDays?: number
    /** 有趋势变化的指标数量 */
    changedCount?: number
    /** 无趋势变化但数据充足的指标数量 */
    stableCount?: number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 趋势分析所需的最小数据天数
 * 与 detectSignificantChanges.ts 中的 minDataPoints 保持一致
 */
const MIN_SAMPLING_DAYS = 20

// ============================================================================
// Core Function
// ============================================================================

/**
 * 判断当前趋势数据状态
 * 
 * @param trendMap 趋势分析结果映射（来自 healthStore.metricTrendMap）
 * @param totalRecordDays 历史记录覆盖的总天数
 * @returns 趋势状态判断结果
 * 
 * @example
 * ```typescript
 * // 场景 1: 数据不足
 * const result = getTrendStatus({}, 10)
 * // => { status: 'insufficient-data', message: '正在采集样本，累计采样 10 天', samplingDays: 10 }
 * 
 * // 场景 2: 全部稳定
 * const result = getTrendStatus(
 *   { step_count: { hasSignificantChange: false, ... } },
 *   25
 * )
 * // => { status: 'all-stable', message: '所有指标趋于稳定' }
 * 
 * // 场景 3: 有趋势
 * const result = getTrendStatus(
 *   { step_count: { hasSignificantChange: true, ... } },
 *   25
 * )
 * // => { status: 'has-trends', message: '' }
 * ```
 */
export function getTrendStatus(
    trendMap: Record<string, TrendAnalysis>,
    totalRecordDays: number
): TrendStatusResult {
    // ✅ FIX: 空值检查 - 防止 trendMap 为 undefined/null
    if (!trendMap || typeof trendMap !== 'object') {
        return {
            status: 'insufficient-data',
            message: `正在采集样本，累计采样 ${totalRecordDays} 天`,
            samplingDays: totalRecordDays,
            changedCount: 0,
            stableCount: 0
        }
    }

    // ============================================================================
    // 计算各类指标数量
    // ============================================================================
    const entries = Object.values(trendMap)

    // 有显著变化的指标数量
    const changedCount = entries.filter(
        analysis => analysis.hasSignificantChange
    ).length

    // 数据充足（>=20天）且稳定的指标数量
    const stableCount = entries.filter(
        analysis => analysis.dataPoints >= MIN_SAMPLING_DAYS && !analysis.hasSignificantChange
    ).length

    // ============================================================================
    // 状态 A: 数据采样不足
    // ============================================================================
    if (totalRecordDays < MIN_SAMPLING_DAYS) {
        return {
            status: 'insufficient-data',
            message: `正在采集样本，累计采样 ${totalRecordDays} 天`,
            samplingDays: totalRecordDays,
            changedCount,
            stableCount
        }
    }

    // ============================================================================
    // 状态 B vs C: 全部稳定 vs 有趋势变化
    // ============================================================================
    if (changedCount === 0) {
        // 状态 B: 所有指标都稳定
        return {
            status: 'all-stable',
            message: '所有指标趋于稳定',
            changedCount,
            stableCount
        }
    } else {
        // 状态 C: 存在趋势变化（无需提示文案，正常渲染趋势卡片）
        return {
            status: 'has-trends',
            message: '',
            changedCount,
            stableCount
        }
    }
}
