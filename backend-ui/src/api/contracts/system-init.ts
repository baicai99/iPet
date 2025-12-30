/**
 * 系统初始化 API 契约
 * @description 系统初始化相关的 API 调用
 */

import getHttpClient from '../client';
import type { AdminInfo, ApiResponseWithMeta } from '../types';

// ============ 请求类型 ============

export interface InitSystemRequest {
    accessUrl: string;
    port?: number;
    entryPath: string;
    admin: {
        username: string;
        email: string;
        password: string;
    };
}

export interface UpdateEntryPathRequest {
    newPath: string;
    currentPassword: string;
}

export interface UpdateAccessConfigRequest {
    url: string;
    port?: number;
}

// ============ 响应类型 ============

export interface CheckAdminExistsResponse {
    exists: boolean;
}

export interface InitSystemResponse {
    success: boolean;
    admin: AdminInfo;
    accessToken: string;
    message: string;
}

export interface UpdateEntryPathResponse {
    success: boolean;
    newPath: string;
    newLoginUrl: string;
}

// ============ API 调用 ============

/**
 * 检查是否存在管理员
 * GET /api/admin/exists
 */
export async function checkAdminExists(): Promise<CheckAdminExistsResponse> {
    const response = await getHttpClient().get<ApiResponseWithMeta<CheckAdminExistsResponse>>(
        '/admin/exists',
        {
            _skipAuth: true,
        } as never
    ) as unknown as ApiResponseWithMeta<CheckAdminExistsResponse>;
    return response.data;
}

/**
 * 提交系统初始化配置（原子性操作）
 * POST /api/admin/init
 */
export async function initializeSystem(data: InitSystemRequest): Promise<InitSystemResponse> {
    const response = await getHttpClient().post<ApiResponseWithMeta<InitSystemResponse>>('/admin/init', data, {
        _skipAuth: true,
    } as never) as unknown as ApiResponseWithMeta<InitSystemResponse>;
    return response.data;
}

/**
 * 更新入口路径（需管理员权限）
 * PUT /api/admin/settings/entry-path
 */
export async function updateEntryPath(
    data: UpdateEntryPathRequest
): Promise<UpdateEntryPathResponse> {
    const response = await getHttpClient().put<ApiResponseWithMeta<UpdateEntryPathResponse>>(
        '/admin/settings/entry-path',
        data
    ) as unknown as ApiResponseWithMeta<UpdateEntryPathResponse>;
    return response.data;
}

/**
 * 更新访问配置（需管理员权限）
 * PUT /api/admin/settings/access-config
 */
export async function updateAccessConfig(data: UpdateAccessConfigRequest): Promise<void> {
    await getHttpClient().put('/admin/settings/access-config', data);
}

/**
 * 获取当前系统配置（需管理员权限）
 * GET /api/admin/settings/system-config
 */
export async function getSystemSettings(): Promise<{
    accessUrl: string;
    port?: number;
    entryPath: string;
}> {
    const response = await getHttpClient().get<ApiResponseWithMeta<{
        accessUrl: string;
        port?: number;
        entryPath: string;
    }>>('/admin/settings/system-config') as unknown as ApiResponseWithMeta<{
        accessUrl: string;
        port?: number;
        entryPath: string;
    }>;
    return response.data;
}
