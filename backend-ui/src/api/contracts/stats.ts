/**
 * 统计聚合 API 契约
 * 仪表盘统计数据
 */

import getHttpClient from '../client';
import type { ApiResponseWithMeta, DashboardStats, TrendPoint } from '../types';

// ============ 请求类型 ============

export interface TrendParams {
    /** 天数，默认30，最大365 */
    days?: number;
}

// ============ API 调用 ============

/**
 * 获取仪表盘统计数据
 * GET /api/admin/stats/dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const response = await getHttpClient().get<ApiResponseWithMeta<DashboardStats>>('/admin/stats/dashboard') as unknown as ApiResponseWithMeta<DashboardStats>;
    return response.data;
}

/**
 * 获取用户增长趋势
 * GET /api/admin/stats/users/trend
 */
export async function getUsersTrend(params?: TrendParams): Promise<TrendPoint[]> {
    const response = await getHttpClient().get<ApiResponseWithMeta<TrendPoint[]>>('/admin/stats/users/trend', {
        params,
    }) as unknown as ApiResponseWithMeta<TrendPoint[]>;
    return response.data;
}

/**
 * 获取健康记录趋势
 * GET /api/admin/stats/records/trend
 */
export async function getRecordsTrend(params?: TrendParams): Promise<TrendPoint[]> {
    const response = await getHttpClient().get<ApiResponseWithMeta<TrendPoint[]>>('/admin/stats/records/trend', {
        params,
    }) as unknown as ApiResponseWithMeta<TrendPoint[]>;
    return response.data;
}
