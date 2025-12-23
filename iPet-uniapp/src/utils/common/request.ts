/**
 * Request Utility
 * Encapsulates uni.request with interceptors, abort support, loading.
 */

import { getAccessToken, setAuthToken, clearAuthToken, getRefreshToken, setRefreshToken } from '@/utils/business/authStorage'
import { APP_CONFIG, USE_MOCK } from '@/utils/config'
import { AppError, ErrorCode } from '@/types/error'
import { showError } from './errorHandler'
import { performanceMonitor } from '@/utils/performance/performanceMonitor'
import { handleMockRequest } from './mockRegistry'

const BASE_URL = APP_CONFIG.API_BASE_URL

interface InternalConfig {
    __retry?: boolean;
}

interface RefreshTokenResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
}

interface TokenRefreshResult {
    accessToken: string;
    expiresAt: number | null;
    refreshToken?: string | null;
}

export interface RequestConfig<T = any> {
    url: string;
    method?: UniApp.RequestOptions['method'];
    data?: UniApp.RequestOptions['data'];
    header?: Record<string, any>;
    rawResponse?: boolean;
    /**
     * optional key to cancel duplicate requests
     */
    abortKey?: string;
    /**
     * show global loading indicator
     */
    showLoading?: boolean;
    loadingText?: string;
    /**
     * skip auto token refresh on 401
     */
    skipAuthRefresh?: boolean;
    /**
     * request timeout in ms
     */
    /**
     * request timeout in ms
     */
    timeout?: number;
    /**
     * skip default error handling (toast)
     */
    skipErrorHandle?: boolean;
}

const pendingTasks = new Map<string, UniApp.RequestTask>()
const inflightRequests = new Map<string, Promise<any>>()
const abortControllers = new Map<string, { id: string; cancel: () => void }>()
const failedRequestQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
    config: RequestConfig<any> & InternalConfig;
}> = []
let loadingCounter = 0
let refreshPromise: Promise<TokenRefreshResult | null> | null = null
let forcingLogout = false

const OFFLINE_QUEUE_KEY = 'offline_request_queue'

const RETRY_POLICY = {
    maxRetries: 3,
    retryableStatus: new Set([408, 429, 500, 502, 503, 504]),
    maxDelayMs: 30000
}

const getRetryDelayMs = (attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt), RETRY_POLICY.maxDelayMs)
}

const hasIdempotencyKey = (header: Record<string, any>): boolean => {
    return Object.keys(header).some(key => key.toLowerCase() === 'x-idempotency-key')
}

