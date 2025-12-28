import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface AuditLog {
    id: number;
    action: string;
    user: string;
    timestamp: string;
    details: string;
}

const AuditLogs: React.FC = () => {
    const [data, setData] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/system/audit-logs')
            .then(res => res.json())
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch audit logs:', err);
                setLoading(false);
            });
    }, []);

    const columns: ColumnsType<AuditLog> = [
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (text) => new Date(text).toLocaleString(),
        },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Audit Logs</Title>
            <Card>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 600 }}
                />
            </Card>
        </div>
    );
};

export default AuditLogs;
