/**
 * Metric Pipeline - Pure Function Pipeline
 * 
 * 5-stage pure function pipeline for processing health metric data.
 * Each function is:
 * - Pure: no side effects, same input → same output
 * - Testable: can be unit tested in isolation
 * - Cacheable: results can be memoized
 * - Composable: can be chained or used individually
 */

import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

import type {
    NormalizedRecord,
    DailyPoint,
    BucketPoint,
    MetricContext,
    PipelineStats,
    PipelineResult
} from './metricPipelineTypes'

import type { MetricRange, AggregationMethod, MissingPolicy, MetricDomain } from '@shared/types/health'
import { getMetricProcessingConfig } from '@/data/metricMetadata'

dayjs.extend(isoWeek)

// ============================================================================
// Stage 1: normalizeRecords
// ============================================================================

/**
 * 解析时间戳（纯函数版本）
 */
function parseTimestamp(input: unknown): number {
    if (!input) return 0

    if (typeof input === 'number') return input

    if (input instanceof Date) return input.getTime()

    if (typeof input === 'object' && input !== null) {
        const obj = input as Record<string, unknown>
        const target = obj.date || obj.updatedAt || obj.timestamp
        if (target) return parseTimestamp(target)
        if (dayjs.isDayjs(input)) return (input as dayjs.Dayjs).valueOf()
    }

    if (typeof input === 'string') {
        const date = new Date(input)
        if (!Number.isNaN(date.getTime())) return date.getTime()
    }

    return 0
}

/**
 * 计算时间范围边界
 */
function resolveRangeBounds(range: MetricRange, now: dayjs.Dayjs = dayjs()): { from: dayjs.Dayjs; to: dayjs.Dayjs } {
    const to = now

    switch (range) {
        case 'day':
            return { from: to.startOf('day'), to }
        case 'week':
            return { from: to.startOf('isoWeek'), to }
        case 'month':
            return { from: to.startOf('month'), to }
        case 'six_month':
            return { from: to.subtract(5, 'month').startOf('month'), to }
        case 'year':
            return { from: to.subtract(11, 'month').startOf('month'), to }
        case 'last7d':
            return { from: to.subtract(6, 'day').startOf('day'), to }
        case 'last30d':
            return { from: to.subtract(29, 'day').startOf('day'), to }
        case 'last12m':
            return { from: to.subtract(11, 'month').startOf('month'), to }
        case 'last40w':
            return { from: to.subtract(40, 'week').startOf('isoWeek'), to }
        default:
            return { from: to.subtract(6, 'day').startOf('day'), to }
    }
}

/**
 * 1️⃣ normalizeRecords - 解析/过滤/裁剪/排序
 * 
 * 将原始记录转换为标准化结构：
 * - 解析各种时间格式为统一时间戳
 * - 过滤预约记录（isScheduled）
 * - 裁剪到时间范围内
 * - 按时间升序排列
 * 
 * @param records - 原始记录数组
 * @param range - 时间范围
 * @param now - 当前时间（可选，用于测试）
 * @returns 标准化记录数组，按时间升序
 */
export function normalizeRecords(
    records: unknown[],
    range: MetricRange,
    now?: dayjs.Dayjs
): NormalizedRecord[] {
    if (!Array.isArray(records) || records.length === 0) return []

    const { from, to } = resolveRangeBounds(range, now)

    const normalized: NormalizedRecord[] = []

    for (const record of records) {
        if (!record || typeof record !== 'object') continue

        const rec = record as Record<string, unknown>

        // 过滤预约记录
        const metadata = rec.metadata as Record<string, unknown> | undefined
        if (metadata?.isScheduled === true) continue

        // 解析时间戳
        const ts = parseTimestamp(record)
        if (!ts) continue

        // 裁剪到范围内
        const recordDate = dayjs(ts)
        if (recordDate.isBefore(from, 'day') || recordDate.isAfter(to, 'day')) continue

        // 解析数值
        const value = Number(rec.value) || 0

        normalized.push({
            ts,
            value,
            date: recordDate.format('YYYY-MM-DD'),
            raw: record
        })
    }

    // 按时间升序排序
    return normalized.sort((a, b) => a.ts - b.ts)
}

// ============================================================================
// Stage 2: aggregateToDailyPoints
// ============================================================================

/**
 * 2️⃣ aggregateToDailyPoints - 按日聚合
 * 
 * 将标准化记录聚合为日级数据点：
 * - 每天一个点
 * - 根据聚合方式计算值
 * - 无数据的天返回 null
 * 
 * @param records - 标准化记录数组
 * @param aggregationMethod - 聚合方式
 * @param range - 时间范围（用于生成完整日期序列）
 * @param now - 当前时间（可选，用于测试）
 * @returns 日聚合点数组
 */
