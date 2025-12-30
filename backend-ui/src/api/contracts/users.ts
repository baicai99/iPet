/**
 * 用户管理 API 契约
 */

import getHttpClient from '../client';
import type {
    User,
    UserDetail,
    GuestStats,
    PaginatedData,
    PaginationParams,
    ApiResponseWithMeta,
} from '../types';
import type { RawPaginatedData } from '../pagination';
import { UserListSchema, UserDetailSchema, GuestStatsSchema, UserSchema } from '../schemas';
import { AppError } from '@/core/errors';
import { normalizePaginatedData } from '../pagination';

// ============ 请求类型 ============

export interface UserListParams extends PaginationParams {
    /** 搜索关键词（邮箱、昵称、姓名） */
    search?: string;
    /** 筛选游客/正式用户 */
    isGuest?: boolean;
    /** 筛选封禁状态 */
    isBanned?: boolean;
    /** 排序字段 */
    sortBy?: 'createdAt' | 'lastActiveAt' | 'petsCount';
    /** 排序方向 */
    sortOrder?: 'asc' | 'desc';
}

export interface BanUserRequest {
    /** 封禁原因（必填） */
    reason: string;
}

export interface BatchUserActionRequest {
    ids: string[];
    reason?: string;
}

// ============ API 调用 ============

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export async function getUsers(params?: UserListParams): Promise<PaginatedData<User>> {
    const response = await getHttpClient().get<ApiResponseWithMeta<RawPaginatedData<User>>>('/admin/users', {
        params,
    }) as unknown as ApiResponseWithMeta<RawPaginatedData<User>>;

    // 运行时类型校验
    try {
        const normalized = normalizePaginatedData(response.data);
        const validated = UserListSchema.parse(normalized);
        return validated;
    } catch (error) {
        throw new AppError(
            'VALIDATION_ERROR',
            'API 响应格式不正确',
            response.meta.requestId,
            { originalError: error, responseData: response.data }
        );
    }
}

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
export async function getUserById(id: string): Promise<UserDetail> {
    const response = await getHttpClient().get<ApiResponseWithMeta<UserDetail>>(`/admin/users/${id}`) as unknown as ApiResponseWithMeta<UserDetail>;

    try {
        const validated = UserDetailSchema.parse(response.data);
        return validated;
    } catch (error) {
        throw new AppError(
            'VALIDATION_ERROR',
            '用户详情格式不正确',
            response.meta.requestId,
            { originalError: error, responseData: response.data }
        );
    }
}

/**
 * 封禁用户
 * PATCH /api/admin/users/:id/ban
 */
export async function banUser(id: string, data: BanUserRequest): Promise<User> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<User>>(`/admin/users/${id}/ban`, data) as unknown as ApiResponseWithMeta<User>;

    try {
        const validated = UserSchema.parse(response.data);
        return validated;
    } catch (error) {
        throw new AppError(
            'VALIDATION_ERROR',
            '封禁用户响应格式不正确',
            response.meta.requestId,
            { originalError: error, responseData: response.data }
        );
    }
}

/**
 * 解封用户
 * PATCH /api/admin/users/:id/unban
 */
export async function unbanUser(id: string): Promise<User> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<User>>(`/admin/users/${id}/unban`) as unknown as ApiResponseWithMeta<User>;

    try {
        const validated = UserSchema.parse(response.data);
        return validated;
    } catch (error) {
        throw new AppError(
            'VALIDATION_ERROR',
            '解封用户响应格式不正确',
            response.meta.requestId,
            { originalError: error, responseData: response.data }
        );
    }
}

/**
 * 批量封禁用户
 * PATCH /api/admin/users/batch/ban
 */
export async function batchBanUsers(data: BatchUserActionRequest): Promise<{ count: number }> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<{ count: number }>>('/admin/users/batch/ban', data) as unknown as ApiResponseWithMeta<{ count: number }>;
    return response.data;
}

/**
 * 批量解封用户
 * PATCH /api/admin/users/batch/unban
 */
export async function batchUnbanUsers(data: BatchUserActionRequest): Promise<{ count: number }> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<{ count: number }>>('/admin/users/batch/unban', data) as unknown as ApiResponseWithMeta<{ count: number }>;
    return response.data;
}

/**
 * 批量删除用户
 * PATCH /api/admin/users/batch/delete
 */
export async function batchDeleteUsers(data: BatchUserActionRequest): Promise<{ count: number }> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<{ count: number }>>('/admin/users/batch/delete', data) as unknown as ApiResponseWithMeta<{ count: number }>;
    return response.data;
}

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 *
 * 注意：此操作会删除用户的所有关联数据（宠物、健康记录、头像文件等）
 */
export async function deleteUser(id: string): Promise<void> {
    await getHttpClient().delete(`/admin/users/${id}`);
}

/**
 * 获取游客统计
 * GET /api/admin/users/guests/stats
 */
export async function getGuestStats(): Promise<GuestStats> {
    const response = await getHttpClient().get<ApiResponseWithMeta<GuestStats>>('/admin/users/guests/stats') as unknown as ApiResponseWithMeta<GuestStats>;

    try {
        const validated = GuestStatsSchema.parse(response.data);
        return validated;
    } catch (error) {
        throw new AppError(
            'VALIDATION_ERROR',
            '访客统计格式不正确',
            response.meta.requestId,
            { originalError: error, responseData: response.data }
        );
    }
}
