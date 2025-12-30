/**
 * 应用全局配置
 * @description 定义 API 地址、存储键、权限角色等常量
 */

const isMockEnabled = import.meta.env.VITE_MOCK === 'true';
// MSW 仅支持同源拦截，mock 模式固定走相对路径
export const API_BASE_URL = isMockEnabled
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'http://backend-api');
export const API_PREFIX = '/api/admin';
export const SKIP_INIT = import.meta.env.VITE_SKIP_INIT === 'true';

// Token 存储键
export const TOKEN_KEY = 'admin_token';
export const ADMIN_KEY = 'admin_info';

// 权限角色
// 权限角色 (Replaced Enum with Const Object for erasableSyntaxOnly)
export const AdminRole = {
    ADMIN: 'admin',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

// 断点常量（与 Ant Design Grid 一致）
export const BREAKPOINTS = {
    xs: 576,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
} as const;

// 管理员信息类型
export interface AdminInfo {
    id: string;
    username: string;
    displayName: string;
    role: AdminRole;
}

// 登录响应类型
export interface LoginResponse {
    accessToken: string;
    expiresIn: number;
    admin: AdminInfo;
}
