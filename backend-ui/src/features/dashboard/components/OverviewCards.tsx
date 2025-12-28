import React from 'react';
import { Row, Col } from 'antd';
import { TeamOutlined, HeartOutlined, RiseOutlined, SmileOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { StatCard } from '../../../shared/components/StatCard';
import type { DashboardStats } from '@/api/types';

interface OverviewCardsProps {
    stats: DashboardStats | null;
    loading?: boolean;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ stats, loading = false }) => {
    const cards = [
        {
            title: '总用户',
            value: stats?.users?.total,
            prefix: <TeamOutlined />,
        },
        {
            title: '活跃用户 (7天)',
            value: stats?.users?.active7d,
            prefix: <RiseOutlined />,
        },
        {
            title: '今日新增用户',
            value: stats?.users?.newToday,
            prefix: <TeamOutlined />,
        },
        {
            title: '宠物总量',
            value: stats?.pets?.total,
            prefix: <SmileOutlined />,
        },
        {
            title: '今日健康记录',
            value: stats?.healthRecords?.today,
            prefix: <HeartOutlined />,
        },
        {
            title: '文章总浏览',
            value: stats?.articles?.totalViews,
            prefix: <EyeOutlined />,
        },
        {
            title: '文章总量',
            value: stats?.articles?.total,
            prefix: <FileTextOutlined />,
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            {cards.map((card, index) => (
                <Col xs={24} sm={12} md={8} xl={6} key={`${card.title}-${index}`}>
                    <StatCard
                        title={card.title}
                        value={typeof card.value === 'number' ? card.value.toLocaleString() : '--'}
                        prefix={card.prefix}
                        loading={loading}
                    />
                </Col>
            ))}
        </Row>
    );
};

export default OverviewCards;
