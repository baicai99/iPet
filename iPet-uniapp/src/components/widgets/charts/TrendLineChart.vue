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

                <!-- Fill Area -->
                <path :d="fillPath" :fill="`url(#grad-${uniqueId})`" stroke="none" />

                <!-- Line -->
                <polyline fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    vector-effect="non-scaling-stroke" :points="points" />

                <!-- End Dot -->
                <circle v-if="points" :cx="100" :cy="endY" r="2" :fill="color" />
            </svg>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';

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

const values = computed(() => props.data.values || []);

const pointsData = computed(() => {
    const data = values.value;
    if (!data || data.length === 0) return { points: '', fillPath: '', endY: 0 };

    const height = 40;
    const width = 100;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const pts = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `M0,${height} L${pts.replace(/ /g, ' L')} L${width},${height} Z`;

    // Calculate endY for the dot
    const endY = height - ((data[data.length - 1] - min) / range) * height;

    return { points: pts, fillPath, endY };
});

const points = computed(() => pointsData.value.points);
const fillPath = computed(() => pointsData.value.fillPath);
const endY = computed(() => pointsData.value.endY);

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
