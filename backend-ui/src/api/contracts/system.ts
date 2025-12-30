/**
 * 系统监控 API 契约
 * 仅 admin 可访问
 */

import getHttpClient from '../client';
import type { ApiResponseWithMeta, SystemInfo, StorageStats } from '../types';

// ============ API 调用 ============

/**
 * 获取系统信息
 * GET /api/admin/system/info
 * 
 * 注意：仅 admin 可访问
 */
export async function getSystemInfo(): Promise<SystemInfo> {
    const response = await getHttpClient().get<ApiResponseWithMeta<SystemInfo>>('/admin/system/info') as unknown as ApiResponseWithMeta<SystemInfo>;
    return response.data;
}

/**
 * 获取存储统计
 * GET /api/admin/system/storage
 * 
 * 注意：仅 admin 可访问
 */
export async function getStorageStats(): Promise<StorageStats> {
    const response = await getHttpClient().get<ApiResponseWithMeta<StorageStats>>('/admin/system/storage') as unknown as ApiResponseWithMeta<StorageStats>;
    return response.data;
}
