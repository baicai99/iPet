import React from 'react';
import {
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    SettingOutlined,
    AuditOutlined,
    DeleteOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { AdminRole } from '@/core/config';

export interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    requiredRole?: AdminRole;
    children?: MenuItem[];
}

/**
 * 侧边栏菜单配置
 * @description 定义所有菜单项及其权限要求
 */
export const menuItems: MenuItem[] = [
    {
        key: 'dashboard',
        label: '仪表盘',
        icon: <DashboardOutlined />,
        path: 'dashboard',
    },
    {
        key: 'users',
        label: '用户管理',
        icon: <UserOutlined />,
        path: 'users',
    },
    {
        key: 'users-trash',
        label: '回收站',
        icon: <DeleteOutlined />,
        path: 'users/trash',
        requiredRole: AdminRole.ADMIN,
    },
    {
        key: 'articles',
        label: '文章管理',
        icon: <FileTextOutlined />,
        path: 'articles',
    },
    {
        key: 'settings',
        label: '设置',
        icon: <ToolOutlined />,
        path: 'system-settings',
    },
    {
        key: 'system',
        label: '系统监控',
        icon: <SettingOutlined />,
        path: 'system',
        requiredRole: AdminRole.ADMIN,
    },
    {
        key: 'audit-logs',
        label: '审计日志',
        icon: <AuditOutlined />,
        path: 'audit-logs',
        requiredRole: AdminRole.ADMIN,
    },
];

/**
 * 根据用户角色过滤菜单项
 */
export const filterMenuByRole = (items: MenuItem[], userRole: AdminRole): MenuItem[] => {
    return items.filter(item => {
        // 没有权限要求的菜单项所有人可见
        if (!item.requiredRole) return true;

        // admin 可见所有菜单
        return item.requiredRole === AdminRole.ADMIN;
    });
};
