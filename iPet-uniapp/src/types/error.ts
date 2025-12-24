/**
 * 统一错误类型定义
 * 
 * 对齐 接口契约层.md 定义的错误码规范
 * @see docs/接口契约层.md#1.4-错误码规范
 */

// ============================================================================
// 从共享包导入统一错误码
// ============================================================================

import {
    ErrorCode as SharedErrorCode,
    ERROR_MESSAGES as SHARED_ERROR_MESSAGES,
    mapHttpStatusToErrorCode as sharedMapHttpStatusToErrorCode,
    getErrorMessage,
} from '../../../shared/validation/error-codes';

// Re-export for convenience
export { SharedErrorCode, SHARED_ERROR_MESSAGES, getErrorMessage };

// ============================================================================
// Legacy 错误码枚举 (保持向后兼容)
// ============================================================================

/**
 * 业务错误码枚举 (Legacy - 数字格式)
 * 
 * @deprecated 请使用 SharedErrorCode (字符串格式)
 * 
 * 分类规则：
 * - 1xxxx: 通用错误
 * - 2xxxx: 认证错误
 * - 3xxxx: 权限错误
 * - 4xxxx: 资源错误
 * - 5xxxx: 业务错误
 * - 6xxxx: 客户端本地错误
 */
export enum ErrorCode {
    // ========== 通用错误 (1xxxx) ==========
    SUCCESS = 10000,
    UNKNOWN = 10001,
    INVALID_PARAMS = 10002,
    RATE_LIMIT = 10003,

    // ========== 认证错误 (2xxxx) ==========
    TOKEN_INVALID = 20001,
    TOKEN_EXPIRED = 20002,
    REFRESH_TOKEN_EXPIRED = 20003,
    LOGIN_FAILED = 20004,
    USER_NOT_FOUND = 20005,
    ACCOUNT_DISABLED = 20006,

    // ========== 权限错误 (3xxxx) ==========
    FORBIDDEN = 30001,
    NOT_OWNER = 30002,
    GUEST_RESTRICTED = 30003,

    // ========== 资源错误 (4xxxx) ==========
    NOT_FOUND = 40001,
    DELETED = 40002,
    EXPIRED = 40003,
    CONFLICT = 40004,

    // ========== 业务错误 (5xxxx) ==========
    PET_LIMIT_EXCEEDED = 50001,
    HEALTH_RECORD_NOT_FOUND = 50002,
    SYNC_FAILED = 50003,

    // ========== 客户端本地错误 (6xxxx) ==========
    NETWORK_ERROR = 60001,
    TIMEOUT = 60002,
    OFFLINE = 60003,
    ABORTED = 60004,
}

// ============================================================================
// Legacy → Shared 错误码映射
// ============================================================================

/**
 * 字符串错误码 → Legacy 数字错误码映射
 */
