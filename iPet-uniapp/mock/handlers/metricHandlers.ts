import { RequestConfig, defineMock } from '../types/common'
import type { HealthRecord } from '@/types/health'
import { SeededRandom } from '../utils/random'
import { getMockStorage } from '../utils/mockStorage'
import { pets } from '../pet.js'
import {
    generateHighFreqDataForMetric,
    generateLowFreqDataForMetric,
    HIGH_FREQ_METRICS,
    LOW_FREQ_METRICS,
    injectChaos
} from '../generators'

const STORAGE_KEYS = {
    HISTORY: 'mock_metric_history',
    SERIES: 'mock_metric_series',
    LATEST: 'mock_metric_latest',
    HEALTH_RECORDS: 'mock_health_records'
}

const getStorage = () => getMockStorage()

const getFromCache = (type: string, key: string) => {
    const store = getStorage().get(type) || {}
    return store[key]
}

const setToCache = (type: string, key: string, value: any) => {
    const storage = getStorage()
    const store = storage.get(type) || {}
    store[key] = value
    storage.set(type, store)
}

/**
 * Clone a single health record (deep copy metadata)
 */
const cloneRecord = (record: HealthRecord): HealthRecord => ({
    ...record,
    metadata: record.metadata ? { ...record.metadata } : undefined
})

/**
 * Clone an array of health records
 */
const cloneRecords = (records: HealthRecord[]): HealthRecord[] => records.map(cloneRecord)

/**
 * Sort records by updatedAt descending (newest first)
 */
const sortRecordsDesc = (records: HealthRecord[]): HealthRecord[] => {
    return [...records].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

/**
 * Save health records to storage
 */
const saveHealthRecords = (records: HealthRecord[]): HealthRecord[] => {
    const sorted = sortRecordsDesc(records)
    getStorage().set(STORAGE_KEYS.HEALTH_RECORDS, sorted)
    return sorted
}

/**
 * Generate mock health records using unified generators
 * Covers 2-year time span with realistic data distribution
 */
const seedHealthRecords = (): HealthRecord[] => {
    const petId = pets[0]?.id || 'mock_pet_001'
    let records: HealthRecord[] = []

    console.log('[Mock] Generating 2-year health records using generators...')

    // Generate high-frequency data (daily metrics)
    HIGH_FREQ_METRICS.forEach(metric => {
        try {
            const metricRecords = generateHighFreqDataForMetric(metric, petId)
            records.push(...metricRecords)
            console.log(`[Mock] Generated ${metricRecords.length} records for ${metric}`)
        } catch (e) {
            console.warn(`[Mock] Skipped unknown high-freq metric: ${metric}`)
        }
    })

    // Generate low-frequency data (periodic events & body measurements)
    LOW_FREQ_METRICS.forEach(metric => {
        try {
            const metricRecords = generateLowFreqDataForMetric(metric, petId)
            records.push(...metricRecords)
            console.log(`[Mock] Generated ${metricRecords.length} records for ${metric}`)
        } catch (e) {
            console.warn(`[Mock] Skipped unknown low-freq metric: ${metric}`)
        }
    })

    // Apply chaos injection (1% outliers, 2% data voids, 0.5% null fields)
    const beforeChaos = records.length
    records = injectChaos(records)
    console.log(`[Mock] Applied chaos injection: ${beforeChaos} -> ${records.length} records`)

    // Sort by timestamp descending
    records.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

    console.log(`[Mock] Total generated: ${records.length} records covering ${new Set(records.map(r => r.type)).size} metrics`)

    return saveHealthRecords(records)
}

const roundValue = (value: number, precision: number = 0): number => {
    return Number(value.toFixed(precision))
}

const resolveTimestamp = (input?: string | number | Date): number => {
    if (!input) return Date.now()
    if (typeof input === 'number') return input
    if (input instanceof Date) return input.getTime()
    const parsed = new Date(input).getTime()
    return Number.isNaN(parsed) ? Date.now() : parsed
}

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

const getStartOfWeek = (date: Date) => {
    const result = new Date(date)
    const day = result.getDay() || 7
    result.setDate(result.getDate() - day + 1)
    result.setHours(0, 0, 0, 0)
    return result
}

const getMockTimestamp = (
    granularity: string,
    index: number,
    total: number,
    now: Date,
    dayStart: Date,
    weekStart: Date
) => {
    if (granularity === 'day') {
        return dayStart.getTime() + index * ONE_HOUR
    }
    if (granularity === 'week') {
        return weekStart.getTime() + index * ONE_DAY
    }
    if (granularity === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), index + 1, 0, 0, 0, 0).getTime()
    }
    if (granularity === 'six_month' || granularity === 'year') {
        const monthOffset = total - 1 - index
        return new Date(now.getFullYear(), now.getMonth() - monthOffset, 1, 0, 0, 0, 0).getTime()
    }
    return weekStart.getTime() + index * ONE_DAY
}

