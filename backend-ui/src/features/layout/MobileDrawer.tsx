import React from 'react';
import { Drawer, Menu } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/core/auth';
import { AdminRole } from '@/core/config';
import { menuItems, filterMenuByRole } from './menuConfig';

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
}

/**
 * 移动端抽屉菜单组件
 * @description xs 断点专用，从左侧滑出
 */
const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose }) => {
    const { admin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { entryPath } = useParams();

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
        onClose(); // 点击后关闭抽屉
    };

    // 获取当前选中的菜单项
    const selectedKeys = [location.pathname];

    return (
        <Drawer
            title="iPet 管理后台"
            placement="left"
            onClose={onClose}
            open={open}
            size={250}
            styles={{
                body: { padding: 0 },
            }}
        >
            <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                items={antdMenuItems}
                onClick={handleMenuClick}
                style={{ border: 0 }}
            />
        </Drawer>
    );
};

export default MobileDrawer;
