import React, { useRef, useMemo } from 'react';
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
    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
    const chartData = useMemo(() =>
        safeData.map(item => ({
            value: item.count,
            name: PET_LABELS[item.type] || item.type
        }))
        , [safeData]);
    const chartRef = useRef<ReactECharts | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    useEchartsResize(chartRef, containerRef, [chartData.length]);

    const option = useMemo(() => ({
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
    }), [chartData]);

    return (
        <Card title="宠物类型分布" variant="borderless" style={{ height: '100%' }} loading={loading}>
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

// 自定义比较函数 - 仅在关键 props 变化时重渲染
function arePropsEqual(
    prevProps: Readonly<PetDistributionChartProps>,
    nextProps: Readonly<PetDistributionChartProps>
): boolean {
    return (
        prevProps.loading === nextProps.loading &&
        // 深度比较 data 数组
        prevProps.data.length === nextProps.data.length &&
        prevProps.data.every((item, index) =>
            item.type === nextProps.data[index]?.type &&
            item.count === nextProps.data[index]?.count
        )
    );
}

export default React.memo(PetDistributionChart, arePropsEqual);
