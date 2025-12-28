export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    message?: string;
    requestId?: string;
    timestamp: number;
}

export interface PaginatedData<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export function createSuccessResponse<T>(data: T, message?: string): Partial<ApiResponse<T>> {
    return {
        success: true,
        data,
        message,
        timestamp: Date.now(),
    };
}

export function createPaginatedResponse<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
): Partial<PaginatedResponse<T>> {
    return {
        success: true,
        data: {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
        timestamp: Date.now(),
    };
}

export function createErrorResponse(
    code: string,
    message: string,
    details?: Record<string, any>,
): Partial<ApiResponse<null>> {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: Date.now(),
    };
}
