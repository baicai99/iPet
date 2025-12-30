import React, { useCallback, useEffect } from 'react';
import { matchPath, useNavigate } from 'react-router-dom';
import { AuthContext, type AuthContextType } from './AuthContext';
import { AdminRole, type LoginResponse } from '../config';
import { useToken, useAdminInfo, setToken, setAdminInfo, clearToken } from './tokenStore';
import { ROUTES } from '@/router/routes';
import { useInitState, refreshInitState } from '@/core/init';
import { SKIP_INIT } from '@/core/config';

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * 认证上下文 Provider
 * @description 使用订阅式 Token Store 管理登录状态，实现响应式状态同步
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const navigate = useNavigate();
    const initState = useInitState();

    // 订阅 token 和 admin 信息变化
    const token = useToken();
    const admin = useAdminInfo();

    const isAuthenticated = !!token && !!admin;
    const isLoading = false;

    // 当 token 被清除时，自动跳转登录页
    useEffect(() => {
        if (!SKIP_INIT) {
            refreshInitState();
        }
    }, []);

    useEffect(() => {
        if (SKIP_INIT) return;
        if (!token) {
            const pathname = window.location.pathname;
            if (pathname.startsWith('/init')) return;
            if (matchPath(ROUTES.LOGIN, pathname)) return;
            if (!initState.isInitialized) return;
            if (!initState.entryPath) return;
            navigate(`/${initState.entryPath}/login`, { replace: true });
        }
    }, [token, navigate, initState.isInitialized, initState.entryPath]);

    // 登录方法
    const login = useCallback((response: LoginResponse) => {
        setToken(response.accessToken);
        setAdminInfo(response.admin);
        // 状态会通过订阅机制自动更新
    }, []);

    // 登出方法
    const logout = useCallback(() => {
        clearToken();
        // 状态会通过订阅机制自动更新，useEffect 会处理跳转
    }, []);

    // 角色检查
    const hasRole = useCallback((requiredRole: AdminRole): boolean => {
        if (!admin) return false;
        return requiredRole === AdminRole.ADMIN;
    }, [admin]);

    const value: AuthContextType = {
        isAuthenticated,
        isLoading,
        admin,
        login,
        logout,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
