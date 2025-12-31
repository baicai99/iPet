/**
 * Health Entity Store - 健康记录实体存储
 * 
 * 职责：
 * - 存储原始健康记录（ids, entities）
 * - 维护索引（按 petId, 按 metricKey）
 * - 提供 CRUD 操作
 * - 发布变更事件给 Query Store
 * 
 * 设计原则：
 * - 只存原始数据，不存派生数据
 * - 变更时发布事件，由 Query Store 决定是否重算
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { HealthRecord } from '@/types/health'
import { parseTimestamp, sortRecordsByTime } from '@/utils/business/healthDataHelper'
import { healthRecordService } from '@/services/healthRecordService'
import { healthService } from '@/services/health.service'
import { emitRecordChange, emitBulkChange } from './healthEventBus'

// ============================================================================
// Store Definition
// ============================================================================

export const useHealthEntityStore = defineStore('healthEntity', () => {
    // =========================================================================
    // State
    // =========================================================================

    /** 记录 ID 列表（按时间降序） */
    const ids = ref<string[]>([])

    /** 记录实体映射 */
    const entities = ref<Record<string, HealthRecord>>({})

    /** 加载状态 */
    const loading = ref(false)

    /** 错误信息 */
    const error = ref<string | null>(null)

    /** 最后更新时间 */
    const lastUpdated = ref<number | null>(null)

    // =========================================================================
    // Indexes
    // =========================================================================

    /** 指标索引：metricKey -> recordIds */
    const indexByMetric = ref<Record<string, string[]>>({})

    // =========================================================================
    // Computed Getters
    // =========================================================================

    /** 所有健康记录（已排序） */
    const allRecords = computed<HealthRecord[]>(() =>
        ids.value.map(id => entities.value[id]).filter(Boolean)
    )

    /** 按宠物 ID 分组的记录 */
    const indexByPetId = computed<Record<string, HealthRecord[]>>(() => {
        const map: Record<string, HealthRecord[]> = {}
        ids.value.forEach(id => {
            const record = entities.value[id]
            if (!record) return
            const pId = String(record.petId)
            if (!map[pId]) map[pId] = []
            map[pId].push(record)
        })
        return map
    })

    // =========================================================================
    // Index Management
    // =========================================================================

    /** 重新排序 ids */
    function resortIds() {
        const records = ids.value.map(id => entities.value[id]).filter(Boolean)
        const sorted = sortRecordsByTime(records, 'desc')
        ids.value = sorted.map(r => r.id)
    }

    /** 构建指标索引 */
    function rebuildMetricIndex() {
        const index: Record<string, string[]> = {}
        ids.value.forEach(id => {
            const record = entities.value[id]
            if (record?.type && !record.deleted) {
                if (!index[record.type]) index[record.type] = []
                index[record.type].push(id)
            }
        })
        indexByMetric.value = index
    }

    /** 添加记录到索引 */
    function addToIndex(record: HealthRecord) {
        if (!record.type || record.deleted) return
        const list = indexByMetric.value[record.type] || []
        if (!list.includes(record.id)) {
            indexByMetric.value[record.type] = [record.id, ...list]
        }
    }

    /** 从索引移除记录 */
    function removeFromIndex(id: string, type?: string) {
        if (type && indexByMetric.value[type]) {
            indexByMetric.value[type] = indexByMetric.value[type].filter(rid => rid !== id)
        } else {
            Object.keys(indexByMetric.value).forEach(key => {
                indexByMetric.value[key] = indexByMetric.value[key].filter(rid => rid !== id)
            })
        }
    }

    // =========================================================================
    // Query Helpers
    // =========================================================================

    /** 获取指定指标的历史记录（降序） */
    function getMetricHistory(metricKey: string): HealthRecord[] {
        const indexedIds = indexByMetric.value[metricKey]
        if (indexedIds?.length) {
            return indexedIds
                .map(id => entities.value[id])
                .filter(r => r && !r.deleted)
        }
        // 回退到全量扫描
        return ids.value
            .map(id => entities.value[id])
            .filter(r => r?.type === metricKey && !r.deleted)
    }

    /** 获取宠物的所有记录 */
    function getRecordsByPetId(petId: string): HealthRecord[] {
        return indexByPetId.value[petId] || []
    }

    // =========================================================================
    // CRUD Actions
    // =========================================================================

    /**
     * 加载健康记录
     */
    async function fetchRecords(petId?: string) {
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
            rebuildMetricIndex()

            // 发布批量加载事件
            const metricKeys = [...new Set(sorted.map(r => r.type).filter(Boolean))] as string[]
            emitBulkChange('loaded', { petId: petId || '', metricKeys })

        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch records'
            console.error('[HealthEntityStore] fetchRecords failed:', err)
        } finally {
            loading.value = false
        }
    }

    /**
     * 添加记录（含乐观更新）
     */
    async function addRecord(record: Partial<HealthRecord>): Promise<HealthRecord> {
        const optimisticRecord = healthRecordService.buildOptimisticRecord(record)
        const tempId = optimisticRecord.tempId

        // 乐观更新
        entities.value[tempId] = optimisticRecord
        ids.value = [tempId, ...ids.value]
        addToIndex(optimisticRecord)

        try {
            const result = await healthRecordService.createRecord(record)

            if (result.success && result.serverRecord) {
                // 替换临时记录
                delete entities.value[tempId]
                removeFromIndex(tempId, optimisticRecord.type)

                entities.value[result.serverRecord.id] = result.serverRecord
                const idx = ids.value.indexOf(tempId)
                if (idx !== -1) ids.value[idx] = result.serverRecord.id

                resortIds()
                addToIndex(result.serverRecord)

                // 发布事件
                emitRecordChange('added', {
                    metricKey: result.serverRecord.type,
                    petId: String(result.serverRecord.petId),
                    recordId: result.serverRecord.id
                })

                return result.serverRecord
            } else {
                throw result.error || new Error('Failed to add record')
            }
        } catch (err) {
            // 回滚
            delete entities.value[tempId]
            ids.value = ids.value.filter(id => id !== tempId)
            removeFromIndex(tempId, optimisticRecord.type)
            throw err
        }
    }

    /**
     * 更新记录
     */
    async function updateRecord(id: string, payload: Partial<HealthRecord>): Promise<HealthRecord> {
        const original = entities.value[id]
        loading.value = true
        error.value = null

        try {
            const result = await healthRecordService.updateRecord(id, payload)

            if (result.success && result.record) {
                entities.value[id] = result.record
                resortIds()

                // 发布事件
                emitRecordChange('updated', {
                    metricKey: result.record.type,
                    petId: String(result.record.petId),
                    recordId: id
                })

                return result.record
            } else {
                throw result.error || new Error('Failed to update record')
            }
        } finally {
            loading.value = false
        }
    }

    /**
     * 删除记录
     */
    async function deleteRecord(id: string): Promise<void> {
        const record = entities.value[id]
        if (!record) return

        loading.value = true
        error.value = null

        try {
            const result = await healthRecordService.deleteRecord(id)

            if (result.success) {
                delete entities.value[id]
                ids.value = ids.value.filter(i => i !== id)
                removeFromIndex(id, record.type)

                // 发布事件
                emitRecordChange('deleted', {
                    metricKey: record.type,
                    petId: String(record.petId),
                    recordId: id
                })
            } else {
                throw result.error || new Error('Failed to delete record')
            }
        } finally {
            loading.value = false
        }
    }

    /**
     * 按宠物删除所有记录（本地）
     */
    function removeRecordsByPetId(petId: string): void {
        const toRemove = ids.value.filter(id =>
            String(entities.value[id]?.petId) === String(petId)
        )

        const metricKeys = new Set<string>()
        toRemove.forEach(id => {
            const record = entities.value[id]
            if (record?.type) metricKeys.add(record.type)
            delete entities.value[id]
        })

        ids.value = ids.value.filter(id => entities.value[id])
        rebuildMetricIndex()

        // 发布事件
        emitBulkChange('cleared', { petId, metricKeys: [...metricKeys] })
    }

    // =========================================================================
    // Return
    // =========================================================================

    return {
        // State
        ids,
        entities,
        loading,
        error,
        lastUpdated,
        indexByMetric,

        // Getters
        allRecords,
        indexByPetId,
        getMetricHistory,
        getRecordsByPetId,

        // Actions
        fetchRecords,
        addRecord,
        updateRecord,
        deleteRecord,
        removeRecordsByPetId,
        rebuildMetricIndex
    }
}, {
    persist: {
        pick: ['ids', 'entities', 'lastUpdated']
    }
})
