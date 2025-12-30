/**
 * HTTP 拦截器配置
 * 处理认证、错误映射和响应解包
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosRequestHeaders } from 'axios';
import { getToken, clearToken } from '@/core/auth/tokenStore';
import { AppError } from '@/core/errors';
import type { ErrorCode } from './types';

// 生成唯一请求 ID
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// HTTP 状态码到错误码映射
function mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 422:
            return 'VALIDATION_ERROR';
        case 500:
        case 502:
        case 503:
            return 'SERVER_ERROR';
        default:
            return 'UNKNOWN_ERROR';
    }
}

// 扩展请求配置类型
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _requestId?: string;
    _skipAuth?: boolean;
    _rawResponse?: boolean;
}

type HeadersWithSet = {
    set: (key: string, value: string) => void;
};

const hasSetMethod = (headers: AxiosRequestHeaders): headers is AxiosRequestHeaders & HeadersWithSet => {
    return typeof (headers as HeadersWithSet).set === 'function';
};

const ensureHeaders = (config: ExtendedAxiosRequestConfig): AxiosRequestHeaders => {
    if (!config.headers) {
        config.headers = new axios.AxiosHeaders() as AxiosRequestHeaders;
    }
    return config.headers as AxiosRequestHeaders;
};

/**
 * 设置请求和响应拦截器
 */
export function setupInterceptors(client: AxiosInstance): void {
    // ============ 请求拦截器 ============
    client.interceptors.request.use(
        (config: ExtendedAxiosRequestConfig) => {
            // 添加请求 ID
            const requestId = generateRequestId();
            config._requestId = requestId;
            const headers = ensureHeaders(config);
            if (hasSetMethod(headers)) {
                headers.set('X-Request-Id', requestId);
            } else {
                headers['X-Request-Id'] = requestId;
            }

            // 注入认证 Token（除非明确跳过）
            if (!config._skipAuth) {
                const token = getToken();
                if (token) {
                    if (hasSetMethod(headers)) {
                        headers.set('Authorization', `Bearer ${token}`);
                    } else {
                        headers.Authorization = `Bearer ${token}`;
                    }
                }
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // ============ 响应拦截器 ============
    client.interceptors.response.use(
        (response) => {
            // 成功响应：解包 data 并保留 meta
            const responseData = response.data;
            const config = response.config as ExtendedAxiosRequestConfig;

            // 如果响应是标准格式 { success, data, ... }
            if (responseData && typeof responseData === 'object' && 'success' in responseData) {
                if (responseData.success) {
                    // 如果请求配置要求原始响应，直接返回
                    if (config._rawResponse) {
                        return responseData;
                    }

                    // 默认：返回带 meta 的响应  
                    return {
                        data: responseData.data,
                        meta: {
                            requestId: responseData.requestId,
                            timestamp: responseData.timestamp,
                        }
                    };
                } else {
                    // 业务错误
                    const error = responseData.error || {};
                    throw new AppError(
                        error.code || 'UNKNOWN_ERROR',
                        error.message || '请求失败',
                        responseData.requestId,
                        { status: response.status, error }
                    );
                }
            }

            // 非标准格式，直接返回
            return responseData;
        },
        (error: AxiosError) => {
            const config = error.config as ExtendedAxiosRequestConfig | undefined;
            const requestId = config?._requestId;
            const method = config?.method?.toUpperCase() || 'UNKNOWN';
            const url = config?.url || 'unknown';
            const baseURL = config?.baseURL || '';

            // 网络错误
            if (!error.response) {
                console.error('[HTTP Error]', {
                    requestId,
                    method,
                    url: baseURL ? `${baseURL}${url}` : url,
                    message: 'NETWORK_ERROR',
                });
                throw new AppError(
                    'NETWORK_ERROR',
                    '网络连接失败，请检查网络设置',
                    requestId,
                    { originalError: error }
                );
            }

            const { status, data } = error.response;
            console.error('[HTTP Error]', {
                requestId,
                method,
                url: baseURL ? `${baseURL}${url}` : url,
                status,
            });

            // 尝试从响应中提取错误信息
            const responseData = data as Record<string, unknown> | undefined;
            const errorInfo = responseData?.error as { code?: string; message?: string } | undefined;
            const message = errorInfo?.message
                || (responseData?.message as string)
                || getDefaultErrorMessage(status);

            const errorCode = (errorInfo?.code as ErrorCode) || mapHttpStatusToErrorCode(status);

            // 401 未授权 - Token 过期或无效
            if (status === 401 && !config?._skipAuth) {
                clearToken(); // 清除 token，订阅机制会自动触发 UI 更新和跳转
                throw new AppError(
                    'UNAUTHORIZED',
                    '登录已过期，请重新登录',
                    requestId,
                    { status }
                );
            }

            throw new AppError(errorCode, message, requestId, { status });
        }
    );
}

/**
 * 获取默认错误消息
 */
function getDefaultErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return '请求参数错误';
        case 401:
            return '未授权，请登录';
        case 403:
            return '无权限访问';
        case 404:
            return '资源不存在';
        case 422:
            return '数据验证失败';
        case 429:
            return '请求过于频繁，请稍后再试';
        case 500:
            return '服务器内部错误';
        case 502:
            return '网关错误';
        case 503:
            return '服务暂时不可用';
        default:
            return '请求失败，请稍后重试';
    }
}
