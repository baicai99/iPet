<template>
    <view class="status-grid-container">

        <view class="y-axis-labels">
            <!-- 3-zone labels: 偏干, 正常, 偏稀 (top to bottom) -->
            <text v-for="(label, i) in reversedLevels" :key="i" class="label">{{ label }}</text>
        </view>
        <view class="chart-area">
            <!-- #ifdef MP-WEIXIN -->
            <view class="chart-canvas">
                <!-- 3-Zone Background -->
                <view v-for="i in 3" :key="`bg-${i}`" class="zone" :style="{
                    top: `${(getZoneY(i - 1) / height) * 100}%`,
                    height: `${(getZoneHeight(i - 1) / height) * 100}%`,
                    backgroundColor: getZoneFill(i - 1),
                    opacity: (i - 1) === 1 ? 1 : 0.1
                }"></view>

                <!-- Vertical Grid Lines -->
                <view v-for="i in (gridLineCount - 1)" :key="`grid-${i}`" class="vline" :style="{
                    left: `${(i / segmentCount) * 100}%`
                }"></view>

                <!-- Data Points positioned by timestamp, colored by status -->
                <view v-for="(point, i) in chartPoints" :key="`pt-${i}`" class="point" :style="{
                    left: `${(point.x / width) * 100}%`,
                    top: `${(point.y / height) * 100}%`,
                    backgroundColor: point.isNormal ? '#3B82F6' : '#EF4444'
                }"></view>
            </view>
            <!-- #endif -->

            <!-- #ifndef MP-WEIXIN -->
            <svg width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none" style="overflow: visible;">
                <!-- 3-Zone Background -->
                <rect v-for="(zone, i) in 3" :key="`bg-${i}`" x="0" :y="getZoneY(i)" width="300"
                    :height="getZoneHeight(i)" :fill="getZoneFill(i)" :fill-opacity="i === 1 ? 1 : 0.1" rx="4" />

                <!-- Vertical Grid Lines -->
                <line v-for="i in (gridLineCount - 1)" :key="`grid-${i}`" :x1="i * segmentWidth" y1="0"
                    :x2="i * segmentWidth" y2="160" stroke="white" stroke-width="2" stroke-dasharray="4 4" />

                <!-- Same-day Connection Lines (PRD 5.3) -->
                <line v-for="(line, i) in sameDayLines" :key="`line-${i}`" :x1="line.x1" :y1="line.y1" :x2="line.x2"
                    :y2="line.y2" :stroke="color" stroke-width="2" stroke-opacity="0.4" />

                <!-- Data Points positioned by timestamp, colored by status -->
                <circle v-for="(point, i) in chartPoints" :key="`pt-${i}`" :cx="point.x" :cy="point.y" r="6"
                    :fill="point.isNormal ? '#3B82F6' : '#EF4444'" stroke="white" stroke-width="3"
                    class="drop-shadow" />
            </svg>
            <!-- #endif -->
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { getLabelForValue } from '@/config/stoolStatusConfig';
import {
    processChartPoints,
    SEGMENT_COUNTS,
    STATUS_COLORS,
    isNormalValue
} from '@/utils/charts/statusGridUtils';

const props = defineProps({
    data: {
        type: Object,
        default: () => ({ values: [], points: [] })
    },
    options: {
        type: Object,
        default: () => ({})
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    // Time range affects X-axis segments (PRD 5.1)
    timeRange: {
        type: String,
        default: 'week' // day | week | month | six_month | year
    }
});

const width = 300;
const height = 160;

// 3-zone labels (PRD 3.2 - visual layer)
const levels = ['偏干', '正常', '偏稀'];
const reversedLevels = [...levels].reverse(); // Top: 偏干, Middle: 正常, Bottom: 偏稀

const segmentCount = computed(() => SEGMENT_COUNTS[props.timeRange] || 7);
const segmentWidth = computed(() => width / segmentCount.value);
const gridLineCount = computed(() => segmentCount.value);

// Zone Y positions (3 zones with middle highlighted)
const zoneHeights = [40, 80, 40]; // dry, normal, wet zones
const zonePositions = [0, 40, 120];

const getZoneY = (index) => zonePositions[index];
const getZoneHeight = (index) => zoneHeights[index];
const getZoneFill = (index) => index === 1 ? STATUS_COLORS.zone : props.color;

// Process data points using shared utility
const chartPoints = computed(() => {
    // Extract data array from various formats
    let dataArray = [];

    if (props.data.points && props.data.points.length > 0) {
        dataArray = props.data.points;
    } else if (props.data.values && props.data.values.length > 0) {
        dataArray = props.data.values;
    } else if (Array.isArray(props.data) && props.data.length > 0) {
        dataArray = props.data;
    }

    // 只有日视图使用真实时间戳定位，其他视图使用网格吸附
    const useTimestampPositioning = props.timeRange === 'day';

    return processChartPoints(
        dataArray,
        width,
        height,
        segmentCount.value,
        useTimestampPositioning,
        props.timeRange
    );
});

// Same-day connection lines (PRD 5.3) - only for day view
const sameDayLines = computed(() => {
    // 只在日视图显示连接线，其他视图不需要
    if (props.timeRange !== 'day') {
        return [];
    }

    const lines = [];
    const pointsByDate = {};

    // Group points by date
    chartPoints.value.forEach((point, index) => {
        if (point.date) {
            if (!pointsByDate[point.date]) {
                pointsByDate[point.date] = [];
            }
            pointsByDate[point.date].push({ ...point, index });
        }
    });

    // Create lines between points on same day
    Object.values(pointsByDate).forEach(dayPoints => {
        if (dayPoints.length > 1) {
            // Sort by timestamp
            dayPoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            for (let i = 0; i < dayPoints.length - 1; i++) {
                lines.push({
                    x1: dayPoints[i].x,
                    y1: dayPoints[i].y,
                    x2: dayPoints[i + 1].x,
                    y2: dayPoints[i + 1].y
                });
            }
        }
    });

    return lines;
});

// Latest status for summary (PRD 6.1)
const latestStatus = computed(() => {
    const points = chartPoints.value;
    if (!points.length) return null;

    // Find point with latest timestamp
    let latest = points[0];
    points.forEach(p => {
        if (p.timestamp && (!latest.timestamp || p.timestamp > latest.timestamp)) {
            latest = p;
        }
    });

    // If no timestamps, use last point in array
    if (!latest.timestamp) {
        latest = points[points.length - 1];
    }

    return {
        value: latest.value,
        label: getLabelForValue(latest.value)
    };
});
</script>

<style lang="scss" scoped>
.status-grid-container {
    display: flex;
    height: 100%;
    width: 100%;
    position: relative;
}


.y-axis-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8rpx 12rpx 8rpx 0;
    width: 48rpx;
    text-align: right;
}

.label {
    font-size: 20rpx;
    font-weight: 700;
    color: #94a3b8;
}

.chart-area {
    flex: 1;
    height: 100%;
    position: relative;
}

.chart-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 8rpx;
}

.zone {
    position: absolute;
    left: 0;
    width: 100%;
    border-radius: 8rpx;
}

.vline {
    position: absolute;
    top: 0;
    height: 100%;
    width: 2rpx;
    background-color: rgba(255, 255, 255, 0.6);
}

.point {
    position: absolute;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    border: 3rpx solid #ffffff;
    transform: translate(-50%, -50%);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.18);
    box-sizing: border-box;
}
</style>
