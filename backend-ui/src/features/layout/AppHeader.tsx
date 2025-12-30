import React from 'react';
import { Layout, Button, Dropdown, Space, Tag, Grid, Avatar } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MenuOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/core/auth';
import { AdminRole } from '@/core/config';

const { Header } = Layout;
const { useBreakpoint } = Grid;

interface AppHeaderProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    onToggleDrawer: () => void;
}

/**
 * 顶部导航栏组件
 */
const AppHeader: React.FC<AppHeaderProps> = ({
    collapsed,
    onToggleCollapse,
    onToggleDrawer,
}) => {
    const { admin, logout } = useAuth();
    const screens = useBreakpoint();

    // 角色标签颜色
    const roleColor = 'blue';
    const roleLabel = '管理员';

    // 用户下拉菜单
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: logout,
        },
    ];

    return (
        <Header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
        >
            {/* 左侧：Logo和菜单按钮 */}
            <Space>
                {/* 移动端菜单按钮 */}
                {!screens.sm && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleDrawer}
                        style={{ fontSize: 18 }}
                    />
                )}

                {/* 桌面端折叠按钮 */}
                {screens.sm && (
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={onToggleCollapse}
                        style={{ fontSize: 18 }}
                    />
                )}

                {/* Logo */}
                <div style={{
                    fontSize: screens.sm ? 18 : 16,
                    fontWeight: 600,
                    color: '#1890ff',
                }}>
                    iPet 管理后台
                </div>
            </Space>

            {/* 右侧：用户信息 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {screens.sm && (
                        <>
                            <span>{admin?.displayName || admin?.username}</span>
                            <Tag color={roleColor}>{roleLabel}</Tag>
                        </>
                    )}
                </Space>
            </Dropdown>
        </Header>
    );
};

export default AppHeader;
