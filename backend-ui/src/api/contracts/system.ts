/**
 * 系统监控 API 契约
 * 仅 super_admin 可访问
 */

import httpClient from '../client';
import type { SystemInfo, StorageStats } from '../types';

// ============ API 调用 ============

/**
 * 获取系统信息
 * GET /api/admin/system/info
 * 
 * 注意：仅 super_admin 可访问
 */
export async function getSystemInfo(): Promise<SystemInfo> {
    const response = await httpClient.get<SystemInfo>('/admin/system/info');
    return response as unknown as SystemInfo;
}

/**
 * 获取存储统计
 * GET /api/admin/system/storage
 * 
 * 注意：仅 super_admin 可访问
 */
export async function getStorageStats(): Promise<StorageStats> {
    const response = await httpClient.get<StorageStats>('/admin/system/storage');
    return response as unknown as StorageStats;
}
