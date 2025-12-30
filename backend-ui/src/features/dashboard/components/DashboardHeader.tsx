import React from 'react';
import { Typography, Space, Button, Tag } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface DashboardHeaderProps {
    updatedAt?: string | null;
    loading?: boolean;
    onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ updatedAt, loading = false, onRefresh }) => {
    const updatedLabel = updatedAt ? new Date(updatedAt).toLocaleString() : '暂无数据';

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space orientation="vertical" size={4}>
                <Title level={4} style={{ margin: 0 }}>仪表盘</Title>
                <Space size="small">
                    <ClockCircleOutlined style={{ color: '#64748b' }} />
                    <Text type="secondary">更新时间：{updatedLabel}</Text>
                    {!updatedAt && <Tag color="default">等待同步</Tag>}
                </Space>
            </Space>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
                刷新数据
            </Button>
        </div>
    );
};

export default DashboardHeader;
