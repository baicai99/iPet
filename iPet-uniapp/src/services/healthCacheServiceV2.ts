/**
 * Metric-level Cache Extensions (V2)
 * 
 * 提供细粒度的指标级缓存支持
 */

import {
    HEALTH_CACHE_SCHEMA_VERSION
} from '@shared/types/health'

/**
 * 本地缓存条目类型（独立于 CacheManager 和 @shared/types/health）
 */
interface HealthCacheEntry<T> {
    data: T
    version: number
    createdAt: number
    expiresAt: number
}

/**
 * Metric Series 缓存 TTL 配置
 */
const SERIES_TTL_CONFIG: Record<string, number> = {
    day: 30 * 1000,        // 30 秒
    week: 30 * 1000,       // 30 秒
    month: 60 * 1000,      // 1 分钟
    six_month: 5 * 60 * 1000,  // 5 分钟
    year: 5 * 60 * 1000    // 5 分钟
}

const CACHE_PREFIX = 'health_cache_'

/**
 * 生成 Series cache key
 */
function buildSeriesKey(petId: string, metricKey: string, range: string): string {
    return `Series:${metricKey}:${range}:${petId}:${HEALTH_CACHE_SCHEMA_VERSION}`
}

/**
 * 生成 Summary Meta cache key
 */
function buildSummaryMetaKey(petId: string): string {
    return `Summary:Meta:${petId}:${HEALTH_CACHE_SCHEMA_VERSION}`
}

/**
 * 缓存单个 Metric Series
 */
async function cacheMetricSeries(
    petId: string,
    metricKey: string,
    range: string,
    data: {
        series: Array<{ value: number; date: string; timestamp: number }>
        stats: { avg: number | null; min: number | null; max: number | null; count: number }
    }
) {
    const key = buildSeriesKey(petId, metricKey, range)
    const ttl = SERIES_TTL_CONFIG[range] || 60 * 1000

    const entry: HealthCacheEntry<typeof data> = {
        data,
        version: HEALTH_CACHE_SCHEMA_VERSION,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl
    }

    const storageKey = `${CACHE_PREFIX}${key}`
    uni.setStorageSync(storageKey, entry)

    console.log(`[Cache] Cached series: ${key}, TTL: ${ttl}ms`)
}

/**
 * 获取 Metric Series 缓存
 */
async function getMetricSeries(
    petId: string,
    metricKey: string,
    range: string
): Promise<{
    series: Array<{ value: number; date: string; timestamp: number }>
    stats: { avg: number | null; min: number | null; max: number | null; count: number }
} | null> {
    const key = buildSeriesKey(petId, metricKey, range)
    const storageKey = `${CACHE_PREFIX}${key}`

    try {
        const entry = uni.getStorageSync(storageKey) as HealthCacheEntry<any> | null

        if (!entry) {
            console.log(`[Cache] Miss: ${key}`)
            return null
        }

        if (entry.version !== HEALTH_CACHE_SCHEMA_VERSION) {
            uni.removeStorageSync(storageKey)
            return null
        }

        if (Date.now() > entry.expiresAt) {
            uni.removeStorageSync(storageKey)
            return null
        }

        console.log(`[Cache] Hit: ${key}`)
        return entry.data
    } catch (error) {
        console.error(`[Cache] Error reading ${key}:`, error)
        return null
    }
}

/**
 * 按模式失效缓存 (支持通配符)
 */
function invalidateByPattern(pattern: string) {
    try {
        const info = uni.getStorageInfoSync()
        const allKeys = info.keys || []

        const regexPattern = pattern.replace(/\*/g, '.*').replace(/:/g, ':')
        const regex = new RegExp(`^${CACHE_PREFIX}${regexPattern}$`)

        let invalidatedCount = 0
        for (const storageKey of allKeys) {
            if (regex.test(storageKey)) {
                uni.removeStorageSync(storageKey)
                invalidatedCount++
            }
        }

        console.log(`[Cache] Invalidated ${invalidatedCount} keys matching: ${pattern}`)
    } catch (error) {
        console.error('[Cache] Error invalidating by pattern:', error)
    }
}

/**
 * 精准失效单个指标的所有缓存
 */
function invalidateMetric(petId: string, metricKey: string) {
    const pattern = `Series:${metricKey}:*:${petId}:*`
    invalidateByPattern(pattern)

    const metaKey = buildSummaryMetaKey(petId)
    const storageKey = `${CACHE_PREFIX}${metaKey}`
    uni.removeStorageSync(storageKey)

    console.log(`[Cache] Invalidated metric: ${metricKey} for pet: ${petId}`)
}

/**
 * 失效指定宠物的所有缓存
 */
function invalidatePet(petId: string) {
    invalidateByPattern(`*:${petId}:*`)
    console.log(`[Cache] Invalidated all cache for pet: ${petId}`)
}

export const healthCacheServiceV2 = {
    cacheMetricSeries,
    getMetricSeries,
    invalidateByPattern,
    invalidateMetric,
    invalidatePet,
    buildSeriesKey,
    buildSummaryMetaKey
}
