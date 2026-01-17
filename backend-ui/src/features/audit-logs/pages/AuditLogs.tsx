import React, { useState } from 'react';
import { Table, Tag, Card, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AuditLog } from '@/api/types';
import { useRequest } from 'ahooks';
import { getAuditLogs } from '@/api/contracts/audit-logs';

const { Title } = Typography;

const ACTION_MAP: Record<string, { label: string; color: string }> = {
    LOGIN: { label: '登录', color: 'blue' },
    LOGOUT: { label: '登出', color: 'default' },
    CREATE_USER: { label: '创建用户', color: 'green' },
    UPDATE_USER: { label: '更新用户', color: 'orange' },
    DELETE_USER: { label: '删除用户', color: 'red' },
    CREATE_ARTICLE: { label: '发布文章', color: 'cyan' },
    UPDATE_ARTICLE: { label: '更新文章', color: 'geekblue' },
    DELETE_ARTICLE: { label: '删除文章', color: 'magenta' },
    SYSTEM_INIT: { label: '系统初始化', color: 'purple' },
    UPDATE_ENTRY_PATH: { label: '更新入口', color: 'volcano' },
    UPDATE_ACCESS_CONFIG: { label: '更新配置', color: 'gold' },
    UPDATE_SECURITY_POLICY: { label: '安全策略', color: 'red' },
    login: { label: '登录', color: 'blue' },
    logout: { label: '登出', color: 'default' },
    ban_user: { label: '封禁用户', color: 'red' },
    unban_user: { label: '解封用户', color: 'green' },
    delete_user: { label: '删除用户', color: 'red' },
    restore_user: { label: '恢复用户', color: 'green' },
    permanent_delete_user: { label: '永久删除用户', color: 'red' },
    create_article: { label: '发布文章', color: 'cyan' },
    update_article: { label: '更新文章', color: 'geekblue' },
    delete_article: { label: '删除文章', color: 'magenta' },
    create_article_category: { label: '新增分类', color: 'cyan' },
    update_article_category: { label: '编辑分类', color: 'geekblue' },
    delete_article_category: { label: '删除分类', color: 'magenta' },
    bulk_delete_article: { label: '批量删除文章', color: 'red' },
    bulk_update_article_category: { label: '批量改分类', color: 'orange' },
    bulk_update_article_pinned: { label: '批量置顶', color: 'gold' },
    login_failed: { label: '登录失败', color: 'volcano' },
};

const AuditLogs: React.FC = () => {
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const { data: logData, loading } = useRequest(
        () => getAuditLogs({ page: pagination.current, limit: pagination.pageSize }),
        {
            refreshDeps: [pagination.current, pagination.pageSize],
        }
    );

    const columns: ColumnsType<AuditLog> = [
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => {
                const config = ACTION_MAP[action] || { label: action, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: '操作人',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: '时间',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (text) => new Date(text).toLocaleString(),
        },
        {
            title: '访问IP',
            dataIndex: 'ip',
            key: 'ip',
            render: (value?: string) => value || '-',
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
        },
    ];

    return (
        <div>
            <Title level={2}>审计日志</Title>
            <Card>
                <Table
                    columns={columns}
                    dataSource={logData?.items}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: logData?.pagination.page ?? pagination.current,
                        pageSize: logData?.pagination.limit ?? pagination.pageSize,
                        total: logData?.pagination.total ?? 0,
                        showSizeChanger: true,
                        onChange: (page, pageSize) => {
                            setPagination({
                                current: page,
                                pageSize: pageSize ?? pagination.pageSize,
                            });
                        },
                    }}
                    scroll={{ x: 600 }}
                />
            </Card>
        </div>
    );
};

export default AuditLogs;
