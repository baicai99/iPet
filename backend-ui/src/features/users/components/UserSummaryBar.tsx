import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/contracts/stats';
import { queryKeys } from '@/api/queryKeys';

export const UserSummaryBar: React.FC = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: queryKeys.dashboard.stats(),
        queryFn: () => getDashboardStats(),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    return (
        <Card size="small" loading={isLoading} styles={{ body: { padding: '12px 16px' } }}>
            <Row gutter={[24, 12]}>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Statistic title="总用户" value={stats?.users.total ?? 0} styles={{ content: { fontSize: 18 } }} />
                </Col>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Statistic title="注册用户" value={stats?.users.registered ?? 0} styles={{ content: { fontSize: 18 } }} />
                </Col>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Statistic title="游客" value={stats?.users.guests ?? 0} styles={{ content: { fontSize: 18 } }} />
                </Col>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Statistic title="活跃用户(7天)" value={stats?.users.active7d ?? 0} styles={{ content: { fontSize: 18 } }} />
                </Col>
            </Row>
        </Card>
    );
};