const canRetryMethod = (method: string, header: Record<string, any>): boolean => {
    if (['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method)) {
        return true
    }
    if (method === 'POST') {
        return hasIdempotencyKey(header)
    }
    return false
}

interface OfflineRequest {
    id: string;
    config: RequestConfig<any> & InternalConfig;
    timestamp: number;
}

const getOfflineQueue = (): OfflineRequest[] => {
    return uni.getStorageSync(OFFLINE_QUEUE_KEY) || []
}

const setOfflineQueue = (queue: OfflineRequest[]) => {
    uni.setStorageSync(OFFLINE_QUEUE_KEY, queue)
}

const addToOfflineQueue = (config: RequestConfig<any> & InternalConfig) => {
    const queue = getOfflineQueue()
    queue.push({
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        config,
        timestamp: Date.now()
    })
    setOfflineQueue(queue)
}

const processOfflineQueue = async () => {
    const queue = getOfflineQueue()
    if (queue.length === 0) return

    // Clear queue immediately to avoid duplicates if new requests are added during processing
    setOfflineQueue([])

    console.log(`Processing ${queue.length} offline requests...`)

    for (const item of queue) {
        try {
            // Retry request
            // We pass a special flag or just rely on standard behavior
            // If it fails again with network error, it will be re-queued by the request function
            await request({
                ...item.config,
                showLoading: false,
                // Ensure we don't use stale tokens if possible, but request() gets fresh token
            })
        } catch (e) {
            console.error('Offline retry failed', e)
        }
    }
}

// Monitor network status
uni.onNetworkStatusChange((res) => {
    if (res.isConnected) {
        processOfflineQueue()
    }
})

const showGlobalLoading = (text?: string) => {
    if (loadingCounter === 0) {
        uni.showLoading({
            title: text || '加载中',
            mask: true
        })
    }
    loadingCounter += 1
}

const hideGlobalLoading = () => {
    loadingCounter = Math.max(loadingCounter - 1, 0)
    if (loadingCounter === 0) {
        uni.hideLoading()
    }
}

const registerAbort = (key: string, task: UniApp.RequestTask) => {
    const existing = pendingTasks.get(key)
    if (existing) {
        existing.abort()
        pendingTasks.delete(key)
    }
    pendingTasks.set(key, task)
}

const clearAbort = (key?: string, task?: UniApp.RequestTask | null) => {
    if (!key) return
    const stored = pendingTasks.get(key)
    if (!stored || (task && stored !== task)) return
    pendingTasks.delete(key)
}

const cancelByAbortKey = (key: string) => {
    const existingController = abortControllers.get(key)
    if (existingController) {
        existingController.cancel()
        abortControllers.delete(key)
    }
    const existingTask = pendingTasks.get(key)
    if (existingTask) {
        existingTask.abort()
        pendingTasks.delete(key)
    }
}

const resolveExpiresAt = (expiresIn?: number): number | null => {
    if (typeof expiresIn !== 'number' || Number.isNaN(expiresIn)) {
        return null
    }
    const normalized = Math.max(0, expiresIn)
    return normalized ? Date.now() + normalized * 1000 : null
}

const refreshAuthToken = async (): Promise<TokenRefreshResult | null> => {
    // Mock mode: use mock handler instead of network call
    if (USE_MOCK) {
        const { handleMockRefreshToken } = await import('./mockRegistry')
        const mockResult = await handleMockRefreshToken()
        return {
            accessToken: mockResult.accessToken,
            expiresAt: resolveExpiresAt(mockResult.expiresIn),
            refreshToken: mockResult.refreshToken
        }
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
        return null
    }

    return new Promise<TokenRefreshResult | null>((resolve, reject) => {
        uni.request({
            url: BASE_URL + '/auth/refresh',
            method: 'POST',
            data: { refreshToken },
            header: {
                'Content-Type': 'application/json'
            },
            success: (res: UniApp.RequestSuccessCallbackResult) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const payload = (res.data && typeof res.data === 'object' && 'data' in res.data)
                        ? (res.data as { data: RefreshTokenResponse }).data
                        : (res.data as RefreshTokenResponse)
                    if (!payload || !payload.accessToken) {
                        reject(new Error('Invalid refresh response'))
                        return
                    }
                    resolve({
                        accessToken: payload.accessToken,
                        expiresAt: resolveExpiresAt(payload.expiresIn),
                        refreshToken: payload.refreshToken || refreshToken
                    })
                    return
                }
                reject(res)
            },
            fail: (error: UniApp.GeneralCallbackResult) => reject(error)
        })
    })
}

const queueFailedRequest = (
    config: RequestConfig<any> & InternalConfig,
    resolve: (value: any) => void,
    reject: (reason?: any) => void
) => {
    failedRequestQueue.push({ resolve, reject, config })
}

const processQueue = (error: any, tokenResult: TokenRefreshResult | null) => {
    while (failedRequestQueue.length) {
        const { resolve, reject, config } = failedRequestQueue.shift()!
        if (tokenResult && tokenResult.accessToken) {
            resolve(
                request({
                    ...config,
                    header: {
                        ...config.header
                    }
                })
            )
        } else {
            reject(error)
        }
    }
}

const storeHandlers = {
    setToken: null as ((token: string, expiresAt: number | null) => void) | null,
    clearSession: null as (() => void) | null
}

export const setupStoreHandlers = (handlers: {
    setToken: (token: string, expiresAt: number | null) => void,
    clearSession: () => void
}) => {
    storeHandlers.setToken = handlers.setToken
    storeHandlers.clearSession = handlers.clearSession
}

const applyRefreshedToken = (result: TokenRefreshResult) => {
    setAuthToken(result.accessToken, undefined, result.expiresAt ?? null)
    if (storeHandlers.setToken) {
        storeHandlers.setToken(result.accessToken, result.expiresAt ?? null)
    }
    if (result.refreshToken) {
        setRefreshToken(result.refreshToken)
    }
}

const forceLogout = () => {
    if (forcingLogout) {
        return
    }
    forcingLogout = true

    if (storeHandlers.clearSession) {
        storeHandlers.clearSession()
    } else {
        clearAuthToken()
    }

    uni.showToast({
        title: '登录状态已过期，请重新登录',
        icon: 'none'
    })

    setTimeout(() => {
        uni.reLaunch({
            url: '/pages/login/index'
        })
        // Reset flag after a delay to allow re-login flow to complete
        setTimeout(() => {
            forcingLogout = false
        }, 2000)
    }, 1500)
}

