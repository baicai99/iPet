/**
 * Health Cache Service - 健康数据本地缓存服务
 * 
 * 职责：
 * - 管理健康模块的本地缓存（Summary、Trend、Series）
 * - 实现 TTL 过期策略
 * - 实现 LRU 容量控制（≤ 5MB）
 * - 版本控制，避免结构不兼容
 * 
 * 对应 PRD 4.3 节：本地缓存策略
 */

import {
    HEALTH_CACHE_SCHEMA_VERSION,
    type HealthCacheKey,
    type CacheEntry
} from '@/types/health'
import { performanceMonitor } from '@/utils/performance/performanceMonitor'

// ============================================================================
// Constants
// ============================================================================

/** 缓存存储前缀 */
const CACHE_PREFIX = 'health_cache_'

/** 缓存 TTL：24 小时 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

/** 最大缓存容量：5MB */
const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024

/** LRU 访问记录键 */
const LRU_ACCESS_KEY = 'health_cache_lru_access'

/** 高优先级缓存键（不会被 LRU 清理） */
const HIGH_PRIORITY_KEYS: HealthCacheKey[] = ['Summary_Snapshot', 'Trend_Cache_7Days']

/** SWR 默认陈旧时间：5 分钟 */
const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000

// ============================================================================
// In-flight Deduplication
// ============================================================================

/** 请求去重 Map：同一 key 的并发请求复用同一 Promise */
const inflightMap = new Map<string, Promise<unknown>>()

// ============================================================================
// SWR Options
// ============================================================================

/** SWR 配置选项 */
interface SWROptions<T> {
    /** 缓存键 */
    key: HealthCacheKey
    /** 数据获取函数 */
    fetcher: () => Promise<T>
    /** 允许的陈旧时间（毫秒），默认 5 分钟 */
    staleTime?: number
    /** 后台刷新完成回调 */
    onRevalidate?: (data: T) => void
}

// ============================================================================
// Cache Dependency Graph
// ============================================================================

/** Trend 缓存依赖的指标列表 */
const TREND_DEPENDENT_METRICS = ['weight', 'meal', 'water', 'walk_duration', 'body_temp', 'stool']

/**
 * 获取指标的依赖缓存键列表
 * @param metricKey - 指标键
 * @returns 需要失效的缓存键列表
 */
function getDependentKeys(metricKey: string): HealthCacheKey[] {
    const result: HealthCacheKey[] = [
        'Summary_Snapshot'  // Summary 总是依赖所有指标
    ]

    // Trend 缓存依赖常用指标
    if (TREND_DEPENDENT_METRICS.includes(metricKey)) {
        result.push('Trend_Cache_7Days', 'Trend_Cache_30Days')
    }

    return result
}

// ============================================================================
// LRU Access Tracking
// ============================================================================

interface LRUAccessRecord {
    [key: string]: number  // key -> lastAccessTime
}

/**
 * 获取 LRU 访问记录
 */
