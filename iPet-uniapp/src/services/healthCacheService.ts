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
} from '@shared/types/health'

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

        if (!raw) return null

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

        return entry.data
    } catch (e) {
        console.warn(`[HealthCacheService] Failed to get cache for ${key}:`, e)
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
    get,
    set,
    remove,
    clear,
    isExpired,
    getUpdatedAt,
    runLRUCleanup,
    checkVersionAndMigrate,
    getHealthCacheSize,

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
