/**
 * Token Store - 订阅式 Token 状态管理
 * @description 使用 useSyncExternalStore 实现响应式 token 管理，解决登录态同步问题
 */

import { useSyncExternalStore } from 'react';
import type { AdminInfo } from '../config';

const TOKEN_KEY = 'admin_token';
const ADMIN_INFO_KEY = 'admin_info';

// ============ 存储层 ============

// 内存存储 fallback
const memoryStore = new Map<string, string>();

// 尝试使用 sessionStorage，失败则降级到内存存储
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

// 启动时迁移 localStorage 数据到 sessionStorage
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
        // Ignore migration errors
    }
};

migrateLegacyStorage();

// ============ 订阅层 ============

type Listener = () => void;
const listeners = new Set<Listener>();

// Snapshot 缓存，避免无限循环
let cachedTokenSnapshot: string | null = null;
let cachedAdminSnapshot: AdminInfo | null = null;
let isTokenSnapshotDirty = true; // 标记 token 缓存是否过期
let isAdminSnapshotDirty = true; // 标记 admin 缓存是否过期

/**
 * 订阅 token 变化
 * @returns 取消订阅函数
 */
const subscribe = (callback: Listener): (() => void) => {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
};

/**
 * 通知所有订阅者
 */
const notifyListeners = (): void => {
    isTokenSnapshotDirty = true;
    isAdminSnapshotDirty = true;
    listeners.forEach(listener => listener());
};

// ============ Token 管理 ============

/**
 * 获取存储的 Token
 */
export function getToken(): string | null {
    // 只在缓存过期时重新读取
    if (isTokenSnapshotDirty) {
        cachedTokenSnapshot = storage.getItem(TOKEN_KEY);
        isTokenSnapshotDirty = false;
    }
    return cachedTokenSnapshot;
}

/**
 * 存储 Token
 * @param token JWT token 字符串
 */
export function setToken(token: string): void {
    storage.setItem(TOKEN_KEY, token);
    notifyListeners();
}

/**
 * 清除 Token 和管理员信息
 */
export function clearToken(): void {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(ADMIN_INFO_KEY);
    cachedTokenSnapshot = null;
    cachedAdminSnapshot = null;
    notifyListeners();
}

// ============ 管理员信息管理 ============

/**
 * 获取存储的管理员信息
 */
export function getAdminInfo(): AdminInfo | null {
    // 只在缓存过期时重新读取并解析
    if (isAdminSnapshotDirty) {
        const info = storage.getItem(ADMIN_INFO_KEY);
        if (!info) {
            cachedAdminSnapshot = null;
        } else {
            try {
                cachedAdminSnapshot = JSON.parse(info) as AdminInfo;
            } catch {
                cachedAdminSnapshot = null;
            }
        }
        isAdminSnapshotDirty = false;
    }
    return cachedAdminSnapshot;
}

/**
 * 存储管理员信息
 * @param admin 管理员信息对象
 */
export function setAdminInfo(admin: AdminInfo): void {
    storage.setItem(ADMIN_INFO_KEY, JSON.stringify(admin));
    notifyListeners();
}

// ============ React Hooks ============

/**
 * 订阅 Token 变化的 Hook
 * @description 使用 useSyncExternalStore 实现响应式订阅
 * @returns 当前 token 值（可能为 null）
 */
export function useToken(): string | null {
    return useSyncExternalStore(
        subscribe,
        getToken,
        getToken  // Server snapshot (SSR 支持)
    );
}

/**
 * 订阅管理员信息变化的 Hook
 * @description 使用 useSyncExternalStore 实现响应式订阅
 * @returns 当前管理员信息（可能为 null）
 */
export function useAdminInfo(): AdminInfo | null {
    return useSyncExternalStore(
        subscribe,
        getAdminInfo,
        getAdminInfo  // Server snapshot (SSR 支持)
    );
}

// ============ Token 验证工具 ============

interface JwtPayload {
    exp?: number;
    adminId?: string;
    username?: string;
    role?: string;
    isAdmin?: boolean;
}

/**
 * 解析 JWT Payload（不验证签名）
 * @param token JWT token 字符串
 * @returns 解析后的 payload 或 null
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
 * @returns true 表示已过期或无效
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
 * @returns 剩余秒数，-1 表示已过期或无效
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

/**
 * 检查是否已登录
 * @returns true 表示已登录且 token 有效
 */
export function isAuthenticated(): boolean {
    return !!getToken() && !isTokenExpired();
}

/**
 * 获取当前管理员角色
 * @returns 角色字符串或 null
 */
export function getCurrentRole(): string | null {
    const admin = getAdminInfo();
    return admin?.role ?? null;
}
