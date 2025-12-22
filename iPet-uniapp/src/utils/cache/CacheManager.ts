/**
 * CacheManager - 统一缓存管理器
 * 
 * 特性：
 * - 双层缓存：内存（快速）+ localStorage（持久）
 * - TTL 过期：自动过期检查
 * - Schema 版本控制：升级时自动清理旧缓存
 * - SWR 支持：Stale-While-Revalidate 策略
 */

import packageJson from '../../../package.json'

const APP_VERSION = packageJson.version || '1.0.0'
const DEFAULT_TTL = 5 * 60 * 1000  // 5分钟
const CACHE_KEY_PREFIX = 'ipet_cache_'

/**
 * 缓存条目
 */
export interface CacheEntry<T = any> {
    value: T
    timestamp: number
    ttl: number
    version: string
}

/**
 * 缓存选项
 */
export interface CacheOptions {
    /** 过期时间（ms），默认 5 分钟，0 表示永不过期 */
    ttl?: number
    /** 是否持久化到 localStorage，默认 true */
    persist?: boolean
    /** Schema 版本号，默认使用 APP_VERSION */
    version?: string
}

/**
 * SWR 选项
 */
export interface SWROptions<T> extends CacheOptions {
    /** 数据获取函数 */
    fetcher: () => Promise<T>
    /** 成功回调 */
    onSuccess?: (data: T) => void
    /** 失败回调 */
    onError?: (error: Error) => void
}

class CacheManagerInstance {
    // 内存缓存（一级缓存）
    private memoryCache: Map<string, CacheEntry> = new Map()

    // 应用版本号
    private readonly appVersion: string

    constructor(version: string = APP_VERSION) {
        this.appVersion = version
        console.log(`[CacheManager] Initialized with version ${version}`)
        this.cleanupOldVersions()
    }

    // ========================================================================
    // 核心 API
    // ========================================================================

    /**
     * ✅ 读取缓存
     * 
     * 策略：
     * 1. 先查内存缓存（快速）
     * 2. 再查 localStorage（持久）
     * 3. 检查版本和 TTL
     * 
     * @param key 缓存键
     * @returns 缓存条目或 null
     */
    get<T>(key: string): CacheEntry<T> | null {
        const fullKey = this.getFullKey(key)

        // 1. 内存缓存查找
        let entry = this.memoryCache.get(fullKey)

        if (!entry) {
            // 2. localStorage 查找
            entry = this.getFromStorage(fullKey)

            if (entry) {
                // 同步到内存缓存
                this.memoryCache.set(fullKey, entry)
            }
        }

        if (!entry) return null

        // 3. 版本检查
        if (entry.version !== this.appVersion) {
            console.warn(`[CacheManager] Version mismatch for ${key}, clearing`)
            this.clear(key)
            return null
        }

        // 4. TTL 检查
        if (this.isExpired(entry)) {
            console.log(`[CacheManager] Cache expired for ${key}`)
            this.clear(key)
            return null
        }

        return entry as CacheEntry<T>
    }

    /**
     * ✅ 写入缓存
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @param options 缓存选项
     */
    set<T>(key: string, value: T, options: CacheOptions = {}): void {
        const {
            ttl = DEFAULT_TTL,
            persist = true,
            version = this.appVersion
        } = options

        const fullKey = this.getFullKey(key)
        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now(),
            ttl,
            version
        }

        // 写入内存缓存
        this.memoryCache.set(fullKey, entry)

        // 写入 localStorage
        if (persist) {
            this.setToStorage(fullKey, entry)
        }

