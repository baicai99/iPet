import { createContext, useContext } from 'react';
import type { AdminInfo, AdminRole, LoginResponse } from '../config';

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    admin: AdminInfo | null;
    login: (response: LoginResponse) => void;
    logout: () => void;
    hasRole: (requiredRole: AdminRole) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 获取认证上下文
 * @throws 如果在 AuthProvider 外部使用会抛出错误
 */
export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