export function aggregateToDailyPoints(
    records: NormalizedRecord[],
    aggregationMethod: AggregationMethod,
    range: MetricRange,
    now?: dayjs.Dayjs
): DailyPoint[] {
    const { from, to } = resolveRangeBounds(range, now)

    // 按日期分组
    const groups: Record<string, NormalizedRecord[]> = {}
    for (const record of records) {
        if (!groups[record.date]) groups[record.date] = []
        groups[record.date].push(record)
    }

    const result: DailyPoint[] = []
    const totalDays = to.diff(from, 'day') + 1

    // 生成每一天的聚合点
    for (let i = 0; i < totalDays; i++) {
        const date = from.add(i, 'day')
        const dateStr = date.format('YYYY-MM-DD')
        const dayRecords = groups[dateStr] || []

        let value: number | null = null

        if (dayRecords.length > 0) {
            const values = dayRecords.map(r => r.value)

            switch (aggregationMethod) {
                case 'sum':
                    value = values.reduce((a, b) => a + b, 0)
                    break
                case 'avg':
                    value = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
                    break
                case 'max':
                    value = Math.max(...values)
                    break
                case 'min':
                    value = Math.min(...values)
                    break
                case 'latest':
                default:
                    // 取最后一条（已按时间排序）
                    value = dayRecords[dayRecords.length - 1].value
                    break
            }
        }

        result.push({
            date: dateStr,
            ts: date.startOf('day').valueOf(),
            value,
            count: dayRecords.length
        })
    }

    return result
}

// ============================================================================
// Stage 3: bucketizeDailyPoints
// ============================================================================

/**
 * 3️⃣ bucketizeDailyPoints - 日→周/月升维
 * 
 * 将日级数据升维到周/月级别：
 * - bucket='day' 时直接返回转换后的点
 * - bucket='calendarWeek' 按 ISO 周聚合
 * - bucket='calendarMonth' 按月聚合
 * 
 * @param dailyPoints - 日聚合点数组
 * @param bucket - 目标粒度
 * @param aggregationMethod - 聚合方式
 * @returns 周期聚合点数组
 */
export function bucketizeDailyPoints(
    dailyPoints: DailyPoint[],
    bucket: 'day' | 'calendarWeek' | 'calendarMonth',
    aggregationMethod: AggregationMethod
): BucketPoint[] {
    if (!dailyPoints || dailyPoints.length === 0) return []

    // bucket='day' 时直接转换
    if (bucket === 'day') {
        return dailyPoints.map(p => ({
            period: p.date,
            ts: p.ts,
            value: p.value,
            daysWithData: p.value !== null ? 1 : 0
        }))
    }

    // 按周期分组
    const groups: Record<string, { values: number[]; ts: number; daysWithData: number }> = {}

    for (const day of dailyPoints) {
        if (day.value === null) continue

        const d = dayjs(day.date)
        let period: string
        let periodTs: number

        if (bucket === 'calendarWeek') {
            const year = d.isoWeekYear()
            const week = d.isoWeek()
            period = `${year}-W${String(week).padStart(2, '0')}`
            periodTs = d.startOf('isoWeek').valueOf()
        } else {
            period = d.format('YYYY-MM')
            periodTs = d.startOf('month').valueOf()
        }

        if (!groups[period]) {
            groups[period] = { values: [], ts: periodTs, daysWithData: 0 }
        }
        groups[period].values.push(day.value)
        groups[period].daysWithData += 1
    }

    // 聚合并排序
    return Object.entries(groups)
        .map(([period, data]) => {
            let value: number | null = null

            if (data.values.length > 0) {
                switch (aggregationMethod) {
                    case 'sum':
                        value = data.values.reduce((a, b) => a + b, 0)
                        break
                    case 'avg':
                        value = Number((data.values.reduce((a, b) => a + b, 0) / data.values.length).toFixed(2))
                        break
                    case 'max':
                        value = Math.max(...data.values)
                        break
                    case 'min':
                        value = Math.min(...data.values)
                        break
                    case 'latest':
                    default:
                        value = data.values[data.values.length - 1]
                        break
                }
            }

            return {
                period,
                ts: data.ts,
                value,
                daysWithData: data.daysWithData
            }
        })
        .sort((a, b) => a.ts - b.ts)
}

// ============================================================================
// Stage 4: alignToAxis
// ============================================================================

