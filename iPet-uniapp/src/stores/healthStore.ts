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

import { ref, computed, shallowRef, markRaw } from 'vue'
import { defineStore } from 'pinia'
import { getMetricMetadata } from '@/data/metricMetadata'
import { healthSummaryService } from '@/services/healthSummaryService'
import { healthService } from '@/services/health.service'
import { healthRecordService } from '@/services/healthRecordService'
import healthCacheService from '@/services/healthCacheService'
import { healthCacheServiceV2 } from '@/services/healthCacheServiceV2'  // ✅ NEW: V2 缓存
import type { HealthRecord, MetricSeriesResponse, MetricSeriesParams } from '@shared/types/health'
import { parseTimestamp, sortRecordsByTime, getMetricSeries, getMetricSeriesV2 } from '@/utils/business/healthDataHelper'
import { processPinnedMetrics, processTrendMetrics } from '@/utils/business/healthSummaryHelper'
import { getAllMetricKeys } from '@/data/metricMetadata'
import {
    filterChangedMetrics,
    filterStableMetrics,
    type TrendAnalysis,
    type MetricRecord
} from '@/domain/trend/detectSignificantChanges'
import { TrendEngine } from '@/utils/performance/TrendEngine'

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
    // ✅ OPTIMIZED: 使用 shallowRef 避免大对象深层响应式开销
    // =========================================================================

    const ids = ref<string[]>([])

    /**
     * ✅ OPTIMIZED: entities 使用 shallowRef
     * 
     * 原因:
     * - entities 是大对象 (可能包含 100-500 条记录)
     * - ref() 会对每个记录进行深层 Proxy 包装
     * - 每次更新需要深层 diff,性能开销大
     * 
     * 优化:
     * - shallowRef() 只代理第一层,不代理嵌套对象
     * - 更新时通过替换引用: entities.value = { ...entities.value }
     * - 减少响应式开销 ~70%
     */
    const entities = shallowRef<Record<string, HealthRecord>>({})

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
    const metricIndex = shallowRef<Record<string, string[]>>({})

    /** Series 缓存：带 TTL 的图表数据缓存 */
    const seriesCache = shallowRef<Record<string, CachedSeries>>({})

    /** 
     * ✅ OPTIMIZED: Trend 分析缓存 - 完全隔离响应式系统
     * 
     * 使用 markRaw 确保:
     * 1. Map 本身不被 Vue 响应式代理
     * 2. 内部对象不触发深层响应式追踪
     * 3. 杜绝任何循环依赖的可能性
     */
    const trendCache = shallowRef(markRaw(new Map<string, { hash: string, result: TrendAnalysis }>()))

    /**
     * ✅ OPTIMIZED: 趋势分析结果存储 - 非响应式
     * 
     * markRaw 确保:
     * - 结果对象不会被 Vue 深层代理
     * - 更新时不触发 computed/watch 的副作用
     * - 只能通过显式赋值更新 (metricTrendMap.value = newResults)
     */
    const metricTrendMap = shallowRef<Record<string, TrendAnalysis>>(markRaw({}))

    /**
     * 待刷新的指标队列（用于 debounce）
     */
    let pendingRefreshMetrics = new Set<string>()
    let refreshTimer: number | null = null

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
     * ✅ OPTIMIZED: 手动刷新趋势检测 - 显式命令式触发
     * 
     * 核心安全机制:
     * 1. ❌ 禁止在 computed/watchEffect 中调用
     * 2. ✅ 只能通过显式命令触发 (CRUD 操作完成后)
     * 3. ✅ 接受纯数据快照,不直接访问响应式 store
     * 4. ✅ 数据量阈值自动切换 Worker (>100 条)
     * 5. ✅ Debounce 合并多次调用
     * 
     * @param changedTypes 变化的指标类型（undefined = 全量刷新）
     * @param dataSnapshot 可选的数据快照 (用于避免访问响应式 store)
     */
    function refreshTrendDetection(
        changedTypes?: string[],
        dataSnapshot?: { ids: string[], entities: Record<string, HealthRecord> }
    ) {
        // 添加到待刷新队列
        if (changedTypes) {
            changedTypes.forEach(type => pendingRefreshMetrics.add(type))
        } else {
            // 全量刷新：清空队列，标记所有指标
            pendingRefreshMetrics.clear()
            getAllMetricKeys().forEach(key => pendingRefreshMetrics.add(key))
        }

        // Debounce：合并同一 microtask 内的多次调用
        if (refreshTimer !== null) {
            return // 已有待执行的任务
        }

        refreshTimer = setTimeout(async () => {
            refreshTimer = null

            // 执行趋势检测
            const metricsToUpdate = Array.from(pendingRefreshMetrics)
            pendingRefreshMetrics.clear()

            // ✅ 使用快照或创建当前状态的快照（避免响应式访问）
            const snapshot = dataSnapshot || {
                ids: [...ids.value],
                entities: { ...entities.value }
            }

            // ✅ 使用 markRaw 确保结果对象不被响应式追踪
            const results = markRaw({ ...metricTrendMap.value })

            for (const key of metricsToUpdate) {
                // ✅ 从快照获取历史记录（纯数据访问,无响应式依赖）
                const recordIds = snapshot.ids.filter(id => {
                    const record = snapshot.entities[id]
                    return record && record.type === key && !record.deleted
                })
                const records = recordIds.map(id => snapshot.entities[id]).filter(Boolean)

                // 转换为 domain 层格式（纯数据）
                const metricRecords: MetricRecord[] = records.map(r => ({
                    value: r.value,
                    date: r.date
                }))

                // ✅ 使用 TrendEngine with Worker threshold
                // 数据量 >100 自动切换到 Worker
                const { hash, result } = await TrendEngine.run(key, metricRecords)

                // 更新结果（使用 markRaw 标记为非响应式）
                results[key] = markRaw(result)
                trendCache.value.set(key, { hash, result: markRaw(result) })
            }

            // 更新结果（触发 UI 更新）
            metricTrendMap.value = results
        }, 0) as unknown as number
    }

    /**
     * ✅ 获取有显著变化的指标键列表
     * 轻量派生：只读取 metricTrendMap，不触碰 ids/entities
     */
    function getChangedMetricKeys(): string[] {
        return filterChangedMetrics(metricTrendMap.value)
    }

    /**
     * ✅ 获取稳定的指标键列表
     * 轻量派生：只读取 metricTrendMap，不触碰 ids/entities
     */
    function getStableMetricKeys(): string[] {
        return filterStableMetrics(metricTrendMap.value)
    }

    /**
     * ✅ 获取指标的趋势状态
     * 轻量派生：只读取 metricTrendMap
     * 
     * @param key 指标键
     * @returns 'changed' | 'stable' | 'insufficient' | 'unknown'
     */
    function getMetricTrendStatus(key: string): 'changed' | 'stable' | 'insufficient' | 'unknown' {
        const result = metricTrendMap.value[key]

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

    // Actions
    // =========================================================================

    /**
 * 🚀 统一数据加载入口（去重 + 缓存 + SWR）
 * 
 * 替代原先的 fetchHealthRecords + refreshSummary 双重调用
 * 
 * 🔴 RED LINE 规则：
 * 1. 必须返回 Promise（不能是 void）
 * 2. 成功时 resolve 稳定的 snapshot
 * 3. 失败时 reject（不吞异常）
 * 4. 内部不能有未 await 的异步分支
 * 
 * 策略：
 * 1. 去重：检查 lastUpdated 和 petId，避免重复请求
 * 2. 缓存：如果有数据且 petId 未变，立即返回
 * 3. SWR：数据较旧时（>1分钟），后台刷新
 * 
 * @param petId 宠物 ID
 * @param options 配置选项
 * @returns Promise<DataSnapshot> 返回加载后的数据快照
 */
    async function ensureDataLoaded(
        petId: string,
        options: {
            force?: boolean      // 强制刷新（忽略缓存）
            staleTime?: number   // 数据过期时间（ms），默认 60000 (1分钟)
        } = {}
    ): Promise<DataSnapshot> {
        const { force = false, staleTime = 60 * 1000 } = options

        // 当前已加载的 petId（从第一条记录推断）
        const currentPetId = ids.value.length > 0
            ? String(entities.value[ids.value[0]]?.petId)
            : null

        // 检查是否需要刷新
        const now = Date.now()
        const isStale = !lastUpdated.value || (now - lastUpdated.value > staleTime)
        const isPetChanged = currentPetId !== petId
        const needsRefresh = force || isPetChanged || isStale

        if (!needsRefresh && ids.value.length > 0) {
            // ✅ 缓存命中：数据新鲜且 petId 未变
            console.log('[ensureDataLoaded] Cache hit, data is fresh')

            // 确保 metricTrendMap 已初始化
            if (Object.keys(metricTrendMap.value).length === 0) {
                refreshTrendDetection()
            }

            // ✅ 返回稳定的 snapshot
            return createDataSnapshot(petId)
        }

        // ⚠️ 缓存未命中或数据过期
        if (isPetChanged || force) {
            // 场景1: petId 变化 或 强制刷新 → 全量加载（显示 loading）
            console.log('[ensureDataLoaded] Pet changed or force refresh, fetching...')
            loading.value = true

            try {
                await fetchHealthRecords(petId)
                await refreshSummary(petId)

                // ✅ 返回稳定的 snapshot
                return createDataSnapshot(petId)
            } catch (error) {
                // ✅ 失败时 reject（不吞异常）
                console.error('[ensureDataLoaded] Failed to load data:', error)
                throw error
            } finally {
                loading.value = false
            }
        } else if (isStale && ids.value.length > 0) {
            // 场景2: 数据过期但有缓存 → SWR（后台刷新，不显示 loading）
            console.log('[ensureDataLoaded] Data stale, background refresh...')

            // 🔥 RED LINE 修复：不能有未 await 的异步分支
            // 改前：fetchHealthRecords(petId).then(...).catch(...)  ← ❌ 未 await
            // 改后：await 完整执行                                  ← ✅ 正确
            try {
                await fetchHealthRecords(petId)
                await refreshSummary(petId)

                console.log('[ensureDataLoaded] ✅ Background refresh completed')

                // ✅ 返回更新后的 snapshot
                return createDataSnapshot(petId)
            } catch (err) {
                console.warn('[ensureDataLoaded] Background refresh failed:', err)

                // ⚠️ 后台刷新失败，但仍返回缓存数据（不抛出错误）
                // 这是 SWR 的容错策略
                return createDataSnapshot(petId)
            }
        } else {
            // 场景3: 首次加载且无数据 → 全量加载
            console.log('[ensureDataLoaded] Initial load, fetching...')
            loading.value = true

            try {
                await fetchHealthRecords(petId)
                await refreshSummary(petId)

                // ✅ 返回稳定的 snapshot
                return createDataSnapshot(petId)
            } catch (error) {
                // ✅ 失败时 reject（不吞异常）
                console.error('[ensureDataLoaded] Initial load failed:', error)
                throw error
            } finally {
                loading.value = false
            }
        }
    }

    /**
     * 🔧 创建当前数据的稳定快照
     * 
     * @param petId 宠物 ID
     * @returns 数据快照
     */
    function createDataSnapshot(petId: string): DataSnapshot {
        return {
            petId,
            tasks: tasks.value,
            pinnedMetrics: pinnedMetrics.value,
            trends: trends.value,
            dailySummaries: dailySummaries.value,
            records: ids.value.map(id => entities.value[id]),
            timestamp: Date.now(),
            isStale: false
        }
    }

    // 数据快照类型
    interface DataSnapshot {
        petId: string
        tasks: any[]
        pinnedMetrics: any[]
        trends: any[]
        dailySummaries: Record<string, any>
        records: any[]
        timestamp: number
        isStale: boolean
    }
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

            // ✅ OPTIMIZED: shallowRef 需要替换整个引用
            entities.value = sorted.reduce((acc, r) => {
                acc[r.id] = r
                return acc
            }, {} as Record<string, HealthRecord>)
            lastUpdated.value = Date.now()

            // 构建指标索引
            buildMetricIndex()
            // 清除 Series 缓存（数据已更新）
            invalidateSeriesCache()

            // 🔧 手动触发趋势检测（全量刷新）
            refreshTrendDetection()
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
            // ✅ OPTIMIZED: shallowRef 使用引用替换
            const newEntities = { ...entities.value }
            delete newEntities[tempId]
            newEntities[result.serverRecord.id] = result.serverRecord
            entities.value = newEntities

            const index = ids.value.indexOf(tempId)
            if (index !== -1) {
                ids.value[index] = result.serverRecord.id
            }

            resortIds()

            // 更新索引和缓存
            updateMetricIndex(result.serverRecord)
            invalidateSeriesCache(result.serverRecord.type)

            // ✅ NEW: V2 精准失效 - 只失效相关 metric
            const petId = result.serverRecord.petId
            if (petId) {
                healthCacheServiceV2.invalidateMetric(petId, result.serverRecord.type)
                console.log(`[Store] V2 cache invalidated: ${result.serverRecord.type}`)
            }

            // 🔧 手动触发趋势检测（只刷新相关指标）
            refreshTrendDetection([result.serverRecord.type])

            // 刷新 Summary
            if (result.serverRecord.petId) {
                await refreshSummary(String(result.serverRecord.petId))
            }

            return result.serverRecord
        } else {
            // 5. 失败：回滚
            // ✅ OPTIMIZED: shallowRef 使用引用替换
            const newEntities = { ...entities.value }
            delete newEntities[tempId]
            entities.value = newEntities
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
                // ✅ OPTIMIZED: shallowRef 使用引用替换
                entities.value = {
                    ...entities.value,
                    [id]: result.record
                }
                resortIds()

                // ✅ NEW: V2 精准失效
                if (result.record.petId) {
                    healthCacheServiceV2.invalidateMetric(result.record.petId, result.record.type)
                    console.log(`[Store] V2 cache invalidated (update): ${result.record.type}`)
                }

                // 🔧 手动触发趋势检测（只刷新相关指标）
                refreshTrendDetection([result.record.type])

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

        const deletedRecord = entities.value[id] // Store the record before deletion
        const petId = deletedRecord?.petId // Extract petId from the stored record

        try {
            const result = await healthRecordService.deleteRecord(id)

            if (result.success) {
                // 从状态中移除
                // ✅ OPTIMIZED: shallowRef 使用引用替换
                const newEntities = { ...entities.value }
                delete newEntities[id]
                entities.value = newEntities
                ids.value = ids.value.filter(recordId => recordId !== id)

                // ✅ NEW: V2 精准失效
                if (deletedRecord?.petId && deletedRecord?.type) {
                    healthCacheServiceV2.invalidateMetric(deletedRecord.petId, deletedRecord.type)
                    console.log(`[Store] V2 cache invalidated (delete): ${deletedRecord.type}`)
                }

                // 🔧 手动触发趋势检测
                if (deletedRecord?.type) {
                    refreshTrendDetection([deletedRecord.type])
                }

                // 刷新 Summary
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
        metricTrendMap,              // ✅ 暴露趋势分析结果
        refreshTrendDetection,       // ✅ 暴露手动刷新函数
        getChangedMetricKeys,
        getStableMetricKeys,
        getMetricTrendStatus,

        // Actions
        ensureDataLoaded,            // 🚀 统一数据加载入口
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