const getHealthRecordsFromStorage = (): HealthRecord[] => {
    const stored = getStorage().get(STORAGE_KEYS.HEALTH_RECORDS)
    if (Array.isArray(stored) && stored.length > 0) {
        return stored
    }
    return seedHealthRecords()
}

const upsertHealthRecord = (record: HealthRecord, records: HealthRecord[]): HealthRecord[] => {
    const index = records.findIndex(item => item.id === record.id)
    if (index === -1) {
        records.unshift(record)
    } else {
        records[index] = record
    }
    return saveHealthRecords(records)
}

const removeHealthRecord = (id: string, records: HealthRecord[]): HealthRecord[] => {
    const index = records.findIndex(item => item.id === id)
    if (index !== -1) {
        records.splice(index, 1)
    }
    return saveHealthRecords(records)
}

const getConsistentLatestValue = (key: string, min: number, max: number): number => {
    const cached = getFromCache(STORAGE_KEYS.LATEST, key)
    if (cached !== undefined) {
        return cached
    }

    const rng = new SeededRandom(`latest_${key}`)
    const value = Number(rng.float(min, max).toFixed(1))

    setToCache(STORAGE_KEYS.LATEST, key, value)
    return value
}

const createRelativeMonthLabel = (index: number, total: number): string => {
    const date = new Date()
    date.setMonth(date.getMonth() - (total - 1 - index))
    return `${date.getMonth() + 1}月`
}

const generateMockSeries = (key: string, granularity: string) => {
    const configs: Record<string, any> = {
        day: { points: 24, label: (i: number) => `${String(i).padStart(2, '0')}:00`, variance: 8 },
        week: {
            points: 7,
            label: (i: number) => ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
            variance: 5
        },
        month: { points: 30, label: (i: number) => `${i + 1}日`, variance: 6 },
        six_month: {
            points: 6,
            label: (_: any, index: number, total: number) => createRelativeMonthLabel(index, total),
            variance: 7
        },
        year: {
            points: 12,
            label: (_: any, index: number, total: number) => createRelativeMonthLabel(index, total),
            variance: 10
        }
    }

    const config = configs[granularity] || configs.week

    let min = 0, max = 100
    switch (key) {
        case 'meal': min = 150; max = 400; break;
        case 'weight': min = 5; max = 40; break;
        case 'water': min = 200; max = 800; break;
        case 'walk_duration': min = 15; max = 90; break;
        case 'body_temp': min = 38; max = 39.5; break;
        default: min = 0; max = 100;
    }

    const latestVal = getConsistentLatestValue(key, min, max)
    const base = (min + max) / 2
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const weekStart = getStartOfWeek(now)
    const totalPoints = config.points

    // Seed includes key, granularity, and today's date (bucket by day) to ensure stability for the day
    const dateBucket = new Date().toISOString().slice(0, 10)
    const rng = new SeededRandom(`${key}_${granularity}_${dateBucket}`)

    const series = Array.from({ length: totalPoints }, (_, index) => {
        const pointTimestamp = getMockTimestamp(granularity, index, totalPoints, now, dayStart, weekStart)
        if (index === totalPoints - 1) {
            return {
                label: config.label(index, totalPoints),
                value: latestVal,
                timestamp: pointTimestamp,
                date: new Date(pointTimestamp).toISOString()
            }
        }

        const trend = Math.sin(index / totalPoints * Math.PI) * 5
        // Use RNG for variance
        const randomFactor = rng.float(-0.5, 0.5)
        const value = Math.round(base + trend + randomFactor * config.variance * 2)

        return {
            label: config.label(index, totalPoints),
            value: Math.max(min, Math.min(max, value)),
            timestamp: pointTimestamp,
            date: new Date(pointTimestamp).toISOString()
        }
    })

    const values = series.map(item => item.value)
    const stats = {
        avg: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
        min: Math.min(...values),
        max: Math.max(...values)
    }

    return { series, stats }
}

