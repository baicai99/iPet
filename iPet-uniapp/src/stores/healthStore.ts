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

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getMetricMetadata } from '@/data/metricMetadata'
import { healthSummaryService } from '@/services/healthSummaryService'
import { healthService } from '@/services/health.service'
import { healthRecordService } from '@/services/healthRecordService'
import type { HealthRecord } from '@shared/types/health'
import { parseTimestamp, sortRecordsByTime, getMetricSeries } from '@/utils/business/healthDataHelper'
import { processPinnedMetrics, processTrendMetrics } from '@/utils/business/healthSummaryHelper'

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

    /** 获取指定类型的历史记录 (降序) */
    const metricHistory = (key: string): HealthRecord[] => {
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
    // Internal Helpers
    // =========================================================================

    /** 重新排序 ids */
    function resortIds() {
        const records = ids.value.map(id => entities.value[id]).filter(Boolean)
        const sorted = sortRecordsByTime(records, 'desc')
        ids.value = sorted.map(r => r.id)
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
     * 生成图表数据序列
     */
    function getMetricSeriesData(key: string, range: string) {
        const history = metricHistory(key) || []
        return getMetricSeries(history, range)
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

        // Getters
        healthRecords,
        recordsByPetId,
        metricHistory,
        latestMetrics,
        getDailySummary,

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
        fetchHistoryRecords,
        togglePin
    }
}, {
    // Persist 配置
    persist: {
        pick: ['ids', 'entities', 'tasks', 'pinnedMetrics', 'trends', 'dailySummaries', 'lastUpdated']
    }
})
