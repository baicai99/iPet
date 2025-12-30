import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Typography, Statistic, App, Spin } from 'antd';
import { DatabaseOutlined, HddOutlined, CloudServerOutlined } from '@ant-design/icons';
import { getSystemInfo, getStorageStats } from '@/api/contracts/system';
import type { StorageStats, SystemInfo } from '@/api/types';

const { Title } = Typography;

const KPI_CARD_MIN_HEIGHT = 140;

const formatUptime = (seconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(' ');
};

const SystemMonitor: React.FC = () => {
    const { message } = App.useApp();
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadStats = async () => {
            try {
                const [systemResponse, storageResponse] = await Promise.all([
                    getSystemInfo(),
                    getStorageStats(),
                ]);
                if (!isMounted) return;
                setSystemInfo(systemResponse);
                setStorageStats(storageResponse);
            } catch (error) {
                console.error('[SystemMonitor] Fetch failed', error);
                message.error('获取系统状态失败');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadStats();
        return () => {
            isMounted = false;
        };
    }, [message]);

    if (loading) {
        return <Spin fullscreen size="large" tip="系统状态加载中..." />;
    }

    if (!systemInfo || !storageStats) {
        return <div>未能加载系统状态</div>;
    }

    const cpuLoad = systemInfo.system.cpuUsage?.[0] ?? 0;
    const memoryUsedPercent = Number(systemInfo.system.memoryUsage.usedPercent ?? 0);
    const memoryPercent = Number.isFinite(memoryUsedPercent) ? memoryUsedPercent : 0;

    return (
        <div>
            <Title level={2}>系统监控</Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card style={{ minHeight: KPI_CARD_MIN_HEIGHT }}>
                        <Statistic
                            title="CPU 负载 (1m)"
                            value={cpuLoad}
                            precision={2}
                            prefix={<CloudServerOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ minHeight: KPI_CARD_MIN_HEIGHT }}>
                        <Statistic
                            title="内存使用率"
                            value={memoryPercent}
                            suffix="%"
                            prefix={<DatabaseOutlined />}
                        />
                        <Progress percent={memoryPercent} strokeColor="orange" />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ minHeight: KPI_CARD_MIN_HEIGHT }}>
                        <Statistic
                            title="存储占用"
                            value={storageStats.totalSizeFormatted}
                            prefix={<HddOutlined />}
                        />
                        <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                            文件数：{storageStats.totalFiles}
                        </div>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
                <Card title="System Information">
                    <p><strong>Uptime:</strong> {formatUptime(systemInfo.system.uptime ?? systemInfo.uptime)}</p>
                    <p><strong>OS:</strong> {systemInfo.system.platform} {systemInfo.system.arch}</p>
                    <p><strong>Node Version:</strong> {systemInfo.system.nodeVersion}</p>
                </Card>
            </div>
        </div>
    );
};

export default SystemMonitor;
