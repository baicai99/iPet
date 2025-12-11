<template>
    <view class="status-grid-container">
        <view class="y-axis-labels">
            <text class="label">偏干</text>
            <text class="label">正常</text>
            <text class="label">偏稀</text>
        </view>
        <view class="chart-area">
            <svg width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none" style="overflow: visible;">
                <!-- Background Zones -->
                <rect x="0" y="0" width="300" height="40" :fill="color" fill-opacity="0.1" rx="4" />
                <rect x="0" y="45" width="300" height="70" fill="#BAE6FD" rx="4" />
                <rect x="0" y="120" width="300" height="40" :fill="color" fill-opacity="0.1" rx="4" />

                <!-- Vertical Grid Lines -->
                <line v-for="i in 6" :key="i" :x1="i * colWidth" y1="0" :x2="i * colWidth" y2="160" stroke="white"
                    stroke-width="2" stroke-dasharray="4 4" />

                <!-- Data Points -->
                <circle v-for="(val, i) in validValues" :key="i" :cx="i * colWidth + colWidth / 2" :cy="getY(val)" r="6"
                    :fill="color" stroke="white" stroke-width="3" class="drop-shadow" />
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

const width = 300;
const height = 160;
const colWidth = width / 7;

const validValues = computed(() => {
    // Ensure we only take up to 7 values to fit the grid
    return (props.data.values || []).slice(0, 7);
});

const getY = (val) => {
    if (val === null || val === undefined) return 0;
    return height - (val / 100) * height;
};
</script>

<style lang="scss" scoped>
.status-grid-container {
    display: flex;
    height: 100%;
    width: 100%;
}

.y-axis-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8rpx 12rpx 8rpx 0; // py-2 pr-3
    width: 48rpx; // w-12
    text-align: right;
}

.label {
    font-size: 20rpx; // text-[10px]
    font-weight: 700;
    color: #94a3b8; // slate-400
}

.chart-area {
    flex: 1;
    height: 100%;
    position: relative;
}

.drop-shadow {
    // SVG filters are tricky in UniApp/CSS, using simple shadow if possible or ignoring
    // filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
}
</style>
