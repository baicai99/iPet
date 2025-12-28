/**
 * Business error codes for standardized API responses
 */
export const ErrorCodes = {
    // Authentication errors (1xxx)
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
    AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
    AUTH_TOO_MANY_ATTEMPTS: 'AUTH_TOO_MANY_ATTEMPTS',

    // User errors (2xxx)
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USER_BANNED: 'USER_BANNED',
    USER_DELETED: 'USER_DELETED',

    // Pet errors (3xxx)
    PET_NOT_FOUND: 'PET_NOT_FOUND',
    PET_LIMIT_EXCEEDED: 'PET_LIMIT_EXCEEDED',

    // Health record errors (4xxx)
    HEALTH_RECORD_NOT_FOUND: 'HEALTH_RECORD_NOT_FOUND',
    HEALTH_RECORD_INVALID: 'HEALTH_RECORD_INVALID',

    // Article errors (5xxx)
    ARTICLE_NOT_FOUND: 'ARTICLE_NOT_FOUND',

    // Admin errors (6xxx)
    ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
    ADMIN_PERMISSION_DENIED: 'ADMIN_PERMISSION_DENIED',

    // Validation errors (7xxx)
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    MISSING_PARAMETER: 'MISSING_PARAMETER',
    PAGE_LIMIT_EXCEEDED: 'PAGE_LIMIT_EXCEEDED',

    // System errors (9xxx)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error code to HTTP status mapping
 */
export const ErrorCodeToStatus: Record<string, number> = {
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
    [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
    [ErrorCodes.AUTH_TOKEN_INVALID]: 401,
    [ErrorCodes.AUTH_ACCOUNT_DISABLED]: 403,
    [ErrorCodes.AUTH_ACCOUNT_LOCKED]: 423,
    [ErrorCodes.AUTH_TOO_MANY_ATTEMPTS]: 429,

    [ErrorCodes.USER_NOT_FOUND]: 404,
    [ErrorCodes.USER_ALREADY_EXISTS]: 409,
    [ErrorCodes.USER_BANNED]: 403,
    [ErrorCodes.USER_DELETED]: 410,

    [ErrorCodes.PET_NOT_FOUND]: 404,
    [ErrorCodes.PET_LIMIT_EXCEEDED]: 403,

    [ErrorCodes.HEALTH_RECORD_NOT_FOUND]: 404,
    [ErrorCodes.HEALTH_RECORD_INVALID]: 400,

    [ErrorCodes.ARTICLE_NOT_FOUND]: 404,

    [ErrorCodes.ADMIN_NOT_FOUND]: 404,
    [ErrorCodes.ADMIN_PERMISSION_DENIED]: 403,

    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.INVALID_PARAMETER]: 400,
    [ErrorCodes.MISSING_PARAMETER]: 400,
    [ErrorCodes.PAGE_LIMIT_EXCEEDED]: 400,

    [ErrorCodes.INTERNAL_ERROR]: 500,
    [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
};
