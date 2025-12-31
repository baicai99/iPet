/**
 * Health Query Store - 健康数据查询存储
 * 
 * 职责：
 * - 存储派生数据（series, summary, pinnedMetrics）
 * - 维护脏标记（dirty tracking）
 * - 订阅 Entity 变更事件，自动标记脏
 * - 提供查询方法，脏数据自动重算
 * 
 * 设计原则：
 * - 只存派生数据，原始数据在 EntityStore
 * - 查询时检查脏标记，自动重算
 * - 订阅事件驱动失效，无需手动调用
 */

import { ref, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import type { MetricSeriesResponse, MetricSeriesParams } from '@/types/health'
import { getMetricSeries, getMetricSeriesV2 } from '@/utils/business/healthDataHelper'
import { processPinnedMetrics, processTrendMetrics } from '@/utils/business/healthSummaryHelper'
import { healthSummaryService } from '@/services/healthSummaryService'
import { healthCacheService } from '@/services/healthCacheService'
import { healthEventBus } from './healthEventBus'
import { useHealthEntityStore } from './healthEntityStore'

// ============================================================================
// Types
// ============================================================================

/** Series 缓存条目 */
interface CachedSeries {
    data: MetricSeriesResponse
    updatedAt: number
}

/** Series 缓存 TTL: 10 分钟 */
const SERIES_CACHE_TTL_MS = 10 * 60 * 1000

// ============================================================================
// Store Definition
// ============================================================================

export const useHealthQueryStore = defineStore('healthQuery', () => {
    const entityStore = useHealthEntityStore()

    // =========================================================================
    // State: 派生数据
    // =========================================================================

    /** Series 缓存 */
    const seriesCache = ref<Record<string, CachedSeries>>({})

    /** Summary 相关状态 */
    const tasks = ref<any[]>([])
    const pinnedMetrics = ref<any[]>([])
    const trends = ref<any[]>([])
    const dailySummaries = ref<Record<string, number>>({})

    // =========================================================================
    // Dirty Tracking
    // =========================================================================

    /** 脏指标集合：这些指标的 Series 需要重算 */
    const dirtyMetrics = ref<Set<string>>(new Set())

    /** Summary 是否脏 */
    const summaryDirty = ref(false)

    // =========================================================================
    // Event Subscriptions
    // =========================================================================

    // 订阅单条记录变更
    const unsubAdded = healthEventBus.on('record:added', ({ metricKey }) => {
        markMetricDirty(metricKey)
        markSummaryDirty()
    })

    const unsubUpdated = healthEventBus.on('record:updated', ({ metricKey }) => {
        markMetricDirty(metricKey)
        markSummaryDirty()
    })

    const unsubDeleted = healthEventBus.on('record:deleted', ({ metricKey }) => {
        markMetricDirty(metricKey)
        markSummaryDirty()
    })

    // 订阅批量变更
    const unsubLoaded = healthEventBus.on('records:loaded', ({ metricKeys }) => {
        metricKeys.forEach(key => markMetricDirty(key))
        markSummaryDirty()
    })

    const unsubCleared = healthEventBus.on('records:cleared', ({ metricKeys }) => {
        metricKeys.forEach(key => markMetricDirty(key))
        markSummaryDirty()
    })

    // 订阅显式失效请求
    const unsubSummaryInvalidate = healthEventBus.on('summary:invalidate', () => {
        markSummaryDirty()
    })

    const unsubSeriesInvalidate = healthEventBus.on('series:invalidate', ({ metricKey }) => {
        if (metricKey) markMetricDirty(metricKey)
    })

    // =========================================================================
    // Dirty Management
    // =========================================================================

    /** 标记指标为脏 */
    function markMetricDirty(metricKey: string): void {
        dirtyMetrics.value.add(metricKey)

        // 同时清除内存缓存
        Object.keys(seriesCache.value).forEach(key => {
            if (key.startsWith(`${metricKey}::`)) {
                delete seriesCache.value[key]
            }
        })

        // 同时失效持久化缓存
        healthCacheService.invalidateByMetric(metricKey)
    }

    /** 标记 Summary 为脏 */
    function markSummaryDirty(): void {
        summaryDirty.value = true
    }

    /** 清除指标脏标记 */
    function clearMetricDirty(metricKey: string): void {
        dirtyMetrics.value.delete(metricKey)
    }

    /** 清除 Summary 脏标记 */
    function clearSummaryDirty(): void {
        summaryDirty.value = false
    }

    // =========================================================================
    // Query Methods
    // =========================================================================

    /** 生成缓存键 */
    function makeSeriesKey(metric: string, range: string, bucket: string): string {
        return `${metric}::${range}_${bucket}`
    }

    /** 检查缓存是否过期 */
    function isSeriesCacheExpired(cached: CachedSeries): boolean {
        return Date.now() - cached.updatedAt > SERIES_CACHE_TTL_MS
    }

    /**
     * 获取指标系列数据（自动处理脏数据）
     */
    function getMetricSeriesData(
        metric: string,
        range: string,
        bucket: 'day' | 'calendarWeek' | 'calendarMonth' = 'day'
    ): MetricSeriesResponse {
        const cacheKey = makeSeriesKey(metric, range, bucket)
        const cached = seriesCache.value[cacheKey]
        const isDirty = dirtyMetrics.value.has(metric)

        // 缓存命中且未过期且不脏
        if (cached && !isSeriesCacheExpired(cached) && !isDirty) {
            return cached.data
        }

        // 需要重算
        const history = entityStore.getMetricHistory(metric)
        const params: MetricSeriesParams = {
            metric,
            bucket,
            mode: 'rolling',
            range: range as any
        }
        const data = getMetricSeriesV2(history, params)

        // 更新缓存
        seriesCache.value[cacheKey] = {
            data,
            updatedAt: Date.now()
        }

        // 清除脏标记
        clearMetricDirty(metric)

        // 同步到持久化缓存
        healthCacheService.setSeriesCache(metric, `${range}_${bucket}`, data)

        return data
    }

    /**
     * 获取旧版图表数据（兼容）
     */
    function getMetricSeriesLegacy(key: string, range: string) {
        const history = entityStore.getMetricHistory(key) || []
        return getMetricSeries(history, range)
    }

    /**
     * 刷新 Summary 数据
     */
    async function refreshSummary(petId?: string): Promise<void> {
        try {
            const snapshot = await healthSummaryService.fetchSummary(petId ?? '')
            tasks.value = snapshot?.tasks || []
            pinnedMetrics.value = processPinnedMetrics(snapshot?.pinnedMetrics)
            trends.value = processTrendMetrics(snapshot?.trends)
            dailySummaries.value = snapshot?.dailySummaries || {}

            clearSummaryDirty()
        } catch (err) {
            console.error('[HealthQueryStore] refreshSummary failed:', err)
            tasks.value = []
            pinnedMetrics.value = []
            trends.value = []
        }
    }

    /**
     * 获取 Summary（自动处理脏数据）
     */
    async function getSummary(petId: string, options: { force?: boolean } = {}) {
        if (options.force || summaryDirty.value || !pinnedMetrics.value.length) {
            await refreshSummary(petId)
        }
        return {
            tasks: tasks.value,
            pinnedMetrics: pinnedMetrics.value,
            trends: trends.value,
            dailySummaries: dailySummaries.value
        }
    }

    /**
     * 重置 Summary
     */
    function resetSummary(): void {
        tasks.value = []
        pinnedMetrics.value = []
        trends.value = []
        dailySummaries.value = {}
        summaryDirty.value = false
    }

    /**
     * 使指定指标的缓存失效
     */
    function invalidateSeriesCache(metric?: string): void {
        if (metric) {
            markMetricDirty(metric)
        } else {
            // 全部失效
            seriesCache.value = {}
            dirtyMetrics.value.clear()
        }
    }

    /**
     * 获取每日摘要值
     */
    function getDailySummary(key: string): number {
        return dailySummaries.value[key] || 0
    }

    // =========================================================================
    // Return
    // =========================================================================

    return {
        // State
        seriesCache,
        tasks,
        pinnedMetrics,
        trends,
        dailySummaries,
        dirtyMetrics,
        summaryDirty,

        // Query Methods
        getMetricSeriesData,
        getMetricSeriesLegacy,
        getSummary,
        refreshSummary,
        resetSummary,
        getDailySummary,
        invalidateSeriesCache,

        // Dirty Management (exposed for testing/debugging)
        markMetricDirty,
        markSummaryDirty,
        clearMetricDirty,
        clearSummaryDirty
    }
}, {
    persist: {
        pick: ['tasks', 'pinnedMetrics', 'trends', 'dailySummaries']
    }
})
