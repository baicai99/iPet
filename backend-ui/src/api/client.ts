/**
 * HTTP Client - Axios 实例配置
 */

import axios from 'axios';
import { setupInterceptors } from './interceptors';

const isMockEnabled = import.meta.env.VITE_MOCK === '1';
// MSW 只能拦截同源请求，mock 模式强制使用相对地址
const API_BASE_URL = isMockEnabled
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || '/api');

// 创建 Axios 实例
export const httpClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 秒超时
    headers: {
        'Content-Type': 'application/json',
    },
});

// 设置拦截器
setupInterceptors(httpClient);

export default httpClient;
