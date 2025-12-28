import React, { useCallback, useState } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';
import { type AdminInfo, AdminRole, type LoginResponse } from '../config';
import { getAdminInfo, getToken, setAdminInfo, setToken, clearToken } from '@/api/token';

interface AuthProviderProps {
    children: React.ReactNode;
}

const readStoredAuth = (): { admin: AdminInfo | null; isAuthenticated: boolean } => {
    const token = getToken();
    const adminInfo = getAdminInfo();

    if (!token || !adminInfo) {
        clearToken();
        return { admin: null, isAuthenticated: false };
    }

    return { admin: adminInfo, isAuthenticated: true };
};

/**
 * 认证上下文 Provider
 * @description 管理登录状态、管理员信息、Token 存储
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [storedAuth] = useState(readStoredAuth);
    const [isAuthenticated, setIsAuthenticated] = useState(storedAuth.isAuthenticated);
    const [admin, setAdmin] = useState<AdminInfo | null>(storedAuth.admin);
    const isLoading = false;

    // 登录方法
    const login = useCallback((response: LoginResponse) => {
        setToken(response.accessToken);
        setAdminInfo(response.admin);
        setAdmin(response.admin);
        setIsAuthenticated(true);
    }, []);

    // 登出方法
    const logout = useCallback(() => {
        clearToken();
        setAdmin(null);
        setIsAuthenticated(false);
    }, []);

    // 角色检查
    const hasRole = useCallback((requiredRole: AdminRole): boolean => {
        if (!admin) return false;

        // super_admin 拥有所有权限
        if (admin.role === AdminRole.SUPER_ADMIN) return true;

        // admin 只能访问 admin 级别的资源
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
