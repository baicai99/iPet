/**
 * TrendExecutor - 趋势检测执行器接口
 * 
 * 可插拔架构：支持主线程和 Worker 两种实现
 */

import type { TrendAnalysis, MetricRecord } from '@/domain/trend/detectSignificantChanges'

/**
 * 执行器返回结果
 */
export interface TrendExecutorResult {
    /** 指标键 */
    metricKey: string
    /** 数据哈希（用于缓存检查） */
    hash: string
    /** 趋势分析结果 */
    result: TrendAnalysis
}

/**
 * 趋势检测执行器接口
 */
export interface TrendExecutor {
    /**
     * 执行趋势检测
     * @param metricKey 指标键
     * @param records 记录数组
     * @returns Promise<TrendExecutorResult>
     */
    execute(metricKey: string, records: MetricRecord[]): Promise<TrendExecutorResult>

    /**
     * 检查执行器是否可用
     */
    isAvailable(): boolean

    /**
     * 清理资源（如 Worker 终止）
     */
    dispose(): void
}