/**
 * 4️⃣ alignToAxis - 对齐到轴 + 缺失策略
 * 
 * 将数据点对齐到目标时间轴：
 * - 根据 missingPolicy 处理缺失值
 * - 生成与轴一一对应的值数组
 * 
 * @param points - 周期聚合点数组
 * @param axisTimestamps - 目标时间戳数组
 * @param missingPolicy - 缺失值策略
 * @returns 对齐后的值数组
 */
export function alignToAxis(
    points: BucketPoint[],
    axisTimestamps: number[],
    missingPolicy: MissingPolicy
): (number | null)[] {
    // 建立时间戳到值的映射
    const valueMap = new Map<number, number | null>()
    for (const point of points) {
        valueMap.set(point.ts, point.value)
    }

    // 对齐到轴
    return axisTimestamps.map(ts => {
        if (valueMap.has(ts)) {
            return valueMap.get(ts)!
        }

        // 缺失值处理
        switch (missingPolicy) {
            case 'zero':
                return 0
            case 'carry':
                // TODO: 实现 carry 逻辑（沿用上一个有效值）
                return null
            case 'null':
            default:
                return null
        }
    })
}

// ============================================================================
// Stage 5: buildStats
// ============================================================================

/**
 * 5️⃣ buildStats - 按 domain 计算统计
 * 
 * 根据指标类型计算不同的统计信息：
 * - snapshot: 强调 latest
 * - cumulative: 强调 total
 * - continuous: 强调 avg/min/max
 * - enum: 只有 count 有意义
 * 
 * @param points - 对齐后的值数组
 * @param domain - 指标领域类型
 * @returns 统计信息
 */
export function buildStats(
    points: (number | null)[],
    domain: MetricDomain
): PipelineStats {
    // 过滤有效值
    const validValues = points.filter((v): v is number =>
        v !== null && typeof v === 'number' && !Number.isNaN(v)
    )

    if (validValues.length === 0) {
        return { min: 0, max: 0, avg: 0, count: 0 }
    }

    const min = Math.min(...validValues)
    const max = Math.max(...validValues)
    const sum = validValues.reduce((a, b) => a + b, 0)
    const avg = Number((sum / validValues.length).toFixed(2))
    const count = validValues.length
    const latest = validValues[validValues.length - 1]

    // 根据 domain 决定返回哪些字段
    const stats: PipelineStats = { min, max, avg, count }

    if (domain === 'cumulative') {
        stats.total = Number(sum.toFixed(2))
    }

    if (domain === 'snapshot' || domain === 'continuous') {
        stats.latest = latest
    }

    return stats
}

// ============================================================================
// Orchestration: processMetricData
// ============================================================================

/**
 * 流水线组合函数 - 完整处理流程
 * 
 * 将所有阶段组合为一个完整的处理流程。
 * Store 调用此函数，Cache 存储结果。
 * 
 * @param records - 原始记录数组
 * @param metricKey - 指标键
 * @param range - 时间范围
 * @param bucket - 时间粒度
 * @param axisTimestamps - 目标时间轴（可选）
 * @returns 处理结果
 */
export function processMetricData(
    records: unknown[],
    metricKey: string,
    range: MetricRange,
    bucket: 'day' | 'calendarWeek' | 'calendarMonth' = 'day',
    axisTimestamps?: number[]
): PipelineResult {
    // 获取处理配置
    const config = getMetricProcessingConfig(metricKey)

    const context: MetricContext = {
        metricKey,
        domain: config.domain,
        aggregationMethod: config.aggregationMethod,
        missingPolicy: config.missingPolicy,
        connectAcrossMissing: config.connectAcrossMissing,
        range,
        bucket
    }

    // Stage 1: Normalize
    const normalized = normalizeRecords(records, range)

    // Stage 2: Aggregate to daily
    const dailyPoints = aggregateToDailyPoints(normalized, config.aggregationMethod, range)

    // Stage 3: Bucketize
    const bucketPoints = bucketizeDailyPoints(dailyPoints, bucket, config.aggregationMethod)

    // Prepare axis if not provided
    const timestamps = axisTimestamps || bucketPoints.map(p => p.ts)

    // Stage 4: Align to axis
    const points = alignToAxis(bucketPoints, timestamps, config.missingPolicy)

    // Stage 5: Build stats
    const stats = buildStats(points, config.domain)

    return {
        points,
        timestamps,
        stats,
        context
    }
}

// ============================================================================
// Exports
// ============================================================================

export {
    parseTimestamp,
    resolveRangeBounds
}

export type {
    NormalizedRecord,
    DailyPoint,
    BucketPoint,
    MetricContext,
    PipelineStats,
    PipelineResult
} from './metricPipelineTypes'