const triggerTokenRefresh = () => {
    if (!refreshPromise) {
        refreshPromise = refreshAuthToken()
            .then(result => {
                if (!result || !result.accessToken) {
                    throw new Error('No token from refresh')
                }
                applyRefreshedToken(result)
                processQueue(null, result)
                return result
            })
            .catch(error => {
                processQueue(error, null)
                forceLogout()
                return null
            })
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

const handleError = (status: number, data: any, skipToast = false): AppError => {
    // 尝试解析业务错误码
    let bizCode: ErrorCode = ErrorCode.UNKNOWN

    // 从响应中获取业务错误码
    if (data?.code && typeof data.code === 'number') {
        bizCode = data.code as ErrorCode
    } else {
        // 根据 HTTP 状态码映射
        switch (status) {
            case 400:
                bizCode = ErrorCode.INVALID_PARAMS
                break
            case 401:
                bizCode = ErrorCode.TOKEN_INVALID
                break
            case 403:
                bizCode = ErrorCode.FORBIDDEN
                break
            case 404:
                bizCode = ErrorCode.NOT_FOUND
                break
            case 409:
                bizCode = ErrorCode.CONFLICT
                break
            case 429:
                bizCode = ErrorCode.RATE_LIMIT
                break
            default:
                bizCode = ErrorCode.UNKNOWN
        }
    }

    // 获取错误消息（优先使用服务端消息）
    let message = data?.message
    if (Array.isArray(message)) {
        message = message.join(', ')
    }

    const error = new AppError(bizCode, message || undefined, {
        httpStatus: status,
        details: data?.errors
    })

    // 显示 Toast（除非跳过）
    if (!skipToast) {
        showError(error)
    }

    return error
}

const request = async <T = any>(config: RequestConfig<T> & InternalConfig): Promise<T> => {
    // Mock mode: completely bypass network, use mock handlers
    if (USE_MOCK) {
        const requestStartTime = Date.now()
        if (config.showLoading) {
            showGlobalLoading(config.loadingText)
        }
        try {
            const result = await handleMockRequest<T>(config)
            const duration = Date.now() - requestStartTime
            performanceMonitor.trackApiCall(config.url, config.method || 'GET', duration, 200)
            return result
        } finally {
            if (config.showLoading) {
                hideGlobalLoading()
            }
        }
    }

    const header: Record<string, any> = {
        'Content-Type': 'application/json',
        ...config.header
    }

    const token = getAccessToken()
    if (token) {
        header['Authorization'] = `Bearer ${token}`
    }

    const method = (config.method || 'GET').toUpperCase()
    const isGet = method === 'GET'
    const dedupKey = isGet ? `${config.url}?${JSON.stringify(config.data || {})}` : null

    if (dedupKey && inflightRequests.has(dedupKey)) {
        return inflightRequests.get(dedupKey) as Promise<T>
    }

    if (config.abortKey) {
        cancelByAbortKey(config.abortKey)
    }

    let loadingActive = false
    if (config.showLoading) {
        showGlobalLoading(config.loadingText)
        loadingActive = true
    }

    const abortControllerId = config.abortKey
        ? `abort_${Date.now()}_${Math.random().toString(36).slice(2)}`
        : null

    const corePromise = new Promise<T>((resolve, reject) => {
        let settled = false
        let retryCount = 0
        let currentTask: UniApp.RequestTask | null = null
        let retryTimer: ReturnType<typeof setTimeout> | null = null

        const canRetry = canRetryMethod(method, header)

        const cleanupRetryTimer = () => {
            if (retryTimer) {
                clearTimeout(retryTimer)
                retryTimer = null
            }
        }

        const finish = (fn: () => void) => {
            if (settled) return
            settled = true
            cleanupRetryTimer()
            fn()
        }

        const cancel = () => {
            finish(() => {
                try {
                    currentTask?.abort()
                } catch (e) {
                    /* ignore */
                }
                reject(new AppError(ErrorCode.ABORTED))
            })
        }

        if (config.abortKey && abortControllerId) {
            abortControllers.set(config.abortKey, { id: abortControllerId, cancel })
        }

        const scheduleRetry = () => {
            const delay = getRetryDelayMs(retryCount)
            retryCount += 1
            cleanupRetryTimer()
            retryTimer = setTimeout(() => {
                attemptRequest()
            }, delay)
        }

        const attemptRequest = () => {
            if (settled) return
            const requestStartTime = Date.now()

            let requestTask: UniApp.RequestTask | null = null
            requestTask = uni.request({
                url: BASE_URL + config.url,
                method: config.method || 'GET',
                data: config.data,
                header,
                timeout: config.timeout,
                success: async (res) => {
                    if (settled) return

                    const duration = Date.now() - requestStartTime
                    const { statusCode, data } = res
                    const isSuccess = statusCode >= 200 && statusCode < 300
                    const isNotModified = statusCode === 304

                    performanceMonitor.trackApiCall(config.url, config.method || 'GET', duration, statusCode)

                    if (config.rawResponse) {
                        if (isSuccess || isNotModified) {
                            finish(() => resolve(res as any as T))
                            return
                        }
                    } else if (isSuccess || isNotModified) {
                        finish(() => resolve(data as T))
                        return
                    }

                    if (statusCode === 401 && !config.__retry && !config.skipAuthRefresh) {
                        if (loadingActive) {
                            hideGlobalLoading()
                            loadingActive = false
                        }
                        queueFailedRequest({
                            ...config,
                            header: {
                                ...config.header
                            },
                            __retry: true,
                            showLoading: false
                        }, resolve, reject)
                        triggerTokenRefresh()
                            .catch(() => {
                                /* handled in triggerTokenRefresh */
                            })
                        return
                    }

                    if (canRetry && RETRY_POLICY.retryableStatus.has(statusCode) && retryCount < RETRY_POLICY.maxRetries) {
                        scheduleRetry()
                        return
                    }

                    const error = handleError(statusCode, data, config.skipErrorHandle)
                    finish(() => reject(error))
                },
                fail: (err) => {
                    if (settled) return

                    const duration = Date.now() - requestStartTime
                    const errMsg = err?.errMsg ?? ''

                    performanceMonitor.trackApiCall(config.url, config.method || 'GET', duration, 0)

                    if (errMsg === 'request:fail abort') {
                        finish(() => reject(new AppError(ErrorCode.ABORTED)))
                        return
                    }

                    const isNetworkOrTimeout = errMsg.includes('request:fail') || errMsg.includes('timeout')
                    if (isNetworkOrTimeout && canRetry && retryCount < RETRY_POLICY.maxRetries) {
                        scheduleRetry()
                        return
                    }

                    if (isNetworkOrTimeout) {
                        // 只有写操作加入离线队列
                        if (method !== 'GET') {
                            addToOfflineQueue(config)
                            const error = new AppError(ErrorCode.OFFLINE, '网络不可用，已保存到离线队列')
                            if (!config.skipErrorHandle) {
                                showError(error)
                            }
                            finish(() => reject({ ...err, isOffline: true, appError: error }))
                            return
                        }

                        // GET 请求显示网络错误
                        const error = errMsg.includes('timeout')
                            ? new AppError(ErrorCode.TIMEOUT)
                            : new AppError(ErrorCode.NETWORK_ERROR)
                        if (!config.skipErrorHandle) {
                            showError(error)
                        }
                        finish(() => reject(error))
                        return
                    }

                    const error = new AppError(ErrorCode.NETWORK_ERROR, 'Network Error')
                    if (!config.skipErrorHandle) {
                        showError(error)
                    }
                    finish(() => reject(error))
                },
                complete: () => {
                    clearAbort(config.abortKey, requestTask)
                }
            })

            if (requestTask) {
                currentTask = requestTask
                if (config.abortKey) {
                    registerAbort(config.abortKey, requestTask)
                }
            }
        }

        attemptRequest()
    })

    const promise = corePromise.finally(() => {
        if (loadingActive) {
            hideGlobalLoading()
        }
        if (config.abortKey && abortControllerId) {
            const stored = abortControllers.get(config.abortKey)
            if (stored?.id === abortControllerId) {
                abortControllers.delete(config.abortKey)
            }
        }
    })

    if (dedupKey) {
        inflightRequests.set(dedupKey, promise)
        const cleanup = () => {
            if (inflightRequests.get(dedupKey) === promise) {
                inflightRequests.delete(dedupKey)
            }
        }
        promise.then(cleanup, cleanup)
    }

    return promise
}

export default request
