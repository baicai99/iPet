import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

const STAT_CARD_MIN_HEIGHT = 140;

interface StatCardProps {
    title: string;
    value: string | number;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    trend?: {
        value: number; // percentage, e.g. 10.5
        type: 'up' | 'down';
        label?: string; // e.g. "vs last week"
    };
    loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, trend, loading = false }) => {
    return (
        <Card loading={loading} hoverable style={{ minHeight: STAT_CARD_MIN_HEIGHT }}>
            <Statistic title={title} value={value} prefix={prefix} suffix={suffix} />
            {trend && (
                <div style={{ marginTop: 8 }}>
                    <Text type={trend.type === 'up' ? 'success' : 'danger'} style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                        {trend.type === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        <span style={{ marginLeft: 4 }}>{Math.abs(trend.value)}%</span>
                    </Text>
                    {trend.label && <Text type="secondary">{trend.label}</Text>}
                </div>
            )}
        </Card>
    );
};
