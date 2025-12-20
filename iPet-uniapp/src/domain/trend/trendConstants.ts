/**
 * Trend Constants - Shared Defaults
 *
 * 单一职责：
 * - 统一维护趋势检测的默认参数，避免 Domain/UI 出现口径不一致
 */

/** 显著趋势变化阈值：仅当变化百分比 > 30% 才判定为有趋势变化 */
export const TREND_THRESHOLD_PERCENT = 30

/** 趋势分析最少数据点数量 */
export const TREND_MIN_DATA_POINTS = 20

/** 分析窗口大小（最近 N 个数据点） */
export const TREND_WINDOW_SIZE = 40

/** 切换到周视图的阈值（当周数 >= N 时使用周聚合） */
export const TREND_WEEKS_FOR_WEEKLY_MODE = 20
