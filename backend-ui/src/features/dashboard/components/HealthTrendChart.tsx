import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Segmented, Empty, theme } from 'antd';
import type { TrendPoint } from '@/api/types';
import { useEchartsResize } from '../hooks/useEchartsResize';
import { echarts } from '@/core/charts/echarts';

interface HealthTrendChartProps {
    range: string;
    onRangeChange: (value: string) => void;
    data: TrendPoint[];
    loading?: boolean;
}

const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ range, onRangeChange, data, loading = false }) => {
    const { token } = theme.useToken();
    const chartRef = useRef<ReactECharts | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
    const xAxisData = useMemo(() => safeData.map(point => point.date), [safeData]);
    const seriesData = useMemo(() => safeData.map(point => point.count), [safeData]);
    useEchartsResize(chartRef, containerRef, [safeData.length]);

    const option = useMemo(() => ({
        grid: { top: 30, right: 20, bottom: 20, left: 40, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: { lineStyle: { color: token.colorBorder } },
            axisLabel: { color: token.colorTextSecondary },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: token.colorSplit } },
            axisLabel: { color: token.colorTextSecondary },
        },
        series: [
            {
                name: '记录数',
                type: 'bar',
                data: seriesData,
                itemStyle: { color: token.colorPrimary },
                barWidth: seriesData.length <= 7 ? '40%' : '60%',
            },
        ],
    }), [seriesData, token, xAxisData]);

    return (
        <Card
            title="健康记录趋势"
            extra={<Segmented options={['7d', '30d', '90d']} value={range} onChange={onRangeChange} />}
            bordered={false}
            style={{ height: '100%' }}
        >
            <div ref={containerRef} style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                <ReactECharts
                    ref={chartRef}
                    option={option}
                    style={{ height: 300, width: '100%' }}
                    echarts={echarts}
                    notMerge={false}
                    lazyUpdate={true}
                    replaceMerge={['series', 'xAxis']}
                    showLoading={loading}
                    loadingOption={{ text: '加载中...' }}
                />
                {safeData.length === 0 && !loading && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.6)',
                        }}
                    >
                        <Empty description="暂无趋势数据" />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default React.memo(HealthTrendChart);
