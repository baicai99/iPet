/**
 * Incremental Aggregator - 增量聚合器
 * 
 * 避免每次 mutation 全量重算：
 * - 按日索引维护聚合点
 * - 增删改只影响对应天
 * - 支持脏标记，只重算脏数据
 */

import type { AggregationMethod } from '@/types/health'
import { dayKey, startOfDayMs, weekKey, monthKey } from '@/utils/fastTime'

// ============================================================================
// Types
// ============================================================================

/** 日级聚合条目 */
interface DailyEntry {
    /** 聚合值（sum 模式下为总和，用于后续计算 avg） */
    sum: number
    /** 记录数量 */
    count: number
    /** 最大值 */
    max: number
    /** 最小值 */
    min: number
    /** 最新值（按时间排序） */
    latest: number
    /** 最新记录时间戳 */
    latestTs: number
    /** 记录 ID 列表 */
    recordIds: string[]
}

/** 日聚合点 */
export interface DailyPoint {
    date: string
    ts: number
    value: number | null
    count: number
}

/** 聚合器配置 */
interface AggregatorConfig {
    aggregationMethod: AggregationMethod
}

// ============================================================================
// IncrementalAggregator Class
// ============================================================================

/**
 * 增量聚合器
 * 
 * 维护按日索引的聚合点，支持增量更新。
 */
export class IncrementalAggregator {
    /** 按日索引的聚合条目 */
    private map: Map<string, DailyEntry> = new Map()

    /** 脏日期集合（需要重新计算的日期） */
    private dirtyDays: Set<string> = new Set()

    /** 脏桶集合（周/月级别） */
    private dirtyBuckets: Set<string> = new Set()

    /** 聚合配置 */
    private config: AggregatorConfig

    constructor(config: AggregatorConfig) {
        this.config = config
    }

    // =========================================================================
    // Record Operations
    // =========================================================================

    /**
     * 添加记录（增量更新）
     */
    addRecord(record: { id: string; ts: number; value: number }): void {
        const key = dayKey(record.ts)
        const entry = this.getOrCreateEntry(key)

        entry.sum += record.value
        entry.count += 1
        entry.max = Math.max(entry.max, record.value)
        entry.min = Math.min(entry.min, record.value)
        entry.recordIds.push(record.id)

        // 更新 latest
        if (record.ts > entry.latestTs) {
            entry.latest = record.value
            entry.latestTs = record.ts
        }

        this.markDirty(key, record.ts)
    }

    /**
     * 移除记录（增量更新）
     * 
     * 注意：移除后需要重算 max/min/latest，这里只标记脏
     */
    removeRecord(record: { id: string; ts: number; value: number }): void {
        const key = dayKey(record.ts)
        const entry = this.map.get(key)

        if (!entry) return

        entry.sum -= record.value
        entry.count -= 1
        entry.recordIds = entry.recordIds.filter(id => id !== record.id)

        // max/min/latest 需要重算，标记为脏
        this.markDirty(key, record.ts)

        // 如果记录数为 0，删除条目
        if (entry.count <= 0) {
            this.map.delete(key)
        }
    }

    /**
     * 更新记录（增量更新）
     */
    updateRecord(
        oldRecord: { id: string; ts: number; value: number },
        newRecord: { id: string; ts: number; value: number }
    ): void {
        // 如果日期变了，需要两边都更新
        const oldKey = dayKey(oldRecord.ts)
        const newKey = dayKey(newRecord.ts)

        if (oldKey !== newKey) {
            this.removeRecord(oldRecord)
            this.addRecord(newRecord)
        } else {
            // 同一天，增量更新
            const entry = this.map.get(oldKey)
            if (entry) {
                entry.sum = entry.sum - oldRecord.value + newRecord.value
                // max/min/latest 需要重算
                this.markDirty(oldKey, newRecord.ts)
            }
        }
    }

    // =========================================================================
    // Batch Operations
    // =========================================================================

