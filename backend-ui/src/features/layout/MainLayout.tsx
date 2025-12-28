import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Grid } from 'antd';
import AppHeader from './AppHeader';
import AppSider from './AppSider';
import MobileDrawer from './MobileDrawer';

const { Content } = Layout;
const { useBreakpoint } = Grid;

/**
 * 主布局组件
 * @description Header + Sider + Content 布局，响应式设计
 */
const MainLayout: React.FC = () => {
    const screens = useBreakpoint();
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // 计算内容区左边距
    const getContentMarginLeft = () => {
        if (!screens.sm) return 0; // 移动端无侧边栏
        if (collapsed) return 80; // 折叠状态
        return 200; // 展开状态
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 顶部导航 */}
            <AppHeader
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
                onToggleDrawer={() => setDrawerOpen(true)}
            />

            <Layout style={{ marginTop: 64 }}>
                {/* 侧边栏（sm 以上显示） */}
                <AppSider
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                />

                {/* 移动端抽屉菜单（xs 显示） */}
                <MobileDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                />

                {/* 主内容区 */}
                <Content
                    style={{
                        marginLeft: getContentMarginLeft(),
                        padding: screens.sm ? 24 : 16,
                        minHeight: 'calc(100vh - 64px)',
                        background: '#f0f2f5',
                        transition: 'margin-left 0.2s',
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
