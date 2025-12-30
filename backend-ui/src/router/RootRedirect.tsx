import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button, Result, Spin } from 'antd';
import { useInitState } from '@/core/init';
import { useAuth } from '@/core/auth';
import { SKIP_INIT } from '@/core/config';

/**
 * 根路径重定向
 * @description 根据初始化与登录状态跳转到正确入口
 */
export const RootRedirect: React.FC = () => {
    const initState = useInitState();
    const { isAuthenticated, isLoading } = useAuth();

    if (SKIP_INIT) {
        return <Navigate to="/login" replace />;
    }

    if (initState.loading || isLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Spin size="large" tip="初始化状态加载中..." />
            </div>
        );
    }

    if (!initState.isInitialized) {
        return <Navigate to="/init" replace />;
    }

    if (!initState.entryPath) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f2f5',
            }}>
                <Result
                    status="warning"
                    title="入口路径未配置"
                    subTitle="无法自动跳转，请使用已配置的管理入口登录，或稍后重试。"
                    extra={
                        <Button type="primary" onClick={() => window.location.reload()}>
                            刷新页面
                        </Button>
                    }
                />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={`/${initState.entryPath}/login`} replace />;
    }

    return <Navigate to={`/${initState.entryPath}/dashboard`} replace />;
};