export const getMetricHistoryMock = defineMock({
    url: '/metrics/:id/history',
    method: 'GET',
    handler: (config: RequestConfig) => {
        const match = config.url.match(/\/metrics\/([^/]+)\/history/)
        const key = match ? match[1] : ''

        const cached = getFromCache(STORAGE_KEYS.HISTORY, key)
        if (cached) {
            console.log(`[Mock] History cache hit for ${key}`)
            return cached
        }

        console.log(`[Mock] Generating history for ${key}`)
        // Seed for history generation
        const dateBucket = new Date().toISOString().slice(0, 10)
        const rng = new SeededRandom(`history_${key}_${dateBucket}`)

        let result: any[] = []

        if (['bathing', 'tooth_brushing', 'deworming', 'rabies_vaccine'].includes(key)) {
            const events: any[] = []
            const titles: Record<string, string[]> = {
                bathing: ['洗澡 & 护理', '简单清洁'],
                tooth_brushing: ['全口刷牙', '涂抹凝胶'],
                deworming: ['体内驱虫', '体外驱虫'],
                rabies_vaccine: ['狂犬疫苗接种', '多联疫苗（基础病）加强']
            }
            const futureOffsets: Record<string, number> = {
                bathing: 3 * 24 * 60 * 60 * 1000,
                tooth_brushing: 5 * 60 * 60 * 1000,
                deworming: 15 * 24 * 60 * 60 * 1000,
                rabies_vaccine: 18 * 30 * 24 * 60 * 60 * 1000
            }

            const futureDate = new Date(Date.now() + (futureOffsets[key] || 24 * 60 * 60 * 1000))
            events.push({
                title: '下一次计划',
                time: `${futureDate.getMonth() + 1}月${futureDate.getDate()}日`,
                timestamp: futureDate.getTime()
            })

            const count = 3
            for (let i = 0; i < count; i++) {
                const date = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
                const titleOptions = titles[key] || ['记录']
                // Deterministic choice
                const titleIndex = rng.int(0, titleOptions.length - 1)

                events.push({
                    title: titleOptions[titleIndex > 0 && i % 2 === 0 ? 0 : titleIndex],
                    time: `${date.getMonth() + 1}月${date.getDate()}日`,
                    timestamp: date.getTime()
                })
            }
            result = events
        }
        else if (key === 'vomiting') {
            const descriptions = ['白色粘液伴随头发', '未消化食物', '黄色胆汁', '草叶']
            const events = []
            for (let i = 0; i < 5; i++) {
                const date = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000)
                events.push({
                    value: rng.choice(descriptions),
                    timestamp: date.getTime()
                })
            }
            result = events
        }
        else if (key === 'stool') {
            // Deterministic scores
            const scores = Array.from({ length: 7 }, () => rng.int(10, 95))
            const events = []
            for (let i = 0; i < scores.length; i++) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                let label = '正常'
                const score = scores[i]
                if (score < 30) label = '干硬'
                else if (score > 70) label = '软便'

                events.push({
                    value: score,
                    label: label,
                    timestamp: date.getTime()
                })
            }
            result = events
        }
        else if (key === 'anxiety') {
            const levels = [
                { label: '疑似轻度焦虑', emoji: '😟' },
                { label: '中度焦虑', emoji: '😰' },
                { label: '重度焦虑', emoji: '😱' },
                { label: '无焦虑', emoji: '😌' }
            ]
            const events = []
            for (let i = 0; i < 5; i++) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                const level = rng.choice(levels)
                events.push({
                    value: level.label,
                    emoji: level.emoji,
                    timestamp: date.getTime()
                })
            }
            result = events
        }
        else if (key === 'depression') {
            const levels = [
                { label: '疑似轻度抑郁', emoji: '😢' },
                { label: '中度抑郁', emoji: '😭' },
                { label: '重度抑郁', emoji: '🌫️' },
                { label: '心情愉悦', emoji: '😊' }
            ]
            const events = []
            for (let i = 0; i < 5; i++) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                const level = rng.choice(levels)
                events.push({
                    value: level.label,
                    emoji: level.emoji,
                    timestamp: date.getTime()
                })
            }
            result = events
        }
        else {
            let min = 0, max = 100
            switch (key) {
                case 'meal': min = 150; max = 400; break;
                case 'weight': min = 5; max = 40; break;
                case 'water': min = 200; max = 800; break;
                case 'walk_duration': min = 15; max = 90; break;
                case 'body_temp': min = 38; max = 39.5; break;
                default: min = 0; max = 100;
            }

            const latestVal = getConsistentLatestValue(key, min, max)

            const history = Array.from({ length: 10 }, (_, i) => {
                if (i === 0) {
                    return {
                        timestamp: new Date(Date.now()).getTime(),
                        value: latestVal
                    }
                }
                return {
                    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).getTime(),
                    value: Number(rng.float(min, max).toFixed(1))
                }
            })
            result = history
        }

        setToCache(STORAGE_KEYS.HISTORY, key, result)
        return result
    }
})

