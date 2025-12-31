/**
 * Health-related types for iPet-BackEnd.
 */

export interface HealthRecord {
    id: string;
    updatedAt: number;
    deleted?: boolean;
    petId: string;
    type: string;
    value: number;
    unit: string;
    date: string;
    notes?: string | null;
    source?: string | null;
    status?: 'pending' | 'synced' | 'failed' | null;
    label?: string | null;
    emoji?: string | null;
    gridValue?: number | null;
    metadata?: Record<string, any>;
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

// ============================================================================
// MetricSeries 统一协议（PRD 7.3.1）
// ============================================================================

/** 缓存 Schema 版本 - 版本变更时清空旧缓存 */
export const HEALTH_CACHE_SCHEMA_VERSION = 3;

// ============================================================================
// 指标领域模型（数据口径统一）
// ============================================================================

/**
 * 指标领域类型 - 决定聚合方式和缺失值处理
 * - snapshot:   快照型（体重/体温/心率）→ latest, 缺失=null
 * - cumulative: 累积型（步数/饮水/热量）→ sum, 缺失=0
 * - continuous: 连续型（某些监测指标）→ avg/min/max, 缺失=null
 * - enum:       离散状态（排泄/情绪）→ 走 grid/timeline，不进入 numeric pipeline
 */
export type MetricDomain = 'snapshot' | 'cumulative' | 'continuous' | 'enum';

/**
 * 缺失值处理策略
 * - null: 数据缺失时保持 null（图表断开）
 * - zero: 数据缺失时填充 0（如累积型指标）
 * - carry: 沿用上一个有效值（预留，暂不实现）
 */
export type MissingPolicy = 'null' | 'zero' | 'carry';

// ============================================================================
// 时间范围类型（语义分离）
// ============================================================================

/** 时间粒度类型 */
export type MetricBucket = 'day' | 'calendarWeek' | 'calendarMonth';

/**
 * 自然周期（按日历边界对齐）
 * - day:       当天 00:00 ~ 23:59:59
 * - week:      周一 00:00 ~ 周日 23:59:59（ISO week）
 * - month:     月初 00:00 ~ 月末 23:59:59
 * - six_month: 当月及前 5 个自然月
 * - year:      当月及前 11 个自然月
 */
export type NaturalPeriod = 'day' | 'week' | 'month' | 'six_month' | 'year';

/**
 * 滚动窗口（从今天往前推 N 天/周/月）
 * - last7d:  含今天的过去 7 天
 * - last30d: 含今天的过去 30 天
 * - last40w: 含本周的过去 40 周
 * - last12m: 含本月的过去 12 个月
 */
export type RollingWindow = 'last7d' | 'last30d' | 'last40w' | 'last12m';

/** 统一时间范围类型（兼容两种语义） */
export type MetricRange = NaturalPeriod | RollingWindow;

/** 聚合方式 */
export type AggregationMethod = 'sum' | 'avg' | 'latest' | 'max' | 'min';

/** 日级聚合点 */
export interface DailyPoint {
    date: string;       // YYYY-MM-DD
    ts: number;         // timestamp (ms)
    value: number | null;  // null = no data for this day
    count?: number;     // 当天记录数
}

/** 周期聚合点（周/月） */
export interface BucketPoint {
    period: string;     // 2024-W01 (ISO week) or 2024-01 (month)
    ts: number;         // 周期起始时间戳
    value: number;
    days: number;       // 该周期内有记录的天数
}

/** 统计信息 */
export interface MetricStats {
    min: number;
    max: number;
    avg: number;
    latest?: number;
    total?: number;
    count?: number;
}

/**
 * MetricSeries 统一响应结构
 * 用于：
 * - 后端 /health/metric-series 返回值
 * - 前端 helper getMetricSeries 的输出
 * - 前端 Store seriesCache 的 value
 */
export interface MetricSeriesResponse {
    metric: string;
    bucket: MetricBucket;
    range: MetricRange;
    points: Array<{ ts: number; value: number | null }>;
    stats: MetricStats;
}

/** MetricSeries 请求参数 */
export interface MetricSeriesParams {
    metric: string;
    bucket: MetricBucket;
    mode: 'rolling' | 'calendar';
    range: MetricRange;
}

// ============================================================================
// 缓存相关类型
// ============================================================================

/** 缓存条目 */
export interface CacheEntry<T> {
    data: T;
    updatedAt: number;
    schemaVersion: number;
}

/** 缓存键类型 */
export type HealthCacheKey =
    | 'Summary_Snapshot'
    | 'Trend_Cache_7Days'
    | 'Trend_Cache_30Days'
    | `Series_${string}`;
