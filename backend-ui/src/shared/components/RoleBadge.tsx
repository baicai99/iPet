import React from 'react';
import { Tag } from 'antd';

export type UserRole = 'admin' | 'user';

interface RoleBadgeProps {
    role: string;
}

const roleConfig: Record<string, { color: string; label: string }> = {
    admin: { color: 'blue', label: '管理员' },
    user: { color: 'default', label: '用户' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
    const config = roleConfig[role] || { color: 'default', label: role };

    return <Tag color={config.color}>{config.label}</Tag>;
};
