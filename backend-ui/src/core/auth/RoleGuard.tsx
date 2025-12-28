import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from './useAuth';
import { AdminRole } from '../config';

interface RoleGuardProps {
    children: ReactNode;
    requiredRole: AdminRole;
    fallback?: 'redirect' | 'forbidden';
}

/**
 * RBAC 角色守卫组件
 * @description 检查用户是否有权限访问，无权限时显示 403 或重定向
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
    children,
    requiredRole,
    fallback = 'forbidden'
}) => {
    const { hasRole, isAuthenticated } = useAuth();

    // 未登录时不处理（由 AuthGuard 处理）
    if (!isAuthenticated) {
        return null;
    }

    // 有权限则渲染子组件
    if (hasRole(requiredRole)) {
        return <>{children}</>;
    }

    // 无权限处理
    if (fallback === 'redirect') {
        return <Navigate to="/" replace />;
    }

    // 显示 403 页面
    return (
        <div style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
        }}>
            <Result
                status="403"
                title="403"
                subTitle="抱歉，您没有权限访问此页面"
                extra={
                    <Button type="primary" href="/">
                        返回首页
                    </Button>
                }
            />
        </div>
    );
};

export default RoleGuard;
