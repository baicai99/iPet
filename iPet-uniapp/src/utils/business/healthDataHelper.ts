import dayjs from 'dayjs'

/**
 * Parses various time formats into a unified millisecond timestamp (Number).
 * Handles:
 * - `date` string (ISO 8601, etc.)
 * - `updatedAt` number or string
 * - `timestamp` number or string
 * - Native Date objects
 * - Dayjs objects
 * 
 * @param input - The input object or value containing time information
 * @returns number - Timestamp in milliseconds. Returns 0 if parsing fails.
 */
export const parseTimestamp = (input: any): number => {
    if (!input) return 0

    // 1. If input is already a number (timestamp)
    if (typeof input === 'number') {
        // Simple check: is it seconds or milliseconds? 
        // Most modern timestamps are ms (13 digits). If < 10000000000, it might be seconds.
        // But let's assume inputs are mostly ms or we treat them as is unless specified.
        // However, the requirement says "backend returned... updatedAt number".
        return input
    }

    // 2. If input is a Date object
    if (input instanceof Date) {
        return input.getTime()
    }

    // 3. If input is an object (HealthRecord-like)
    if (typeof input === 'object') {
        // Priority: date > updatedAt > timestamp
        const target = input.date || input.updatedAt || input.timestamp
        if (target) {
            return parseTimestamp(target)
        }
        // If it's a dayjs object
        if (dayjs.isDayjs(input)) {
            return input.valueOf()
        }
    }

    // 4. If input is a string
    if (typeof input === 'string') {
        // Try parsing with Date
        const date = new Date(input)
        if (!Number.isNaN(date.getTime())) {
            return date.getTime()
        }
    }

    return 0
}

/**
 * Sorts an array of records based on their time information.
 * Uses `parseTimestamp` to extract time.
 * 
 * @param records - Array of records to sort
 * @param order - 'asc' (ascending) or 'desc' (descending). Default is 'desc'.
 * @returns Array - New sorted array (does not mutate original)
 */
export const sortRecordsByTime = <T>(records: T[], order: 'asc' | 'desc' = 'desc'): T[] => {
    if (!Array.isArray(records)) return []

    return [...records].sort((a, b) => {
        const timeA = parseTimestamp(a)
        const timeB = parseTimestamp(b)
        return order === 'asc' ? timeA - timeB : timeB - timeA
    })
}

/**
 * Gets the latest record from a list based on time.
 * 
 * @param records - Array of records
 * @returns The latest record or null if empty
 */
export const getLatestRecord = <T>(records: T[]): T | null => {
    if (!records || records.length === 0) return null
    // Optimization: if we know it's sorted, we could just take the first/last.
    // But to be safe, we sort.
    const sorted = sortRecordsByTime(records, 'desc')
    return sorted[0]
}

/**
 * Generates chart data from history records.
 * Handles sorting and data extraction based on visualization type.
 * 
 * @param visualizationType - Type of visualization (e.g., 'event_timeline', 'status_grid', 'status_icon')
 * @param history - Array of history records
 * @returns Array or value suitable for chart components
 */
export const buildChartData = (visualizationType: string, history: any[] = [], limit?: number) => {
    if (!Array.isArray(history)) return []
    let sorted = sortRecordsByTime(history, 'asc')

    if (limit && limit > 0 && sorted.length > limit) {
        sorted = sorted.slice(-limit)
    }

    switch (visualizationType) {
        case 'event_timeline':
            // For timeline, we might want the latest events, so we slice from the end (latest) 
            // but the display usually expects desc order.
            // If we sliced 'asc' sorted data (oldest -> newest) by taking the last N, we get the N newest.
            // Then we sort them desc for display.
            return sortRecordsByTime(sorted, 'desc')
        case 'status_grid':
            return sorted.map(item => Number(item.value ?? item.gridValue ?? 0))
        case 'status_icon':
            return sorted.length
                ? sorted[sorted.length - 1].emoji || sorted[sorted.length - 1].value
                : ''
        default:
            return sorted.map(item => item.value)
    }
}

