import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Typography, Statistic } from 'antd';
import { DatabaseOutlined, HddOutlined, CloudServerOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface SystemStats {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: number;
}

const SystemMonitor: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/system/monitor')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch system stats:', err);
                setLoading(false);
            });
    }, []);

    if (loading || !stats) {
        return <div>Loading system statistics...</div>;
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>System Monitor</Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="CPU Usage"
                            value={stats.cpuUsage}
                            suffix="%"
                            prefix={<CloudServerOutlined />}
                        />
                        <Progress percent={stats.cpuUsage} status={stats.cpuUsage > 80 ? 'exception' : 'active'} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Memory Usage"
                            value={stats.memoryUsage}
                            suffix="%"
                            prefix={<DatabaseOutlined />}
                        />
                        <Progress percent={stats.memoryUsage} strokeColor="orange" />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Disk Usage"
                            value={stats.diskUsage}
                            suffix="%"
                            prefix={<HddOutlined />}
                        />
                        <Progress percent={stats.diskUsage} />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
                <Card title="System Information">
                    <p><strong>Uptime:</strong> {stats.uptime} seconds</p>
                    <p><strong>OS:</strong> Linux x64</p>
                    <p><strong>Node Version:</strong> v20.10.0</p>
                </Card>
            </div>
        </div>
    );
};

export default SystemMonitor;
