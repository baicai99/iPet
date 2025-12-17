import { computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { getMetricProcessingConfig } from '@/data/metricMetadata'
import type { MetricMetadata } from '@/data/metricMetadata'
import type { ChartSpec } from '@/types/chart'

/**
 * Type Definitions
 */
type TimeRange = 'day' | 'week' | 'month' | 'six_month' | 'year'

interface TimeAxisResult {
    timestamps: number[]
    labels: string[]
    formatLabel: (ts: number) => string
}

interface SourceData {
    values?: number[]
    timestamps?: number[]
}

interface YAxisRange {
    min: number
    max: number
    interval?: number
}

interface Theme {
    hex: string
    bg: string
}

interface CurrentData {
    values?: number[]
    timestamps?: number[]
    labels?: string[]
}

/**
 * Constants for Time Axis
 */
const ONE_HOUR = 3600 * 1000
const ONE_DAY = 24 * 3600 * 1000

/**
 * Helper: Generate standard time axis based on range
 */
const generateTimeAxis = (range: TimeRange): TimeAxisResult => {
    const now = new Date()
    const timestamps: number[] = []
    const labels: string[] = []
    let formatLabel = (_ts: number): string => ''

    if (range === 'day') {
        // Generate 0-24 hourly points for today (00:00 - 24:00)
        // Display ticks at 0 / 6 / 12 / 18 / 24 (numbers only)
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const startTs = startOfDay.getTime()

        for (let i = 0; i <= 24; i++) {
            const ts = startTs + i * ONE_HOUR
            timestamps.push(ts)
            labels.push(i % 6 === 0 ? String(i) : '')
        }

        formatLabel = (ts: number): string => {
            if (ts === startTs + ONE_DAY) return '24:00'
            const d = new Date(ts)
            return `${String(d.getHours()).padStart(2, '0')}:00`
        }
    } else if (range === 'week') {
        // Fixed Mon-Sun view for current week
        const day = now.getDay() || 7 // 1 (Mon) - 7 (Sun)
        const monday = new Date(now)
        monday.setDate(now.getDate() - day + 1)
        monday.setHours(0, 0, 0, 0)

        const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday.getTime() + i * ONE_DAY)
            timestamps.push(d.getTime())
            labels.push(weekLabels[i])
        }

        formatLabel = (ts: number): string => {
            const d = new Date(ts)
            return `${d.getMonth() + 1}-${d.getDate()}`
        }
    } else if (range === 'month') {
        // Days of current month
        const year = now.getFullYear()
        const month = now.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i, 0, 0, 0, 0)
            timestamps.push(d.getTime())
            // Show label every 6 days: 1 / 7 / 13 / 19 / 25 / ... / last day (numbers only)
            const showLabel = (i - 1) % 6 === 0 || i === daysInMonth
            labels.push(showLabel ? String(i) : '')
        }
        formatLabel = (ts: number): string => {
            const d = new Date(ts)
            return `${d.getMonth() + 1}-${d.getDate()}`
        }
    } else if (range === 'six_month') {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            timestamps.push(d.getTime())
            labels.push(String(d.getMonth() + 1))
        }
        formatLabel = (ts: number): string => {
            const d = new Date(ts)
            return `${d.getFullYear()}-${d.getMonth() + 1}`
        }
    } else if (range === 'year') {
        // Current year: 1-12 month ticks (numbers only)
        const year = now.getFullYear()
        for (let i = 0; i < 12; i++) {
            const d = new Date(year, i, 1)
            timestamps.push(d.getTime())
            labels.push(String(i + 1))
        }
        formatLabel = (ts: number): string => {
            const d = new Date(ts)
            return `${d.getFullYear()}-${d.getMonth() + 1}`
        }
    }

    return { timestamps, labels, formatLabel }
}

/**
 * Helper: Get date format function based on range
 */
export const getDateFormat = (range: TimeRange | string): ((ts: number) => string) => {
    const { formatLabel } = generateTimeAxis(range as TimeRange)
    return formatLabel
}

/**
 * Helper: Align data to the standard axis
 */
