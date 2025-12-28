import React, { useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Empty } from 'antd';
import type { PetDistribution } from '@/api/types';
import { useEchartsResize } from '../hooks/useEchartsResize';
import { echarts } from '@/core/charts/echarts';

const PET_LABELS: Record<string, string> = {
    dog: '狗',
    cat: '猫',
    other: '其他'
};

interface PetDistributionChartProps {
    data: PetDistribution[];
    loading?: boolean;
}

const PetDistributionChart: React.FC<PetDistributionChartProps> = ({ data, loading = false }) => {
    const safeData = Array.isArray(data) ? data : [];
    const chartData = safeData.map(item => ({
        value: item.count,
        name: PET_LABELS[item.type] || item.type
    }));
    const chartRef = useRef<ReactECharts | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    useEchartsResize(chartRef, containerRef, [chartData.length]);

    const option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        series: [
            {
                name: 'Pet Type',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 20,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: chartData
            }
        ]
    };

    return (
        <Card title="宠物类型分布" bordered={false} style={{ height: '100%' }} loading={loading}>
            <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
                {chartData.length === 0 && !loading ? (
                    <Empty description="暂无分布数据" />
                ) : (
                    <ReactECharts
                        ref={chartRef}
                        option={option}
                        style={{ height: 320, width: '100%' }}
                        echarts={echarts}
                    />
                )}
            </div>
        </Card>
    );
};

export default PetDistributionChart;
