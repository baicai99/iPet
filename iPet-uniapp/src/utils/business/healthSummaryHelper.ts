import { getMetricMetadata } from '@/data/metricMetadata'
import { parseTimestamp, sortRecordsByTime, buildChartData } from '@/utils/business/healthDataHelper'

export const average = (values: number[] = []): number => {
    const numericValues = values.filter(
        value => typeof value === 'number' && !Number.isNaN(value)
    )
    if (!numericValues.length) return 0
    const total = numericValues.reduce((sum, value) => sum + value, 0)
    return Number((total / numericValues.length).toFixed(1))
}

export const processPinnedMetrics = (backendMetrics: any[] = []) => {
    if (!Array.isArray(backendMetrics)) return []

    return backendMetrics
        .map(item => {
            const metadata = getMetricMetadata(item.key) as any
            if (!metadata) return null

            const latest = item.latestRecord
            const visualizationType = metadata.visualization?.type || 'trend_line'
            const hasLatestValue = latest && typeof latest.value === 'number'
            const latestNumericValue = hasLatestValue ? Number(latest.value) : 0
            const latestValue = hasLatestValue ? Number(latestNumericValue.toFixed(2)) : undefined
            const baseUnit = metadata.unit || ''

            return {
                key: item.key,
                title: metadata.title,
                subtitle: metadata.description || '',
                date: parseTimestamp(latest) ? new Date(parseTimestamp(latest)).toISOString() : null,
                value: hasLatestValue ? latestValue : '--',
                numericValue: hasLatestValue ? latestValue : null,
                unit: metadata.displayUnit || metadata.unit || '',
                baseUnit,
                color: metadata.category,
                chartType: visualizationType,
                chartData: buildChartData(visualizationType, item.history || [], 7),
                chartOptions: metadata.visualization?.options || {},
                trend: item.trend,
                trendValue: item.trendValue
            }
        })
        .filter(Boolean)
}

export const processTrendMetrics = (backendTrends: any[] = []) => {
    if (!Array.isArray(backendTrends)) return []

    return backendTrends
        .map(item => {
            const metadata = getMetricMetadata(item.key) as any
            if (!metadata) return null

            const series = item.records || []
            if (!series.length) return null

            const midpoint = Math.max(1, Math.floor(series.length / 2))
            const sortedSeries = sortRecordsByTime(series, 'asc')

            const previousRecords = sortedSeries
                .slice(0, midpoint)
                .map((r: any) => ({ value: Number(r.value) }))
            const recentRecords = sortedSeries
                .slice(midpoint)
                .map((r: any) => ({ value: Number(r.value) }))

            const prevAvg = average(previousRecords.map((item: any) => item.value))
            const recentAvg = average(recentRecords.map((item: any) => item.value))
            const change = Number((recentAvg - prevAvg).toFixed(1))
            const hasChange = Math.abs(change) >= 0.5
            const insights = metadata.trendInsights || {}

            let changeText = insights.stable || `${metadata.title}保持稳定`
            if (hasChange) {
                changeText =
                    change > 0
                        ? insights.up || `${metadata.title}呈上升趋势`
                        : insights.down || `${metadata.title}呈下降趋势`
            }

            const baseUnit = metadata.unit || ''
            const displayUnit = metadata.displayUnit || metadata.unit || ''
            const unitLabel = displayUnit ? `${displayUnit}/天` : '值/天'

            return {
                key: item.key,
                title: metadata.title,
                unitLabel,
                changeText,
                hasChange,
                baseUnit,
                previousRecords,
                recentRecords
            }
        })
        .filter(Boolean)
}
