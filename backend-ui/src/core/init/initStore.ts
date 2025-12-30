/**
 * Init Store - 系统初始化状态管理
 * @description 使用 useSyncExternalStore 实现响应式初始化状态管理
 */

import { useSyncExternalStore } from 'react';
import { checkAdminExists, getSystemSettings } from '@/api/contracts/system-init';

// ============ 类型定义 ============

export interface AccessConfig {
    url: string;
    port?: number;
}

export interface SystemInitConfig {
    isInitialized: boolean;
    entryPath: string | null;
    accessConfig: AccessConfig | null;
    loading: boolean;
    hasRequested: boolean;
}

// ============ 订阅层 ============

type Listener = () => void;
const listeners = new Set<Listener>();

// Snapshot 缓存
let cachedSnapshot: SystemInitConfig = {
    isInitialized: false,
    entryPath: null,
    accessConfig: null,
    loading: false,
    hasRequested: false,
};
let isSnapshotDirty = true;
let refreshInFlight: Promise<void> | null = null;

/**
 * 订阅状态变化
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
    isSnapshotDirty = true;
    listeners.forEach(listener => listener());
};

// ============ 初始化状态管理 ============

/**
 * 获取系统初始化状态
 */
export function getInitStatus(): boolean {
    return getSystemConfig().isInitialized;
}

/**
 * 设置系统初始化状态（内存）
 */
export function setInitStatus(initialized: boolean): void {
    cachedSnapshot = {
        ...cachedSnapshot,
        isInitialized: initialized,
    };
    notifyListeners();
}

// ============ 入口路径管理 ============

/**
 * 获取入口路径
 */
export function getEntryPath(): string | null {
    return getSystemConfig().entryPath;
}

/**
 * 设置入口路径（内存）
 */
export function setEntryPath(path: string): void {
    cachedSnapshot = {
        ...cachedSnapshot,
        entryPath: path,
    };
    notifyListeners();
}

// ============ 访问配置管理 ============

/**
 * 获取访问配置
 */
export function getAccessConfig(): AccessConfig | null {
    return getSystemConfig().accessConfig;
}

/**
 * 设置访问配置（内存）
 */
export function setAccessConfig(config: AccessConfig): void {
    cachedSnapshot = {
        ...cachedSnapshot,
        accessConfig: config,
    };
    notifyListeners();
}

// ============ 完整配置获取 ============

/**
 * 获取完整的系统初始化配置
 */
export function getSystemConfig(): SystemInitConfig {
    if (isSnapshotDirty) {
        isSnapshotDirty = false;
    }
    return cachedSnapshot;
}

/**
 * 完成系统初始化（原子性操作）
 */
export function completeInitialization(config: {
    entryPath: string;
    accessConfig: AccessConfig;
}): void {
    cachedSnapshot = {
        ...cachedSnapshot,
        isInitialized: true,
        entryPath: config.entryPath,
        accessConfig: config.accessConfig,
        loading: false,
        hasRequested: true,
    };
    notifyListeners();
}

/**
 * 重置系统（清除所有初始化数据）
 */
export function resetSystem(): void {
    cachedSnapshot = {
        isInitialized: false,
        entryPath: null,
        accessConfig: null,
        loading: false,
        hasRequested: false,
    };
    notifyListeners();
}

/**
 * 刷新初始化状态（从 API 拉取）
 */
export async function refreshInitState(): Promise<void> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        cachedSnapshot = {
            ...cachedSnapshot,
            loading: true,
            hasRequested: true,
        };
        notifyListeners();

        try {
            const exists = await checkAdminExists();
            if (!exists.exists) {
                cachedSnapshot = {
                    isInitialized: false,
                    entryPath: null,
                    accessConfig: null,
                    loading: false,
                    hasRequested: true,
                };
                notifyListeners();
                return;
            }

            cachedSnapshot = {
                ...cachedSnapshot,
                isInitialized: true,
            };
            notifyListeners();

            const settings = await getSystemSettings();
            cachedSnapshot = {
                isInitialized: true,
                entryPath: settings.entryPath || null,
                accessConfig: {
                    url: settings.accessUrl,
                    port: settings.port,
                },
                loading: false,
                hasRequested: true,
            };
            notifyListeners();
        } catch {
            cachedSnapshot = {
                ...cachedSnapshot,
                isInitialized: cachedSnapshot.isInitialized || false,
                loading: false,
                hasRequested: true,
            };
            notifyListeners();
        }
    })();

    try {
        await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

// ============ React Hooks ============

/**
 * 订阅系统初始化状态
 */
export function useInitStatus(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => getSystemConfig().isInitialized,
        () => getSystemConfig().isInitialized
    );
}

/**
 * 订阅入口路径
 */
export function useEntryPath(): string | null {
    return useSyncExternalStore(
        subscribe,
        () => getSystemConfig().entryPath,
        () => getSystemConfig().entryPath
    );
}

/**
 * 订阅访问配置
 */
export function useAccessConfig(): AccessConfig | null {
    return useSyncExternalStore(
        subscribe,
        () => getSystemConfig().accessConfig,
        () => getSystemConfig().accessConfig
    );
}

/**
 * 订阅完整的系统配置
 */
export function useSystemConfig(): SystemInitConfig {
    return useSyncExternalStore(
        subscribe,
        getSystemConfig,
        getSystemConfig
    );
}

/**
 * 订阅完整初始化状态（含 loading）
 */
export function useInitState(): SystemInitConfig {
    return useSyncExternalStore(
        subscribe,
        getSystemConfig,
        getSystemConfig
    );
}