export const getMetricSeriesMock = defineMock({
    url: '/metrics/:id/series',
    method: 'GET',
    handler: (config: RequestConfig) => {
        const match = config.url.match(/\/metrics\/([^/]+)\/series/)
        const key = match ? match[1] : ''
        const requestData = (config.data || {}) as Record<string, any>
        const granularity = requestData.granularity || requestData.bucket || 'day'

        const cacheKey = `${key}_${granularity}`
        const cached = getFromCache(STORAGE_KEYS.SERIES, cacheKey)
        if (cached) {
            return cached
        }

        const data = generateMockSeries(key, granularity)
        setToCache(STORAGE_KEYS.SERIES, cacheKey, data)
        return data
    }
})

export const getHealthRecordsMock = defineMock({
    url: '/health',
    method: 'GET',
    handler: (config: RequestConfig) => {
        const params = (config.data || {}) as {
            petId?: string
            page?: number
            limit?: number
            type?: string
        }

        let records = sortRecordsDesc(getHealthRecordsFromStorage()).filter(record => !record.deleted)

        if (params.petId) {
            records = records.filter(record => String(record.petId) === String(params.petId))
        }
        if (params.type) {
            records = records.filter(record => record.type === params.type)
        }

        const page = Number(params?.page) > 0 ? Number(params.page) : 1
        const limit = Number(params?.limit) > 0 ? Number(params.limit) : records.length
        const start = (page - 1) * limit
        const end = start + limit

        return cloneRecords(records.slice(start, end))
    }
})

export const createHealthRecordMock = defineMock({
    url: '/health',
    method: 'POST',
    handler: (config: RequestConfig) => {
        const payload = (config.data || {}) as Partial<HealthRecord>
        const timestamp = resolveTimestamp(payload.metadata?.targetDate || payload.date || payload.updatedAt)
        const petId = String(payload.petId || (pets[0]?.id ?? 'mock_pet_001'))

        const record: HealthRecord = {
            id: payload.id || `health_${petId}_${timestamp}`,
            petId,
            type: payload.type || 'custom',
            value: Number(payload.value ?? 0),
            unit: payload.unit || '',
            updatedAt: timestamp,
            date: new Date(timestamp).toISOString(),
            notes: payload.notes ?? null,
            source: payload.source || (payload.metadata?.isScheduled ? 'schedule' : 'manual'),
            status: payload.status || 'synced',
            label: payload.label,
            emoji: payload.emoji,
            gridValue: payload.gridValue ?? null,
            metadata: payload.metadata ? { ...payload.metadata } : {}
        }

        const stored = getHealthRecordsFromStorage()
        upsertHealthRecord(record, stored)

        return cloneRecord(record)
    }
})

