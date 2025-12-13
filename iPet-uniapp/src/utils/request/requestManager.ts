/**
 * Request Manager - Deduplication & Cancellation
 * 
 * 职责：
 * - 请求去重：同一个 key 的并发请求复用同一个 Promise
 * - 请求取消：支持 AbortController 取消进行中的请求
 * - 自动清理：请求完成后自动从 pending 中移除
 * 
 * 设计原则：
 * - 零依赖：不依赖任何框架
 * - 类型安全：完整的 TypeScript 支持
 * - 内存安全：自动清理完成的请求
 */

// ============================================================================
// Types
// ============================================================================

/**
 * 请求键（用于标识唯一请求）
 */
type RequestKey = string

/**
 * 待处理请求
 */
interface PendingRequest<T> {
    /** Promise 实例 */
    promise: Promise<T>
    /** 取消函数 */
    abort: () => void
    /** 创建时间戳 */
    timestamp: number
}

/**
 * 执行选项
 */
interface ExecuteOptions {
    /** 是否取消之前的同 key 请求（默认 false，即复用） */
    cancelPrevious?: boolean
}

// ============================================================================
// Request Manager Class
// ============================================================================

class RequestManager {
    /** 待处理请求映射 */
    private pending = new Map<RequestKey, PendingRequest<any>>()

    /**
     * 执行请求，带去重和取消功能
     * 
     * @param key 请求唯一标识（如 "summary:pet-123"）
     * @param executor 执行函数，接收 AbortSignal
     * @param options 执行选项
     * @returns Promise 结果
     * 
     * @example
     * ```typescript
     * // 自动去重
     * const p1 = manager.execute('key1', async (signal) => {
     *   return fetch('/api/data', { signal })
     * })
     * const p2 = manager.execute('key1', ...) // 复用 p1
     * 
     * // 取消旧请求
     * manager.execute('key1', ..., { cancelPrevious: true })
     * ```
     */
    async execute<T>(
        key: RequestKey,
        executor: (signal: AbortSignal) => Promise<T>,
        options: ExecuteOptions = {}
    ): Promise<T> {
        // 检查是否有同 key 的进行中请求
        const existing = this.pending.get(key)

        if (existing) {
            if (options.cancelPrevious) {
                // 取消旧请求
                existing.abort()
                this.pending.delete(key)
            } else {
                // 复用现有 Promise
                console.log(`[RequestManager] Reusing pending request: ${key}`)
                return existing.promise
            }
        }

        // 创建新请求
        const controller = new AbortController()
        const promise = executor(controller.signal)
            .finally(() => {
                // 请求完成后自动清理
                this.pending.delete(key)
            })

        // 保存到 pending
        this.pending.set(key, {
            promise,
            abort: () => {
                console.log(`[RequestManager] Aborting request: ${key}`)
                controller.abort()
            },
            timestamp: Date.now()
        })

        return promise
    }

    /**
     * 取消匹配正则的所有请求
     * 
     * @param pattern 匹配模式（如 /^summary:/ 取消所有 summary 请求）
     * 
     * @example
     * ```typescript
     * // 取消特定宠物的所有请求
     * manager.cancelMatching(/^.*:pet-123$/)
     * 
     * // 取消所有 summary 请求
     * manager.cancelMatching(/^summary:/)
     * ```
     */
    cancelMatching(pattern: RegExp): void {
        let cancelCount = 0

        for (const [key, request] of this.pending.entries()) {
            if (pattern.test(key)) {
                request.abort()
                this.pending.delete(key)
                cancelCount++
            }
        }

        if (cancelCount > 0) {
            console.log(`[RequestManager] Cancelled ${cancelCount} requests matching ${pattern}`)
        }
    }

    /**
     * 取消所有待处理请求
     */
    cancelAll(): void {
        const count = this.pending.size

        for (const request of this.pending.values()) {
            request.abort()
        }

        this.pending.clear()

        if (count > 0) {
            console.log(`[RequestManager] Cancelled all ${count} pending requests`)
        }
    }

    /**
     * 获取待处理请求数量
     */
    getPendingCount(): number {
        return this.pending.size
    }

    /**
     * 检查是否有待处理请求
     */
    hasPending(key: RequestKey): boolean {
        return this.pending.has(key)
    }

    /**
     * 获取所有待处理请求的 key（用于调试）
     */
    getPendingKeys(): RequestKey[] {
        return Array.from(this.pending.keys())
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * 全局 RequestManager 实例
 * 
 * @example
 * ```typescript
 * import { requestManager } from '@/utils/request/requestManager'
 * 
 * // 在 composable 中使用
 * const result = await requestManager.execute(
 *   `summary:${petId}`,
 *   async (signal) => {
 *     return await api.getSummary(petId, signal)
 *   }
 * )
 * ```
 */
export const requestManager = new RequestManager()

/**
 * 创建作用域 RequestManager（用于特定场景隔离请求）
 */
export function createRequestManager(): RequestManager {
    return new RequestManager()
}
