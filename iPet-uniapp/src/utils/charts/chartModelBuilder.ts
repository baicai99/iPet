/**
 * ChartModel Builder - 统一图表模型构建器
 * 
 * 构建渲染器无关的 ChartModel，供 Mini/Detail Charts 共享。
 * 统一了轴生成、点对齐、缺失策略等逻辑。
 */

import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

import type { MetricRange } from '@/types/health'
import type {
    ChartModel,
    ChartModelOptions,
    AxisConfig,
    ChartDataPoint,
    ChartStats,
    ChartAnnotation,
    ChartSemantic
} from './chartModel'
import { getMetricMetadata, getMetricProcessingConfig } from '@/data/metricMetadata'
import { getDomain } from './chartCore'

dayjs.extend(isoWeek)

// ============================================================================
// Range Configuration
// ============================================================================

interface RangeConfig {
    tickCount: number
    tickFormat: string
    bucket: 'day' | 'calendarWeek' | 'calendarMonth'
    daysBack: number
}

const RANGE_CONFIGS: Record<string, RangeConfig> = {
    day: { tickCount: 24, tickFormat: 'HH:mm', bucket: 'day', daysBack: 1 },
    week: { tickCount: 7, tickFormat: 'ddd', bucket: 'day', daysBack: 7 },
    last7d: { tickCount: 7, tickFormat: 'MM/DD', bucket: 'day', daysBack: 7 },
    month: { tickCount: 30, tickFormat: 'D', bucket: 'day', daysBack: 30 },
    last30d: { tickCount: 30, tickFormat: 'D', bucket: 'day', daysBack: 30 },
    six_month: { tickCount: 6, tickFormat: 'M', bucket: 'calendarMonth', daysBack: 180 },
    year: { tickCount: 12, tickFormat: 'MMM', bucket: 'calendarMonth', daysBack: 365 },
    last12m: { tickCount: 12, tickFormat: 'MMM', bucket: 'calendarMonth', daysBack: 365 },
    last40w: { tickCount: 40, tickFormat: 'M/D', bucket: 'calendarWeek', daysBack: 280 }
}

// ============================================================================
// Axis Generation
// ============================================================================

/**
 * 生成时间轴配置
 */
function buildAxis(range: MetricRange, now: dayjs.Dayjs = dayjs()): AxisConfig {
    const config = RANGE_CONFIGS[range] || RANGE_CONFIGS.week
    const { tickCount, tickFormat, bucket } = config

    const timestamps: number[] = []
    const labels: string[] = []

    if (bucket === 'day') {
        // 生成日级时间戳
        for (let i = tickCount - 1; i >= 0; i--) {
            const date = now.subtract(i, 'day').startOf('day')
            timestamps.push(date.valueOf())
            labels.push(date.format(tickFormat))
        }
    } else if (bucket === 'calendarWeek') {
        // 生成周级时间戳
        for (let i = tickCount - 1; i >= 0; i--) {
            const date = now.subtract(i, 'week').startOf('isoWeek')
            timestamps.push(date.valueOf())
            labels.push(date.format(tickFormat))
        }
    } else if (bucket === 'calendarMonth') {
        // 生成月级时间戳
        for (let i = tickCount - 1; i >= 0; i--) {
            const date = now.subtract(i, 'month').startOf('month')
            timestamps.push(date.valueOf())
            labels.push(date.format(tickFormat))
        }
    }

    return {
        timestamps,
        labels,
        tickFormat,
        tickCount,
        type: 'time'
    }
}

// ============================================================================
// Points Generation
// ============================================================================

/**
 * 生成数据点（对齐到轴）
 */
function buildPoints(
    values: (number | null)[],
    axis: AxisConfig,
    yDomain: { min: number; max: number; range: number },
    width: number = 100,
    height: number = 100
): ChartDataPoint[] {
    const points: ChartDataPoint[] = []
    const count = Math.min(values.length, axis.timestamps.length)

    for (let i = 0; i < count; i++) {
        const value = values[i]
        const ts = axis.timestamps[i]
        const label = axis.labels[i]

        // X 坐标：均匀分布
        const x = count > 1 ? (i / (count - 1)) * width : width / 2

        // Y 坐标：null 时不绘制
        let y: number | null = null
        if (value !== null && yDomain.range > 0) {
            // SVG 坐标：y=0 在顶部
            y = height - ((value - yDomain.min) / yDomain.range) * height
        } else if (value !== null && yDomain.range === 0) {
            // 所有值相同，居中
            y = height / 2
        }

        points.push({
            ts,
            value,
            x,
            y,
            label,
            index: i
        })
    }

    return points
}

// ============================================================================
// Stats Calculation
// ============================================================================

/**
 * 计算统计信息
 */
function buildStats(values: (number | null)[]): ChartStats {
    const validValues = values.filter((v): v is number => v !== null && !Number.isNaN(v))

    if (validValues.length === 0) {
        return { min: 0, max: 0, avg: 0, count: 0 }
    }

    const min = Math.min(...validValues)
    const max = Math.max(...validValues)
    const sum = validValues.reduce((a, b) => a + b, 0)
    const avg = Number((sum / validValues.length).toFixed(2))

    return {
        min,
        max,
        avg,
        total: Number(sum.toFixed(2)),
        count: validValues.length,
        latest: validValues[validValues.length - 1]
    }
}

