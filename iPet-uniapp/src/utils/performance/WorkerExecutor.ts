/**
 * WorkerExecutor - Worker 线程执行器
 *
 * 目标：
 * - 数据量大时将趋势检测计算从主线程移走（避免卡 UI）
 * - 在 Worker 不可用/失败时由 TrendEngine 自动降级到主线程
 */

import type { TrendExecutor, TrendExecutorResult } from './TrendExecutor'
import type { MetricRecord, TrendAnalysis } from '@/domain/trend/detectSignificantChanges'

type WorkerRequest = {
    id: number
    metricKey: string
    records: MetricRecord[]
}

type WorkerResponse =
    | { id: number; metricKey: string; hash: string; result: TrendAnalysis }
    | { id: number; error: string }

export class WorkerExecutor implements TrendExecutor {
    private worker: Worker | null = null
    private nextId = 1
    private pending = new Map<number, { resolve: (r: TrendExecutorResult) => void; reject: (e: Error) => void }>()

    constructor() {
        if (typeof Worker === 'undefined') return

        try {
            this.worker = new Worker(new URL('../../workers/trendDetection.worker.ts', import.meta.url), {
                type: 'module'
            })

            this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
                const message = event.data
                const handler = this.pending.get(message.id)
                if (!handler) return
                this.pending.delete(message.id)

                if ('error' in message) {
                    handler.reject(new Error(message.error))
                    return
                }

                handler.resolve({
                    metricKey: message.metricKey,
                    hash: message.hash,
                    result: message.result
                })
            }

            this.worker.onerror = (event: ErrorEvent) => {
                const error = new Error(event.message || 'Worker error')
                for (const { reject } of this.pending.values()) reject(error)
                this.pending.clear()
            }
        } catch {
            this.worker = null
        }
    }

    isAvailable(): boolean {
        return this.worker !== null
    }

    execute(metricKey: string, records: MetricRecord[]): Promise<TrendExecutorResult> {
        if (!this.worker) {
            return Promise.reject(new Error('WorkerExecutor is not available'))
        }

        const id = this.nextId++
        const payload: WorkerRequest = { id, metricKey, records }

        return new Promise<TrendExecutorResult>((resolve, reject) => {
            this.pending.set(id, { resolve, reject })
            try {
                this.worker!.postMessage(payload)
            } catch (err) {
                this.pending.delete(id)
                reject(err instanceof Error ? err : new Error(String(err)))
            }
        })
    }

    dispose(): void {
        this.worker?.terminate()
        this.worker = null

        const error = new Error('WorkerExecutor disposed')
        for (const { reject } of this.pending.values()) reject(error)
        this.pending.clear()
    }
}

