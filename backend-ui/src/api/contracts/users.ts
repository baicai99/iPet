/**
 * 用户管理 API 契约
 */

import httpClient from '../client';
import type {
    User,
    UserDetail,
    GuestStats,
    PaginatedData,
    PaginationParams,
} from '../types';

// ============ 请求类型 ============

export interface UserListParams extends PaginationParams {
    /** 搜索关键词（邮箱、昵称、姓名） */
    search?: string;
    /** 筛选游客/正式用户 */
    isGuest?: boolean;
    /** 筛选封禁状态 */
    isBanned?: boolean;
}

export interface BanUserRequest {
    /** 封禁原因（必填） */
    reason: string;
}

// ============ API 调用 ============

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export async function getUsers(params?: UserListParams): Promise<PaginatedData<User>> {
    const response = await httpClient.get<PaginatedData<User>>('/admin/users', {
        params,
    });
    return response as unknown as PaginatedData<User>;
}

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
export async function getUserById(id: string): Promise<UserDetail> {
    const response = await httpClient.get<UserDetail>(`/admin/users/${id}`);
    return response as unknown as UserDetail;
}

/**
 * 封禁用户
 * PATCH /api/admin/users/:id/ban
 */
export async function banUser(id: string, data: BanUserRequest): Promise<User> {
    const response = await httpClient.patch<User>(`/admin/users/${id}/ban`, data);
    return response as unknown as User;
}

/**
 * 解封用户
 * PATCH /api/admin/users/:id/unban
 */
export async function unbanUser(id: string): Promise<User> {
    const response = await httpClient.patch<User>(`/admin/users/${id}/unban`);
    return response as unknown as User;
}

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 * 
 * 注意：此操作会删除用户的所有关联数据（宠物、健康记录、头像文件等）
 */
export async function deleteUser(id: string): Promise<void> {
    await httpClient.delete(`/admin/users/${id}`);
}

/**
 * 获取游客统计
 * GET /api/admin/users/guests/stats
 */
export async function getGuestStats(): Promise<GuestStats> {
    const response = await httpClient.get<GuestStats>('/admin/users/guests/stats');
    return response as unknown as GuestStats;
}
