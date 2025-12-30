/**
 * Token 管理模块（向后兼容层）
 * @deprecated 此文件仅为向后兼容保留，新代码请直接使用 @/core/auth/tokenStore
 * 
 * 迁移说明：
 * - import { getToken, setToken, clearToken } from '@/api/token';
 * + import { getToken, setToken, clearToken } from '@/core/auth/tokenStore';
 * 
 * 已移除的 API（使用订阅机制替代）：
 * - onTokenExpired(callback) - 改用 useToken() hook 订阅
 * - triggerTokenExpired() - 改用 clearToken()，订阅者自动响应
 */

// Re-export from tokenStore
export {
    getToken,
    setToken,
    clearToken,
    getAdminInfo,
    setAdminInfo,
    isTokenExpired,
    getTokenRemainingTime,
    isAuthenticated,
    getCurrentRole,
    useToken,
    useAdminInfo,
} from '@/core/auth/tokenStore';

// 向后兼容：保留类型导出
export type { AdminInfo } from '@/api/types';
