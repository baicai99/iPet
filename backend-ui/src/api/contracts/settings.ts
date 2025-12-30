/**
 * 设置 API 契约
 * @description 管理员设置相关 API 调用
 */

import getHttpClient from '../client';
import type { ApiResponseWithMeta } from '../types';

export interface SettingsResponse {
    username: string;
    email: string | null;
    port: number;
    entryPath: string;
}

export interface UpdateSettingsRequest {
    username: string;
    email: string;
    port: number;
    entryPath: string;
    password?: string;
    currentPassword?: string;
}

export interface VerifyPasswordResponse {
    valid: boolean;
}

/**
 * 获取当前设置
 * GET /api/admin/settings
 */
export async function getSettings(): Promise<SettingsResponse> {
    const response = await getHttpClient().get<ApiResponseWithMeta<SettingsResponse>>(
        '/admin/settings'
    ) as unknown as ApiResponseWithMeta<SettingsResponse>;
    return response.data;
}

/**
 * 更新设置
 * PUT /api/admin/settings
 */
export async function updateSettings(data: UpdateSettingsRequest): Promise<SettingsResponse> {
    const response = await getHttpClient().put<ApiResponseWithMeta<SettingsResponse>>(
        '/admin/settings',
        data
    ) as unknown as ApiResponseWithMeta<SettingsResponse>;
    return response.data;
}

/**
 * 验证旧密码
 * POST /api/admin/settings/verify-password
 */
export async function verifyAdminPassword(currentPassword: string): Promise<VerifyPasswordResponse> {
    const response = await getHttpClient().post<ApiResponseWithMeta<VerifyPasswordResponse>>(
        '/admin/settings/verify-password',
        { currentPassword }
    ) as unknown as ApiResponseWithMeta<VerifyPasswordResponse>;
    return response.data;
}