export const updateHealthRecordMock = defineMock({
    url: '/health/:id',
    method: 'PATCH',
    handler: (config: RequestConfig) => {
        const match = config.url.match(/\/health\/([^/]+)/)
        const recordId = match ? match[1] : null

        if (!recordId) {
            throw new Error('Invalid record id')
        }

        const payload = (config.data || {}) as Partial<HealthRecord>
        const stored = getHealthRecordsFromStorage()
        const index = stored.findIndex(record => record.id === recordId)

        if (index === -1) {
            throw new Error('Record not found')
        }

        const timestamp = resolveTimestamp(payload.metadata?.targetDate || payload.date || payload.updatedAt)
        const shouldSyncDate = Boolean(payload.date || payload.metadata?.targetDate || payload.updatedAt)
        const isoDate = new Date(timestamp).toISOString()
        const merged: HealthRecord = {
            ...stored[index],
            ...payload,
            updatedAt: timestamp,
            date: shouldSyncDate ? isoDate : stored[index].date,
            metadata: payload.metadata
                ? { ...(stored[index].metadata || {}), ...payload.metadata }
                : stored[index].metadata
        }

        stored[index] = merged
        saveHealthRecords(stored)

        return cloneRecord(merged)
    }
})

export const deleteHealthRecordMock = defineMock({
    url: '/health/:id',
    method: 'DELETE',
    handler: (config: RequestConfig) => {
        const match = config.url.match(/\/health\/([^/]+)/)
        const recordId = match ? match[1] : null

        if (!recordId) {
            throw new Error('Invalid record id')
        }

        const stored = getHealthRecordsFromStorage()
        removeHealthRecord(recordId, stored)
        return { success: true }
    }
})

export const getHealthSummaryMock = defineMock({
    url: '/health/summary',
    method: 'GET',
    handler: (config: RequestConfig) => {
        const params = (config.data || {}) as { petId?: string }
        const petId = params.petId || pets[0]?.id || 'mock_pet_001'
        const rng = new SeededRandom(`health_summary_${petId}`)

        // Get all health records for comprehensive summary
        const allRecords = getHealthRecordsFromStorage().filter(
            record => String(record.petId) === String(petId) && !record.deleted
        )

        // Generate pinned metrics (default: weight, meal, water)
        const pinnedMetricKeys = ['weight', 'meal', 'water', 'walk_duration']
        const pinnedMetrics = pinnedMetricKeys.map(key => {
            const metricRecords = allRecords
                .filter(r => r.type === key)
                .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

            const latestRecord = metricRecords[0] || null
            const history = metricRecords.slice(0, 7) // Last 7 records

            return {
                key,
                latestRecord,
                history,
                trend: rng.choice(['up', 'down', 'stable']),
                trendValue: rng.float(-5, 5).toFixed(1)
            }
        })

        // Generate trends (metrics with significant changes)
        const trendMetricKeys = ['weight', 'meal']
        const trends = trendMetricKeys.map(key => {
            const metricRecords = allRecords
                .filter(r => r.type === key)
                .slice(0, 30) // Last 30 records

            return {
                key,
                records: metricRecords
            }
        })

        // Generate tasks (upcoming scheduled events)
        const tasks = [
            {
                id: 'task_1',
                type: 'deworming',
                title: '体内驱虫',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
            },
            {
                id: 'task_2',
                type: 'bathing',
                title: '洗澡美容',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
            }
        ]

        // Generate daily summaries (aggregated daily data)
        const dailySummaries: Record<string, any> = {}
        const today = new Date()
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateKey = date.toISOString().split('T')[0]

            dailySummaries[dateKey] = {
                meal: rng.float(250, 350).toFixed(1),
                water: rng.float(400, 600).toFixed(1),
                weight: rng.float(8, 12).toFixed(1)
            }
        }

        return {
            tasks,
            pinnedMetrics,
            trends,
            dailySummaries
        }
    }
})

