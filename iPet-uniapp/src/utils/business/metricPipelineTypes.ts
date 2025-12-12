/**
 * Metric Pipeline Types
 * 
 * Type definitions for the pure function pipeline.
 * Each type represents the data shape at a specific stage.
 */

import type {
    MetricDomain,
    MissingPolicy,
    AggregationMethod,
    MetricRange,
    MetricBucket
} from '@shared/types/health'

// ============================================================================
// Stage 1: Normalized Records
// ============================================================================

/**
 * NormalizedRecord - 标准化后的记录
 * 
 * normalizeRecords() 的输出，结构统一、按时间升序排列。
 * 内部使用，不暴露给外部。
 */
export interface NormalizedRecord {
    /** 毫秒时间戳 */
    ts: number
    /** 数值（已转换为 number） */
    value: number
    /** 日期字符串 YYYY-MM-DD */
    date: string
    /** 原始记录引用（调试用，可选） */
    raw?: unknown
}

// ============================================================================
// Stage 2: Daily Points
// ============================================================================

/**
 * DailyPoint - 日聚合点
 * 
 * aggregateToDailyPoints() 的输出。
 * 每天一个点，按时间升序排列。
 */
export interface DailyPoint {
    /** 日期字符串 YYYY-MM-DD */
    date: string
    /** 当天 00:00 的毫秒时间戳 */
    ts: number
    /** 聚合值，null 表示当天无数据 */
    value: number | null
    /** 原始记录数（调试用） */
    count: number
}

// ============================================================================
// Stage 3: Bucket Points
// ============================================================================

/**
 * BucketPoint - 周期聚合点（周/月）
 * 
 * bucketizeDailyPoints() 的输出。
 * 用于 six_month/year 视图的粗粒度显示。
 */
export interface BucketPoint {
    /** 周期标识：2024-W01（ISO 周）或 2024-01（月） */
    period: string
    /** 周期起始时间戳（周一或月初） */
    ts: number
    /** 周期内聚合值，null 表示整个周期无数据 */
    value: number | null
    /** 有数据的天数 */
    daysWithData: number
}

// ============================================================================
// Processing Context
// ============================================================================

/**
 * MetricContext - 处理上下文
 * 
 * 贯穿整个流水线的配置对象。
 * 从 metricMetadata 派生，包含所有处理决策信息。
 */
export interface MetricContext {
    /** 指标键 */
    metricKey: string
    /** 指标领域类型 */
    domain: MetricDomain
    /** 聚合方式 */
    aggregationMethod: AggregationMethod
    /** 缺失值策略 */
    missingPolicy: MissingPolicy
    /** 是否跨越缺失点连接 */
    connectAcrossMissing: boolean
    /** 时间范围 */
    range: MetricRange
    /** 时间粒度 */
    bucket: MetricBucket
    /** 时区（可选，默认本地） */
    timezone?: string
}

// ============================================================================
// Stage 5: Stats
// ============================================================================

/**
 * MetricStats - 统计结果
 * 
 * buildStats() 的输出。
 * 含义随 domain 变化：
 * - snapshot: latest 有意义，total 无意义
 * - cumulative: total 有意义
 * - enum: count 可能是事件次数
 */
export interface PipelineStats {
    /** 最小值 */
    min: number
    /** 最大值 */
    max: number
    /** 平均值（仅 snapshot/continuous 有意义） */
    avg: number
    /** 总和（仅 cumulative 有意义） */
    total?: number
    /** 有效数据点数 */
    count: number
    /** 最新值（仅 snapshot 有意义） */
    latest?: number
}

// ============================================================================
// Pipeline Result
// ============================================================================

/**
 * PipelineResult - 流水线最终输出
 */
export interface PipelineResult {
    /** 对齐后的数据点 */
    points: (number | null)[]
    /** 时间戳轴 */
    timestamps: number[]
    /** 统计信息 */
    stats: PipelineStats
    /** 处理上下文（调试用） */
    context: MetricContext
}

// ============================================================================
// Axis Generation
// ============================================================================

/**
 * TimeAxis - 时间轴定义
 */
export interface TimeAxis {
    /** 时间戳数组 */
    timestamps: number[]
    /** 标签数组（与 timestamps 一一对应） */
    labels: string[]
    /** 格式化函数 */
    formatLabel: (ts: number) => string
}