    /**
     * 批量初始化（全量构建）
     */
    buildFromRecords(records: Array<{ id: string; ts: number; value: number }>): void {
        this.clear()

        for (const record of records) {
            const key = dayKey(record.ts)
            const entry = this.getOrCreateEntry(key)

            entry.sum += record.value
            entry.count += 1
            entry.max = Math.max(entry.max, record.value)
            entry.min = Math.min(entry.min, record.value)
            entry.recordIds.push(record.id)

            if (record.ts > entry.latestTs) {
                entry.latest = record.value
                entry.latestTs = record.ts
            }
        }

        // 初始化后清除脏标记
        this.clearDirty()
    }

    /**
     * 清空聚合器
     */
    clear(): void {
        this.map.clear()
        this.dirtyDays.clear()
        this.dirtyBuckets.clear()
    }

    // =========================================================================
    // Query Methods
    // =========================================================================

    /**
     * 获取日聚合点列表
     */
    getDailyPoints(): DailyPoint[] {
        const points: DailyPoint[] = []

        this.map.forEach((entry, date) => {
            points.push({
                date,
                ts: startOfDayMs(Date.parse(date + 'T00:00:00')),
                value: this.computeValue(entry),
                count: entry.count
            })
        })

        // 按日期排序
        return points.sort((a, b) => a.ts - b.ts)
    }

    /**
     * 获取指定日期范围的日聚合点
     */
    getDailyPointsInRange(fromTs: number, toTs: number): DailyPoint[] {
        const fromKey = dayKey(fromTs)
        const toKey = dayKey(toTs)

        return this.getDailyPoints().filter(p => p.date >= fromKey && p.date <= toKey)
    }

    /**
     * 获取指定日期的聚合值
     */
    getDayValue(date: string): number | null {
        const entry = this.map.get(date)
        return entry ? this.computeValue(entry) : null
    }

    /**
     * 检查是否有数据
     */
    hasData(): boolean {
        return this.map.size > 0
    }

    /**
     * 获取数据天数
     */
    getDayCount(): number {
        return this.map.size
    }

    // =========================================================================
    // Dirty Tracking
    // =========================================================================

    /**
     * 标记日期为脏
     */
    private markDirty(dayKeyStr: string, ts: number): void {
        this.dirtyDays.add(dayKeyStr)
        this.dirtyBuckets.add(weekKey(ts))
        this.dirtyBuckets.add(monthKey(ts))
    }

    /**
     * 获取脏日期列表
     */
    getDirtyDays(): string[] {
        return [...this.dirtyDays]
    }

    /**
     * 获取脏桶列表
     */
    getDirtyBuckets(): string[] {
        return [...this.dirtyBuckets]
    }

    /**
     * 检查是否有脏数据
     */
    isDirty(): boolean {
        return this.dirtyDays.size > 0
    }

    /**
     * 清除脏标记
     */
    clearDirty(): void {
        this.dirtyDays.clear()
        this.dirtyBuckets.clear()
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    /**
     * 获取或创建日条目
     */
    private getOrCreateEntry(key: string): DailyEntry {
        let entry = this.map.get(key)
        if (!entry) {
            entry = {
                sum: 0,
                count: 0,
                max: -Infinity,
                min: Infinity,
                latest: 0,
                latestTs: 0,
                recordIds: []
            }
            this.map.set(key, entry)
        }
        return entry
    }

    /**
     * 根据聚合方式计算值
     */
    private computeValue(entry: DailyEntry): number {
        if (entry.count === 0) return 0

        switch (this.config.aggregationMethod) {
            case 'sum':
                return entry.sum
            case 'avg':
                return Number((entry.sum / entry.count).toFixed(2))
            case 'max':
                return entry.max
            case 'min':
                return entry.min
            case 'latest':
            default:
                return entry.latest
        }
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建增量聚合器
 */
export function createAggregator(method: AggregationMethod): IncrementalAggregator {
    return new IncrementalAggregator({ aggregationMethod: method })
}
