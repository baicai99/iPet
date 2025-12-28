/**
 * 统计聚合 API 契约
 * 仪表盘统计数据
 */

import httpClient from '../client';
import type { DashboardStats, TrendPoint } from '../types';

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
    const response = await httpClient.get<DashboardStats>('/admin/stats/dashboard');
    return response as unknown as DashboardStats;
}

/**
 * 获取用户增长趋势
 * GET /api/admin/stats/users/trend
 */
export async function getUsersTrend(params?: TrendParams): Promise<TrendPoint[]> {
    const response = await httpClient.get<TrendPoint[]>('/admin/stats/users/trend', {
        params,
    });
    return response as unknown as TrendPoint[];
}

/**
 * 获取健康记录趋势
 * GET /api/admin/stats/records/trend
 */
export async function getRecordsTrend(params?: TrendParams): Promise<TrendPoint[]> {
    const response = await httpClient.get<TrendPoint[]>('/admin/stats/records/trend', {
        params,
    });
    return response as unknown as TrendPoint[];
}
