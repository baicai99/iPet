/**
 * Token 管理模块
 * 处理 JWT Token 的存储、读取、验证和清理
 */

const TOKEN_KEY = 'admin_token';
const ADMIN_INFO_KEY = 'admin_info';

const memoryStore = new Map<string, string>();

const storage = (() => {
    try {
        const testKey = '__ipet_storage_test__';
        sessionStorage.setItem(testKey, '1');
        sessionStorage.removeItem(testKey);
        return sessionStorage;
    } catch {
        return {
            getItem: (key: string) => memoryStore.get(key) ?? null,
            setItem: (key: string, value: string) => {
                memoryStore.set(key, value);
            },
            removeItem: (key: string) => {
                memoryStore.delete(key);
            },
        } as Storage;
    }
})();

const migrateLegacyStorage = () => {
    try {
        const legacyToken = localStorage.getItem(TOKEN_KEY);
        const legacyAdmin = localStorage.getItem(ADMIN_INFO_KEY);
        if (legacyToken) {
            storage.setItem(TOKEN_KEY, legacyToken);
            localStorage.removeItem(TOKEN_KEY);
        }
        if (legacyAdmin) {
            storage.setItem(ADMIN_INFO_KEY, legacyAdmin);
            localStorage.removeItem(ADMIN_INFO_KEY);
        }
    } catch {
        // Ignore migration errors (e.g., storage unavailable)
    }
};

migrateLegacyStorage();

// ============ Token 存储 ============

/**
 * 获取存储的 Token
 */
export function getToken(): string | null {
    return storage.getItem(TOKEN_KEY);
}

/**
 * 存储 Token
 */
export function setToken(token: string): void {
    storage.setItem(TOKEN_KEY, token);
}

/**
 * 清除 Token
 */
export function clearToken(): void {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(ADMIN_INFO_KEY);
}

// ============ 管理员信息存储 ============

import type { AdminInfo } from './types';

/**
 * 获取存储的管理员信息
 */
export function getAdminInfo(): AdminInfo | null {
    const info = storage.getItem(ADMIN_INFO_KEY);
    if (!info) return null;
    try {
        return JSON.parse(info) as AdminInfo;
    } catch {
        return null;
    }
}

/**
 * 存储管理员信息
 */
export function setAdminInfo(admin: AdminInfo): void {
    storage.setItem(ADMIN_INFO_KEY, JSON.stringify(admin));
}

// ============ Token 验证 ============

interface JwtPayload {
    exp?: number;
    adminId?: string;
    username?: string;
    role?: string;
    isAdmin?: boolean;
}

/**
 * 解析 JWT Payload（不验证签名）
 */
function parseJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * 检查 Token 是否过期
 * @param bufferSeconds 提前过期的缓冲时间（秒），默认 60 秒
 */
export function isTokenExpired(bufferSeconds = 60): boolean {
    const token = getToken();
    if (!token) return true;

    const payload = parseJwtPayload(token);
    if (!payload?.exp) return true;

    const expiresAt = payload.exp * 1000; // 转换为毫秒
    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;

    return now >= expiresAt - bufferMs;
}

/**
 * 获取 Token 剩余有效时间（秒）
 * 返回 -1 表示已过期或无效
 */
export function getTokenRemainingTime(): number {
    const token = getToken();
    if (!token) return -1;

    const payload = parseJwtPayload(token);
    if (!payload?.exp) return -1;

    const expiresAt = payload.exp * 1000;
    const remaining = Math.floor((expiresAt - Date.now()) / 1000);

    return remaining > 0 ? remaining : -1;
}

// ============ 认证状态 ============

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
    return !!getToken() && !isTokenExpired();
}

/**
 * 获取当前管理员角色
 */
export function getCurrentRole(): string | null {
    const admin = getAdminInfo();
    return admin?.role ?? null;
}

/**
 * 检查是否为超级管理员
 */
export function isSuperAdmin(): boolean {
    return getCurrentRole() === 'super_admin';
}

// ============ Token 过期事件 ============

type TokenExpiredCallback = () => void;
let tokenExpiredCallback: TokenExpiredCallback | null = null;

/**
 * 注册 Token 过期回调
 */
export function onTokenExpired(callback: TokenExpiredCallback): void {
    tokenExpiredCallback = callback;
}

/**
 * 触发 Token 过期事件
 */
export function triggerTokenExpired(): void {
    clearToken();
    tokenExpiredCallback?.();
}
