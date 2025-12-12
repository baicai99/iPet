<template>
    <view class="trend-line-container">
        <!-- Background Grid -->
        <view class="grid-background">
            <view v-for="i in 24" :key="i" class="grid-cell"></view>
        </view>

        <!-- Sparkline -->
        <view class="chart-wrapper">
            <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style="overflow: visible;">
                <defs>
                    <linearGradient :id="`grad-${uniqueId}`" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" :stop-color="color" stop-opacity="0.25" />
                        <stop offset="100%" :stop-color="color" stop-opacity="0" />
                    </linearGradient>
                </defs>

                <!-- Empty state: no valid data points -->
                <template v-if="chartPointsCount === 0">
                    <!-- Show nothing when no data -->
                </template>

                <!-- Single Point: Show dot only, no line -->
                <template v-else-if="chartPointsCount === 1">
                    <circle :cx="singlePointX" :cy="singlePointY" r="3" :fill="color" />
                </template>

                <!-- Multiple Points: Draw line connecting valid points -->
                <template v-else>
                    <!-- Fill Area -->
                    <path :d="fillPath" :fill="`url(#grad-${uniqueId})`" stroke="none" />

                    <!-- Line -->
                    <polyline fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        vector-effect="non-scaling-stroke" :points="points" />

                    <!-- End Dot -->
                    <circle v-if="points" :cx="endX" :cy="endY" r="2" :fill="color" />
                </template>
            </svg>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { normalizeData, generatePoints, generateLinePath, generateAreaPath } from '@/utils/charts/chartCore';

const props = defineProps({
    data: {
        type: Object,
        default: () => ({ values: [] })
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
});

const uniqueId = Math.random().toString(36).substr(2, 9);
const width = 100;
const height = 40;

const pointsData = computed(() => {
    // 1. Normalize Data (from props.data.values) - now preserves null
    const data = normalizeData(props.data.values);
    if (!data.length) return { points: '', fillPath: '', endY: 0, endX: 100, chartPoints: [] };
    
    // 2. Generate Points (now skips null values)
    const chartPoints = generatePoints(data, width, height);
    
    // No valid points
    if (!chartPoints.length) return { points: '', fillPath: '', endY: 0, endX: 100, chartPoints: [] };

    // 3. Generate Paths (Polyline & Area)
    const pointsStr = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
    
    // Use helper for area path
    const fillPath = generateAreaPath(chartPoints, height);

    // Calculate end position for the dot (last point)
    const lastPoint = chartPoints[chartPoints.length - 1];
    const endY = lastPoint.y;
    const endX = lastPoint.x;

    return { points: pointsStr, fillPath, endY, endX, chartPoints };
});

const chartPointsCount = computed(() => pointsData.value.chartPoints.length);
const points = computed(() => pointsData.value.points);
const fillPath = computed(() => pointsData.value.fillPath);
const endY = computed(() => pointsData.value.endY);
const endX = computed(() => pointsData.value.endX);

// Single point coordinates
const singlePointX = computed(() => pointsData.value.chartPoints[0]?.x ?? 50);
const singlePointY = computed(() => pointsData.value.chartPoints[0]?.y ?? 20);
</script>

<style lang="scss" scoped>
.trend-line-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.grid-background {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 1fr);
    pointer-events: none;
    border-top: 1rpx solid #f8fafc; // slate-50
    border-left: 1rpx solid #f8fafc;
}

.grid-cell {
    border-right: 1rpx solid #f8fafc;
    border-bottom: 1rpx solid #f8fafc;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
}
</style>