const alignSeriesData = (
    sourceData: SourceData,
    axisTimestamps: number[],
    missingPolicy: 'null' | 'zero' | 'carry',
    range: TimeRange
): (number | null)[] => {
    const { values = [], timestamps = [] } = sourceData

    // Create a map of timestamp -> value for quick lookup
    const dataMap = new Map<string, number>()

    values.forEach((val: number, idx: number) => {
        const ts = timestamps[idx]
        if (!ts) return

        const d = new Date(ts)
        let key: string

        if (range === 'day') {
            // Key by YYYY-MM-DD-HH
            key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
        } else if (range === 'six_month' || range === 'year') {
            // Key by YYYY-MM
            key = `${d.getFullYear()}-${d.getMonth()}`
        } else {
            // Key by YYYY-MM-DD (week, month)
            key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        }

        dataMap.set(key, val)
    })

    const alignedValues: (number | null)[] = []
    let lastValidValue: number | null = null  // ✅ Track last valid value for carry

    axisTimestamps.forEach((axisTs: number, axisIdx: number) => {
        if (range === 'day') {
            const startTs = axisTimestamps[0]
            const isEndOfDayTick = axisIdx === axisTimestamps.length - 1 && axisTs === startTs + ONE_DAY
            if (isEndOfDayTick) {
                alignedValues.push(null)
                return
            }
        }

        const d = new Date(axisTs)
        let key: string

        if (range === 'day') {
            key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
        } else if (range === 'six_month' || range === 'year') {
            key = `${d.getFullYear()}-${d.getMonth()}`
        } else {
            key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        }

        if (dataMap.has(key)) {
            const value = dataMap.get(key)!
            alignedValues.push(value)
            lastValidValue = value  // ✅ Update last valid value
        } else {
            // ✅ Missing data handling based on missingPolicy
            if (missingPolicy === 'zero') {
                alignedValues.push(0)
            } else if (missingPolicy === 'carry' && lastValidValue !== null) {
                alignedValues.push(lastValidValue)  // ✅ Use last valid value
            } else {
                alignedValues.push(null)
            }
        }
    })

    return alignedValues
}

/**
 * Helper: Calculate smart Y-axis range with padding
 */
const calculateSmartYAxis = (values: (number | null)[]): YAxisRange => {
    // Filter out nulls and non-finite numbers
    const validValues = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v))

    if (validValues.length === 0) {
        return { min: 0, max: 10, interval: 2 } // Default fallback
    }

    let min = Math.min(...validValues)
    let max = Math.max(...validValues)

    if (min === max) {
        if (min === 0) return { min: 0, max: 10, interval: 2 }
        // Single value case: +/- 20%
        const padding = Math.abs(min) * 0.2
        return {
            min: Math.max(0, min - padding),
            max: max + padding
        }
    }

    const delta = max - min
    const padding = delta * 0.2 // 20% padding

    let niceMin = min - padding
    let niceMax = max + padding

    // Ensure min doesn't go below 0 unless the data actually has negative values (unlikely for health metrics)
    if (min >= 0) {
        niceMin = Math.max(0, niceMin)
    }

    return {
        min: niceMin,
        max: niceMax
    }
}

