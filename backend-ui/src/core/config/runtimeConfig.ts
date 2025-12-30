/**
 * 运行时配置加载模块
 * @description 从环境变量加载配置，支持 dev 和 prod 环境分离
 */

import { useSyncExternalStore } from 'react';

/**
 * 运行时配置接口
 */
export interface RuntimeConfig {
    /** API 基础地址 */
    apiBaseUrl: string;
    /** 是否启用 Mock */
    mockEnabled: boolean;
    /** 当前环境 */
    environment: 'development' | 'staging' | 'production';
}


/** 配置缓存 */
let cachedConfig: RuntimeConfig | null = null;

/** 配置变更监听器 */
const listeners = new Set<() => void>();

/**
 * 订阅配置变化
 */
const subscribe = (callback: () => void): (() => void) => {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
};

/**
 * 通知所有订阅者
 */
const notifyListeners = (): void => {
    listeners.forEach(listener => listener());
};

/**
 * 加载运行时配置
 * @description 直接使用环境变量配置，简化配置管理
 * @returns 配置对象
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    // 直接使用环境变量配置
    cachedConfig = {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://backend-api/api',
        mockEnabled: import.meta.env.VITE_MOCK === 'true',
        environment: (import.meta.env.MODE === 'dev' ? 'development' :
            import.meta.env.MODE === 'production' ? 'production' :
                'development') as RuntimeConfig['environment'],
    };

    console.info('[RuntimeConfig] Loaded from environment variables:', cachedConfig);
    notifyListeners();
    return cachedConfig;
}

/**
 * 获取当前运行时配置
 * @throws 如果配置尚未加载
 * @returns 配置对象
 */
export function getRuntimeConfig(): RuntimeConfig {
    if (!cachedConfig) {
        throw new Error(
            'Runtime config not loaded. Call loadRuntimeConfig() in main.tsx before rendering app.'
        );
    }
    return cachedConfig;
}

/**
 * React Hook: 订阅运行时配置
 * @description 使用 useSyncExternalStore 实现响应式订阅
 * @returns 当前配置对象
 */
export function useRuntimeConfig(): RuntimeConfig {
    return useSyncExternalStore(
        subscribe,
        getRuntimeConfig,
        getRuntimeConfig
    );
}

/**
 * 更新运行时配置（用于测试或热更新）
 * @param newConfig 新配置
 */
export function updateRuntimeConfig(newConfig: Partial<RuntimeConfig>): void {
    if (!cachedConfig) {
        throw new Error('Cannot update config before it is loaded');
    }

    cachedConfig = {
        ...cachedConfig,
        ...newConfig,
    };

    console.info('[RuntimeConfig] Updated:', cachedConfig);
    notifyListeners();
}
