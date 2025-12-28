import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, RoleGuard } from '@/core/auth';
import { AdminRole } from '@/core/config';
import { MainLayout } from '@/features/layout';
import { Spin } from 'antd';

// Feature Pages (lazy-loaded)
const LoginPage = React.lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const UserListPage = React.lazy(() => import('@/features/users/pages/UserListPage'));
const RecycleBinPage = React.lazy(() => import('@/features/users/pages/RecycleBinPage'));
const ArticleListPage = React.lazy(() => import('@/features/articles/pages/ArticleListPage'));
const ArticleEditPage = React.lazy(() => import('@/features/articles/pages/ArticleEditPage'));
const SystemMonitor = React.lazy(() => import('@/features/system/pages/SystemMonitor'));
const AuditLogs = React.lazy(() => import('@/features/audit-logs/pages/AuditLogs'));

const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <Spin size="large" />
    </div>
);

/**
 * 路由组件
 * @description 定义所有路由及其守卫
 */
const AppRouter: React.FC = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* 登录页 - 无守卫 */}
                <Route path="/login" element={<LoginPage />} />

                {/* 受保护的路由 - 需要登录 */}
                <Route
                    element={
                        <AuthGuard>
                            <MainLayout />
                        </AuthGuard>
                    }
                >
                    {/* 仪表盘 - admin+ */}
                    <Route path="/" element={<DashboardPage />} />

                    {/* 用户管理 - admin+ */}
                    <Route path="/users" element={<UserListPage />} />

                    {/* 回收站 - super_admin */}
                    <Route
                        path="/users/trash"
                        element={
                            <RoleGuard requiredRole={AdminRole.SUPER_ADMIN}>
                                <RecycleBinPage />
                            </RoleGuard>
                        }
                    />

                    {/* 文章管理 - admin+ */}
                    <Route path="/articles" element={<ArticleListPage />} />
                    <Route path="/articles/new" element={<ArticleEditPage />} />
                    <Route path="/articles/:id/edit" element={<ArticleEditPage />} />

                    {/* 系统监控 - super_admin */}
                    <Route
                        path="/system"
                        element={
                            <RoleGuard requiredRole={AdminRole.SUPER_ADMIN}>
                                <SystemMonitor />
                            </RoleGuard>
                        }
                    />

                    {/* 审计日志 - super_admin */}
                    <Route
                        path="/audit-logs"
                        element={
                            <RoleGuard requiredRole={AdminRole.SUPER_ADMIN}>
                                <AuditLogs />
                            </RoleGuard>
                        }
                    />
                </Route>

                {/* 404 重定向到首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
