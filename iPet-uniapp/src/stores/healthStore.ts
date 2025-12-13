/**
 * Health Store - 健康记录状态管理
 * 
 * 使用 Setup Store 写法（Vue 3 Composition API 风格）
 * 职责：
 * - 管理健康记录的状态（ids, entities）
 * - 提供 computed getters 给 UI 层
 * - 调用 Service 层执行业务逻辑
 * 
 * 设计原则：
 * - Store 只负责状态管理，不包含复杂业务逻辑
 * - 复杂逻辑下沉到 Service 层
 * - 使用 ref/computed 替代 state/getters，获得更好的 TS 推断
 */

import { ref, computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { getMetricMetadata } from '@/data/metricMetadata'
import { healthSummaryService } from '@/services/healthSummaryService'
import { healthService } from '@/services/health.service'
import { healthRecordService } from '@/services/healthRecordService'
import { healthCacheService } from '@/services/healthCacheService'
import type { HealthRecord, MetricSeriesResponse, MetricSeriesParams } from '@shared/types/health'
import { parseTimestamp, sortRecordsByTime, getMetricSeries, getMetricSeriesV2 } from '@/utils/business/healthDataHelper'
import { processPinnedMetrics, processTrendMetrics } from '@/utils/business/healthSummaryHelper'
import { getAllMetricKeys } from '@/data/metricMetadata'
import {
    detectSignificantChange,
    filterChangedMetrics,
    filterStableMetrics,
    type TrendAnalysis,
    type MetricRecord
} from '@/domain/trend/detectSignificantChanges'

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
// Store Definition (Setup Store)
// ============================================================================

export const useHealthStore = defineStore('health', () => {
    // =========================================================================
    // State (reactive refs)
    // =========================================================================

    const ids = ref<string[]>([])
    const entities = ref<Record<string, HealthRecord>>({})
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Summary related state
    const tasks = ref<any[]>([])
    const pinnedMetrics = ref<any[]>([])
    const trends = ref<any[]>([])
    const dailySummaries = ref<Record<string, number>>({})
    const lastUpdated = ref<number | null>(null)

    // =========================================================================
    // Performance Optimization: Index & Cache (PRD 8.1)
    // =========================================================================

    /** 指标索引：metricKey -> recordIds，减少 O(N) 扫描 */
    const metricIndex = ref<Record<string, string[]>>({})

    /** Series 缓存：带 TTL 的图表数据缓存 */
    const seriesCache = ref<Record<string, CachedSeries>>({})

    /** 
     * Trend 分析缓存：按指标粒度 memoization 
     * 使用 shallowRef 避免在 getter 中更新时触发响应式循环
     */
    const trendCache = shallowRef<Map<string, { hash: string, result: TrendAnalysis }>>(new Map())

    // =========================================================================
    // Getters (computed)
    // =========================================================================

    /** 所有健康记录（已排序） */
    const healthRecords = computed<HealthRecord[]>(() =>
        ids.value.map(id => entities.value[id])
    )

    /** 按宠物 ID 分组的记录 */
    const recordsByPetId = computed<Record<string, HealthRecord[]>>(() => {
        const map: Record<string, HealthRecord[]> = {}
        ids.value.forEach(id => {
            const record = entities.value[id]
            const pId = String(record.petId)
            if (!map[pId]) {
                map[pId] = []
            }
            map[pId].push(record)
        })
        return map
    })

    /** 获取指定类型的历史记录 (降序) - 使用索引加速 */
    const metricHistory = (key: string): HealthRecord[] => {
        // 优先使用索引
        const indexedIds = metricIndex.value[key]
        if (indexedIds && indexedIds.length > 0) {
            return indexedIds
                .map(id => entities.value[id])
                .filter(r => r && !r.deleted)
        }
        // 回退到全量扫描（索引未建立时）
        return ids.value
            .map(id => entities.value[id])
            .filter(r => r.type === key && !r.deleted)
    }

    /** 获取最新的指标数据 */
    const latestMetrics = (keys: string[]) => {
        return keys.map(key => {
            const record = ids.value
                .map(id => entities.value[id])
                .find(r => r.type === key && !r.deleted)

            return record
                ? {
                    key,
                    value: record.value,
                    timestamp: parseTimestamp(record)
                }
                : null
        }).filter(Boolean)
    }

    /** 获取每日摘要 */
    const getDailySummary = (key: string): number => {
        return dailySummaries.value[key] || 0
    }

    // =========================================================================
    // Trend Detection Getters (带 Memoization)
    // =========================================================================

    /**
     * 计算指标数据哈希（用于脏检查）
     */
    function calculateMetricHash(records: MetricRecord[]): string {
        if (records.length === 0) return '0:0'
        const lastTimestamp = records[records.length - 1].date || '0'
        return `${lastTimestamp}:${records.length}`
    }

    /**
     * 获取所有指标的趋势分析结果
     * 
     * 带 memoization：只在数据变化时重算
     * 性能优化：按指标粒度缓存，避免全量重算
     */
    const trendAnalysis = computed<Record<string, TrendAnalysis>>(() => {
        const keys = getAllMetricKeys()
        const results: Record<string, TrendAnalysis> = {}

        for (const key of keys) {
            // 从 store 获取历史记录
            const records = metricHistory(key) || []

            // 转换为 domain 层格式
            const metricRecords: MetricRecord[] = records.map(r => ({
                value: r.value,
                date: r.date
            }))

            // 计算当前数据哈希
            const currentHash = calculateMetricHash(metricRecords)

            // 检查缓存
            const cached = trendCache.value.get(key)

            if (cached && cached.hash === currentHash) {
                // ✅ 哈希未变，复用缓存结果
                results[key] = cached.result
            } else {
                // ❌ 哈希变化或无缓存，重新计算
                const result = detectSignificantChange(metricRecords)
                results[key] = result

                // 更新缓存（shallowRef不会触发响应式循环）
                trendCache.value.set(key, { hash: currentHash, result })
            }
        }

        return results
    })

    /**
     * 获取有显著变化的指标键列表
     */
    function getChangedMetricKeys(): string[] {
        return filterChangedMetrics(trendAnalysis.value)
    }

    /**
     * 获取稳定的指标键列表
     */
    function getStableMetricKeys(): string[] {
        return filterStableMetrics(trendAnalysis.value)
    }

    /**
     * 获取指标的趋势状态
     * 
     * @param key 指标键
     * @returns 'changed' | 'stable' | 'insufficient' | 'unknown'
     */
    function getMetricTrendStatus(key: string): 'changed' | 'stable' | 'insufficient' | 'unknown' {
        const analysis = trendAnalysis.value
        const result = analysis[key]

        if (!result) return 'unknown'
        if (result.dataPoints < 20) return 'insufficient'
        return result.hasSignificantChange ? 'changed' : 'stable'
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    /** 重新排序 ids */
    function resortIds() {
        const records = ids.value.map(id => entities.value[id]).filter(Boolean)
        const sorted = sortRecordsByTime(records, 'desc')
        ids.value = sorted.map(r => r.id)
    }

    /** 构建指标索引 */
    function buildMetricIndex() {
        const index: Record<string, string[]> = {}
        ids.value.forEach(id => {
            const record = entities.value[id]
            if (record && record.type && !record.deleted) {
                if (!index[record.type]) {
                    index[record.type] = []
                }
                index[record.type].push(id)
            }
        })
        metricIndex.value = index
    }

    /** 更新指标索引（新增记录时） */
    function updateMetricIndex(record: HealthRecord) {
        if (!record.type || record.deleted) return
        const list = metricIndex.value[record.type] || []
        if (!list.includes(record.id)) {
            metricIndex.value[record.type] = [record.id, ...list]
        }
    }

    /** 从索引移除记录 */
    function removeFromMetricIndex(id: string, type?: string) {
        if (type && metricIndex.value[type]) {
            metricIndex.value[type] = metricIndex.value[type].filter(rid => rid !== id)
        } else {
            // 如果不知道类型，遍历所有索引
            Object.keys(metricIndex.value).forEach(key => {
                metricIndex.value[key] = metricIndex.value[key].filter(rid => rid !== id)
            })
        }
    }

    /** 生成 Series 缓存键 */
    function makeSeriesKey(metric: string, range: string): string {
        return `${metric}::${range}`
    }

    /** 检查 Series 缓存是否过期 */
    function isSeriesCacheExpired(cached: CachedSeries): boolean {
        return Date.now() - cached.updatedAt > SERIES_CACHE_TTL_MS
    }

    /** 使缓存失效（记录变更后调用） */
    function invalidateSeriesCache(metric?: string) {
        if (metric) {
            // 只清除该指标相关的缓存
            Object.keys(seriesCache.value).forEach(key => {
                if (key.startsWith(`${metric}::`)) {
                    delete seriesCache.value[key]
                }
            })
        } else {
            // 清除所有缓存
            seriesCache.value = {}
        }
    }

    /** 应用乐观更新到 pinned metrics */
    function applyPinnedMetricOptimisticUpdate(record: Partial<HealthRecord>) {
        if (!record.type) return

        const pinnedIndex = pinnedMetrics.value.findIndex(m => m.key === record.type)
        if (pinnedIndex !== -1) {
            const metric = pinnedMetrics.value[pinnedIndex]
            metric.value = record.value
            metric.numericValue = Number(record.value)
            metric.date = new Date(Date.now()).toISOString()
        }
    }

    // =========================================================================
    // Actions
    // =========================================================================

    /**
     * 获取健康记录列表
     */
    async function fetchHealthRecords(petId?: string) {
        loading.value = true
        error.value = null

        try {
            const records = await healthService.getHealthRecords(petId)
            const sorted = sortRecordsByTime(records, 'desc')

            ids.value = sorted.map(r => r.id)
            entities.value = sorted.reduce((acc, r) => {
                acc[r.id] = r
                return acc
            }, {} as Record<string, HealthRecord>)
            lastUpdated.value = Date.now()

            // 构建指标索引
            buildMetricIndex()
            // 清除 Series 缓存（数据已更新）
            invalidateSeriesCache()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch health records'
            error.value = message
            console.error(err)
        } finally {
            loading.value = false
        }
    }

    /**
     * 添加健康记录（含乐观更新）
     * 业务逻辑委托给 healthRecordService
     */
    async function addRecord(record: Partial<HealthRecord>) {
        // 1. 通过 Service 构建乐观记录
        const optimisticRecord = healthRecordService.buildOptimisticRecord(record)
        const tempId = optimisticRecord.tempId

        // 2. 立即更新状态（乐观更新）
        entities.value[tempId] = optimisticRecord
        ids.value = [tempId, ...ids.value]
        applyPinnedMetricOptimisticUpdate(record)

        // 3. 调用 Service 执行创建
        const result = await healthRecordService.createRecord(record)

        if (result.success && result.serverRecord) {
            // 4. 成功：替换临时记录
            delete entities.value[tempId]
            entities.value[result.serverRecord.id] = result.serverRecord

            const index = ids.value.indexOf(tempId)
            if (index !== -1) {
                ids.value[index] = result.serverRecord.id
            }

            resortIds()

            // 更新索引和缓存
            updateMetricIndex(result.serverRecord)
            invalidateSeriesCache(result.serverRecord.type)

            // 刷新 Summary
            if (result.serverRecord.petId) {
                await refreshSummary(String(result.serverRecord.petId))
            }

            return result.serverRecord
        } else {
            // 5. 失败：回滚
            delete entities.value[tempId]
            ids.value = ids.value.filter(id => id !== tempId)
            error.value = result.error?.message || 'Failed to add record'
            throw result.error
        }
    }

    /**
     * 更新健康记录
     */
    async function updateRecord(id: string, payload: Partial<HealthRecord>) {
        loading.value = true
        error.value = null

        try {
            const result = await healthRecordService.updateRecord(id, payload)

            if (result.success && result.record) {
                entities.value[id] = result.record
                resortIds()
                return result.record
            } else {
                error.value = result.error?.message || 'Failed to update record'
                throw result.error
            }
        } finally {
            loading.value = false
        }
    }

    /**
     * 删除健康记录
     */
    async function deleteRecord(id: string) {
        loading.value = true
        error.value = null

        const petId = entities.value[id]?.petId

        try {
            const result = await healthRecordService.deleteRecord(id)

            if (result.success) {
                delete entities.value[id]
                ids.value = ids.value.filter(i => i !== id)

                if (petId) {
                    await refreshSummary(String(petId))
                }
            } else {
                error.value = result.error?.message || 'Failed to delete record'
                throw result.error
            }
        } finally {
            loading.value = false
        }
    }

    /**
     * 按宠物 ID 删除所有记录（本地）
     */
    function removeRecordsByPetId(petId: string) {
        const toRemoveIds = ids.value.filter(id =>
            String(entities.value[id].petId) === String(petId)
        )
        toRemoveIds.forEach(id => delete entities.value[id])
        ids.value = ids.value.filter(id =>
            String(entities.value[id]?.petId) !== String(petId)
        )
    }

    /**
     * 刷新 Summary 数据
     */
    async function refreshSummary(petId?: string) {
        try {
            const snapshot = await healthSummaryService.fetchSummary(petId ?? '')
            tasks.value = snapshot?.tasks || []
            pinnedMetrics.value = processPinnedMetrics(snapshot?.pinnedMetrics)
            trends.value = processTrendMetrics(snapshot?.trends)
            dailySummaries.value = snapshot?.dailySummaries || {}
        } catch (err) {
            console.error('Failed to refresh summary', err)
            tasks.value = []
            pinnedMetrics.value = []
            trends.value = []
        }
    }

    /**
     * 重置 Summary 快照
     */
    function resetSummarySnapshot() {
        tasks.value = []
        pinnedMetrics.value = []
        trends.value = []
        dailySummaries.value = {}
    }

    /**
     * 初始化 Summary 页面
     */
    async function initSummaryPage(petId: string, options: { force?: boolean } = {}) {
        if (options.force || !lastUpdated.value) {
            await fetchHealthRecords(petId)
        }
        await refreshSummary(petId)
    }

    /**
     * 生成图表数据序列（旧版，保持向后兼容）
     */
    function getMetricSeriesData(key: string, range: string) {
        const history = metricHistory(key) || []
        return getMetricSeries(history, range)
    }

    /**
     * 获取指标系列数据 V2（带缓存）
     * 统一入口，返回 MetricSeriesResponse 结构
     */
    function metricSeriesV2(
        metric: string,
        range: string,
        bucket: 'day' | 'calendarWeek' | 'calendarMonth' = 'day'
    ): MetricSeriesResponse {
        const cacheKey = makeSeriesKey(metric, `${range}_${bucket}`)
        const cached = seriesCache.value[cacheKey]

        // 缓存命中且未过期
        if (cached && !isSeriesCacheExpired(cached)) {
            return cached.data
        }

        // 计算新数据
        const history = metricHistory(metric)
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

        // 同步到持久化缓存
        healthCacheService.setSeriesCache(metric, `${range}_${bucket}`, data)

        return data
    }

    /**
     * 获取历史记录（分页）
     */
    async function fetchHistoryRecords(
        petId: string,
        metricKey: string,
        page: number = 1,
        limit: number = 20
    ) {
        try {
            return await healthService.getHealthRecords(petId, page, limit, metricKey)
        } catch (err) {
            console.error('Failed to fetch history records', err)
            throw err
        }
    }

    /**
     * 切换 Pin 状态
     */
    async function togglePin(petId: string, metricKey: string, isPinned: boolean) {
        // 保存原始状态用于回滚
        const originalPinnedMetrics = [...pinnedMetrics.value]

        // 乐观更新
        if (!isPinned) {
            pinnedMetrics.value = pinnedMetrics.value.filter(m => m.key !== metricKey)
        } else {
            if (!pinnedMetrics.value.some(m => m.key === metricKey)) {
                const metadata = getMetricMetadata(metricKey) || {} as any
                pinnedMetrics.value.push({
                    key: metricKey,
                    title: metadata.title || 'Loading...',
                    subtitle: metadata.description || '',
                    unit: metadata.displayUnit || metadata.unit || '',
                    baseUnit: metadata.unit || '',
                    color: metadata.category || 'default',
                    chartType: metadata.visualization?.type || 'trend_line',
                    value: '--',
                    chartData: []
                } as any)
            }
        }

        try {
            await healthService.toggleMetricPin(petId, metricKey, isPinned)
            await refreshSummary(petId)
        } catch (err) {
            // 回滚
            pinnedMetrics.value = originalPinnedMetrics
            console.error('Failed to toggle pin', err)
            throw err
        }
    }

    // =========================================================================
    // Return (Setup Store 必须显式返回)
    // =========================================================================

    return {
        // State
        ids,
        entities,
        loading,
        error,
        tasks,
        pinnedMetrics,
        trends,
        dailySummaries,
        lastUpdated,
        metricIndex,
        seriesCache,

        // Getters
        healthRecords,
        recordsByPetId,
        metricHistory,
        latestMetrics,
        getDailySummary,
        trendAnalysis,
        getChangedMetricKeys,
        getStableMetricKeys,
        getMetricTrendStatus,

        // Actions
        fetchHealthRecords,
        addRecord,
        updateRecord,
        deleteRecord,
        removeRecordsByPetId,
        refreshSummary,
        resetSummarySnapshot,
        initSummaryPage,
        metricSeries: getMetricSeriesData,  // 保持向后兼容的别名
        metricSeriesV2,                      // 新版统一入口
        invalidateSeriesCache,
        fetchHistoryRecords,
        togglePin
    }
}, {
    // Persist 配置
    persist: {
        pick: ['ids', 'entities', 'tasks', 'pinnedMetrics', 'trends', 'dailySummaries', 'lastUpdated']
    }
})
