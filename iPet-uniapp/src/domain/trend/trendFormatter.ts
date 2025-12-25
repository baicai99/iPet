/**
 * Trend Formatter - Headline & Text Generation
 * 
 * 职责：
 * - 生成趋势事实句（headline）
 * - 提供方向文本等辅助格式化函数
 * 
 * 设计原则：
 * - 唯一事实文案源：所有事实句都从 formatHeadline 产出
 * - 纯函数：零副作用，100% 可测试
 * - TrendCard 和 InsightBubble 都使用此函数保证一致性
 */

import type { TrendResult, TrendDirection } from './trendTypes'

// ============================================================================
// Headline Formatter
// ============================================================================

/**
 * 格式化趋势事实句（唯一文案源）
 * 
 * 输出规则：
 * - 不足样本：`样本不足：已采集 X 天，至少需要 Y 天`
 * - 稳定：`{metricName}{compareLabel}基本稳定`
 * - 有趋势：`{metricName}{compareLabel}增长/下降 N%`
 * 
 * @param metricName 指标名称（如"体重"、"饭量"）
 * @param result 趋势判定结果
 * @returns 事实句文案
 * 
 * @example
 * ```typescript
 * formatHeadline('体重', { status: 'trending', direction: 'up', changePercent: 2, ... })
 * // => "体重相比上周增长 2%"
 * 
 * formatHeadline('体重', { status: 'stable', direction: 'flat', ... })
 * // => "体重相比上周基本稳定"
 * 
 * formatHeadline('体重', { status: 'insufficient', totalRecordDays: 10, minRequiredDays: 20, ... })
 * // => "样本不足：已采集 10 天，至少需要 20 天"
 * ```
 */
export function formatHeadline(metricName: string, result: TrendResult): string {
    switch (result.status) {
        case 'insufficient':
            return `样本不足：已采集 ${result.totalRecordDays} 天，至少需要 ${result.minRequiredDays} 天`

        case 'stable':
            return `${metricName}${result.compareLabel}基本稳定`

        case 'trending': {
            const verb = result.direction === 'up' ? '增长' : '下降'
            const percent = Math.abs(result.changePercent ?? 0)
            return `${metricName}${result.compareLabel}${verb} ${percent}%`
        }

        default:
            // 防御性编程：处理未知状态
            return `${metricName}数据分析中...`
    }
}

// ============================================================================
// Direction Text Helpers
// ============================================================================

/**
 * 格式化方向文本
 * 
 * @param direction 趋势方向
 * @returns 方向描述文本
 */
export function formatDirectionText(direction: TrendDirection): string {
    switch (direction) {
        case 'up':
            return '上升'
        case 'down':
            return '下降'
        case 'flat':
            return '稳定'
        case 'unknown':
        default:
            return ''
    }
}

/**
 * 格式化变化动词
 * 
 * @param direction 趋势方向
 * @returns 变化动词（用于句子中）
 */
export function formatChangeVerb(direction: TrendDirection): string {
    switch (direction) {
        case 'up':
            return '增长'
        case 'down':
            return '下降'
        case 'flat':
            return '保持稳定'
        case 'unknown':
        default:
            return ''
    }
}

// ============================================================================
// Percentage Formatters
// ============================================================================

/**
 * 格式化百分比（统一格式）
 * 
 * @param percent 百分比数值
 * @param options 格式化选项
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(
    percent: number | undefined,
    options: {
        /** 是否显示正负号 */
        showSign?: boolean
        /** 小数位数（默认 0） */
        decimals?: number
        /** 是否添加百分号 */
        addSymbol?: boolean
    } = {}
): string {
    const { showSign = false, decimals = 0, addSymbol = true } = options

    if (percent === undefined || percent === null || isNaN(percent)) {
        return addSymbol ? '0%' : '0'
    }

    const absValue = Math.abs(percent).toFixed(decimals)
    let result = absValue

    if (showSign && percent !== 0) {
        result = percent > 0 ? `+${absValue}` : `-${absValue}`
    }

    return addSymbol ? `${result}%` : result
}

// ============================================================================
// Status Text Helpers
// ============================================================================

/**
 * 格式化状态文本
 * 
 * @param result 趋势结果
 * @returns 状态描述文本
 */
export function formatStatusText(result: TrendResult): string {
    switch (result.status) {
        case 'insufficient':
            return '数据采集中'
        case 'stable':
            return '趋于稳定'
        case 'trending':
            return result.direction === 'up' ? '上升趋势' : '下降趋势'
        default:
            return ''
    }
}

/**
 * 生成简短的趋势描述（用于标签等场景）
 * 
 * @param result 趋势结果
 * @returns 简短描述
 */
export function formatShortLabel(result: TrendResult): string {
    if (result.status === 'insufficient') {
        return '采集中'
    }

    if (result.status === 'stable') {
        return '稳定'
    }

    const verb = result.direction === 'up' ? '↑' : '↓'
    const percent = Math.abs(result.changePercent ?? 0)
    return `${verb}${percent}%`
}
