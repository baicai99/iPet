/**
 * QueryKeys 工厂函数
 * @description 统一管理所有 React Query 的 queryKey，提供类型安全和结构化访问
 */

import type { UserListParams } from './contracts/users';

/**
 * Dashboard 相关 QueryKeys
 */
const dashboard = {
    /** Dashboard 命名空间根 */
    all: () => ['dashboard'] as const,

    /** 仪表盘统计数据 */
    stats: () => [...dashboard.all(), 'stats'] as const,

    /** 用户趋势数据 */
    usersTrend: (range: string) => [...dashboard.all(), 'users-trend', range] as const,

    /** 记录趋势数据 */
    recordsTrend: (range: string) => [...dashboard.all(), 'records-trend', range] as const,
};

/**
 * Users 相关 QueryKeys
 */
const users = {
    /** Users 命名空间根 */
    all: () => ['users'] as const,

    /** 用户列表 */
    list: (params?: UserListParams) =>
        params
            ? [...users.all(), 'list', params] as const
            : [...users.all(), 'list'] as const,

    /** 单个用户详情 */
    detail: (id: string) => [...users.all(), 'detail', id] as const,

    /** 访客统计 */
    guestStats: () => [...users.all(), 'guest-stats'] as const,
};

/**
 * 导出统一的 queryKeys 对象
 */
export const queryKeys = {
    dashboard,
    users,
} as const;

/**
 * QueryKey 类型推导
 */
export type QueryKeys = typeof queryKeys;
