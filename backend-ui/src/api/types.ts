/**
 * API 通用类型定义
 * 基于 管理后台API.md v1.1.0
 */

// ============ 通用响应类型 ============

/** API 成功响应 */
export interface ApiResponse<T> {
    success: true;
    data: T;
    requestId: string;
    timestamp: number;
}

/** API 错误响应 */
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
    requestId: string;
    timestamp: number;
}

/** API 响应联合类型 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/** API 响应元信息 */
export interface ApiResponseMeta {
    requestId: string;
    timestamp: number;
}

/** 带元信息的 API 响应（拦截器返回格式） */
export interface ApiResponseWithMeta<T> {
    data: T;
    meta: ApiResponseMeta;
}

/** 请求配置扩展 */
export interface ApiRequestConfig {
    /** 返回原始响应（不解包，用于特殊场景） */
    _rawResponse?: boolean;
}

// ============ 分页类型 ============

/** 分页请求参数 */
export interface PaginationParams {
    page?: number;
    limit?: number;
}

/** 分页信息 */
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/** 分页响应数据 */
export interface PaginatedData<T> {
    items: T[];
    pagination: PaginationInfo;
}

// ============ 排序类型 ============

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
    sortBy?: string;
    sortOrder?: SortOrder;
}

// ============ 错误类型 ============

/** 业务错误码 */
export type ErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'USER_NOT_FOUND'
    | 'ARTICLE_NOT_FOUND'
    | 'LOGIN_FAILED'
    | 'ACCOUNT_LOCKED'
    | 'VALIDATION_ERROR'
    | 'SERVER_ERROR'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';

/** API 错误 */
export class ApiError extends Error {
    code: ErrorCode;
    requestId?: string;
    statusCode?: number;

    constructor(
        code: ErrorCode,
        message: string,
        requestId?: string,
        statusCode?: number
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.requestId = requestId;
        this.statusCode = statusCode;
    }
}

// ============ 管理员类型 ============

/** 管理员角色 */
export type AdminRole = 'admin';

/** 管理员信息 */
export interface AdminInfo {
    id: string;
    username: string;
    displayName: string;
    role: AdminRole;
}

// ============ 用户类型 ============

/** 用户列表项 */
export interface User extends Record<string, unknown> {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    isGuest: boolean;
    isBanned: boolean;
    bannedAt?: string;
    bannedReason?: string;
    createdAt: string;
    lastActiveAt?: string;
    petsCount: number;
}

/** 宠物类型 */
export type PetType = 'dog' | 'cat' | 'other';

/** 宠物信息 */
export interface Pet {
    id: string;
    name: string;
    type: PetType;
    healthRecordsCount: number;
}

/** 用户详情 */
export interface UserDetail extends User {
    healthRecordsCount: number;
    pets: Pet[];
}

/** 游客统计 */
export interface GuestStats {
    total: number;
    last7Days: number;
    last30Days: number;
}

// ============ 文章类型 ============

/** 文章分类 */
export type ArticleCategory = 'education' | 'health' | 'care' | 'nutrition' | string;

/** 文章置顶范围 */
export type ArticlePinScope = 'section' | 'metric';

/** 文章分类选项 */
export interface ArticleCategoryOption {
    key: string;
    label: string;
    order: number;
    count?: number;
}

/** 文章列表项 */
export interface Article extends Record<string, unknown> {
    id: string;
    title: string;
    summary: string;
    category: ArticleCategory;
    cover?: string;
    tags: string[];
    views: number;
    likes: number;
    sectionPinned: boolean;
    sectionPinnedAt?: string | null;
    pinnedMetrics: string[];
    createdAt: string;
    updatedAt?: string;
}

/** 文章详情 */
export interface ArticleDetail extends Article {
    content: string;
    author?: string;
}

// ============ 统计类型 ============

/** 宠物分布 */
export interface PetDistribution {
    type: PetType;
    count: number;
}

/** 仪表盘统计 */
export interface DashboardStats {
    users: {
        total: number;
        guests: number;
        registered: number;
        active7d: number;
        active30d: number;
        newToday: number;
    };
    pets: {
        total: number;
        distribution: PetDistribution[];
    };
    healthRecords: {
        total: number;
        today: number;
    };
    articles: {
        total: number;
        totalViews: number;
    };
    generatedAt: string;
}

/** 趋势数据点 */
export interface TrendPoint {
    date: string;
    count: number;
}

// ============ 系统类型 ============

/** 内存使用 */
export interface MemoryUsage {
    total: number;
    free: number;
    used: number;
    usedPercent: string;
}

/** 系统详情 */
export interface SystemDetails {
    platform: string;
    arch: string;
    nodeVersion: string;
    hostname?: string;
    uptime: number;
    memoryUsage: MemoryUsage;
    cpuUsage: number[];
}

/** 系统信息 */
export interface SystemInfo {
    status: 'ok' | 'error';
    uptime: number;
    version: string;
    system: SystemDetails;
}

/** 存储分类统计 */
export interface StorageBreakdown {
    [extension: string]: {
        count: number;
        size: number;
    };
}

/** 存储统计 */
export interface StorageStats {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    breakdown: StorageBreakdown;
}

// ============ 审计日志类型 ============

/** 审计日志操作类型 */
export type AuditLogAction = string;

/** 审计日志 */
export interface AuditLog {
    id: string;
    action: AuditLogAction;
    user: string;
    timestamp: string;
    details: string;
    ip?: string;
}
