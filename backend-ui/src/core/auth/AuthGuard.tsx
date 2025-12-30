import React, { type ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './useAuth';

interface AuthGuardProps {
    children: ReactNode;
}

/**
 * 登录守卫组件
 * @description 未登录时重定向到 /login
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const { entryPath } = useParams();

    // 加载中显示 loading
    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Spin size="large" tip="加载中..." />
            </div>
        );
    }

    // 未登录重定向到登录页
    if (!isAuthenticated) {
        const loginPath = entryPath ? `/${entryPath}/login` : '/init';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
