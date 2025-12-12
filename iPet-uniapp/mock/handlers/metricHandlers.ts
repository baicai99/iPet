import { RequestConfig } from '../types/common'
import { SeededRandom } from '../utils/random'
import { getMockStorage } from '../utils/mockStorage'

const STORAGE_KEYS = {
    HISTORY: 'mock_metric_history',
    SERIES: 'mock_metric_series',
    LATEST: 'mock_metric_latest'
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

    // Seed includes key, granularity, and today's date (bucket by day) to ensure stability for the day
    const dateBucket = new Date().toISOString().slice(0, 10)
    const rng = new SeededRandom(`${key}_${granularity}_${dateBucket}`)

    const series = Array.from({ length: config.points }, (_, index) => {
        if (index === config.points - 1) {
            return {
                label: config.label(index, config.points),
                value: latestVal
            }
        }

        const trend = Math.sin(index / config.points * Math.PI) * 5
        // Use RNG for variance
        const randomFactor = rng.float(-0.5, 0.5)
        const value = Math.round(base + trend + randomFactor * config.variance * 2)

        return {
            label: config.label(index, config.points),
            value: Math.max(min, Math.min(max, value))
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

export const getMetricHistoryMock = (config: RequestConfig) => {
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

export const getMetricSeriesMock = (config: RequestConfig) => {
    const match = config.url.match(/\/metrics\/([^/]+)\/series/)
    const key = match ? match[1] : ''
    const granularity = (config.data as any)?.granularity || 'day'

    const cacheKey = `${key}_${granularity}`
    const cached = getFromCache(STORAGE_KEYS.SERIES, cacheKey)
    if (cached) {
        return cached
    }

    const data = generateMockSeries(key, granularity)
    setToCache(STORAGE_KEYS.SERIES, cacheKey, data)
    return data
}

export const getHealthRecordsMock = (config: RequestConfig) => {
    // Basic mock implementation compatible with list format
    const rng = new SeededRandom('health_records_list')
    const total = 20
    const list = Array.from({ length: total }, (_, i) => ({
        id: `record_${i}`,
        type: rng.choice(['weight', 'meal', 'stool', 'bath']),
        value: rng.int(10, 100),
        time: Date.now() - i * 86400000,
        note: rng.choice(['正常', '有点异常', '非常健康'])
    }))
    return {
        list,
        total,
        page: 1,
        pageSize: 10
    }
}

export const createHealthRecordMock = (config: RequestConfig) => {
    return {
        id: `new_record_${Date.now()}`,
        ...config.data,
        createTime: Date.now()
    }
}

export const getHealthSummaryMock = (config: RequestConfig) => {
    const rng = new SeededRandom('health_summary')
    return {
        avgWeight: rng.float(5, 15).toFixed(1),
        totalWalk: rng.int(100, 500),
        status: 'healthy'
    }
}
