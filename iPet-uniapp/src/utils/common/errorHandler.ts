/**
 * 统一错误处理工具
 * 
 * 提供统一的错误显示、处理和包装功能
 */

import { AppError, ErrorCode, isAppError, toAppError, ERROR_MESSAGES } from '@/types/error'
import { performanceMonitor } from '@/utils/performance/performanceMonitor'

// ============================================================================
// 错误显示
// ============================================================================

export interface ShowErrorOptions {
    /** 自定义标题 */
    title?: string
    /** 显示时长 (ms)，默认 2000 */
    duration?: number
    /** 静默模式，不显示 Toast */
    silent?: boolean
}

/**
 * 显示错误 Toast
 * 
 * @example
 * showError(error)
 * 
 * @example
 * showError(error, { silent: true })
 */
export function showError(error: AppError | Error | unknown, options?: ShowErrorOptions): void {
    if (options?.silent) {
        return
    }

    const appError = toAppError(error)
    const title = options?.title ?? appError.message

    // 记录到性能监控
    performanceMonitor.trackError(appError, {
        code: appError.code,
        httpStatus: appError.httpStatus
    })

    uni.showToast({
        title,
        icon: 'none',
        duration: options?.duration ?? 2000
    })

    // 开发环境打印详细错误
    if (import.meta.env.DEV) {
        console.error('[ErrorHandler]', {
            code: appError.code,
            message: appError.message,
            httpStatus: appError.httpStatus,
            details: appError.details,
            requestId: appError.requestId,
            cause: appError.cause
        })
    }
}

/**
 * 显示成功 Toast
 */
export function showSuccess(message: string, duration = 1500): void {
    uni.showToast({
        title: message,
        icon: 'success',
        duration
    })
}

// ============================================================================
// 错误判断
// ============================================================================

/**
 * 判断是否需要重新登录
 */
export function isAuthError(error: unknown): boolean {
    if (isAppError(error)) {
        return error.isAuthError()
    }
    return false
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
    if (isAppError(error)) {
        return error.code === ErrorCode.NETWORK_ERROR ||
            error.code === ErrorCode.TIMEOUT ||
            error.code === ErrorCode.OFFLINE
    }
    return false
}

/**
 * 判断是否为可重试错误
 */
export function isRetryableError(error: unknown): boolean {
    if (isAppError(error)) {
        return error.isRetryable()
    }
    return false
}

// ============================================================================
// 错误包装器
// ============================================================================

export interface WithErrorHandlerOptions<T> {
    /** 静默模式，不显示 Toast */
    silent?: boolean
    /** 失败时的降级返回值 */
    fallback?: T
    /** 自定义错误处理 */
    onError?: (error: AppError) => void
    /** 失败时是否重新抛出错误 */
    rethrow?: boolean
}

/**
 * 包装异步操作，统一错误处理
 * 
 * @example
 * // 基础用法
 * const result = await withErrorHandler(() => fetchData())
 * 
 * @example
 * // 静默模式 + 降级值
 * const result = await withErrorHandler(
 *   () => fetchData(),
 *   { silent: true, fallback: [] }
 * )
 * 
 * @example
 * // 自定义错误处理
 * const result = await withErrorHandler(
 *   () => fetchData(),
 *   { onError: (err) => console.log(err.code) }
 * )
 */
export async function withErrorHandler<T>(
    fn: () => Promise<T>,
    options?: WithErrorHandlerOptions<T>
): Promise<T | undefined> {
    try {
        return await fn()
    } catch (err) {
        const appError = toAppError(err)

        // 显示错误（除非静默）
        if (!options?.silent) {
            showError(appError)
        }

        // 自定义处理
        if (options?.onError) {
            options.onError(appError)
        }

        // 重新抛出
        if (options?.rethrow) {
            throw appError
        }

        // 返回降级值
        return options?.fallback
    }
}

// ============================================================================
// 错误消息获取
// ============================================================================

/**
 * 根据错误码获取用户友好消息
 */
export function getErrorMessage(code: ErrorCode): string {
    return ERROR_MESSAGES[code] ?? '未知错误'
}

/**
 * 从任意错误中提取消息
 */
export function extractErrorMessage(error: unknown): string {
    if (isAppError(error)) {
        return error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === 'string') {
        return error
    }

    return '未知错误'
}

// ============================================================================
// 导出
// ============================================================================

export {
    AppError,
    ErrorCode,
    isAppError,
    toAppError
} from '@/types/error'
