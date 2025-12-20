/**
 * TrendEngine - 趋势检测引擎（统一入口）
 * 
 * 可插拔执行器架构：
 * - MainThreadExecutor（默认，零风险）
 * - WorkerExecutor（可选，Phase 2 实现）
 * 
 * 特性：
 * - 自动选择执行器（基于数据量和配置）
 * - 自动降级（Worker 失败时回退到主线程）
 * - 运行时配置更新
 */

import { MainThreadExecutor } from './MainThreadExecutor'
import { WorkerExecutor } from './WorkerExecutor'
import type { TrendExecutor, TrendExecutorResult } from './TrendExecutor'
import type { MetricRecord } from '@/domain/trend/detectSignificantChanges'

interface TrendEngineConfig {
    /** 优先使用 Worker（Phase 2 功能） */
    preferWorker?: boolean
    /** 记录数超过此值才考虑用 Worker */
    workerThreshold?: number
}

class TrendEngineInstance {
    private mainThreadExecutor: TrendExecutor
    private workerExecutor: TrendExecutor | null = null
    private config: Required<TrendEngineConfig>

    constructor(config: TrendEngineConfig = {}) {
        this.config = {
            preferWorker: false,  // 默认主线程
            workerThreshold: 100,
            ...config
        }

        // 初始化主线程执行器（总是可用）
        this.mainThreadExecutor = new MainThreadExecutor()

        // WorkerExecutor 初始化（按需启用，且内部会自行判断平台可用性）
        if (this.config.preferWorker) {
            this.workerExecutor = new WorkerExecutor()
        }
    }

    /**
     * 选择执行器（策略模式）
     */
    private selectExecutor(records: MetricRecord[]): TrendExecutor {
        // 策略1: Worker 未启用或不可用
        if (!this.config.preferWorker || !this.workerExecutor) {
            return this.mainThreadExecutor
        }

        // 策略2: 数据量小，用主线程（避免通信开销）
        if (records.length < this.config.workerThreshold) {
            return this.mainThreadExecutor
        }

        // 策略3: Worker 可用且数据量大
        if (this.workerExecutor.isAvailable()) {
            return this.workerExecutor
        }

        // 策略4: 降级到主线程
        return this.mainThreadExecutor
    }

    /**
     * 执行趋势检测（统一入口）
     * 
     * @param metricKey 指标键
     * @param records 记录数组
     * @returns Promise<TrendExecutorResult>
     */
    async run(metricKey: string, records: MetricRecord[]): Promise<TrendExecutorResult> {
        const executor = this.selectExecutor(records)

        try {
            return await executor.execute(metricKey, records)
        } catch (error) {
            // Worker 失败时自动降级到主线程
            if (executor !== this.mainThreadExecutor) {
                console.warn(`[TrendEngine] Executor failed, fallback to main thread`, error)
                return await this.mainThreadExecutor.execute(metricKey, records)
            }
            throw error
        }
    }

    /**
     * 更新配置（运行时调整）
     */
    updateConfig(config: Partial<TrendEngineConfig>) {
        Object.assign(this.config, config)
    }

    /**
     * 获取当前配置
     */
    getConfig(): Readonly<Required<TrendEngineConfig>> {
        return { ...this.config }
    }

    /**
     * 清理资源
     */
    dispose() {
        this.mainThreadExecutor.dispose()
        this.workerExecutor?.dispose()
    }
}

/**
 * 单例导出
 * 
 * Phase 1 配置：
 * - preferWorker: false（仅使用主线程）
 * - workerThreshold: 100（为 Phase 2 预留）
 */
export const TrendEngine = new TrendEngineInstance({
    preferWorker: true,
    workerThreshold: 100
})