/**
 * Generates metric series data for charts based on a specific time range.
 * Filters history records and calculates min/max/avg stats.
 * 
 * @param history - Array of history records
 * @param range - Time range ('day', 'week', 'month', 'six_month', 'year')
 * @returns Object containing series data and stats
 */
export const getMetricSeries = (history: any[], range: string) => {
    // Calculate cutoff time based on range
    const now = dayjs()
    let cutoff = now

    switch (range) {
        case 'day': cutoff = now.startOf('day'); break;
        case 'week': cutoff = now.startOf('day').subtract(6, 'day'); break;
        case 'month': cutoff = now.subtract(1, 'month'); break;
        case 'six_month': cutoff = now.subtract(5, 'month').startOf('month'); break;
        case 'year': cutoff = now.subtract(11, 'month').startOf('month'); break;
        default: cutoff = now.subtract(7, 'day');
    }

    // Filter and sort by time ascending (for charts)
    const filtered = history
        .filter((r: any) => {
            // Filter by date range
            const inRange = dayjs(r.date || r.updatedAt || r.timestamp).isAfter(cutoff)
            // Filter out scheduled future records (appointments)
            const isNotScheduled = r.metadata?.isScheduled !== true
            return inRange && isNotScheduled
        })
        .sort((a: any, b: any) => parseTimestamp(a) - parseTimestamp(b))

    const series = filtered.map((r: any) => ({
        value: Number(r.value),
        timestamp: parseTimestamp(r)
    }))

    const numericValues = series.map((s: any) => s.value).filter((value: any) => typeof value === 'number' && !Number.isNaN(value))
    const min = numericValues.length ? Math.min(...numericValues) : 0
    const max = numericValues.length ? Math.max(...numericValues) : 0
    const avg = numericValues.length ? (numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length).toFixed(1) : 0

    return {
        series,
        stats: { min, max, avg }
    }
}

/**
 * Aggregates metric data by day for chart display.
 * Generates a fixed number of data points (default 7 days).
 * 
 * @param history - Array of history records
 * @param daysCount - Number of days to look back (default 7)
 * @param method - Aggregation method ('sum', 'latest', 'avg')
 * @returns Array of numbers representing daily values (latest first or oldest first? usually charts want oldest -> newest)
 *          Here we return oldest -> newest to match chart left-to-right.
 */
export const aggregateDailyData = (history: any[], daysCount: number = 7, method: 'sum' | 'latest' | 'avg' = 'latest', endDate?: number | string | Date) => {
    // Return zeros if no history
    if (!Array.isArray(history)) return Array(daysCount).fill(0)

    const groups = {} as Record<string, any[]>

    // Group records by YYYY-MM-DD
    history.forEach(record => {
        const ts = parseTimestamp(record)
        if (!ts) return
        // Use local format consistent with the loop below
        const dateStr = dayjs(ts).format('YYYY-MM-DD')
        if (!groups[dateStr]) groups[dateStr] = []
        groups[dateStr].push(record)
    })

    const result = []
    const anchor = endDate ? dayjs(endDate) : dayjs()

    // Iterate from (daysCount-1) days ago up to anchor date
    for (let i = daysCount - 1; i >= 0; i--) {
        const dateStr = anchor.subtract(i, 'day').format('YYYY-MM-DD')
        const dayRecords = groups[dateStr] || []

        let value = 0
        if (dayRecords.length > 0) {
            if (method === 'sum') {
                value = dayRecords.reduce((acc, r) => acc + (Number(r.value) || 0), 0)
            } else if (method === 'avg') {
                const sum = dayRecords.reduce((acc, r) => acc + (Number(r.value) || 0), 0)
                value = Number((sum / dayRecords.length).toFixed(2))
            } else { // latest
                // Sort descending by time to get the latest record of the day
                const sorted = sortRecordsByTime(dayRecords, 'desc')
                value = Number(sorted[0].value) || 0
            }
        }
        result.push(value)
    }
    return result
}

