/**
 * RiskGrid 图表共享逻辑
 * 用于 RiskGridTrendChart 组件
 * 专门处理离散风险等级类指标（焦虑、抑郁等）
 */
import dayjs from 'dayjs'
import { getLocalDayKey } from '@/utils/common/timeKey'

// 风险等级定义（固定顺序，自上而下：重度 → 最轻）
export const RISK_LEVELS = ['最轻', '轻度', '中度', '重度'] as const
export type RiskLevel = typeof RISK_LEVELS[number]

// 风险等级颜色映射（语义色，仅用于数据点，不用于网格/文字）
export const RISK_COLORS: Record<RiskLevel, string> = {
    '最轻': '#43A047',  // 绿色 - 安全/正常
    '轻度': '#FBC02D',  // 黄色 - 轻微波动
    '中度': '#FB8C00',  // 橙色 - 明显异常
    '重度': '#E53935'   // 深红 - 高风险
}

// 时间范围对应的网格分段数
export const SEGMENT_COUNTS: Record<string, number> = {
    day: 24,      // 24小时
    week: 7,      // 7天
    month: 30,    // 30天
    six_month: 6, // 6个月
    year: 12      // 12个月
}

// 数值到风险等级映射
export function valueToRiskLevel(value: number): RiskLevel {
    if (value <= 1) return '最轻'
    if (value <= 2) return '轻度'
    if (value <= 3) return '中度'
    return '重度'
}

// 风险等级到数值映射
export function riskLevelToValue(level: RiskLevel): number {
    const map: Record<RiskLevel, number> = {
        '最轻': 1,
        '轻度': 2,
        '中度': 3,
        '重度': 4
    }
    return map[level] ?? 1
}

/**
 * 计算风险等级对应的 Y 坐标
 * Y轴从上到下：重度(0) → 中度(1) → 轻度(2) → 最轻(3)
 * @param level 风险等级
 * @param height 图表高度
 * @returns Y 坐标（居中于对应行）
 */
export function riskLevelToY(level: RiskLevel, height: number): number {
    const rowHeight = height / 4
    // 从上到下的索引：重度=0, 中度=1, 轻度=2, 最轻=3
    const levelIndex: Record<RiskLevel, number> = {
        '重度': 0,
        '中度': 1,
        '轻度': 2,
        '最轻': 3
    }
    const index = levelIndex[level]
    // 返回行中心点的 Y 坐标
    return index * rowHeight + rowHeight / 2
}

/**
 * 根据数值计算 Y 坐标
 */
export function valueToY(value: number, height: number): number {
    const level = valueToRiskLevel(value)
    return riskLevelToY(level, height)
}

/**
 * 获取风险等级对应的颜色
 */
export function getRiskColor(value: number): string {
    const level = valueToRiskLevel(value)
    return RISK_COLORS[level]
}

/**
 * 根据日期计算网格列索引
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
            startDate = now.subtract(5, 'month').startOf('month')
            break
        case 'year':
            startDate = now.subtract(11, 'month').startOf('month')
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

export interface RiskChartPoint {
    value: number
    level: RiskLevel
    x: number
    y: number
    color: string
    timestamp: number | null
    date: string | null
}

export interface RiskDataPoint {
    value: number
    timestamp?: number
    date?: string
}

/**
 * 处理数据点，返回标准化的图表点数组
 * 对于同一时间单元的多次记录，取最高风险等级
 */
export function processRiskChartPoints(
    dataArray: RiskDataPoint[],
    width: number,
    height: number,
    segments: number,
    timeRange: string = 'week'
): RiskChartPoint[] {
    if (!dataArray || dataArray.length === 0) return []

    const segmentWidth = width / segments

    // 按时间单元分组，取最高风险等级
    const groupedBySegment = new Map<number, RiskDataPoint>()

    dataArray.forEach(point => {
        const columnIndex = getGridColumnIndex(point.timestamp, point.date, timeRange, segments)
        const existing = groupedBySegment.get(columnIndex)

        if (!existing || point.value > existing.value) {
            groupedBySegment.set(columnIndex, point)
        }
    })

    // 转换为图表点
    const chartPoints: RiskChartPoint[] = []

    groupedBySegment.forEach((point, columnIndex) => {
        const level = valueToRiskLevel(point.value)
        chartPoints.push({
            value: point.value,
            level,
            x: columnIndex * segmentWidth + segmentWidth / 2,
            y: valueToY(point.value, height),
            color: RISK_COLORS[level],
            timestamp: point.timestamp || null,
            date: point.date || (point.timestamp ? getLocalDayKey(point.timestamp) : null)
        })
    })

    // 按 X 坐标排序
    chartPoints.sort((a, b) => a.x - b.x)

    return chartPoints
}

/**
 * 生成趋势连接线的 SVG points 字符串
 * 只连接相邻的数据点（非缺失数据）
 */
export function generateTrendLinePoints(chartPoints: RiskChartPoint[]): string {
    if (chartPoints.length < 2) return ''
    return chartPoints.map(p => `${p.x},${p.y}`).join(' ')
}
