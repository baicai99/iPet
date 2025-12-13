import { defineStore } from 'pinia'

/**
 * ============================================================================
 * App Store - 全局应用状态管理
 * ============================================================================
 * 
 * 核心功能：
 * - 管理应用就绪状态 (isAppReady)
 * - 提供 Promise-based 等待机制 (whenReady)
 * - 支持超时降级
 */

interface AppState {
    isAppReady: boolean;
    isNetworkReady: boolean;
    /** 就绪错误信息 (如果有) */
    readyError: string | null;
}

/**
 * whenReady 配置选项
 */
interface WhenReadyOptions {
    /** 超时时间（毫秒），默认 5000ms */
    timeoutMs?: number;
    /** 超时后是否降级继续执行（resolve），默认 true */
    fallbackOnTimeout?: boolean;
}

/**
 * 等待者（Waiter）记录
 */
interface ReadyWaiter {
    resolve: (value: void) => void;
    reject: (reason: Error) => void;
    timeoutId?: ReturnType<typeof setTimeout>;
}

// ============================================================================
// 🔧 Module-level state (等待队列 - 不能放在 Pinia state 中)
// ============================================================================

/**
 * 等待队列 - 存储所有等待 whenReady() 的 Promise
 * 
 * 注意：不能放在 Pinia state 中，因为：
 * 1. Promise 不能被序列化
 * 2. 不需要响应式
 */
let waiters: ReadyWaiter[] = []

export const useAppStore = defineStore('app', {
    state: (): AppState => ({
        isAppReady: false,
        isNetworkReady: false,
        readyError: null
    }),

    actions: {
        /**
         * 设置应用就绪状态
         * @param status - 是否就绪
         */
        setAppReady(status: boolean) {
            this.isAppReady = status

            // ✅ 如果设置为 ready，触发所有等待者
            if (status) {
                this._resolveAllWaiters()
            }
        },

        /**
         * 设置网络就绪状态
         * @param status - 是否就绪
         */
        setNetworkReady(status: boolean) {
            this.isNetworkReady = status
        },

        /**
         * 设置就绪错误
         * @param error - 错误信息
         */
        setReadyError(error: string | null) {
            this.readyError = error

            // ✅ 如果设置了错误，拒绝所有等待者
            if (error) {
                this._rejectAllWaiters(new Error(error))
            }
        },

        // ========================================================================
        // Promise-based Ready 机制
        // ========================================================================

        /**
         * 等待应用就绪的 Promise
         * 
         * 策略：
         * 1. 如果已经 ready → 立即 resolve
         * 2. 如果有错误 → 立即 reject
         * 3. 否则 → 等待 setAppReady(true) 或超时
         * 4. 超时后 → 根据 fallbackOnTimeout 决定 resolve/reject
         * 
         * @param options - 配置选项
         * @returns Promise<void>
         * 
         * @example
         * ```typescript
         * // 基本用法
         * await appStore.whenReady()
         * 
         * // 自定义超时
         * await appStore.whenReady({ timeoutMs: 10000 })
         * 
         * // 超时后抛出异常（不降级）
         * await appStore.whenReady({ fallbackOnTimeout: false })
         * ```
         */
        whenReady(options: WhenReadyOptions = {}): Promise<void> {
            const {
                timeoutMs = 5000,
                fallbackOnTimeout = true
            } = options

            // 快速路径：如果已经 ready，立即返回
            if (this.isAppReady) {
                return Promise.resolve()
            }

            // 快速路径：如果有错误，立即拒绝
            if (this.readyError) {
                return Promise.reject(new Error(this.readyError))
            }

            // 创建等待 Promise
            return new Promise<void>((resolve, reject) => {
                const waiter: ReadyWaiter = { resolve, reject }

                // 设置超时定时器
                waiter.timeoutId = setTimeout(() => {
                    const timeoutError = new Error(
                        `[AppStore] whenReady() timeout after ${timeoutMs}ms (isAppReady: ${this.isAppReady})`
                    )

                    if (fallbackOnTimeout) {
                        // 降级模式：超时后继续执行
                        console.warn(
                            '⚠️ [AppStore] whenReady() timeout, fallback to continue',
                            {
                                timeoutMs,
                                isAppReady: this.isAppReady,
                                readyError: this.readyError
                            }
                        )
                        this._removeWaiter(waiter)
                        resolve()
                    } else {
                        // 严格模式：超时后抛出异常
                        this._removeWaiter(waiter)
                        reject(timeoutError)
                    }
                }, timeoutMs)

                // 添加到等待队列
                waiters.push(waiter)
            })
        },

        // ========================================================================
        // 内部方法 (Private)
        // ========================================================================

        /**
         * 解决所有等待者
         * @internal
         */
        _resolveAllWaiters() {
            const currentWaiters = waiters.splice(0)  // 清空并获取所有等待者
            currentWaiters.forEach(waiter => {
                if (waiter.timeoutId) {
                    clearTimeout(waiter.timeoutId)
                }
                waiter.resolve()
            })

            if (currentWaiters.length > 0) {
                console.log(`[AppStore] ✅ Resolved ${currentWaiters.length} ready waiters`)
            }
        },

        /**
         * 拒绝所有等待者
         * @internal
         */
        _rejectAllWaiters(error: Error) {
            const currentWaiters = waiters.splice(0)  // 清空并获取所有等待者
            currentWaiters.forEach(waiter => {
                if (waiter.timeoutId) {
                    clearTimeout(waiter.timeoutId)
                }
                waiter.reject(error)
            })

            if (currentWaiters.length > 0) {
                console.warn(`[AppStore] ❌ Rejected ${currentWaiters.length} ready waiters:`, error.message)
            }
        },

        /**
         * 移除指定等待者
         * @internal
         */
        _removeWaiter(waiter: ReadyWaiter) {
            const index = waiters.indexOf(waiter)
            if (index !== -1) {
                waiters.splice(index, 1)
            }
        }
    },

    getters: {
        /**
         * 是否可以开始加载数据
         * (ready 或有网络连接)
         */
        canLoadData(): boolean {
            return this.isAppReady || this.isNetworkReady
        }
    }
})