// ============================================================================
// MetricSeries V2 统一协议（PRD 7.3）
// ============================================================================

import type {
    DailyPoint,
    BucketPoint,
    MetricSeriesResponse,
    MetricSeriesParams,
    MetricBucket,
    MetricRange,
    MetricStats,
    AggregationMethod
} from '@shared/types/health'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

/**
 * 将日级数据升维到周/月级别
 * 
 * @param days - 日级聚合点数组
 * @param bucket - 目标粒度 ('calendarWeek' | 'calendarMonth')
 * @returns BucketPoint 数组
 */
export function groupDailyToBucket(
    days: DailyPoint[],
    bucket: 'calendarWeek' | 'calendarMonth'
): BucketPoint[] {
    if (!days || days.length === 0) return []

    const groups: Record<string, { values: number[]; days: number; ts: number }> = {}

    days.forEach(day => {
        const d = dayjs(day.date)
        let period: string
        let periodTs: number

        if (bucket === 'calendarWeek') {
            // ISO week: 2024-W01
            const year = d.isoWeekYear()
            const week = d.isoWeek()
            period = `${year}-W${String(week).padStart(2, '0')}`
            // 周起始时间戳（周一）
            periodTs = d.startOf('isoWeek').valueOf()
        } else {
            // Month: 2024-01
            period = d.format('YYYY-MM')
            periodTs = d.startOf('month').valueOf()
        }

        if (!groups[period]) {
            groups[period] = { values: [], days: 0, ts: periodTs }
        }
        groups[period].values.push(day.value)
        groups[period].days += 1
    })

    // 按时间排序
    return Object.entries(groups)
        .map(([period, data]) => ({
            period,
            ts: data.ts,
            value: data.values.reduce((a, b) => a + b, 0) / data.values.length, // 默认取平均
            days: data.days
        }))
        .sort((a, b) => a.ts - b.ts)
}

/**
 * 构建统一 Series 结果
 * 
 * @param points - 日级或周期级聚合点
 * @returns MetricStats 统计信息
 */
