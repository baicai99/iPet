/**
 * 路由路径常量
 * @description 统一管理所有路由路径，避免硬编码
 */

/**
 * 路由路径常量
 */
export const ROUTES = {
    // 动态路由前缀，实际使用时需要替换 :entryPath
    LOGIN: '/:entryPath/login',
    DASHBOARD: 'dashboard',
    USERS: 'users',
    USERS_TRASH: 'users/trash',
    ARTICLES: 'articles',
    ARTICLES_NEW: 'articles/new',
    /** 编辑文章（动态路由） */
    ARTICLES_EDIT: (id: string) => `/articles/${id}/edit`,

    /** 审计日志 */
    AUDIT_LOGS: 'audit-logs',

    /** 系统设置 */
    SYSTEM_SETTINGS: 'system-settings',
} as const;

/**
 * 路由路径类型
 */
export type RouteKey = keyof typeof ROUTES;
