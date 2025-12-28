import React from 'react';
import { Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/shared/components/StatCard';
import { getGuestStats } from '@/api/contracts/users';

export const VisitorStats: React.FC = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['guest-stats'],
        queryFn: () => getGuestStats(),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    const growthRate = stats
        ? ((stats.last7Days / stats.total) * 100).toFixed(1)
        : '0';

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
                <StatCard
                    title="游客总数"
                    value={stats?.total || 0}
                    loading={isLoading}
                    trend={{
                        value: parseFloat(growthRate),
                        type: 'up',
                        label: '近7天'
                    }}
                />
            </Col>
            <Col xs={24} sm={12} md={8}>
                <StatCard
                    title="活跃游客(7天)"
                    value={stats?.last7Days || 0}
                    loading={isLoading}
                />
            </Col>
            <Col xs={24} sm={12} md={8}>
                <StatCard
                    title="活跃游客(30天)"
                    value={stats?.last30Days || 0}
                    loading={isLoading}
                />
            </Col>
        </Row>
    );
};
