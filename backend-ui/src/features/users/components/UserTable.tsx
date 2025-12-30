import React, { useMemo, useState } from 'react';
import {
    Avatar,
    Space,
    Typography,
    Tag,
    Button,
    Dropdown,
    Drawer,
    Segmented,
    Empty,
    type MenuProps,
    Modal,
    type TableProps
} from 'antd';
import { UserOutlined, MoreOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { User } from '@/api/types';
import { DataTable } from '@/shared/components/DataTable';
import type { ColumnType } from '@/shared/components/DataTable/types';
import { UserDetailDrawer } from './UserDetailDrawer';

const { Text } = Typography;

export type UserActionType = 'ban' | 'unban' | 'delete' | 'restore';
export type UserBatchActionType = 'ban' | 'unban' | 'delete';

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
    onBatchAction: (type: UserBatchActionType) => void;
    onSelectionChange: (selectedKeys: React.Key[], selectedUsers: User[]) => void;
    selectedRowKeys: React.Key[];
    selectedUsers: User[];
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
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
    onBatchAction,
    onSelectionChange,
    selectedRowKeys,
    selectedUsers,
    hasActiveFilters = false,
    onClearFilters,
    canBan = true,
    canUnban = true,
    canDelete = false
}) => {
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const handleViewDetails = (record: User) => {
        setCurrentUser(record);
        setDetailOpen(true);
    };

    const closeDrawer = () => {
        setDetailOpen(false);
        setCurrentUser(null);
    };

    const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

    const eligibleBanCount = useMemo(
        () => selectedUsers.filter((user) => !user.isBanned).length,
        [selectedUsers]
    );
    const eligibleUnbanCount = useMemo(
        () => selectedUsers.filter((user) => user.isBanned).length,
        [selectedUsers]
    );

    const formatLastActive = (lastActiveAt?: string) => {
        if (!lastActiveAt) return '-';
        const lastActive = new Date(lastActiveAt);
        if (Number.isNaN(lastActive.getTime())) return '-';
        const now = new Date();
        const diffMs = now.getTime() - lastActive.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return '今天';
        if (diffDays < 7) return `${diffDays} 天前`;
        return lastActive.toLocaleDateString();
    };

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
                    <Space orientation="vertical" size={0}>
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
                <Tag color="default">
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
            sorter: true,
            render: (count: number) => <Tag>{count} 只</Tag>,
        },
        {
            title: '最近活跃',
            dataIndex: 'lastActiveAt',
            key: 'lastActiveAt',
            sorter: true,
            defaultSortOrder: 'descend',
            render: (date?: string) => formatLastActive(date),
        },
        {
            title: '操作',
            key: 'action',
            primary: true,
            render: (_value: unknown, record: User) => (
                <Space size={4}>
                    <Button
                        type="link"
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleViewDetails(record);
                        }}
                    >
                        查看
                    </Button>
                    <Dropdown menu={getActionMenu(record)} trigger={['click']}>
                        <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined />}
                            onClick={(event) => event.stopPropagation()}
                        />
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Space size={8} align="center">
                    <Typography.Text type="secondary">密度</Typography.Text>
                    <Segmented
                        size="small"
                        value={density}
                        onChange={(value) => setDensity(value as 'compact' | 'comfortable')}
                        options={[
                            { label: '紧凑', value: 'compact' },
                            { label: '舒适', value: 'comfortable' },
                        ]}
                    />
                </Space>
            </div>
            {selectedRowKeys.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        padding: '8px 12px',
                        background: '#fafafa',
                        borderRadius: 6,
                        border: '1px solid #f0f0f0',
                    }}
                >
                    <Space size={8}>
                        <Typography.Text>已选 {selectedRowKeys.length} 项</Typography.Text>
                        <Button type="link" size="small" onClick={() => onSelectionChange([], [])}>
                            清空
                        </Button>
                    </Space>
                    <Space size={8}>
                        <Button
                            size="small"
                            danger
                            disabled={!canBan || eligibleBanCount === 0}
                            onClick={() => onBatchAction('ban')}
                        >
                            批量封禁
                        </Button>
                        <Button
                            size="small"
                            disabled={!canUnban || eligibleUnbanCount === 0}
                            onClick={() => onBatchAction('unban')}
                        >
                            批量解封
                        </Button>
                        {canDelete && (
                            <Button
                                size="small"
                                danger
                                onClick={() => onBatchAction('delete')}
                            >
                                批量删除
                            </Button>
                        )}
                    </Space>
                </div>
            )}
            <DataTable<User>
                rowKey="id"
                columns={columns}
                dataSource={users}
                loading={loading}
                pagination={{
                    ...pagination,
                    showTotal: (total, range) => `共 ${total} 条，当前 ${range[0]}-${range[1]}`,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                }}
                onChange={onChange}
                disableMobileMore={true}
                enableDrawerDetails={false}
                rowSelection={{
                    selectedRowKeys,
                    onChange: onSelectionChange,
                }}
                locale={{
                    emptyText: (
                        <Empty
                            description={hasActiveFilters ? '未找到匹配用户' : '暂无用户'}
                        >
                            {hasActiveFilters && onClearFilters && (
                                <Button onClick={onClearFilters}>清除筛选</Button>
                            )}
                        </Empty>
                    ),
                }}
                size={density === 'compact' ? 'small' : 'middle'}
            />
            <Drawer
                title="用户详情"
                width={720}
                onClose={closeDrawer}
                open={detailOpen}
                destroyOnClose
            >
                {currentUser && <UserDetailDrawer user={currentUser} />}
            </Drawer>
        </>
    );
};
