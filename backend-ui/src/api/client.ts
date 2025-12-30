/**
 * HTTP Client - Axios 实例配置
 * @description 使用运行时配置动态创建 Axios 实例
 */

import axios, { type AxiosInstance } from 'axios';
import { setupInterceptors } from './interceptors';
import { getRuntimeConfig } from '@/core/config/runtimeConfig';

/** Axios 实例缓存 */
let httpClient: AxiosInstance | null = null;

/**
 * 获取 HTTP 客户端实例
 * @description 延迟初始化，使用运行时配置
 * @returns Axios 实例
 */
export function getHttpClient(): AxiosInstance {
    if (!httpClient) {
        const config = getRuntimeConfig();

        // Mock 模式强制使用相对路径（MSW 仅支持同源拦截）
        const baseURL = config.mockEnabled ? '/api' : config.apiBaseUrl;

        httpClient = axios.create({
            baseURL,
            timeout: 30000, // 30 秒超时
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 设置拦截器
        setupInterceptors(httpClient);

        console.info('[HTTP Client] Initialized with baseURL:', baseURL);
    }

    return httpClient;
}

/**
 * 重置 HTTP 客户端（用于测试或配置热更新）
 */
export function resetHttpClient(): void {
    httpClient = null;
}

// 向后兼容：导出工厂函数
export default getHttpClient;

