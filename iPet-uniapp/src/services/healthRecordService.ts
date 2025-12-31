/**
 * HealthRecordService - 健康记录业务逻辑服务
 * 
 * 职责：
 * - 封装乐观更新逻辑
 * - 处理记录 CRUD 的业务流程
 * - 错误处理与回滚策略
 * 
 * 设计原则：
 * - Service 不持有状态，只处理业务逻辑
 * - 返回操作结果供 Store 更新状态
 * - 纯函数风格，便于测试
 */

import { healthService } from './health.service'
import { sortRecordsByTime } from '@/utils/business/healthDataHelper'
import { shouldBlockOfflineHealthWrite, showOfflineToast } from '@/utils/common/networkUtils'
import type { HealthRecord } from '@/types/health'

// ============================================================================
// Types
// ============================================================================

/** 乐观更新记录的结构 */
export interface OptimisticRecord extends HealthRecord {
    tempId: string
    isPending: true
}

/** 创建记录操作的结果 */
export interface CreateRecordResult {
    success: boolean
    optimisticRecord: OptimisticRecord
    serverRecord?: HealthRecord
    error?: Error
}

/** 更新记录操作的结果 */
export interface UpdateRecordResult {
    success: boolean
    record?: HealthRecord
    error?: Error
}

/** 删除记录操作的结果 */
export interface DeleteRecordResult {
    success: boolean
    deletedId: string
    error?: Error
}

/** Pinned Metric 乐观更新信息 */
export interface PinnedMetricUpdate {
    key: string
    value: number | string
    numericValue: number
    date: string
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * 生成临时 ID
 */
function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * 构建乐观更新的临时记录
 */
function buildOptimisticRecord(record: Partial<HealthRecord>): OptimisticRecord {
    const tempId = generateTempId()
    return {
        ...record,
        id: tempId,
        tempId,
        updatedAt: Date.now(),
        status: 'pending',
        isPending: true
    } as OptimisticRecord
}

/**
 * 合并服务端返回的记录与本地 metadata
 * 某些后端可能会剥离 metadata，需要保留本地的
 */
function mergeServerRecord(
    serverRecord: HealthRecord,
    localRecord: Partial<HealthRecord>
): HealthRecord {
    if (localRecord.metadata && (!serverRecord.metadata || Object.keys(serverRecord.metadata).length === 0)) {
        return {
            ...serverRecord,
            metadata: { ...serverRecord.metadata, ...localRecord.metadata }
        }
    }
    return serverRecord
}

/**
 * 计算 Pinned Metric 的乐观更新信息
 */
function buildPinnedMetricUpdate(
    record: Partial<HealthRecord>,
    timestamp: number
): PinnedMetricUpdate | null {
    if (!record.type || record.value === undefined) return null

    return {
        key: record.type,
        value: record.value,
        numericValue: Number(record.value),
        date: new Date(timestamp).toISOString()
    }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * 创建健康记录（含乐观更新支持）
 * 
 * @param record - 要创建的记录
 * @returns 包含乐观记录和服务端记录的结果
 * 
 * @example
 * const result = await healthRecordService.createRecord({ type: 'weight', value: 5.2 })
 * if (result.success) {
 *   // 用 result.serverRecord 替换 result.optimisticRecord
 * } else {
 *   // 回滚 result.optimisticRecord
 * }
 */
export async function createRecord(
    record: Partial<HealthRecord>
): Promise<CreateRecordResult> {
    const optimisticRecord = buildOptimisticRecord(record)

    // 离线检查：小程序端健康写入不走离线队列（PRD 4.2 节）
    if (shouldBlockOfflineHealthWrite()) {
        showOfflineToast('当前为离线模式，暂不支持新增记录')
        return {
            success: false,
            optimisticRecord,
            error: new Error('OFFLINE_BLOCKED')
        }
    }

    try {
        const serverRecord = await healthService.createHealthRecord(record)
        const mergedRecord = mergeServerRecord(serverRecord, record)

        return {
            success: true,
            optimisticRecord,
            serverRecord: mergedRecord
        }
    } catch (error) {
        return {
            success: false,
            optimisticRecord,
            error: error instanceof Error ? error : new Error(String(error))
        }
    }
}

/**
 * 更新健康记录
 * 
 * @param id - 记录 ID
 * @param payload - 更新内容
 * @returns 更新结果
 */
export async function updateRecord(
    id: string,
    payload: Partial<HealthRecord>
): Promise<UpdateRecordResult> {
    // 离线检查
    if (shouldBlockOfflineHealthWrite()) {
        showOfflineToast('当前为离线模式，暂不支持更新记录')
        return {
            success: false,
            error: new Error('OFFLINE_BLOCKED')
        }
    }

    try {
        const record = await healthService.updateHealthRecord(id, payload)
        return {
            success: true,
            record
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error))
        }
    }
}

/**
 * 删除健康记录
 * 
 * @param id - 记录 ID
 * @returns 删除结果
 */
export async function deleteRecord(id: string): Promise<DeleteRecordResult> {
    // 离线检查
    if (shouldBlockOfflineHealthWrite()) {
        showOfflineToast('当前为离线模式，暂不支持删除记录')
        return {
            success: false,
            deletedId: id,
            error: new Error('OFFLINE_BLOCKED')
        }
    }

    try {
        await healthService.deleteHealthRecord(id)
        return {
            success: true,
            deletedId: id
        }
    } catch (error) {
        return {
            success: false,
            deletedId: id,
            error: error instanceof Error ? error : new Error(String(error))
        }
    }
}

/**
 * 排序记录数组并返回 ID 列表
 * 
 * @param entities - 记录实体映射
 * @param ids - 当前 ID 列表
 * @returns 排序后的 ID 列表
 */
export function getSortedIds(
    entities: Record<string, HealthRecord>,
    ids: string[]
): string[] {
    const records = ids.map(id => entities[id]).filter(Boolean)
    const sorted = sortRecordsByTime(records, 'desc')
    return sorted.map(r => r.id)
}

// ============================================================================
// Export as service object (for consistency with existing pattern)
// ============================================================================

export const healthRecordService = {
    createRecord,
    updateRecord,
    deleteRecord,
    getSortedIds,
    buildOptimisticRecord,
    buildPinnedMetricUpdate,
    generateTempId
}

export default healthRecordService
