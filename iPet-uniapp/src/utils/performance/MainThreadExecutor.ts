/**
 * MainThreadExecutor - 主线程执行器
 * 
 * 默认执行器，直接在主线程执行趋势检测
 * 
 * 特点：
 * - ✅ 零风险：不依赖 Worker API，所有平台可用
 * - ✅ 零通信开销：同步执行
 * - ⚠️ 阻塞 UI：大数据量时可能影响性能
 */

import type { TrendExecutor, TrendExecutorResult } from './TrendExecutor'
import type { MetricRecord } from '@/domain/trend/detectSignificantChanges'
import { detectSignificantChange } from '@/domain/trend/detectSignificantChanges'

/**
 * 计算指标数据哈希（用于缓存检查）
 */
function calculateMetricHash(records: MetricRecord[]): string {
    if (records.length === 0) return '0:0'
    const lastTimestamp = records[records.length - 1].date || '0'
    return `${lastTimestamp}:${records.length}`
}

export class MainThreadExecutor implements TrendExecutor {
    isAvailable(): boolean {
        return true  // 主线程总是可用
    }

    async execute(metricKey: string, records: MetricRecord[]): Promise<TrendExecutorResult> {
        // ✅ 直接在主线程执行（同步转异步，保持接口一致）
        const hash = calculateMetricHash(records)
        const result = detectSignificantChange(records)

        return {
            metricKey,
            hash,
            result
        }
    }

    dispose(): void {
        // 主线程无需清理资源
    }
}
