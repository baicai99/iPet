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

/** 时间粒度类型 */
export type MetricBucket = 'day' | 'calendarWeek' | 'calendarMonth';

/** 时间范围类型 */
export type MetricRange = 'day' | 'week' | 'month' | 'six_month' | 'year' | 'last7d' | 'last30d' | 'last40w' | 'last12m';

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
