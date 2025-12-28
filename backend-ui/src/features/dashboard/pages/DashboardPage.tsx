import React from 'react';
import { Row, Col, Alert } from 'antd';
import OverviewCards from '../components/OverviewCards';
import UserTrendChart from '../components/UserTrendChart';
import HealthTrendChart from '../components/HealthTrendChart';
import PetDistributionChart from '../components/PetDistributionChart';
import DashboardHeader from '../components/DashboardHeader';
import { useDashboardData } from '../hooks/useDashboardData';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
    const {
        stats,
        userTrend,
        recordTrend,
        userRange,
        setUserRange,
        recordRange,
        setRecordRange,
        loadingStats,
        loadingUserTrend,
        loadingRecordTrend,
        refreshing,
        error,
        refreshAll
    } = useDashboardData();

    return (
        <div className="dashboard-page">
            <DashboardHeader
                updatedAt={stats?.generatedAt ?? null}
                loading={refreshing}
                onRefresh={refreshAll}
            />

            {error && (
                <Alert
                    type="warning"
                    message="部分数据加载失败"
                    description={error}
                    showIcon
                />
            )}

            <section className="dashboard-section">
                <OverviewCards stats={stats} loading={loadingStats} />
            </section>

            <section className="dashboard-section">
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <UserTrendChart
                            range={userRange}
                            onRangeChange={setUserRange}
                            data={userTrend}
                            loading={loadingUserTrend}
                        />
                    </Col>
                    <Col xs={24} lg={12}>
                        <HealthTrendChart
                            range={recordRange}
                            onRangeChange={setRecordRange}
                            data={recordTrend}
                            loading={loadingRecordTrend}
                        />
                    </Col>
                </Row>
            </section>

            <section className="dashboard-section">
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <PetDistributionChart
                            data={stats?.pets?.distribution ?? []}
                            loading={loadingStats}
                        />
                    </Col>
                </Row>
            </section>
        </div>
    );
};

export default DashboardPage;
