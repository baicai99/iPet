/**
 * Metric Handlers - Mock API handlers for health metrics
 * 
 * Uses the generator system to produce realistic 2-year data:
 * - High-frequency metrics (meal, water, walk): 2-3x daily
 * - Low-frequency metrics (bathing, vaccine): monthly intervals
 * - Chaos engineering for edge case testing
 */

import { RequestConfig } from '@/utils/common/request'
import {
    HIGH_FREQ_METRICS,
    LOW_FREQ_METRICS,
    generateHighFreqDataForMetric,
    generateLowFreqDataForMetric,
    injectChaos,
    getChaosConfig,
    randomInRange,
    generateId
} from '../generators'
import type { HealthRecord } from '@shared/types/health'

// Default pet ID for mock data
const DEFAULT_PET_ID = 'mock_pet_001'

/**
 * Data cache to avoid regenerating on each request
 * Uses lazy initialization - data is generated on first access
 */
interface DataCache {
    history: Record<string, HealthRecord[]>
    series: Record<string, any>
    initialized: Set<string>
}

const CACHE: DataCache = {
    history: {},
    series: {},
    initialized: new Set()
}

/**
 * Initialize data for a metric if not already done
 */
function ensureMetricData(key: string, petId: string = DEFAULT_PET_ID): HealthRecord[] {
    const cacheKey = `${key}_${petId}`

    if (CACHE.initialized.has(cacheKey)) {
        return CACHE.history[cacheKey] || []
    }

    let records: HealthRecord[] = []

    if (HIGH_FREQ_METRICS.includes(key)) {
        records = generateHighFreqDataForMetric(key, petId)
    } else if (LOW_FREQ_METRICS.includes(key)) {
        records = generateLowFreqDataForMetric(key, petId)
    } else {
        // Fallback for other numeric metrics (generate simple 2-year data)
        records = generateFallbackData(key, petId)
    }

    // Apply chaos engineering
    const chaosConfig = getChaosConfig()
    records = injectChaos(records, chaosConfig)

    CACHE.history[cacheKey] = records
    CACHE.initialized.add(cacheKey)

    console.log(`[Mock] Generated ${records.length} records for ${key}`)

    return records
}

/**
 * Fallback data generator for metrics not in high/low freq lists
 */
function generateFallbackData(key: string, petId: string): HealthRecord[] {
    const records: HealthRecord[] = []
    const now = new Date()

    // Value ranges for different metrics
    const ranges: Record<string, { min: number; max: number; unit: string; decimals: number }> = {
        weight: { min: 5, max: 40, unit: 'kg', decimals: 1 },
        body_temp: { min: 38, max: 39.5, unit: '°C', decimals: 1 },
        shoulder_height: { min: 30, max: 60, unit: 'cm', decimals: 0 },
        body_fat: { min: 10, max: 30, unit: 'percent', decimals: 1 },
        stool: { min: 20, max: 90, unit: 'score', decimals: 0 },
        anxiety: { min: 0, max: 10, unit: 'score', decimals: 0 },
        depression: { min: 0, max: 10, unit: 'score', decimals: 0 },
        vomiting: { min: 0, max: 3, unit: 'count', decimals: 0 }
    }

    const config = ranges[key] || { min: 0, max: 100, unit: '', decimals: 0 }

    // Generate one record per week for 2 years = ~104 records
    for (let i = 0; i < 104; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i * 7)
        date.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)

        records.push({
            id: generateId(),
            petId,
            type: key,
            value: randomInRange(config.min, config.max, config.decimals),
            unit: config.unit,
            date: date.toISOString().split('T')[0],
            updatedAt: date.getTime(),
            status: 'synced',
            source: 'mock'
        })
    }

    return records.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Generate time series data for charts
 */
