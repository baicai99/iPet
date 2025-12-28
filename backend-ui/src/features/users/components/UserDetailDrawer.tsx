import React from 'react';
import { Descriptions, Table, Tag, Typography, Spin, Empty, Badge } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { User, UserDetail } from '@/api/types';
import { getUserById } from '@/api/contracts/users';

interface UserDetailDrawerProps {
    user: User;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ user }) => {
    const { data: detail, isLoading } = useQuery<UserDetail>({
        queryKey: ['user', user.id],
        queryFn: () => getUserById(user.id),
        enabled: Boolean(user.id),
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
    const petTypeLabels: Record<string, string> = {
        dog: '狗',
        cat: '猫',
        other: '其他',
    };

    if (isLoading) {
        return <Spin style={{ display: 'block', margin: '20px auto' }} />;
    }

    if (!detail) {
        return <Empty description="未找到用户详情" />;
    }

    return (
        <div>
            <Descriptions title="用户信息" bordered size="small" column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                <Descriptions.Item label="昵称">{detail.displayName}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{detail.email}</Descriptions.Item>
                <Descriptions.Item label="角色">
                    <Tag color={detail.isGuest ? 'default' : 'blue'}>
                        {detail.isGuest ? '游客' : '注册用户'}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                    <Badge status={detail.isBanned ? 'error' : 'success'} text={detail.isBanned ? '封禁' : '正常'} />
                </Descriptions.Item>
                <Descriptions.Item label="宠物数量">{detail.petsCount}</Descriptions.Item>
                <Descriptions.Item label="最后活跃">{detail.lastActiveAt ? new Date(detail.lastActiveAt).toLocaleString() : '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{new Date(detail.createdAt).toLocaleDateString()}</Descriptions.Item>
                {detail.isBanned && (
                    <Descriptions.Item label="封禁原因" span={2}>
                        <Typography.Text type="danger">{detail.bannedReason}</Typography.Text>
                    </Descriptions.Item>
                )}
            </Descriptions>

            <Typography.Title level={5} style={{ marginTop: 24 }}>宠物 ({detail.pets?.length || 0})</Typography.Title>
            <Table
                dataSource={detail.pets || []}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    {
                        title: '类型',
                        dataIndex: 'type',
                        key: 'type',
                        render: (type) => <Tag>{petTypeLabels[type] || type}</Tag>
                    },
                    { title: '健康记录数', dataIndex: 'healthRecordsCount', key: 'healthRecordsCount' },
                ]}
            />
        </div>
    );
};