export function useChartOptions(
    metricMetadata: Ref<MetricMetadata>,
    currentData: Ref<CurrentData>,
    theme: Ref<Theme>,
    activeRange: Ref<TimeRange | string>
) {
    // ✅ Renamed from isChartType to isStandardChart
    const isStandardChart = computed(() => {
        const type = metricMetadata.value.visualization?.type
        return ['trend_line', 'daily_bar'].includes(type || '')
    })

    // ✅ New: Generate ChartSpec instead of echarts options
    const chartSpec = computed((): ChartSpec | null => {
        if (!isStandardChart.value) return null

        const type = metricMetadata.value.visualization?.type
        const range = activeRange.value as TimeRange

        // Metadata-driven processing config
        const metricKey = metricMetadata.value.key || ''
        const processingConfig = getMetricProcessingConfig(metricKey)

        // 1. Generate Time Axis
        const { timestamps: axisTimestamps, labels: axisLabels } = generateTimeAxis(range)

        // 2. Align Data using metadata-driven missingPolicy
        const alignedValues = alignSeriesData(currentData.value, axisTimestamps, processingConfig.missingPolicy, range)

        // 3. Calculate Y-Axis
        const yAxisRange = calculateSmartYAxis(alignedValues)

        // 4. Build ChartSpec
        return {
            type: type === 'trend_line' ? 'area' : 'bar',  // ✅ trend_line → area, daily_bar → bar
            categories: axisLabels,
            series: [{
                name: metricMetadata.value.title || 'Value',
                data: alignedValues,  // ✅ Preserve null values
                areaStyle: type === 'trend_line'
            }],
            min: yAxisRange.min,
            max: yAxisRange.max,
            color: theme.value.hex,
            yAxisName: metricMetadata.value.displayUnit || metricMetadata.value.unit || '',
            animation: false,
            showLegend: false,
            connectNulls: processingConfig.connectAcrossMissing,  // ✅ New field
            missingPolicy: processingConfig.missingPolicy          // ✅ New field
        }
    })

    // ⚠️ DEPRECATED: Keep echartsOptions for backward compatibility
    // This will be removed after migration is complete
    const echartsOptions = computed(() => {
        if (!isStandardChart.value) return {}

        const type = metricMetadata.value.visualization?.type
        const range = activeRange.value as TimeRange
        const metricKey = metricMetadata.value.key || ''
        const processingConfig = getMetricProcessingConfig(metricKey)

        const { timestamps: axisTimestamps, labels: axisLabels, formatLabel } = generateTimeAxis(range)
        const alignedValues = alignSeriesData(currentData.value, axisTimestamps, processingConfig.missingPolicy, range)
        const yAxisRange = calculateSmartYAxis(alignedValues)

        const tooltipFormatter = (params: { dataIndex: number; value: number | null; color: string } | Array<{ dataIndex: number; value: number | null; color: string }>) => {
            const point = Array.isArray(params) ? params[0] : params
            if (!point) return ''

            const index = point.dataIndex
            const ts = axisTimestamps[index]
            const value = point.value

            if (value === null || value === undefined) return ''

            const dateStr = formatLabel(ts)
            const unit = metricMetadata.value.displayUnit || metricMetadata.value.unit || ''

            return `
                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">${dateStr}</div>
                <div style="font-size: 14px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 4px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${point.color};"></span>
                    ${value} <span style="font-size: 12px; font-weight: 400; color: #94a3b8;">${unit}</span>
                </div>
            `
        }

        const commonGrid = {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
        }

        const xAxis = {
            type: 'category',
            data: axisLabels,
            boundaryGap: type === 'daily_bar',
            axisLine: {
                show: true,
                lineStyle: { color: '#e2e8f0' }
            },
            axisTick: { show: false },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 10,
                interval: 0,
            },
            splitLine: {
                show: range === 'day',
                lineStyle: { color: '#f1f5f9' }
            }
        }

        const yAxis = {
            type: 'value',
            min: yAxisRange.min,
            max: yAxisRange.max,
            splitLine: {
                lineStyle: {
                    color: '#f1f5f9',
                    type: 'dashed'
                }
            },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 10,
                formatter: (val: number) => {
                    return `${Math.round(val)}`
                }
            }
        }

        const validDataCount = alignedValues.filter(v => v !== null && v !== undefined).length
        const shouldShowSymbol = validDataCount === 1
        const shouldEnableSampling = validDataCount > 50 && range === 'year'
        const shouldEnableProgressive = validDataCount > 100

        const seriesItem = {
            data: alignedValues,
            type: type === 'trend_line' ? 'line' : 'bar',
            smooth: true,
            connectNulls: processingConfig.connectAcrossMissing,
            symbol: 'circle',
            symbolSize: validDataCount === 1 ? 10 : 6,
            showSymbol: shouldShowSymbol,
            sampling: shouldEnableSampling ? 'lttb' : undefined,
            progressive: shouldEnableProgressive ? 500 : undefined,
            progressiveThreshold: shouldEnableProgressive ? 1000 : undefined,
            itemStyle: {
                color: theme.value.hex,
                borderRadius: type === 'daily_bar' ? [4, 4, 0, 0] : 0
            },
            lineStyle: {
                width: 3,
                color: theme.value.hex
            },
            areaStyle: type === 'trend_line' ? {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0, color: theme.value.hex
                    }, {
                        offset: 1, color: 'rgba(255, 255, 255, 0)'
                    }],
                    global: false
                },
                opacity: 0.2
            } : undefined,
            emphasis: {
                scale: true,
                itemStyle: {
                    borderWidth: 2,
                    borderColor: '#fff',
                    shadowBlur: 4,
                    shadowColor: 'rgba(0,0,0,0.2)'
                }
            }
        }

        return {
            grid: commonGrid,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#f1f5f9',
                borderWidth: 1,
                padding: 0,
                formatter: tooltipFormatter,
                extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 12px;',
                confine: true
            },
            xAxis,
            yAxis,
            series: [seriesItem]
        }
    })

    return {
        isStandardChart,  // ✅ Renamed
        chartSpec,        // ✅ New: ChartSpec output
        echartsOptions    // ⚠️ Deprecated: Keep for backward compatibility, will be removed
    }
}
