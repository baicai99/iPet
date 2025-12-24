/**
 * 统一错误码定义
 * 
 * 前后端共享的错误码枚举和消息映射
 * @see docs/接口契约层.md#1.4-错误码规范
 */

// ============================================================================
// 错误码枚举（使用字符串便于调试和日志追踪）
// ============================================================================

/**
 * 业务错误码枚举
 * 
 * 分类规则：
 * - AUTH_*: 认证错误
 * - PERM_*: 权限错误
 * - RES_*: 资源错误
 * - BIZ_*: 业务错误
 * - CLIENT_*: 客户端本地错误
 * - 通用错误: SUCCESS, UNKNOWN, INVALID_PARAMS, RATE_LIMIT
 */
export enum ErrorCode {
    // ========== 通用错误 ==========
    SUCCESS = 'SUCCESS',
    UNKNOWN = 'UNKNOWN',
    INVALID_PARAMS = 'INVALID_PARAMS',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT = 'RATE_LIMIT',

    // ========== 认证错误 (AUTH_*) ==========
    AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
    AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
    AUTH_REFRESH_EXPIRED = 'AUTH_REFRESH_EXPIRED',
    AUTH_LOGIN_FAILED = 'AUTH_LOGIN_FAILED',
    AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
    AUTH_ACCOUNT_DISABLED = 'AUTH_ACCOUNT_DISABLED',

    // ========== 权限错误 (PERM_*) ==========
    PERM_FORBIDDEN = 'PERM_FORBIDDEN',
    PERM_NOT_OWNER = 'PERM_NOT_OWNER',
    PERM_GUEST_RESTRICTED = 'PERM_GUEST_RESTRICTED',

    // ========== 资源错误 (RES_*) ==========
    RES_NOT_FOUND = 'RES_NOT_FOUND',
    RES_DELETED = 'RES_DELETED',
    RES_EXPIRED = 'RES_EXPIRED',
    RES_CONFLICT = 'RES_CONFLICT',

    // ========== 业务错误 (BIZ_*) ==========
    BIZ_PET_LIMIT = 'BIZ_PET_LIMIT',
    BIZ_HEALTH_NOT_FOUND = 'BIZ_HEALTH_NOT_FOUND',
    BIZ_SYNC_FAILED = 'BIZ_SYNC_FAILED',
    BIZ_GUEST_NOT_UPGRADABLE = 'BIZ_GUEST_NOT_UPGRADABLE',
    BIZ_EMAIL_ALREADY_BOUND = 'BIZ_EMAIL_ALREADY_BOUND',

    // ========== 客户端本地错误 (CLIENT_*) ==========
    CLIENT_NETWORK = 'CLIENT_NETWORK',
    CLIENT_TIMEOUT = 'CLIENT_TIMEOUT',
    CLIENT_OFFLINE = 'CLIENT_OFFLINE',
    CLIENT_ABORTED = 'CLIENT_ABORTED',
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
    [ErrorCode.VALIDATION_ERROR]: '数据校验失败',
    [ErrorCode.RATE_LIMIT]: '请求过于频繁，请稍后重试',

    // 认证错误
    [ErrorCode.AUTH_UNAUTHORIZED]: '登录状态无效，请重新登录',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.AUTH_REFRESH_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.AUTH_LOGIN_FAILED]: '邮箱或密码错误',
    [ErrorCode.AUTH_USER_NOT_FOUND]: '用户不存在',
    [ErrorCode.AUTH_ACCOUNT_DISABLED]: '账号已被禁用',

    // 权限错误
    [ErrorCode.PERM_FORBIDDEN]: '无权限访问',
    [ErrorCode.PERM_NOT_OWNER]: '无权操作此资源',
    [ErrorCode.PERM_GUEST_RESTRICTED]: '游客模式不支持此操作，请注册账号',

    // 资源错误
    [ErrorCode.RES_NOT_FOUND]: '资源不存在',
    [ErrorCode.RES_DELETED]: '资源已删除',
    [ErrorCode.RES_EXPIRED]: '资源已过期',
    [ErrorCode.RES_CONFLICT]: '资源冲突，请刷新后重试',

    // 业务错误
    [ErrorCode.BIZ_PET_LIMIT]: '宠物数量已达上限',
    [ErrorCode.BIZ_HEALTH_NOT_FOUND]: '健康记录不存在',
    [ErrorCode.BIZ_SYNC_FAILED]: '数据同步失败',
    [ErrorCode.BIZ_GUEST_NOT_UPGRADABLE]: '只有游客账户可以升级',
    [ErrorCode.BIZ_EMAIL_ALREADY_BOUND]: '该账户已绑定邮箱',

    // 客户端本地错误
    [ErrorCode.CLIENT_NETWORK]: '网络连接失败，请检查网络设置',
    [ErrorCode.CLIENT_TIMEOUT]: '请求超时，请稍后重试',
    [ErrorCode.CLIENT_OFFLINE]: '当前处于离线模式',
    [ErrorCode.CLIENT_ABORTED]: '请求已取消',
};

// ============================================================================
// HTTP 状态码映射
// ============================================================================

/**
 * HTTP 状态码 → ErrorCode 映射
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
    400: ErrorCode.INVALID_PARAMS,
    401: ErrorCode.AUTH_UNAUTHORIZED,
    403: ErrorCode.PERM_FORBIDDEN,
    404: ErrorCode.RES_NOT_FOUND,
    409: ErrorCode.RES_CONFLICT,
    422: ErrorCode.VALIDATION_ERROR,
    429: ErrorCode.RATE_LIMIT,
    500: ErrorCode.UNKNOWN,
    502: ErrorCode.UNKNOWN,
    503: ErrorCode.UNKNOWN,
    504: ErrorCode.CLIENT_TIMEOUT,
};

/**
 * 根据 HTTP 状态码获取对应的 ErrorCode
 */
export function mapHttpStatusToErrorCode(status: number): ErrorCode {
    return HTTP_STATUS_TO_ERROR_CODE[status] ?? ErrorCode.UNKNOWN;
}

/**
 * 获取错误消息
 */
export function getErrorMessage(code: ErrorCode): string {
    return ERROR_MESSAGES[code] ?? ERROR_MESSAGES[ErrorCode.UNKNOWN];
}
