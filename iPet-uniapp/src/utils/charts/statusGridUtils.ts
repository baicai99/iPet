/**
 * StatusGrid 图表共享逻辑
 * 用于 MiniStatusGrid 和 StatusGridChart
 */
import dayjs from 'dayjs'
import { mapValueToY, isLegacyValue, convertLegacyValue } from '@/config/stoolStatusConfig'

// 时间范围对应的网格分段数
export const SEGMENT_COUNTS: Record<string, number> = {
    day: 3,
    week: 7,
    month: 30,
    six_month: 6,
    year: 12
}

// 默认颜色
export const STATUS_COLORS = {
    normal: '#3B82F6',  // 蓝色
    abnormal: '#EF4444', // 红色
    zone: '#BAE6FD'      // 区域背景色
}

/**
 * 判断值是否在正常区间 (3-5)
 */
export function isNormalValue(value: number): boolean {
    return value >= 3 && value <= 5
}

/**
 * 处理原始值，转换 legacy 格式
 */
export function normalizeValue(value: any): number {
    return isLegacyValue(value) ? convertLegacyValue(value) : Number(value)
}

/**
 * 计算值对应的 Y 坐标 (归一化到 0-100)
 */
export function getYPosition(value: number, height: number): number {
    const normalized = mapValueToY(normalizeValue(value))
    return height - (normalized / 100) * height
}

/**
 * 计算时间范围
 */
export function getTimeRange(points: Array<{ timestamp?: number }>): { min: number; max: number } {
    if (!points.length) return { min: 0, max: 1 }
    const timestamps = points.map(p => p.timestamp).filter((t): t is number => !!t)
    if (timestamps.length === 0) return { min: 0, max: 1 }
    return {
        min: Math.min(...timestamps),
        max: Math.max(...timestamps)
    }
}

/**
 * 根据时间戳计算 X 坐标 (用于日视图的精确定位)
 */
export function getXFromTimestamp(
    timestamp: number | undefined,
    range: { min: number; max: number },
    width: number,
    padding: number
): number {
    if (!timestamp || range.max === range.min) {
        return width / 2
    }
    const ratio = (timestamp - range.min) / (range.max - range.min)
    return padding + ratio * (width - 2 * padding)
}

/**
 * 根据日期计算网格列索引 (用于非日视图的网格吸附)
 */
export function getGridColumnIndex(
    timestamp: number | undefined,
    date: string | undefined,
    timeRange: string,
    segments: number
): number {
    const now = dayjs()
    let startDate: dayjs.Dayjs

    switch (timeRange) {
        case 'day':
            startDate = now.startOf('day')
            break
        case 'week':
            startDate = now.subtract(6, 'day').startOf('day')
            break
        case 'month':
            startDate = now.subtract(29, 'day').startOf('day')
            break
        case 'six_month':
            startDate = now.subtract(6, 'month').startOf('day')
            break
        case 'year':
            startDate = now.subtract(1, 'year').startOf('day')
            break
        default:
            startDate = now.subtract(6, 'day').startOf('day')
    }

    const endDate = now.endOf('day')
    const totalMs = endDate.valueOf() - startDate.valueOf()

    const pointTime = timestamp || (date ? dayjs(date).valueOf() : now.valueOf())
    const offsetMs = pointTime - startDate.valueOf()
    const ratio = Math.max(0, Math.min(1, offsetMs / totalMs))
    const columnIndex = Math.floor(ratio * segments)

    return Math.min(columnIndex, segments - 1)
}

export interface ChartPoint {
    value: number
    x: number
    y: number
    timestamp: number | null
    date: string | null
    isNormal: boolean
}

/**
 * 处理数据点，返回标准化的图表点数组
 */
export function processChartPoints(
    dataArray: any[],
    width: number,
    height: number,
    segments: number,
    useTimestampPositioning: boolean = false,
    timeRange: string = 'week'
): ChartPoint[] {
    if (dataArray.length === 0) return []

    const firstItem = dataArray[0]
    const isStructuredData = typeof firstItem === 'object' && firstItem !== null && 'value' in firstItem
    const segmentWidth = width / segments

    if (isStructuredData) {
        if (useTimestampPositioning) {
            // 日视图：使用真实时间戳计算 X 位置
            const range = getTimeRange(dataArray)
            const padding = segmentWidth / 2
            return dataArray.map(point => {
                const rawValue = normalizeValue(point.value)
                return {
                    value: rawValue,
                    x: getXFromTimestamp(point.timestamp, range, width, padding),
                    y: getYPosition(rawValue, height),
                    timestamp: point.timestamp || null,
                    date: point.date || (point.timestamp ? new Date(point.timestamp).toISOString().split('T')[0] : null),
                    isNormal: isNormalValue(rawValue)
                }
            })
        } else {
            // 其他视图：网格吸附
            return dataArray.map(point => {
                const rawValue = normalizeValue(point.value)
                const columnIndex = getGridColumnIndex(point.timestamp, point.date, timeRange, segments)
                return {
                    value: rawValue,
                    x: columnIndex * segmentWidth + segmentWidth / 2,
                    y: getYPosition(rawValue, height),
                    timestamp: point.timestamp || null,
                    date: point.date || (point.timestamp ? new Date(point.timestamp).toISOString().split('T')[0] : null),
                    isNormal: isNormalValue(rawValue)
                }
            })
        }
    }

    // 简单数字数组 - 均匀分布
    return dataArray.slice(0, segments).map((val, i) => {
        const rawValue = normalizeValue(val)
        return {
            value: rawValue,
            x: i * segmentWidth + segmentWidth / 2,
            y: getYPosition(rawValue, height),
            timestamp: null,
            date: null,
            isNormal: isNormalValue(rawValue)
        }
    })
}
