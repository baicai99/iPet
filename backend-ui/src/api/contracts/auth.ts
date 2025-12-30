/**
 * 认证 API 契约
 * 管理员登录/登出
 */

import getHttpClient from '../client';
import { setToken, setAdminInfo, clearToken } from '../token';
import type { AdminInfo, ApiResponseWithMeta } from '../types';

// ============ 请求类型 ============

export interface LoginRequest {
    username: string;
    password: string;
}

// ============ 响应类型 ============

export interface LoginResponse {
    accessToken: string;
    expiresIn: number;
    admin: AdminInfo;
}

// ============ API 调用 ============

/**
 * 管理员登录
 * POST /api/admin/login
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await getHttpClient().post<ApiResponseWithMeta<LoginResponse>>('/admin/login', data, {
        // 登录请求不需要携带 Token
        _skipAuth: true,
    } as never) as unknown as ApiResponseWithMeta<LoginResponse>;

    // 存储 Token 和管理员信息
    const result = response.data;
    setToken(result.accessToken);
    setAdminInfo(result.admin);

    return result;
}

/**
 * 管理员登出
 * 清除本地存储的认证信息
 */
export function logout(): void {
    clearToken();
}