function generateSeries(key: string, granularity: string): { series: any[]; stats: any } {
    const history = ensureMetricData(key)

    // Time range configurations
    const configs: Record<string, { days: number; groupBy: string; labelFn: (d: Date) => string }> = {
        day: { days: 1, groupBy: 'hour', labelFn: d => `${String(d.getHours()).padStart(2, '0')}:00` },
        week: { days: 7, groupBy: 'day', labelFn: d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()] },
        month: { days: 30, groupBy: 'day', labelFn: d => `${d.getDate()}日` },
        six_month: { days: 180, groupBy: 'month', labelFn: d => `${d.getMonth() + 1}月` },
        year: { days: 365, groupBy: 'month', labelFn: d => `${d.getMonth() + 1}月` }
    }

    const config = configs[granularity] || configs.week
    const cutoff = Date.now() - config.days * 24 * 60 * 60 * 1000

    // Filter records within time range
    const relevantRecords = history.filter(r => r.updatedAt >= cutoff)

    // Group by time period
    const groups = new Map<string, number[]>()

    for (const record of relevantRecords) {
        const date = new Date(record.updatedAt)
        const label = config.labelFn(date)

        if (!groups.has(label)) {
            groups.set(label, [])
        }
        groups.get(label)!.push(record.value)
    }

    // Calculate aggregates
    const series: { label: string; value: number }[] = []

    for (const [label, values] of groups) {
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = values.length > 0 ? sum / values.length : 0
        series.push({ label, value: Math.round(avg) })
    }

    // Calculate stats
    const allValues = series.map(s => s.value)
    const stats = allValues.length > 0 ? {
        avg: Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length),
        min: Math.min(...allValues),
        max: Math.max(...allValues)
    } : { avg: 0, min: 0, max: 0 }

    return { series, stats }
}

/**
 * Format history records for UI display
 * Handles different metric types appropriately
 */
