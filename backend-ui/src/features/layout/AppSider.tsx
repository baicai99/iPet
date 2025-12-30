import React from 'react';
import { Layout, Menu, Grid } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/core/auth';
import { AdminRole } from '@/core/config';
import { menuItems, filterMenuByRole } from './menuConfig';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

interface AppSiderProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

/**
 * 侧边栏组件
 * @description sm 以上断点显示，支持折叠
 */
const AppSider: React.FC<AppSiderProps> = ({ collapsed, onCollapse }) => {
    const { admin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { entryPath } = useParams();
    const screens = useBreakpoint();

    // 移动端隐藏侧边栏
    if (!screens.sm) {
        return null;
    }

    // 获取当前用户可见菜单
    const userRole = admin?.role || AdminRole.ADMIN;
    const visibleMenuItems = filterMenuByRole(menuItems, userRole);

    // 转换为 Ant Design Menu items 格式
    const buildRoutePath = (path: string) => {
        const normalized = path.replace(/^\/+/, '');
        if (entryPath) return `/${entryPath}/${normalized}`;
        return `/${normalized}`;
    };

    const antdMenuItems = visibleMenuItems.map(item => ({
        key: buildRoutePath(item.path),
        icon: item.icon,
        label: item.label,
    }));

    // 处理菜单点击
    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(key);
    };

    // 获取当前选中的菜单项
    const selectedKeys = [location.pathname];

    return (
        <Sider
            collapsible
            trigger={null}
            collapsed={collapsed}
            onCollapse={onCollapse}
            breakpoint="md"
            collapsedWidth={screens.md ? 80 : 0}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 64,
                bottom: 0,
                background: '#fff',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
            }}
        >
            <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                items={antdMenuItems}
                onClick={handleMenuClick}
                style={{ borderRight: 0 }}
            />
        </Sider>
    );
};

export default AppSider;