export function buildSeriesStats(points: Array<{ value: number }>): MetricStats {
    if (!points || points.length === 0) {
        return { min: 0, max: 0, avg: 0 }
    }

    const values = points.map(p => p.value).filter(v => typeof v === 'number' && !Number.isNaN(v))

    if (values.length === 0) {
        return { min: 0, max: 0, avg: 0 }
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
    const total = Number(values.reduce((a, b) => a + b, 0).toFixed(2))

    return { min, max, avg, total, count: values.length, latest: values[values.length - 1] }
}

/**
 * 根据 range 计算时间范围
 */
function resolveRange(range: MetricRange): { from: dayjs.Dayjs; to: dayjs.Dayjs; daysCount: number } {
    const to = dayjs()
    let from: dayjs.Dayjs
    let daysCount: number

    switch (range) {
        case 'day':
            from = to.startOf('day')
            daysCount = 1
            break
        case 'week':
        case 'last7d':
            from = to.subtract(6, 'day').startOf('day')
            daysCount = 7
            break
        case 'month':
        case 'last30d':
            // Month View: Recent 30 days
            from = to.subtract(29, 'day').startOf('day')
            daysCount = 30
            break
        case 'six_month':
            // 6 Months View: Current month + previous 5 months
            from = to.subtract(5, 'month').startOf('month')
            daysCount = to.diff(from, 'day') + 1
            break
        case 'year':
        case 'last12m':
            // Year View: Current month + previous 11 months
            from = to.subtract(11, 'month').startOf('month')
            daysCount = to.diff(from, 'day') + 1 // Dynamic days count
            break
        case 'last40w':
            from = to.subtract(40, 'week').startOf('isoWeek')
            daysCount = 40 * 7
            break
        default:
            from = to.subtract(6, 'day').startOf('day')
            daysCount = 7
    }

    return { from, to, daysCount }
}

/**
 * 根据指标类型推断聚合方式
 */
function resolveAggMethod(metric: string): AggregationMethod {
    // 累加型指标
    const sumMetrics = ['steps', 'calories', 'water', 'exercise_duration']
    // 取最新值指标
    const latestMetrics = ['weight', 'temperature', 'heart_rate', 'mood', 'poop', 'meal']

    if (sumMetrics.includes(metric)) return 'sum'
    if (latestMetrics.includes(metric)) return 'latest'
    return 'avg'
}

/**
 * 日级聚合（返回 DailyPoint 数组）
 * 
 * @param history - 原始记录数组
 * @param options - 聚合选项
 * @returns DailyPoint 数组
 */
export function aggregateToDailyPoints(
    history: any[],
    options: {
        agg: AggregationMethod
        from?: dayjs.Dayjs
        to?: dayjs.Dayjs
        daysCount?: number
    }
): DailyPoint[] {
    if (!Array.isArray(history)) return []

    const { agg, from, to, daysCount } = options
    const endDate = to || dayjs()
    const startDate = from || (daysCount ? endDate.subtract(daysCount - 1, 'day') : endDate.subtract(6, 'day'))

    // 按日期分组
    const groups: Record<string, any[]> = {}
    history.forEach(record => {
        const ts = parseTimestamp(record)
        if (!ts) return

        const recordDate = dayjs(ts)
        // 过滤掉不在范围内的记录
        if (recordDate.isBefore(startDate, 'day') || recordDate.isAfter(endDate, 'day')) return
        // 过滤掉预约记录
        if (record.metadata?.isScheduled === true) return

        const dateStr = recordDate.format('YYYY-MM-DD')
        if (!groups[dateStr]) groups[dateStr] = []
        groups[dateStr].push(record)
    })

    const result: DailyPoint[] = []
    const totalDays = endDate.diff(startDate, 'day') + 1

    // 生成每一天的聚合点
    for (let i = 0; i < totalDays; i++) {
        const date = startDate.add(i, 'day')
        const dateStr = date.format('YYYY-MM-DD')
        const dayRecords = groups[dateStr] || []

        let value = 0
        if (dayRecords.length > 0) {
            const values = dayRecords.map(r => Number(r.value) || 0)
            switch (agg) {
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
                    const sorted = sortRecordsByTime(dayRecords, 'desc')
                    value = Number(sorted[0].value) || 0
                    break
            }
        }

        result.push({
            date: dateStr,
            ts: date.valueOf(),
            value,
            count: dayRecords.length
        })
    }

    return result
}

/**
 * 获取指标系列数据 V2（统一入口）
 * 
 * 该函数对齐 PRD 7.3.1 的 MetricSeriesResponse 结构，
 * 未来迁移到服务端时，只需在后端按同样语义实现。
 * 
 * @param history - 原始健康记录数组
 * @param params - 查询参数
 * @returns MetricSeriesResponse 统一响应结构
 */
export function getMetricSeriesV2(
    history: any[],
    params: MetricSeriesParams
): MetricSeriesResponse {
    const { metric, bucket, range } = params
    const { from, to, daysCount } = resolveRange(range)
    const agg = resolveAggMethod(metric)

    // 1. 日级聚合
    const dailyPoints = aggregateToDailyPoints(history, {
        agg,
        from,
        to,
        daysCount
    })

    // 2. 如果需要更粗粒度，升维到周/月
    let finalPoints: Array<{ ts: number; value: number }>

    if (bucket === 'day') {
        finalPoints = dailyPoints.map(p => ({ ts: p.ts, value: p.value }))
    } else {
        const bucketPoints = groupDailyToBucket(dailyPoints, bucket)
        finalPoints = bucketPoints.map(p => ({ ts: p.ts, value: p.value }))
    }

    // 3. 构建统计信息
    const stats = buildSeriesStats(finalPoints)

    return {
        metric,
        bucket,
        range,
        points: finalPoints,
        stats
    }
}
