/**
 * Request Utility
 * Encapsulates uni.request with interceptors, abort support, loading.
 */

import { getAccessToken, setAuthToken, clearAuthToken, getRefreshToken, setRefreshToken } from '@/utils/business/authStorage'
import { APP_CONFIG } from '@/utils/config'
import { handleMockRequest, handleMockRefreshToken } from './mockRegistry'

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
const failedRequestQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
    config: RequestConfig<any> & InternalConfig;
}> = []
let loadingCounter = 0
let refreshPromise: Promise<TokenRefreshResult | null> | null = null
let forcingLogout = false

const OFFLINE_QUEUE_KEY = 'offline_request_queue'

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

const resolveExpiresAt = (expiresIn?: number): number | null => {
    if (typeof expiresIn !== 'number' || Number.isNaN(expiresIn)) {
        return null
    }
    const normalized = Math.max(0, expiresIn)
    return normalized ? Date.now() + normalized * 1000 : null
}

const refreshAuthToken = async (): Promise<TokenRefreshResult | null> => {
    // Mock mode: use mock handler instead of network call
    if (APP_CONFIG.USE_MOCK) {
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

const handleError = (status: number, data: any) => {
    let message = 'Request Failed'
    switch (status) {
        case 401:
            message = 'Unauthorized. Please login again.'
            break
        case 403:
            message = 'Forbidden.'
            break
        case 404:
            message = 'Resource not found.'
            break
        case 500:
            message = 'Server Error.'
            break
        default:
            const rawMessage = data?.message
            message = Array.isArray(rawMessage)
                ? rawMessage.join(', ')
                : (rawMessage || `Error: ${status}`)
    }

    uni.showToast({
        title: message,
        icon: 'none'
    })
}

const request = async <T = any>(config: RequestConfig<T> & InternalConfig): Promise<T> => {
    // Mock mode: completely bypass network, use mock handlers
    if (APP_CONFIG.USE_MOCK) {
        if (config.showLoading) {
            showGlobalLoading(config.loadingText)
        }
        try {
            return await handleMockRequest<T>(config)
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

    if (config.showLoading) {
        showGlobalLoading(config.loadingText)
    }

    const isGet = (config.method || 'GET').toUpperCase() === 'GET'
    const dedupKey = isGet ? `${config.url}?${JSON.stringify(config.data || {})}` : null

    if (dedupKey && inflightRequests.has(dedupKey)) {
        return inflightRequests.get(dedupKey) as Promise<T>
    }

    const promise = new Promise<T>((resolve, reject) => {
        const requestTask = uni.request({
            url: BASE_URL + config.url,
            method: config.method || 'GET',
            data: config.data,
            header,
            timeout: config.timeout,
            success: async (res) => {
                const { statusCode, data } = res
                const isSuccess = statusCode >= 200 && statusCode < 300
                const isNotModified = statusCode === 304

                if (config.rawResponse) {
                    if (isSuccess || isNotModified) {
                        resolve(res as any as T)
                        return
                    }
                } else if (isSuccess) {
                    resolve(data as T)
                    return
                } else if (isNotModified) {
                    resolve(data as T)
                    return
                } else if (statusCode === 401 && !config.__retry && !config.skipAuthRefresh) {
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
                } else {
                    if (!config.skipErrorHandle) {
                        handleError(statusCode, data)
                    }
                    reject(res)
                }
            },
            fail: (err) => {
                if (err?.errMsg && (err.errMsg.includes('request:fail') || err.errMsg.includes('timeout'))) {
                    const method = (config.method || 'GET').toUpperCase()
                    // Only queue mutation requests
                    if (method !== 'GET') {
                        addToOfflineQueue(config)
                        uni.showToast({
                            title: '网络不可用，已保存到离线队列',
                            icon: 'none'
                        })
                        // Reject with a specific error so caller knows it was queued?
                        // Or just reject normally.
                        reject({ ...err, isOffline: true })
                        return
                    }

                    uni.showToast({
                        title: '网络连接失败',
                        icon: 'none'
                    })
                } else if (err?.errMsg !== 'request:fail abort') {
                    uni.showToast({
                        title: 'Network Error',
                        icon: 'none'
                    })
                }
                reject(err)
            },
            complete: () => {
                if (config.showLoading) {
                    hideGlobalLoading()
                }
                clearAbort(config.abortKey, requestTask)
            }
        })

        if (config.abortKey) {
            registerAbort(config.abortKey, requestTask)
        }
    })

    if (dedupKey) {
        inflightRequests.set(dedupKey, promise)
        promise.finally(() => {
            if (inflightRequests.get(dedupKey) === promise) {
                inflightRequests.delete(dedupKey)
            }
        })
    }

    return promise
}

export default request
