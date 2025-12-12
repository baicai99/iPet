/**
 * Health Event Bus - 健康模块事件总线
 * 
 * 用于 Entity Store 和 Query Store 之间的松耦合通信。
 * Entity 变更时发布事件，Query Store 订阅并标记脏数据。
 */

import mitt from 'mitt'

// ============================================================================
// Event Types
// ============================================================================

/** 记录变更事件 payload */
export interface RecordChangeEvent {
    /** 指标键 */
    metricKey: string
    /** 宠物 ID */
    petId: string
    /** 记录 ID（更新/删除时有） */
    recordId?: string
}

/** 批量变更事件 payload */
export interface BulkChangeEvent {
    /** 宠物 ID */
    petId: string
    /** 影响的指标列表 */
    metricKeys: string[]
}

/** 健康模块事件映射 */
type HealthEvents = {
    /** 单条记录新增 */
    'record:added': RecordChangeEvent
    /** 单条记录更新 */
    'record:updated': RecordChangeEvent
    /** 单条记录删除 */
    'record:deleted': RecordChangeEvent
    /** 批量记录加载 */
    'records:loaded': BulkChangeEvent
    /** 批量记录删除（按 petId） */
    'records:cleared': BulkChangeEvent
    /** 请求刷新 Summary */
    'summary:invalidate': { petId: string }
    /** 请求刷新特定 Series */
    'series:invalidate': { metricKey: string; range?: string }
}

// ============================================================================
// Event Bus Instance
// ============================================================================

/** 健康模块事件总线（单例） */
export const healthEventBus = mitt<HealthEvents>()

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 发布记录变更事件
 */
export function emitRecordChange(
    type: 'added' | 'updated' | 'deleted',
    payload: RecordChangeEvent
): void {
    healthEventBus.emit(`record:${type}`, payload)
}

/**
 * 发布批量变更事件
 */
export function emitBulkChange(
    type: 'loaded' | 'cleared',
    payload: BulkChangeEvent
): void {
    healthEventBus.emit(`records:${type}`, payload)
}

/**
 * 发布失效请求
 */
export function emitInvalidate(
    target: 'summary' | 'series',
    payload: { petId?: string; metricKey?: string; range?: string }
): void {
    if (target === 'summary') {
        healthEventBus.emit('summary:invalidate', { petId: payload.petId || '' })
    } else {
        healthEventBus.emit('series:invalidate', {
            metricKey: payload.metricKey || '',
            range: payload.range
        })
    }
}