        console.log(`[CacheManager] Set cache for ${key} (ttl: ${ttl}ms, persist: ${persist})`)
    }

    /**
     * ✅ 检查是否过期
     * 
     * @param key 缓存键
     * @returns true: 过期或不存在, false: 未过期
     */
    isStale(key: string): boolean {
        const entry = this.get(key)
        return !entry || this.isExpired(entry)
    }

    /**
     * ✅ 清除缓存
     * 
     * @param key 缓存键，不传则清除所有
     */
    clear(key?: string): void {
        if (key) {
            // 清除单个 key
            const fullKey = this.getFullKey(key)
            this.memoryCache.delete(fullKey)
            this.removeFromStorage(fullKey)
            console.log(`[CacheManager] Cleared cache for ${key}`)
        } else {
            // 清除所有缓存
            this.memoryCache.clear()
            this.clearAllStorage()
            console.log('[CacheManager] Cleared all cache')
        }
    }

    /**
     * ✅ 批量读取
     */
    getMany<T>(keys: string[]): Map<string, CacheEntry<T>> {
        const result = new Map<string, CacheEntry<T>>()

        for (const key of keys) {
            const entry = this.get<T>(key)
            if (entry) {
                result.set(key, entry)
            }
        }

        return result
    }

    /**
     * ✅ 批量写入
     */
    setMany<T>(entries: Map<string, T>, options: CacheOptions = {}): void {
        for (const [key, value] of entries) {
            this.set(key, value, options)
        }
    }

    // ========================================================================
    // SWR 支持
    // ========================================================================

    /**
     * ✅ Stale-While-Revalidate 策略
     * 
     * 1. 优先返回缓存（即使过期）
     * 2. 后台自动刷新
     * 3. 刷新成功后更新缓存
     */
    async swr<T>(key: string, options: SWROptions<T>): Promise<T | null> {
        const { fetcher, onSuccess, onError, ...cacheOptions } = options

        // 1. 读取缓存（即使过期也返回）
        const cached = this.get<T>(key)

        // 2. 判断是否需要刷新
        const needsRefresh = !cached || this.isExpired(cached)

        if (needsRefresh) {
            // 后台刷新
            this.refreshInBackground(key, fetcher, cacheOptions, onSuccess, onError)
        }

        // 3. 返回缓存数据（可能是过期的）
        return cached?.value ?? null
    }

    // ========================================================================
    // 私有方法
    // ========================================================================

    private getFullKey(key: string): string {
        return `${CACHE_KEY_PREFIX}${key}`
    }

    private isExpired(entry: CacheEntry): boolean {
        if (entry.ttl <= 0) return false  // ttl=0 表示永不过期
        return Date.now() - entry.timestamp > entry.ttl
    }

    private getFromStorage(fullKey: string): CacheEntry | undefined {
        try {
            const str = uni.getStorageSync(fullKey)
            if (!str) return undefined
            return JSON.parse(str) as CacheEntry
        } catch (e) {
            console.warn(`[CacheManager] Failed to read from storage: ${fullKey}`, e)
            return undefined
        }
    }

    private setToStorage(fullKey: string, entry: CacheEntry): void {
        try {
            uni.setStorageSync(fullKey, JSON.stringify(entry))
        } catch (e) {
            console.warn(`[CacheManager] Failed to write to storage: ${fullKey}`, e)
        }
    }

    private removeFromStorage(fullKey: string): void {
        try {
            uni.removeStorageSync(fullKey)
        } catch (e) {
            console.warn(`[CacheManager] Failed to remove from storage: ${fullKey}`, e)
        }
    }

    private clearAllStorage(): void {
        try {
            const info = uni.getStorageInfoSync()
            const keys = info.keys || []

            for (const key of keys) {
                if (key.startsWith(CACHE_KEY_PREFIX)) {
                    uni.removeStorageSync(key)
                }
            }
        } catch (e) {
            console.warn('[CacheManager] Failed to clear storage', e)
        }
    }

    /**
     * 清理旧版本缓存（App 启动时调用）
     */
    private cleanupOldVersions(): void {
        try {
            const info = uni.getStorageInfoSync()
            const keys = info.keys || []

            let cleanedCount = 0
            for (const key of keys) {
                if (!key.startsWith(CACHE_KEY_PREFIX)) continue

                try {
                    const str = uni.getStorageSync(key)
                    if (!str) continue

                    const entry = JSON.parse(str) as CacheEntry
                    if (entry.version !== this.appVersion) {
                        uni.removeStorageSync(key)
                        cleanedCount++
                    }
                } catch (e) {
                    // 解析失败，直接删除
                    uni.removeStorageSync(key)
                    cleanedCount++
                }
            }

            if (cleanedCount > 0) {
                console.log(`[CacheManager] Cleaned up ${cleanedCount} old cache entries`)
            }
        } catch (e) {
            console.warn('[CacheManager] Failed to cleanup old versions', e)
        }
    }

    /**
     * 后台刷新数据
     */
    private async refreshInBackground<T>(
        key: string,
        fetcher: () => Promise<T>,
        cacheOptions: CacheOptions,
        onSuccess?: (data: T) => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        try {
            console.log(`[CacheManager] Background refresh for ${key}`)
            const data = await fetcher()
            this.set(key, data, cacheOptions)
            onSuccess?.(data)
        } catch (error) {
            console.warn(`[CacheManager] SWR refresh failed for ${key}`, error)
            onError?.(error as Error)
        }
    }
}

// 单例导出
export const CacheManager = new CacheManagerInstance(APP_VERSION)
