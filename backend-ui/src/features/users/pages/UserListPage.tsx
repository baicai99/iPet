import React, { useMemo, useState } from 'react';
import { Card, Space, Modal, type TablePaginationConfig, type TableProps } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/api/types';
import {
    banUser,
    unbanUser,
    deleteUser,
    batchBanUsers,
    batchUnbanUsers,
    batchDeleteUsers,
    type UserListParams
} from '@/api/contracts/users';
import { UserSummaryBar } from '../components/UserSummaryBar';
import { UserFilter } from '../components/UserFilter';
import { UserTable, type UserActionType, type UserBatchActionType } from '../components/UserTable';
import { BanUserModal } from '../components/BanUserModal';
import { BatchBanModal } from '../components/BatchBanModal';
import { useUsers } from '../hooks/useUsers';
import { notify } from '@/core/notify';
import { usePermission } from '@/core/auth';
import { queryKeys } from '@/api/queryKeys';

const UserListPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { users, pagination, setParams, isLoading, isFetching } = useUsers();
    const { can } = usePermission();
    const [currentFilters, setCurrentFilters] = useState<UserListParams>({});
    const [filterResetSignal, setFilterResetSignal] = useState(0);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    // BanUserModal 状态
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [userToBan, setUserToBan] = useState<User | null>(null);
    const [batchBanOpen, setBatchBanOpen] = useState(false);

    const handleTableChange: TableProps<User>['onChange'] = (newPagination, _filters, sorter) => {
        const paginationConfig = newPagination as TablePaginationConfig;
        const resolvedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const sorterField = resolvedSorter?.field ?? resolvedSorter?.columnKey;
        const sortBy =
            sorterField === 'petsCount' || sorterField === 'lastActiveAt' || sorterField === 'createdAt'
                ? sorterField
                : undefined;
        const sortOrder = resolvedSorter?.order === 'ascend' ? 'asc' : resolvedSorter?.order === 'descend' ? 'desc' : undefined;
        const hasSorter = Boolean(resolvedSorter?.field || resolvedSorter?.columnKey);
        const shouldClearSort = hasSorter && !resolvedSorter?.order;

        setParams((prev) => ({
            ...prev,
            ...currentFilters,
            page: paginationConfig.current ?? 1,
            limit: paginationConfig.pageSize ?? prev.limit,
            sortBy: shouldClearSort ? undefined : sortBy ?? prev.sortBy,
            sortOrder: shouldClearSort ? undefined : sortOrder ?? prev.sortOrder,
        }));
        setSelectedRowKeys([]);
        setSelectedUsers([]);
    };

    const handleFilterChange = (filters: UserListParams) => {
        setCurrentFilters(filters);
        setParams((prev) => ({
            ...prev,
            ...filters,
            page: 1,
        }));
        setSelectedRowKeys([]);
        setSelectedUsers([]);
    };

    const handleClearFilters = () => {
        setCurrentFilters({});
        setParams((prev) => ({
            ...prev,
            page: 1,
            search: undefined,
            isGuest: undefined,
            isBanned: undefined,
        }));
        setFilterResetSignal((prev) => prev + 1);
        setSelectedRowKeys([]);
        setSelectedUsers([]);
    };

    const banMutation = useMutation({
        mutationFn: (payload: { userId: string; reason: string }) => banUser(payload.userId, { reason: payload.reason }),
        onSuccess: (_, payload) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(payload.userId) });
        },
    });

    const unbanMutation = useMutation({
        mutationFn: (userId: string) => unbanUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => deleteUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
            queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) });
        },
    });

    const handleAction = async (type: UserActionType, user: User) => {
        try {
            if (type === 'ban') {
                if (!can('user:ban')) return;
                // 打开封禁弹窗
                setUserToBan(user);
                setBanModalOpen(true);
                return;
            }

            if (type === 'unban') {
                if (!can('user:unban')) return;
                await unbanMutation.mutateAsync(user.id);
                notify.success(`已解封用户 ${user.displayName}`);
                return;
            }

            if (type === 'delete') {
                if (!can('user:delete')) return;
                await deleteMutation.mutateAsync(user.id);
                notify.success(`已删除用户 ${user.displayName}`);
            }
        } catch {
            // Global query error handler shows a toast.
        }
    };

    const handleBatchAction = (type: UserBatchActionType) => {
        if (selectedUsers.length === 0) return;
        if (type === 'ban') {
            if (!can('user:ban')) return;
            setBatchBanOpen(true);
            return;
        }
        if (type === 'unban') {
            if (!can('user:unban')) return;
            Modal.confirm({
                title: '确认批量解封？',
                content: `确认解封已选择的 ${selectedUsers.length} 位用户？`,
                onOk: () => handleBatchUnban(),
            });
            return;
        }
        if (type === 'delete') {
            if (!can('user:delete')) return;
            Modal.confirm({
                title: '确认批量删除？',
                content: `此操作将软删除已选择的 ${selectedUsers.length} 位用户，是否继续？`,
                okButtonProps: { danger: true },
                onOk: () => handleBatchDelete(),
            });
        }
    };

    const handleBatchBanConfirm = async (reason: string) => {
        const targets = selectedUsers.filter((user) => !user.isBanned);
        if (targets.length === 0) {
            notify.info('没有可封禁的用户');
            setBatchBanOpen(false);
            return;
        }
        try {
            const result = await batchBanUsers({ ids: targets.map((user) => user.id), reason });
            notify.success(`已封禁 ${result.count} 位用户`);
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
            setBatchBanOpen(false);
            setSelectedRowKeys([]);
            setSelectedUsers([]);
        } catch {
            // Error handled by global error handler
        }
    };

    const handleBatchUnban = async () => {
        const targets = selectedUsers.filter((user) => user.isBanned);
        if (targets.length === 0) {
            notify.info('没有可解封的用户');
            return;
        }
        try {
            const result = await batchUnbanUsers({ ids: targets.map((user) => user.id) });
            notify.success(`已解封 ${result.count} 位用户`);
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
            setSelectedRowKeys([]);
            setSelectedUsers([]);
        } catch {
            // Error handled by global error handler
        }
    };

    const handleBatchDelete = async () => {
        try {
            const result = await batchDeleteUsers({ ids: selectedUsers.map((user) => user.id) });
            notify.success(`已删除 ${result.count} 位用户`);
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
            setSelectedRowKeys([]);
            setSelectedUsers([]);
        } catch {
            // Error handled by global error handler
        }
    };

    // 确认封禁
    const handleBanConfirm = async (reason: string) => {
        if (!userToBan) return;
        try {
            await banMutation.mutateAsync({ userId: userToBan.id, reason });
            notify.success(`已封禁用户 ${userToBan.displayName}`);
            setBanModalOpen(false);
            setUserToBan(null);
        } catch {
            // Error handled by global error handler
        }
    };

    // 取消封禁
    const handleBanCancel = () => {
        setBanModalOpen(false);
        setUserToBan(null);
    };

    const handleBatchBanCancel = () => {
        setBatchBanOpen(false);
    };

    const hasActiveFilters = useMemo(() => {
        return Boolean(currentFilters.search || currentFilters.isGuest !== undefined || currentFilters.isBanned !== undefined);
    }, [currentFilters]);

    const loading = isLoading || isFetching;

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%', paddingBottom: 24 }}>
            {/* Summary Section */}
            <UserSummaryBar />

            {/* Main Content */}
            <Card styles={{ body: { padding: '24px 24px 0 24px' } }}>
                <UserFilter onFilterChange={handleFilterChange} loading={loading} resetSignal={filterResetSignal} />

                <UserTable
                    users={users}
                    loading={loading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                    }}
                    onChange={handleTableChange}
                    onAction={handleAction}
                    onBatchAction={handleBatchAction}
                    onSelectionChange={(keys, rows) => {
                        setSelectedRowKeys(keys);
                        setSelectedUsers(rows);
                    }}
                    selectedRowKeys={selectedRowKeys}
                    selectedUsers={selectedUsers}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={handleClearFilters}
                    canBan={can('user:ban')}
                    canUnban={can('user:unban')}
                    canDelete={can('user:delete')}
                />
            </Card>

            {/* 封禁用户弹窗 */}
            <BanUserModal
                open={banModalOpen}
                user={userToBan}
                onCancel={handleBanCancel}
                onConfirm={handleBanConfirm}
                loading={banMutation.isPending}
            />

            <BatchBanModal
                open={batchBanOpen}
                count={selectedUsers.filter((user) => !user.isBanned).length}
                onCancel={handleBatchBanCancel}
                onConfirm={handleBatchBanConfirm}
                loading={banMutation.isPending}
            />
        </Space>
    );
};

export default UserListPage;
