<template>
    <view class="risk-grid-container">
        <!-- Y轴标签：重度/中度/轻度/最轻（自上而下，中性色） -->
        <view class="y-axis-labels">
            <text v-for="(label, i) in yAxisLabels" :key="i" class="y-label">
                {{ label }}
            </text>
        </view>

        <!-- 图表主区域 -->
        <view class="chart-main">
            <!-- 图表区域 -->
            <view class="chart-area">
                <svg width="100%" height="100%" :viewBox="`0 0 ${width} ${chartHeight}`" preserveAspectRatio="none"
                    style="overflow: visible;">
                    <!-- 4行背景网格（中性色） -->
                    <rect v-for="(zone, i) in 4" :key="`bg-${i}`" x="0" :y="getZoneY(i)" :width="width"
                        :height="zoneHeight" fill="#f8fafc" />

                    <!-- 水平分隔线（中性色） -->
                    <line v-for="i in 5" :key="`hline-${i}`" x1="0" :y1="(i - 1) * zoneHeight" :x2="width"
                        :y2="(i - 1) * zoneHeight" stroke="#e2e8f0" stroke-width="1" />

                    <!-- 垂直网格线（中性色，形成完整二维网格） -->
                    <line v-for="i in (gridLineCount + 1)" :key="`vline-${i}`" :x1="(i - 1) * segmentWidth" y1="0"
                        :x2="(i - 1) * segmentWidth" :y2="chartHeight" stroke="#e2e8f0" stroke-width="1" />

                    <!-- 数据点（唯一承载风险颜色的元素） -->
                    <circle v-for="(point, i) in chartPoints" :key="`pt-${i}`" :cx="point.x" :cy="point.y" r="8"
                        :fill="point.color" stroke="white" stroke-width="3" class="drop-shadow" />
                </svg>
            </view>

            <!-- X轴时间标签 -->
            <view class="x-axis-labels">
                <text v-for="(label, i) in xAxisLabels" :key="i" class="x-label" :style="{ width: `${100 / xAxisLabels.length}%` }">
                    {{ label }}
                </text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import {
    RISK_COLORS,
    SEGMENT_COUNTS,
    processRiskChartPoints,
    generateTrendLinePoints
} from '@/utils/charts/riskGridUtils';

const props = defineProps({
    data: {
        type: Object,
        default: () => ({ values: [], points: [] })
    },
    options: {
        type: Object,
        default: () => ({})
    },
    // Time range affects X-axis segments
    timeRange: {
        type: String,
        default: 'week' // day | week | month | six_month | year
    }
});

// Chart dimensions
const width = 300;
const chartHeight = 160;

// Y轴标签（自上而下：重度 → 最轻，使用中性文字色）
const yAxisLabels = ['重度', '中度', '轻度', '最轻'];

// 网格计算
const segmentCount = computed(() => SEGMENT_COUNTS[props.timeRange] || 7);
const segmentWidth = computed(() => width / segmentCount.value);
const gridLineCount = computed(() => segmentCount.value);
const zoneHeight = chartHeight / 4;

// 区域位置计算
const getZoneY = (index) => index * zoneHeight;

// X轴时间标签计算
const xAxisLabels = computed(() => {
    const now = dayjs();
    const labels = [];

    switch (props.timeRange) {
        case 'day':
            // 24小时，显示 0, 6, 12, 18, 24
            return ['0时', '6时', '12时', '18时', '24时'];
        case 'week':
            // 周一到周日
            return ['一', '二', '三', '四', '五', '六', '日'];
        case 'month':
            // 月视图：1, 8, 15, 22, 月末
            const daysInMonth = now.daysInMonth();
            return ['1日', '8日', '15日', '22日', `${daysInMonth}日`];
        case 'six_month':
            // 最近6个月
            for (let i = 5; i >= 0; i--) {
                labels.push(`${now.subtract(i, 'month').month() + 1}月`);
            }
            return labels;
        case 'year':
            // 最近12个月，显示间隔月份
            return ['1月', '4月', '7月', '10月', '12月'];
        default:
            return ['一', '二', '三', '四', '五', '六', '日'];
    }
});

// 处理数据点
const chartPoints = computed(() => {
    let dataArray = [];

    if (props.data.points && props.data.points.length > 0) {
        dataArray = props.data.points;
    } else if (props.data.values && props.data.values.length > 0) {
        dataArray = props.data.values;
    } else if (Array.isArray(props.data) && props.data.length > 0) {
        dataArray = props.data;
    }

    // 支持简单数值数组格式
    if (dataArray.length > 0 && typeof dataArray[0] === 'number') {
        dataArray = dataArray.map((val, idx) => ({
            value: val,
            timestamp: Date.now() - (dataArray.length - 1 - idx) * 86400000
        }));
    }

    return processRiskChartPoints(
        dataArray,
        width,
        chartHeight,
        segmentCount.value,
        props.timeRange
    );
});

// 趋势连接线
const trendLinePoints = computed(() => {
    return generateTrendLinePoints(chartPoints.value);
});
</script>

<style lang="scss" scoped>
.risk-grid-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
}

.y-axis-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 0 12rpx 28rpx 0;
    width: 56rpx;
    text-align: right;
}

.y-label {
    font-size: 20rpx;
    font-weight: 600;
    color: #64748b;
    line-height: 1;
}

.chart-main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.chart-area {
    flex: 1;
    position: relative;
}

.x-axis-labels {
    display: flex;
    justify-content: space-between;
    padding-top: 8rpx;
    height: 28rpx;
}

.x-label {
    font-size: 18rpx;
    color: #94a3b8;
    text-align: center;
}

.drop-shadow {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
</style>
