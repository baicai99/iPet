/**
 * API 层统一导出
 * 
 * 使用示例：
 * ```typescript
 * import { authApi, usersApi, type User, type ApiError } from '@/api';
 * 
 * // 登录
 * const { accessToken, admin } = await authApi.login({ username, password });
 * 
 * // 获取用户列表
 * const { items, pagination } = await usersApi.getUsers({ page: 1, limit: 20 });
 * ```
 */

// 导出所有类型
export * from './types';

// 导出 Token 管理
export * from './token';

// 导出 HTTP Client
export { getHttpClient } from './client';

// 命名空间导出各模块 API
export * as authApi from './contracts/auth';
export * as usersApi from './contracts/users';
export * as articlesApi from './contracts/articles';
export * as statsApi from './contracts/stats';
export * as systemApi from './contracts/system';
export * as auditLogsApi from './contracts/audit-logs';
