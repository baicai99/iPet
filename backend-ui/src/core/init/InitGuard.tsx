/**
 * Init Guard - 初始化状态守卫
 * @description 检查系统是否已初始化，未初始化时重定向到初始化向导
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useInitState, refreshInitState } from './initStore';
import { NotFoundPage } from '@/router/NotFoundPage';
import { SKIP_INIT } from '@/core/config';
import { Button, Result, Spin } from 'antd';

interface InitGuardProps {
    children: React.ReactNode;
}

/**
 * 初始化守卫组件
 * - 系统未初始化：重定向到初始化向导
 * - 系统已初始化：验证入口路径，渲染子组件
 */
export const InitGuard: React.FC<InitGuardProps> = ({ children }) => {
    const initState = useInitState();
    const location = useLocation();
    useEffect(() => {
        if (!SKIP_INIT) {
            refreshInitState();
        }
    }, []);

    if (SKIP_INIT) {
        return <>{children}</>;
    }

    if (!initState.hasRequested || initState.loading) {
        return <Spin fullscreen size="large" tip="初始化状态加载中..." />;
    }

    // 1. 初始化页面访问规则
    if (location.pathname.startsWith('/init')) {
        if (!initState.isInitialized) {
            return <>{children}</>;
        }
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f2f5',
            }}>
                <Result
                    status="403"
                    title="系统已初始化"
                    subTitle="初始化向导已关闭，请使用管理入口登录。"
                    extra={
                        <Button type="primary" onClick={() => window.location.replace('/')}>
                            返回首页
                        </Button>
                    }
                />
            </div>
        );
    }

    // 2. 如果未初始化，重定向到初始化页面
    if (!initState.isInitialized) {
        return <Navigate to="/init" replace />;
    }

    // 3. 入口路径未获取时跳过校验
    if (!initState.entryPath) {
        return <>{children}</>;
    }

    // 4. 验证入口路径 (已初始化状态下)
    // URL 格式通常为 /:entryPath/...
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentEntryPath = pathSegments[0];

    // 根路径交由 RootRedirect 处理
    if (!currentEntryPath && location.pathname === '/') {
        return <>{children}</>;
    }

    // 路径不匹配，直接显示 404 页面，避免路由重定向循环
    // 因为 generic route /:entryPath/* 会匹配 /404 等路径，导致无限循环
    // 直接渲染组件可以保持 URL 不变（用户可以看到错误的 URL），体验更好
    if (!currentEntryPath || currentEntryPath !== initState.entryPath) {
        return <NotFoundPage />;
    }

    // 5. 已初始化且路径匹配，正常渲染
    return <>{children}</>;
};
