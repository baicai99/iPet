import React from 'react';
import { Avatar, Space, Typography, Tag, Button, Dropdown, type MenuProps, Modal, type TableProps } from 'antd';
import { UserOutlined, MoreOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { User } from '@/api/types';
import { DataTable } from '@/shared/components/DataTable';
import type { ColumnType } from '@/shared/components/DataTable/types';
import { UserDetailDrawer } from './UserDetailDrawer';

const { Text } = Typography;

export type UserActionType = 'ban' | 'unban' | 'delete' | 'restore';

interface UserTableProps {
    users: User[];
    loading?: boolean;
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
    onChange: TableProps<User>['onChange'];
    onAction: (key: UserActionType, user: User) => void;
    canBan?: boolean;
    canUnban?: boolean;
    canDelete?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    loading,
    pagination,
    onChange,
    onAction,
    canBan = true,
    canUnban = true,
    canDelete = false
}) => {

    const getActionMenu = (record: User): MenuProps => {
        const items: MenuProps['items'] = [];

        if (record.isBanned && canUnban) {
            items.push({
                key: 'unban',
                label: '解封用户',
                icon: <CheckCircleOutlined />,
                danger: false,
                onClick: () => onAction('unban', record),
            });
        } else if (!record.isBanned && canBan) {
            items.push({
                key: 'ban',
                label: '封禁用户',
                icon: <StopOutlined />,
                danger: true,
                onClick: () => onAction('ban', record),
            });
        }

        if (canDelete) {
            items.push({
                type: 'divider',
            });
            items.push({
                key: 'delete',
                label: '删除(软删除)',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                    Modal.confirm({
                        title: '确认删除？',
                        content: `确认软删除用户 ${record.displayName}？`,
                        onOk: () => onAction('delete', record),
                    });
                },
            });
        }

        return { items };
    };

    const columns: ColumnType<User>[] = [
        {
            title: '用户',
            key: 'user',
            primary: true,
            render: (_value: unknown, record: User) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.displayName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: '角色',
            dataIndex: 'isGuest',
            key: 'role',
            render: (isGuest: boolean) => (
                <Tag color={isGuest ? 'default' : 'blue'}>
                    {isGuest ? '游客' : '注册用户'}
                </Tag>
            ),
        },
        {
            title: '状态',
            key: 'status',
            primary: true,
            render: (_value: unknown, record: User) => (
                <Tag color={record.isBanned ? 'error' : 'success'}>
                    {record.isBanned ? '封禁' : '正常'}
                </Tag>
            ),
        },
        {
            title: '宠物',
            dataIndex: 'petsCount',
            key: 'pets',
            align: 'center',
            render: (count: number) => <Tag>{count} 只</Tag>,
        },
        {
            title: '加入时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: '操作',
            key: 'action',
            render: (_value: unknown, record: User) => (
                <Dropdown menu={getActionMenu(record)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <DataTable
            rowKey="id"
            columns={columns}
            dataSource={users}
            loading={loading}
            pagination={pagination}
            onChange={onChange}
            enableDrawerDetails={true}
            drawerContent={(record) => <UserDetailDrawer user={record} />}
        // For mobile, actions are handled by DataTable's "More" column
        // We can customize the drawer to maybe include actions too, but for now simple view
        />
    );
};