function formatHistoryForUI(key: string, records: HealthRecord[]): any[] {
    // Task-type metrics (bathing, deworming, vaccine, tooth_brushing)
    if (LOW_FREQ_METRICS.includes(key)) {
        return records.map(r => {
            const date = new Date(r.updatedAt)
            const isScheduled = r.metadata?.isScheduled || r.status === 'pending'

            return {
                id: r.id,
                title: isScheduled ? '下一次计划' : (r.label || r.metadata?.eventType || '记录'),
                time: `${date.getMonth() + 1}月${date.getDate()}日`,
                timestamp: r.updatedAt,
                isScheduled,
                metadata: r.metadata
            }
        })
    }

    // Text-type metrics (stool, anxiety, depression, vomiting)
    if (['stool', 'anxiety', 'depression', 'vomiting'].includes(key)) {
        return records.slice(0, 30).map(r => {
            const date = new Date(r.updatedAt)
            return {
                value: r.value,
                label: r.label,
                emoji: r.emoji,
                timestamp: r.updatedAt,
                time: `${date.getMonth() + 1}月${date.getDate()}日`
            }
        })
    }

    // Default numeric format
    return records.slice(0, 100).map(r => ({
        id: r.id,
        value: r.value,
        unit: r.unit,
        timestamp: r.updatedAt,
        date: r.date
    }))
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * GET /metrics/:key/history
 * Returns historical records for a metric
 */
export const getMetricHistoryMock = (config: RequestConfig) => {
    const match = config.url.match(/\/metrics\/([^/]+)\/history/)
    const key = match ? match[1] : ''

    if (!key) {
        return { error: 'Invalid metric key' }
    }

    const records = ensureMetricData(key)
    return formatHistoryForUI(key, records)
}

/**
 * GET /metrics/:key/series
 * Returns time series data for charts
 */
export const getMetricSeriesMock = (config: RequestConfig) => {
    const match = config.url.match(/\/metrics\/([^/]+)\/series/)
    const key = match ? match[1] : ''
    const granularity = (config.data as any)?.granularity || 'day'

    const cacheKey = `${key}_${granularity}`

    if (CACHE.series[cacheKey]) {
        return CACHE.series[cacheKey]
    }

    const data = generateSeries(key, granularity)
    CACHE.series[cacheKey] = data

    return data
}

/**
 * Clear all cached data (useful for testing)
 */
export const clearMockCache = () => {
    CACHE.history = {}
    CACHE.series = {}
    CACHE.initialized.clear()
    console.log('[Mock] Cache cleared')
}

/**
 * GET /health
 * Returns all health records for a pet, optionally filtered by metric type
 * This is the main endpoint used by healthStore to fetch data
 */
export const getHealthRecordsMock = (config: RequestConfig) => {
    // Extract params from URL query string or request data
    const urlParams = new URLSearchParams(config.url.split('?')[1] || '')
    const data = typeof config.data === 'object' && config.data !== null ? config.data as Record<string, any> : {}
    const metricKey = urlParams.get('type') || urlParams.get('metricKey') || data.type || data.metricKey
    const petId = urlParams.get('petId') || data.petId || DEFAULT_PET_ID

    console.log('[Mock] getHealthRecordsMock called with:', { metricKey, petId })

    // If specific metric type requested, return only that type
    if (metricKey) {
        return ensureMetricData(metricKey, petId)
    }

    // Otherwise return records for all metric types
    // For summary page, we need data from multiple metrics
    const allMetrics = [
        ...HIGH_FREQ_METRICS,
        ...LOW_FREQ_METRICS,
        'weight', 'body_temp', 'shoulder_height'
    ]

    const allRecords: HealthRecord[] = []

    for (const key of allMetrics) {
        try {
            const records = ensureMetricData(key, petId)
            allRecords.push(...records)
        } catch (e) {
            // Skip metrics that fail to generate
        }
    }

    // Sort by timestamp descending
    allRecords.sort((a, b) => b.updatedAt - a.updatedAt)

    console.log(`[Mock] Returning ${allRecords.length} total health records`)

    return allRecords
}

/**
 * POST /health
 * Creates a new health record
 */
export const createHealthRecordMock = (config: RequestConfig) => {
    const data = (typeof config.data === 'object' && config.data !== null ? config.data : {}) as Record<string, any>
    const petId = data.petId || DEFAULT_PET_ID

    const newRecord: HealthRecord = {
        id: generateId(),
        petId,
        type: data.type || 'unknown',
        value: data.value || 0,
        unit: data.unit || '',
        date: data.date || new Date().toISOString().split('T')[0],
        updatedAt: Date.now(),
        status: 'synced',
        source: 'mock',
        notes: data.notes,
        label: data.label,
        metadata: data.metadata
    }

    // Add to cache if exists
    const cacheKey = `${newRecord.type}_${petId}`
    if (CACHE.history[cacheKey]) {
        CACHE.history[cacheKey].unshift(newRecord)
    }

    console.log('[Mock] Created health record:', newRecord.id, newRecord.type)

    return newRecord
}

/**
 * GET /health/summary
 * Returns summary data for the dashboard including pinned metrics, trends, and tasks
 */
export const getHealthSummaryMock = (config: RequestConfig) => {
    // Extract params from URL query string or request data
    const urlParams = new URLSearchParams(config.url.split('?')[1] || '')
    const data = typeof config.data === 'object' && config.data !== null ? config.data as Record<string, any> : {}
    const petId = urlParams.get('petId') || data.petId || DEFAULT_PET_ID

    console.log('[Mock] getHealthSummaryMock called for petId:', petId)

    // Generate pinned metrics from recent data
    const pinnedKeys = ['meal', 'water', 'weight', 'walk_duration']
    const pinnedMetrics = pinnedKeys.map(key => {
        const records = ensureMetricData(key, petId)
        const latestRecord = records[0]

        // Get last 7 records for chart
        const chartData = records.slice(0, 7).reverse().map(r => r.value)

        return {
            key,
            title: key === 'meal' ? '今日饭量' :
                key === 'water' ? '今日喝水' :
                    key === 'weight' ? '体重' :
                        key === 'walk_duration' ? '步行时长' : key,
            subtitle: '',
            unit: latestRecord?.unit || '',
            baseUnit: latestRecord?.unit || '',
            color: 'emerald',
            chartType: 'trend_line',
            value: latestRecord?.value || 0,
            numericValue: latestRecord?.value || 0,
            date: latestRecord?.date || new Date().toISOString(),
            chartData
        }
    })

    // Generate trends data (last 2 weeks split into previous/recent)
    const trendKeys = ['meal', 'water', 'walk_duration']
    const trends = trendKeys.map(key => {
        const records = ensureMetricData(key, petId)
        const recent = records.slice(0, 7).map(r => ({ value: r.value, date: r.date }))
        const previous = records.slice(7, 14).map(r => ({ value: r.value, date: r.date }))

        return {
            key,
            title: key === 'meal' ? '饭量' :
                key === 'water' ? '饮水' :
                    key === 'walk_duration' ? '运动' : key,
            baseUnit: records[0]?.unit || '',
            unitLabel: records[0]?.unit || '',
            previousRecords: previous,
            recentRecords: recent
        }
    })

    // Generate daily summaries
    const dailySummaries: Record<string, number> = {}
    for (const key of ['meal', 'water', 'walk_duration']) {
        const records = ensureMetricData(key, petId)
        const today = new Date().toISOString().split('T')[0]
        const todayRecords = records.filter(r => r.date === today)
        dailySummaries[key] = todayRecords.reduce((sum, r) => sum + (r.value || 0), 0)
    }

    const result = {
        tasks: [],
        pinnedMetrics,
        trends,
        dailySummaries
    }

    console.log('[Mock] Returning summary with', pinnedMetrics.length, 'pinned metrics')

    return result
}