export const SHARED_TO_LEGACY_CODE: Record<SharedErrorCode, ErrorCode> = {
    [SharedErrorCode.SUCCESS]: ErrorCode.SUCCESS,
    [SharedErrorCode.UNKNOWN]: ErrorCode.UNKNOWN,
    [SharedErrorCode.INVALID_PARAMS]: ErrorCode.INVALID_PARAMS,
    [SharedErrorCode.VALIDATION_ERROR]: ErrorCode.INVALID_PARAMS,
    [SharedErrorCode.RATE_LIMIT]: ErrorCode.RATE_LIMIT,

    [SharedErrorCode.AUTH_UNAUTHORIZED]: ErrorCode.TOKEN_INVALID,
    [SharedErrorCode.AUTH_TOKEN_EXPIRED]: ErrorCode.TOKEN_EXPIRED,
    [SharedErrorCode.AUTH_REFRESH_EXPIRED]: ErrorCode.REFRESH_TOKEN_EXPIRED,
    [SharedErrorCode.AUTH_LOGIN_FAILED]: ErrorCode.LOGIN_FAILED,
    [SharedErrorCode.AUTH_USER_NOT_FOUND]: ErrorCode.USER_NOT_FOUND,
    [SharedErrorCode.AUTH_ACCOUNT_DISABLED]: ErrorCode.ACCOUNT_DISABLED,

    [SharedErrorCode.PERM_FORBIDDEN]: ErrorCode.FORBIDDEN,
    [SharedErrorCode.PERM_NOT_OWNER]: ErrorCode.NOT_OWNER,
    [SharedErrorCode.PERM_GUEST_RESTRICTED]: ErrorCode.GUEST_RESTRICTED,

    [SharedErrorCode.RES_NOT_FOUND]: ErrorCode.NOT_FOUND,
    [SharedErrorCode.RES_DELETED]: ErrorCode.DELETED,
    [SharedErrorCode.RES_EXPIRED]: ErrorCode.EXPIRED,
    [SharedErrorCode.RES_CONFLICT]: ErrorCode.CONFLICT,

    [SharedErrorCode.BIZ_PET_LIMIT]: ErrorCode.PET_LIMIT_EXCEEDED,
    [SharedErrorCode.BIZ_HEALTH_NOT_FOUND]: ErrorCode.HEALTH_RECORD_NOT_FOUND,
    [SharedErrorCode.BIZ_SYNC_FAILED]: ErrorCode.SYNC_FAILED,
    [SharedErrorCode.BIZ_GUEST_NOT_UPGRADABLE]: ErrorCode.FORBIDDEN,
    [SharedErrorCode.BIZ_EMAIL_ALREADY_BOUND]: ErrorCode.CONFLICT,

    [SharedErrorCode.CLIENT_NETWORK]: ErrorCode.NETWORK_ERROR,
    [SharedErrorCode.CLIENT_TIMEOUT]: ErrorCode.TIMEOUT,
    [SharedErrorCode.CLIENT_OFFLINE]: ErrorCode.OFFLINE,
    [SharedErrorCode.CLIENT_ABORTED]: ErrorCode.ABORTED,
};

/**
 * 将共享错误码转换为 Legacy 错误码
 */
export function toLegacyErrorCode(sharedCode: SharedErrorCode): ErrorCode {
    return SHARED_TO_LEGACY_CODE[sharedCode] ?? ErrorCode.UNKNOWN;
}

// ============================================================================
// 错误消息映射
// ============================================================================

/**
 * 错误码 → 用户友好消息映射
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    // 通用错误
    [ErrorCode.SUCCESS]: '操作成功',
    [ErrorCode.UNKNOWN]: '未知错误，请稍后重试',
    [ErrorCode.INVALID_PARAMS]: '请求参数错误',
    [ErrorCode.RATE_LIMIT]: '请求过于频繁，请稍后重试',

    // 认证错误
    [ErrorCode.TOKEN_INVALID]: '登录状态无效，请重新登录',
    [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.REFRESH_TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.LOGIN_FAILED]: '邮箱或密码错误',
    [ErrorCode.USER_NOT_FOUND]: '用户不存在',
    [ErrorCode.ACCOUNT_DISABLED]: '账号已被禁用',

    // 权限错误
    [ErrorCode.FORBIDDEN]: '无权限访问',
    [ErrorCode.NOT_OWNER]: '无权操作此资源',
    [ErrorCode.GUEST_RESTRICTED]: '游客模式不支持此操作，请注册账号',

    // 资源错误
    [ErrorCode.NOT_FOUND]: '资源不存在',
    [ErrorCode.DELETED]: '资源已删除',
    [ErrorCode.EXPIRED]: '资源已过期',
    [ErrorCode.CONFLICT]: '资源冲突，请刷新后重试',

    // 业务错误
    [ErrorCode.PET_LIMIT_EXCEEDED]: '宠物数量已达上限',
    [ErrorCode.HEALTH_RECORD_NOT_FOUND]: '健康记录不存在',
    [ErrorCode.SYNC_FAILED]: '数据同步失败',

    // 客户端本地错误
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
    [ErrorCode.TIMEOUT]: '请求超时，请稍后重试',
    [ErrorCode.OFFLINE]: '当前处于离线模式',
    [ErrorCode.ABORTED]: '请求已取消',
}


// ============================================================================
// AppError 类
// ============================================================================

export interface AppErrorOptions {
    httpStatus?: number
    details?: Record<string, any>
    cause?: Error
    /** 请求追踪 ID，用于与后端日志关联 */
    requestId?: string
}

/**
 * 统一应用错误类
 * 
 * @example
 * throw new AppError(ErrorCode.NOT_FOUND, '宠物不存在')
 * 
 * @example
 * const error = AppError.fromResponse(res)
 * showError(error)
 */