function getLRUAccess(): LRUAccessRecord {
    try {
        const raw = uni.getStorageSync(LRU_ACCESS_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

/**
 * 更新 LRU 访问记录
 */
function updateLRUAccess(key: string): void {
    try {
        const access = getLRUAccess()
        access[key] = Date.now()
        uni.setStorageSync(LRU_ACCESS_KEY, JSON.stringify(access))
    } catch (e) {
        console.warn('[HealthCacheService] Failed to update LRU access:', e)
    }
}

/**
 * 移除 LRU 记录中的键
 */
function removeLRUAccess(key: string): void {
    try {
        const access = getLRUAccess()
        delete access[key]
        uni.setStorageSync(LRU_ACCESS_KEY, JSON.stringify(access))
    } catch (e) {
        console.warn('[HealthCacheService] Failed to remove LRU access:', e)
    }
}

// ============================================================================
// Core Cache Functions
// ============================================================================

/**
 * 获取缓存键的完整存储键
 */
function getStorageKey(key: HealthCacheKey): string {
    return `${CACHE_PREFIX}${key}`
}

/**
 * 从缓存获取数据
 * 
 * @param key - 缓存键
 * @returns 缓存的数据，如果不存在、过期或版本不匹配则返回 null
 */
function get<T>(key: HealthCacheKey): T | null {
    try {
        const storageKey = getStorageKey(key)
        const raw = uni.getStorageSync(storageKey)

        if (!raw) {
            performanceMonitor.trackCacheHit(key, false)
            return null
        }

        const entry: CacheEntry<T> = JSON.parse(raw)

        // 版本检查
        if (entry.schemaVersion !== HEALTH_CACHE_SCHEMA_VERSION) {
            console.log(`[HealthCacheService] Schema version mismatch for ${key}, clearing`)
            remove(key)
            return null
        }

        // 过期检查
        if (isExpired(key)) {
            console.log(`[HealthCacheService] Cache expired for ${key}`)
            return null  // 不自动删除，让调用方决定是否更新
        }

        // 更新 LRU 访问时间
        updateLRUAccess(key)

        // 记录缓存命中
        performanceMonitor.trackCacheHit(key, true)

        return entry.data
    } catch (e) {
        console.warn(`[HealthCacheService] Failed to get cache for ${key}:`, e)
        performanceMonitor.trackCacheHit(key, false)
        return null
    }
}

/**
 * 设置缓存数据
 * 
 * @param key - 缓存键
 * @param data - 要缓存的数据
 */
function set<T>(key: HealthCacheKey, data: T): void {
    try {
        // 先检查容量，必要时进行 LRU 清理
        runLRUCleanupIfNeeded()

        const storageKey = getStorageKey(key)
        const entry: CacheEntry<T> = {
            data,
            updatedAt: Date.now(),
            schemaVersion: HEALTH_CACHE_SCHEMA_VERSION
        }

        uni.setStorageSync(storageKey, JSON.stringify(entry))
        updateLRUAccess(key)

    } catch (e) {
        console.warn(`[HealthCacheService] Failed to set cache for ${key}:`, e)
        // 如果存储失败（可能是配额问题），尝试清理后重试
        try {
            runLRUCleanup()
            const storageKey = getStorageKey(key)
            const entry: CacheEntry<T> = {
                data,
                updatedAt: Date.now(),
                schemaVersion: HEALTH_CACHE_SCHEMA_VERSION
            }
            uni.setStorageSync(storageKey, JSON.stringify(entry))
        } catch (retryError) {
            console.error(`[HealthCacheService] Retry failed for ${key}:`, retryError)
        }
    }
}

/**
 * 检查缓存是否过期
 * 
 * @param key - 缓存键
 * @returns 是否过期
 */
function isExpired(key: HealthCacheKey): boolean {
    try {
        const storageKey = getStorageKey(key)
        const raw = uni.getStorageSync(storageKey)

        if (!raw) return true

        const entry: CacheEntry<unknown> = JSON.parse(raw)
        return Date.now() - entry.updatedAt > CACHE_TTL_MS
    } catch {
        return true
    }
}

/**
 * 获取缓存项的更新时间
 */
function getUpdatedAt(key: HealthCacheKey): number | null {
    try {
        const storageKey = getStorageKey(key)
        const raw = uni.getStorageSync(storageKey)

        if (!raw) return null

        const entry: CacheEntry<unknown> = JSON.parse(raw)
        return entry.updatedAt
    } catch {
        return null
    }
}

/**
 * 移除指定缓存
 * 
 * @param key - 缓存键
 */
function remove(key: HealthCacheKey): void {
    try {
        const storageKey = getStorageKey(key)
        uni.removeStorageSync(storageKey)
        removeLRUAccess(key)
    } catch (e) {
        console.warn(`[HealthCacheService] Failed to remove cache for ${key}:`, e)
    }
}

/**
 * 清空所有健康模块缓存
 */
function clear(): void {
    try {
        const info = uni.getStorageInfoSync()
        const keysToRemove = info.keys.filter((k: string) => k.startsWith(CACHE_PREFIX))

        keysToRemove.forEach((k: string) => {
            uni.removeStorageSync(k)
        })

        uni.removeStorageSync(LRU_ACCESS_KEY)
        console.log(`[HealthCacheService] Cleared ${keysToRemove.length} cache entries`)
    } catch (e) {
        console.warn('[HealthCacheService] Failed to clear cache:', e)
    }
}

// ============================================================================
// In-flight Deduplication Functions
// ============================================================================

/**
 * 获取或创建去重请求
 * 
 * 如果同一 key 的请求正在进行中，复用该 Promise。
 * 否则创建新请求，并在完成后自动清理。
 * 
 * @param key - 缓存键
 * @param fetcher - 数据获取函数
 * @returns Promise 返回数据
 */
function getOrCreateInflight<T>(
    key: HealthCacheKey,
    fetcher: () => Promise<T>
): Promise<T> {
    // 如果已有进行中的请求，复用它
    if (inflightMap.has(key)) {
        console.log(`[HealthCacheService] Reusing inflight request for ${key}`)
        return inflightMap.get(key) as Promise<T>
    }

    // 创建新请求
    const promise = fetcher().finally(() => {
        inflightMap.delete(key)
    })

    inflightMap.set(key, promise)
    return promise
}

// ============================================================================
// Stale-While-Revalidate (SWR)
// ============================================================================

/**
 * SWR 模式获取数据
 * 
 * 策略：
 * 1. 有缓存（即使陈旧）→ 立即返回
 * 2. 如果陈旧 → 后台刷新，刷新完成触发 onRevalidate 回调
 * 3. 无缓存 → 同步获取
 * 
 * @param options - SWR 配置
 * @returns 缓存数据或新获取的数据
 */
async function getWithSWR<T>(options: SWROptions<T>): Promise<T | null> {
    const { key, fetcher, staleTime = DEFAULT_STALE_TIME_MS, onRevalidate } = options

    const cached = get<T>(key)
    const updatedAt = getUpdatedAt(key)
    const now = Date.now()
    const isStale = updatedAt !== null && (now - updatedAt > staleTime)

    // 有缓存，立即返回
    if (cached !== null) {
        // 如果陈旧，后台刷新
        if (isStale) {
            console.log(`[HealthCacheService] SWR: ${key} is stale, revalidating in background`)
            getOrCreateInflight(key, async () => {
                try {
                    const fresh = await fetcher()
                    set(key, fresh)
                    onRevalidate?.(fresh)
                    return fresh
                } catch (e) {
                    console.warn(`[HealthCacheService] SWR revalidation failed for ${key}:`, e)
                    throw e
                }
            }).catch(() => {
                // 后台刷新失败不影响已返回的陈旧数据
            })
        }
        return cached
    }

    // 无缓存，同步获取
    console.log(`[HealthCacheService] SWR: ${key} cache miss, fetching`)
    return getOrCreateInflight(key, async () => {
        const data = await fetcher()
        set(key, data)
        return data
    })
}

// ============================================================================
// Dependency-Graph Invalidation
// ============================================================================

/**
 * 按指标失效缓存
 * 
 * 根据依赖图自动失效相关缓存：
 * - 该指标的所有 Series 缓存
 * - Summary 快照
 * - Trend 缓存（如果该指标在依赖列表中）
 * 
 * @param metricKey - 指标键
 */
function invalidateByMetric(metricKey: string): void {
    try {
        const info = uni.getStorageInfoSync()
        let invalidatedCount = 0

        // 1. 删除该指标的所有 Series 缓存
        info.keys.forEach((k: string) => {
            if (k.startsWith(`${CACHE_PREFIX}Series_${metricKey}_`)) {
                uni.removeStorageSync(k)
                removeLRUAccess(k.replace(CACHE_PREFIX, '') as HealthCacheKey)
                invalidatedCount++
            }
        })

        // 2. 删除依赖的固定缓存
        const dependentKeys = getDependentKeys(metricKey)
        dependentKeys.forEach(key => {
            remove(key)
            invalidatedCount++
        })

        console.log(`[HealthCacheService] Invalidated ${invalidatedCount} caches by metric: ${metricKey}`)
    } catch (e) {
        console.warn(`[HealthCacheService] Failed to invalidate by metric ${metricKey}:`, e)
    }
}

/**
 * 按记录类型失效缓存
 * 
 * 记录类型通常等于指标键，直接调用 invalidateByMetric
 * 
 * @param recordType - 记录类型
 */
function invalidateByRecordType(recordType: string): void {
    invalidateByMetric(recordType)
}

/**
 * 失效所有 Series 缓存
 */
function invalidateAllSeries(): void {
    try {
        const info = uni.getStorageInfoSync()
        let count = 0

        info.keys.forEach((k: string) => {
            if (k.startsWith(`${CACHE_PREFIX}Series_`)) {
                uni.removeStorageSync(k)
                count++
            }
        })

        console.log(`[HealthCacheService] Invalidated ${count} Series caches`)
    } catch (e) {
        console.warn('[HealthCacheService] Failed to invalidate all series:', e)
    }
}

// ============================================================================
// LRU Cleanup
// ============================================================================

/**
 * 获取当前健康模块缓存占用大小（估算）
 */
function getHealthCacheSize(): number {
    try {
        const info = uni.getStorageInfoSync()
        let totalSize = 0

        info.keys.forEach((k: string) => {
            if (k.startsWith(CACHE_PREFIX) || k === LRU_ACCESS_KEY) {
                try {
                    const data = uni.getStorageSync(k)
                    // 估算：字符串长度 * 2（UTF-16）
                    totalSize += (typeof data === 'string' ? data.length : JSON.stringify(data).length) * 2
                } catch {
                    // 忽略单个读取失败
                }
            }
        })

        return totalSize
    } catch {
        return 0
    }
}

/**
 * 如果超过容量限制，执行 LRU 清理
 */
function runLRUCleanupIfNeeded(): void {
    const currentSize = getHealthCacheSize()
    if (currentSize > MAX_CACHE_SIZE_BYTES * 0.9) {  // 90% 阈值触发清理
        runLRUCleanup()
    }
}

/**
 * 执行 LRU 清理
 * 
 * 策略：
 * 1. 保留高优先级键（Summary_Snapshot, Trend_Cache_7Days）
 * 2. 按最后访问时间排序，删除最久未访问的
 * 3. 直到总占用 < 80% 阈值
 */
function runLRUCleanup(): void {
    try {
        const access = getLRUAccess()
        const info = uni.getStorageInfoSync()

        // 获取所有健康缓存键
        const healthKeys = info.keys
            .filter((k: string) => k.startsWith(CACHE_PREFIX))
            .map((k: string) => k.replace(CACHE_PREFIX, '') as HealthCacheKey)

        // 按访问时间排序（最久未访问的在前）
        const sortedKeys = healthKeys
            .filter(k => !HIGH_PRIORITY_KEYS.includes(k))
            .sort((a, b) => (access[a] || 0) - (access[b] || 0))

        let currentSize = getHealthCacheSize()
        const targetSize = MAX_CACHE_SIZE_BYTES * 0.8  // 清理到 80%

        for (const key of sortedKeys) {
            if (currentSize <= targetSize) break

            const storageKey = getStorageKey(key)
            try {
                const data = uni.getStorageSync(storageKey)
                const itemSize = (typeof data === 'string' ? data.length : JSON.stringify(data).length) * 2

                uni.removeStorageSync(storageKey)
                removeLRUAccess(key)
                currentSize -= itemSize

                console.log(`[HealthCacheService] LRU removed: ${key}`)
            } catch {
                // 忽略单个删除失败
            }
        }

        console.log(`[HealthCacheService] LRU cleanup complete, current size: ${Math.round(currentSize / 1024)}KB`)
    } catch (e) {
        console.warn('[HealthCacheService] LRU cleanup failed:', e)
    }
}

// ============================================================================
// Version Migration
// ============================================================================

/**
 * 初始化时检查并处理版本迁移
 * 如果发现旧版本缓存，清空所有缓存
 */
function checkVersionAndMigrate(): void {
    try {
        const info = uni.getStorageInfoSync()
        const healthKeys = info.keys.filter((k: string) => k.startsWith(CACHE_PREFIX))

        if (healthKeys.length === 0) return

        // 检查任意一个缓存的版本
        for (const storageKey of healthKeys) {
            try {
                const raw = uni.getStorageSync(storageKey)
                if (!raw) continue

                const entry: CacheEntry<unknown> = JSON.parse(raw)
                if (entry.schemaVersion !== HEALTH_CACHE_SCHEMA_VERSION) {
                    console.log('[HealthCacheService] Detected outdated cache version, clearing all')
                    clear()
                    return
                }

                // 只需检查一个就够了
                return
            } catch {
                // 解析失败的也需要清理
                continue
            }
        }
    } catch (e) {
        console.warn('[HealthCacheService] Version check failed:', e)
    }
}

// ============================================================================
// Export
// ============================================================================

export const healthCacheService = {
    // Core functions
    get,
    set,
    remove,
    clear,
    isExpired,
    getUpdatedAt,
    runLRUCleanup,
    checkVersionAndMigrate,
    getHealthCacheSize,

    // In-flight deduplication
    getOrCreateInflight,

    // Stale-While-Revalidate
    getWithSWR,

    // Dependency-graph invalidation
    invalidateByMetric,
    invalidateByRecordType,
    invalidateAllSeries,

    // 便捷方法
    getSummarySnapshot: () => get<any>('Summary_Snapshot'),
    setSummarySnapshot: (data: any) => set('Summary_Snapshot', data),

    getTrend7Days: () => get<any>('Trend_Cache_7Days'),
    setTrend7Days: (data: any) => set('Trend_Cache_7Days', data),

    getTrend30Days: () => get<any>('Trend_Cache_30Days'),
    setTrend30Days: (data: any) => set('Trend_Cache_30Days', data),

    getSeriesCache: (metric: string, range: string) => get<any>(`Series_${metric}_${range}`),
    setSeriesCache: (metric: string, range: string, data: any) => set(`Series_${metric}_${range}` as HealthCacheKey, data)
}

export default healthCacheService