/**
 * ✅ NEW: Mock handler for /health/series API
 * Matches backend aggregation endpoint format
 */
export const getHealthSeriesMock = defineMock({
    url: '/health/series',
    method: 'GET',
    handler: (config: RequestConfig) => {
        const params = (config.data || {}) as {
            petId?: string
            metricKey?: string
            range?: string
            bucket?: string
        }

        const metricKey = params.metricKey || 'weight'
        const range = params.range || 'week'
        const bucket = params.bucket || 'none'

        console.log(`[Mock] Generating /health/series: ${metricKey}, ${range}, ${bucket}`)

        // Determine number of data points based on range and bucket
        const dataPoints: Record<string, Record<string, number>> = {
            day: { none: 10 },
            week: { none: 7 },
            month: { day: 30, none: 50 },
            six_month: { week: 26, none: 180 },
            year: { month: 12, week: 52, none: 365 }
        }

        const points = dataPoints[range]?.[bucket] || 7

        // Min/max values per metric
        let min = 0, max = 100
        switch (metricKey) {
            case 'meal': min = 150; max = 400; break
            case 'weight': min = 5; max = 40; break
            case 'water': min = 200; max = 800; break
            case 'walk_duration': min = 15; max = 90; break
            case 'body_temp': min = 38; max = 39.5; break
            default: min = 0; max = 100
        }

        // Generate deterministic data
        const dateBucket = new Date().toISOString().slice(0, 10)
        const rng = new SeededRandom(`series_${metricKey}_${range}_${bucket}_${dateBucket}`)

        const latestVal = getConsistentLatestValue(metricKey, min, max)
        const base = (min + max) / 2

        // Generate series data
        const now = Date.now()
        const series = Array.from({ length: points }, (_, index) => {
            // Calculate timestamp based on range and index
            let timestamp: number
            if (bucket === 'month') {
                // Monthly buckets
                const date = new Date()
                date.setMonth(date.getMonth() - (points - 1 - index))
                date.setDate(1)
                date.setHours(12, 0, 0, 0)
                timestamp = date.getTime()
            } else if (bucket === 'week') {
                // Weekly buckets
                const daysAgo = (points - 1 - index) * 7
                timestamp = now - daysAgo * 24 * 60 * 60 * 1000
            } else if (bucket === 'day') {
                // Daily buckets
                const daysAgo = points - 1 - index
                timestamp = now - daysAgo * 24 * 60 * 60 * 1000
            } else {
                // None/raw data
                const daysAgo = points - 1 - index
                timestamp = now - daysAgo * 24 * 60 * 60 * 1000
            }

            // Use latest value for the most recent point
            let value: number
            if (index === points - 1) {
                value = latestVal
            } else {
                const trend = Math.sin(index / points * Math.PI) * (max - min) * 0.1
                const randomFactor = rng.float(-0.5, 0.5)
                value = base + trend + randomFactor * (max - min) * 0.1
                value = Math.max(min, Math.min(max, value))
            }

            // Round based on metric type
            if (metricKey === 'weight' || metricKey === 'body_temp') {
                value = Number(value.toFixed(1))
            } else {
                value = Math.round(value)
            }

            return {
                value,
                date: new Date(timestamp).toISOString(),
                timestamp
            }
        })

        // Calculate stats
        const values = series.map(s => s.value)
        const stats = {
            avg: values.length > 0 ? Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)) : null,
            min: values.length > 0 ? Math.min(...values) : null,
            max: values.length > 0 ? Math.max(...values) : null,
            count: values.length
        }

        // Calculate cutoff date
        const cutoffDate = new Date(series[0].timestamp).toISOString()

        return {
            series,
            stats,
            meta: {
                metricKey,
                range,
                bucket,
                cutoffDate,
                recordCount: points,
                aggregatedCount: points
            }
        }
    }
})