export class AppError extends Error {
    readonly code: ErrorCode
    readonly httpStatus?: number
    readonly details?: Record<string, any>
    /** 请求追踪 ID，用于与后端日志关联 */
    readonly requestId?: string

    constructor(code: ErrorCode, message?: string, options?: AppErrorOptions) {
        super(message ?? ERROR_MESSAGES[code] ?? '未知错误')
        this.name = 'AppError'
        this.code = code
        this.httpStatus = options?.httpStatus
        this.details = options?.details
        this.requestId = options?.requestId

        // 保持原因链
        if (options?.cause) {
            this.cause = options.cause
        }
    }

    /**
     * 从 HTTP 响应创建 AppError
     * 支持后端返回的字符串错误码和 Legacy 数字错误码
     */
    static fromResponse(res: {
        statusCode: number
        data: any
    }): AppError {
        const { statusCode, data } = res

        // 尝试解析业务错误码（支持字符串和数字格式）
        let bizCode: ErrorCode
        const backendCode = data?.code

        if (typeof backendCode === 'string') {
            // 新格式：字符串错误码，转换为 Legacy 格式
            bizCode = toLegacyErrorCode(backendCode as SharedErrorCode)
        } else if (typeof backendCode === 'number') {
            // Legacy 格式：直接使用
            bizCode = backendCode as ErrorCode
        } else {
            // 根据 HTTP 状态码推断
            bizCode = mapHttpStatusToErrorCode(statusCode)
        }

        // 获取错误消息（优先使用服务端消息）
        let message = data?.message
        if (Array.isArray(message)) {
            message = message.join(', ')
        }
        message = message ?? ERROR_MESSAGES[bizCode] ?? `请求失败 (${statusCode})`

        return new AppError(bizCode, message, {
            httpStatus: statusCode,
            details: data?.errors,
            requestId: data?.requestId
        })
    }

    /**
     * 从网络错误创建 AppError
     */
    static fromNetworkError(err: UniApp.GeneralCallbackResult): AppError {
        const errMsg = err?.errMsg ?? ''

        if (errMsg.includes('timeout')) {
            return new AppError(ErrorCode.TIMEOUT)
        }

        if (errMsg.includes('abort')) {
            return new AppError(ErrorCode.ABORTED)
        }

        if (errMsg.includes('request:fail')) {
            return new AppError(ErrorCode.NETWORK_ERROR)
        }

        return new AppError(ErrorCode.UNKNOWN, errMsg || '网络请求失败')
    }

    /**
     * 判断是否为认证相关错误
     */
    isAuthError(): boolean {
        return this.code >= 20001 && this.code <= 20006
    }

    /**
     * 判断是否为权限相关错误
     */
    isPermissionError(): boolean {
        return this.code >= 30001 && this.code <= 30003
    }

    /**
     * 判断是否为可重试错误
     */
    isRetryable(): boolean {
        return [
            ErrorCode.NETWORK_ERROR,
            ErrorCode.TIMEOUT,
            ErrorCode.UNKNOWN
        ].includes(this.code)
    }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * HTTP 状态码 → ErrorCode 映射
 */
function mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
        case 400:
            return ErrorCode.INVALID_PARAMS
        case 401:
            return ErrorCode.TOKEN_INVALID
        case 403:
            return ErrorCode.FORBIDDEN
        case 404:
            return ErrorCode.NOT_FOUND
        case 409:
            return ErrorCode.CONFLICT
        case 429:
            return ErrorCode.RATE_LIMIT
        case 500:
        case 502:
        case 503:
        case 504:
            return ErrorCode.UNKNOWN
        default:
            return ErrorCode.UNKNOWN
    }
}

/**
 * 类型守卫：判断是否为 AppError
 */
export function isAppError(err: unknown): err is AppError {
    return err instanceof AppError
}

/**
 * 将任意错误转换为 AppError
 */
export function toAppError(err: unknown): AppError {
    if (isAppError(err)) {
        return err
    }

    if (err instanceof Error) {
        return new AppError(ErrorCode.UNKNOWN, err.message, { cause: err })
    }

    if (typeof err === 'string') {
        return new AppError(ErrorCode.UNKNOWN, err)
    }

    return new AppError(ErrorCode.UNKNOWN)
}
