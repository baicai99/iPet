/**
 * Trend Domain - Barrel Export
 * 
 * 统一导出趋势相关的类型、函数和常量
 */

// Types
export type {
    TrendStatus,
    TrendDirection,
    TrendResult,
    EvaluatorInput,
    LegacyInsightStatus
} from './trendTypes'

export { mapToLegacyStatus } from './trendTypes'

// Evaluator
export {
    evaluateTrend,
    evaluateTrendFromRecords,
    isPositiveTrend
} from './trendEvaluator'

// Formatter
export {
    formatHeadline,
    formatDirectionText,
    formatChangeVerb,
    formatPercent,
    formatStatusText,
    formatShortLabel
} from './trendFormatter'

// Constants
export {
    TREND_THRESHOLD_PERCENT,
    TREND_MIN_DATA_POINTS,
    TREND_WINDOW_SIZE,
    TREND_WEEKS_FOR_WEEKLY_MODE,
    TREND_STABLE_THRESHOLD_PERCENT,
    TREND_DEFAULT_WINDOW_DAYS,
    TREND_DEFAULT_COMPARE_LABEL
} from './trendConstants'

// Legacy exports (for backward compatibility)
export { getTrendStatus } from './getTrendStatus'
export type { TrendStatusResult } from './getTrendStatus'
export { detectSignificantChange, detectSignificantChanges, filterChangedMetrics, filterStableMetrics } from './detectSignificantChanges'
export type { TrendAnalysis, TrendDetectionConfig, MetricRecord } from './detectSignificantChanges'
