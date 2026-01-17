import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthGuard, RoleGuard } from '@/core/auth';
import { AdminRole } from '@/core/config';
import { MainLayout } from '@/features/layout';
import { Spin } from 'antd';
import { ErrorBoundary } from '@/core/errors';
import { NotFoundPage } from './NotFoundPage';
import { RootRedirect } from './RootRedirect';
import { InitGuard } from '@/core/init';
import { Outlet } from 'react-router-dom';

// Feature Pages (lazy-loaded)
const InitWizardPage = React.lazy(() => import('@/features/init/pages/InitWizardPage'));
const LoginPage = React.lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const UserListPage = React.lazy(() => import('@/features/users/pages/UserListPage'));
const RecycleBinPage = React.lazy(() => import('@/features/users/pages/RecycleBinPage'));
const ArticleListPage = React.lazy(() => import('@/features/articles/pages/ArticleListPage'));
const ArticleEditPage = React.lazy(() => import('@/features/articles/pages/ArticleEditPage'));
const ArticleCategoryListPage = React.lazy(() => import('@/features/articles/pages/ArticleCategoryListPage'));
const SystemMonitor = React.lazy(() => import('@/features/system/pages/SystemMonitor'));
const SystemSettingsPage = React.lazy(() => import('@/features/system/pages/SystemSettingsPage'));
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
        <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* 全局初始化守卫 */}
                    <Route
                        element={
                            <InitGuard>
                                <Outlet />
                            </InitGuard>
                        }
                    >
                        {/* 初始化页面 - 受 InitGuard 统一控制 */}
                        <Route path="/init" element={<InitWizardPage />} />
                        {/* 根路径交由 RootRedirect 处理重定向 */}
                        <Route index element={<RootRedirect />} />

                        {/* 登录页 - 动态入口路径 */}
                        <Route path="/:entryPath/login" element={<LoginPage />} />

                        {/* 受保护的后台路由 */}
                        <Route
                            path="/:entryPath/*"
                            element={
                                <AuthGuard>
                                    <MainLayout />
                                </AuthGuard>
                            }
                        >
                            {/* 仪表盘 */}
                            <Route path="dashboard" element={<DashboardPage />} />

                            {/* 用户管理 */}
                            <Route path="users" element={<UserListPage />} />
                            <Route
                                path="users/trash"
                                element={
                                    <RoleGuard requiredRole={AdminRole.ADMIN}>
                                        <RecycleBinPage />
                                    </RoleGuard>
                                }
                            />

                            {/* 文章管理 */}
                            <Route path="articles" element={<ArticleListPage />} />
                            <Route
                                path="articles/categories"
                                element={
                                    <RoleGuard requiredRole={AdminRole.ADMIN}>
                                        <ArticleCategoryListPage />
                                    </RoleGuard>
                                }
                            />
                            <Route path="articles/new" element={<ArticleEditPage />} />
                            <Route path="articles/:id/edit" element={<ArticleEditPage />} />

                            {/* 系统监控 */}
                            <Route
                                path="system"
                                element={
                                    <RoleGuard requiredRole={AdminRole.ADMIN}>
                                        <SystemMonitor />
                                    </RoleGuard>
                                }
                            />

                            {/* 系统设置 */}
                            <Route path="system-settings" element={<SystemSettingsPage />} />

                            {/* 审计日志 */}
                            <Route
                                path="audit-logs"
                                element={
                                    <RoleGuard requiredRole={AdminRole.ADMIN}>
                                        <AuditLogs />
                                    </RoleGuard>
                                }
                            />
                        </Route>
                    </Route>

                    {/* 404 页面 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
};

export default AppRouter;
