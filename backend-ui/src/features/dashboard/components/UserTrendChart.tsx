import React, { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Segmented, theme } from 'antd';
import type { TrendPoint } from '@/api/types';
import { useEchartsResize } from '../hooks/useEchartsResize';
import { echarts } from '@/core/charts/echarts';

interface UserTrendChartProps {
    range: string;
    onRangeChange: (value: string) => void;
    data: TrendPoint[];
    loading?: boolean;
}

const UserTrendChart: React.FC<UserTrendChartProps> = ({ range, onRangeChange, data, loading = false }) => {
    const { token } = theme.useToken();
    const chartRef = useRef<ReactECharts | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
    const hasTrendData = useMemo(() => safeData.some(point => point.count > 0), [safeData]);
    const xAxisData = useMemo(() => safeData.map(point => point.date), [safeData]);
    const seriesData = useMemo(
        () => (hasTrendData ? safeData.map(point => point.count) : []),
        [safeData, hasTrendData]
    );
    useEchartsResize(chartRef, containerRef, [safeData.length]);

    // 提取并稳定 token 值
    const chartColors = useMemo(() => ({
        primary: token.colorPrimary,
        primaryActive: token.colorPrimaryActive,
        border: token.colorBorder,
        textSecondary: token.colorTextSecondary,
        split: token.colorSplit,
    }), [
        token.colorPrimary,
        token.colorPrimaryActive,
        token.colorBorder,
        token.colorTextSecondary,
        token.colorSplit
    ]);

    const option = useMemo(() => ({
        grid: { top: 30, right: 20, bottom: 20, left: 40, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: { lineStyle: { color: chartColors.border } },
            axisLabel: { color: chartColors.textSecondary },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: !hasTrendData, lineStyle: { color: chartColors.border } },
            axisTick: { show: !hasTrendData },
            splitLine: { lineStyle: { color: chartColors.split } },
            axisLabel: { color: chartColors.textSecondary },
            min: hasTrendData ? undefined : 0,
            max: hasTrendData ? undefined : 1,
            splitNumber: hasTrendData ? undefined : 4,
        },
        series: [
            {
                data: seriesData,
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 3, color: chartColors.primary },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: chartColors.primaryActive },
                            { offset: 1, color: 'rgba(255, 255, 255, 0)' }
                        ]
                    }
                },
            },
        ],
    }), [seriesData, chartColors, xAxisData, hasTrendData]);

    return (
        <Card
            title="用户增长"
            extra={<Segmented options={['7d', '30d', '90d']} value={range} onChange={onRangeChange} />}
            variant="borderless"
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
                {!hasTrendData && !loading && null}
            </div>
        </Card>
    );
};

// 自定义比较函数 - 仅在关键 props 变化时重渲染
function arePropsEqual(
    prevProps: Readonly<UserTrendChartProps>,
    nextProps: Readonly<UserTrendChartProps>
): boolean {
    return (
        prevProps.range === nextProps.range &&
        prevProps.loading === nextProps.loading &&
        prevProps.onRangeChange === nextProps.onRangeChange &&
        // 深度比较 data 数组
        prevProps.data.length === nextProps.data.length &&
        prevProps.data.every((item, index) =>
            item.date === nextProps.data[index]?.date &&
            item.count === nextProps.data[index]?.count
        )
    );
}

export default React.memo(UserTrendChart, arePropsEqual);
