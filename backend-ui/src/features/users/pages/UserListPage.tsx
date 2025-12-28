import React, { useState } from 'react';
import { Card, Space, type TablePaginationConfig, type TableProps } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/api/types';
import { banUser, unbanUser, deleteUser, type UserListParams } from '@/api/contracts/users';
import { VisitorStats } from '../components/VisitorStats';
import { UserFilter } from '../components/UserFilter';
import { UserTable, type UserActionType } from '../components/UserTable';
import { useUsers } from '../hooks/useUsers';
import { notify } from '@/core/notify';
import { usePermission } from '@/core/auth';

const UserListPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { users, pagination, setParams, isLoading, isFetching } = useUsers();
    const { can } = usePermission();
    const [currentFilters, setCurrentFilters] = useState<UserListParams>({});

    const handleTableChange: TableProps<User>['onChange'] = (newPagination) => {
        const paginationConfig = newPagination as TablePaginationConfig;
        setParams((prev) => ({
            ...prev,
            ...currentFilters,
            page: paginationConfig.current ?? 1,
            limit: paginationConfig.pageSize ?? prev.limit,
        }));
    };

    const handleFilterChange = (filters: UserListParams) => {
        setCurrentFilters(filters);
        setParams((prev) => ({
            ...prev,
            ...filters,
            page: 1,
        }));
    };

    const banMutation = useMutation({
        mutationFn: (payload: { userId: string; reason: string }) => banUser(payload.userId, { reason: payload.reason }),
        onSuccess: (_, payload) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', payload.userId] });
        },
    });

    const unbanMutation = useMutation({
        mutationFn: (userId: string) => unbanUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => deleteUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.removeQueries({ queryKey: ['user', userId] });
        },
    });

    const handleAction = async (type: UserActionType, user: User) => {
        try {
            if (type === 'ban') {
                if (!can('user:ban')) return;
                const reason = window.prompt('请输入封禁原因：', '违反社区规范');
                if (!reason) return;
                await banMutation.mutateAsync({ userId: user.id, reason });
                notify.success(`已封禁用户 ${user.displayName}`);
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

    const loading = isLoading || isFetching;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 24 }}>
            {/* Stats Section */}
            <VisitorStats />

            {/* Main Content */}
            <Card bodyStyle={{ padding: '24px 24px 0 24px' }}>
                <UserFilter onFilterChange={handleFilterChange} loading={loading} />

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
                    canBan={can('user:ban')}
                    canUnban={can('user:unban')}
                    canDelete={can('user:delete')}
                />
            </Card>
        </Space>
    );
};

export default UserListPage;