// ============================================================================
// Annotations Generation
// ============================================================================

/**
 * 生成标注（最小值、最大值）
 */
function buildAnnotations(points: ChartDataPoint[], stats: ChartStats): ChartAnnotation[] {
    const annotations: ChartAnnotation[] = []

    // 只在有足够数据时添加标注
    if (points.length < 3) return annotations

    // 找最小值点
    const minPoint = points.find(p => p.value === stats.min && p.y !== null)
    if (minPoint) {
        annotations.push({
            ts: minPoint.ts,
            label: `Min: ${stats.min}`,
            type: 'min',
            x: minPoint.x,
            y: minPoint.y ?? undefined
        })
    }

    // 找最大值点
    const maxPoint = points.find(p => p.value === stats.max && p.y !== null)
    if (maxPoint && maxPoint !== minPoint) {
        annotations.push({
            ts: maxPoint.ts,
            label: `Max: ${stats.max}`,
            type: 'max',
            x: maxPoint.x,
            y: maxPoint.y ?? undefined
        })
    }

    return annotations
}

// ============================================================================
// Main Builder Function
// ============================================================================

/**
 * 构建统一图表模型
 * 
 * @param metricKey - 指标键
 * @param range - 时间范围
 * @param values - 数据值数组（已按时间排序，与 axis 对齐）
 * @param options - 构建选项
 * @returns ChartModel
 */
export function buildChartModel(
    metricKey: string,
    range: MetricRange,
    values: (number | null)[],
    options: ChartModelOptions = {}
): ChartModel {
    const { width = 100, height = 100, includeAnnotations = false } = options

    // 1. 获取元数据
    const metadata = getMetricMetadata(metricKey)
    const processingConfig = getMetricProcessingConfig(metricKey)
    const rangeConfig = RANGE_CONFIGS[range] || RANGE_CONFIGS.week

    // 2. 生成轴
    const axis = buildAxis(range)

    // 3. 对齐值到轴长度
    const alignedValues = alignValues(values, axis.tickCount, processingConfig.missingPolicy)

    // 4. 计算 Y 域
    const validValues = alignedValues.filter((v): v is number => v !== null)
    const yDomain = getDomain(validValues)

    // 5. 生成点
    const points = buildPoints(alignedValues, axis, yDomain, width, height)

    // 6. 计算统计
    const stats = buildStats(alignedValues)

    // 7. 生成标注
    const annotations = includeAnnotations ? buildAnnotations(points, stats) : undefined

    // 8. 构建语义元数据
    const semantic: ChartSemantic = {
        metricKey,
        range,
        bucket: rangeConfig.bucket,
        unit: metadata?.unit || '',
        displayUnit: metadata?.displayUnit || metadata?.unit || '',
        title: metadata?.title || metricKey,
        domain: processingConfig.domain,
        missingPolicy: processingConfig.missingPolicy
    }

    return {
        axis,
        points,
        stats,
        annotations,
        semantic,
        yDomain
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 对齐值数组到目标长度
 */
function alignValues(
    values: (number | null)[],
    targetLength: number,
    missingPolicy: 'null' | 'zero' | 'carry'
): (number | null)[] {
    const result: (number | null)[] = []

    for (let i = 0; i < targetLength; i++) {
        if (i < values.length) {
            result.push(values[i])
        } else {
            // 超出范围，根据策略填充
            if (missingPolicy === 'zero') {
                result.push(0)
            } else if (missingPolicy === 'carry' && result.length > 0) {
                result.push(result[result.length - 1])
            } else {
                result.push(null)
            }
        }
    }

    return result
}

/**
 * 从原始记录构建 ChartModel
 * 
 * 结合 metricPipeline 使用
 */
export function buildChartModelFromRecords(
    metricKey: string,
    range: MetricRange,
    records: unknown[],
    options: ChartModelOptions = {}
): ChartModel {
    // 这里可以调用 processMetricData，但为了解耦，暂时只接受已处理的值
    // 实际使用时，调用方先调用 processMetricData，再传入 values
    return buildChartModel(metricKey, range, [], options)
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * 获取 SVG polyline points 字符串
 */
export function toPolylinePoints(model: ChartModel): string {
    return model.points
        .filter(p => p.y !== null)
        .map(p => `${p.x},${p.y}`)
        .join(' ')
}

/**
 * 获取 SVG area path 字符串
 */
export function toAreaPath(model: ChartModel, baselineY: number = 100): string {
    const validPoints = model.points.filter(p => p.y !== null)
    if (validPoints.length === 0) return ''

    const linePath = validPoints.map(p => `${p.x},${p.y}`).join(' L')
    const first = validPoints[0]
    const last = validPoints[validPoints.length - 1]

    return `M${first.x},${baselineY} L${linePath} L${last.x},${baselineY} Z`
}

/**
 * 获取 ECharts xAxis data
 */
export function toEChartsXAxisData(model: ChartModel): string[] {
    return model.axis.labels
}

/**
 * 获取 ECharts series data
 */
export function toEChartsSeriesData(model: ChartModel): (number | null)[] {
    return model.points.map(p => p.value)
}
