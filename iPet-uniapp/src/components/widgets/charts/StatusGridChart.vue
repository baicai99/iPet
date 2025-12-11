<template>
    <view class="status-grid-container">
        <view class="y-axis-labels">
            <!-- Dynamic labels from options.levels, reversed for top-to-bottom display -->
            <text v-for="(label, i) in reversedLevels" :key="i" class="label">{{ label }}</text>
        </view>
        <view class="chart-area">
            <svg width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none" style="overflow: visible;">
                <!-- Dynamic Background Zones based on levels -->
                <rect v-for="(level, i) in levelCount" :key="`bg-${i}`" x="0" :y="getRowY(i)" width="300"
                    :height="getRowHeight(i)" :fill="getRowFill(i)" :fill-opacity="isMiddleRow(i) ? 1 : 0.1" rx="4" />

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
    options: {
        type: Object,
        default: () => ({})
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
});

const width = 300;
const height = 160;
const colWidth = width / 7;

// Get levels from options or use default Chinese labels for stool metric
const levels = computed(() => {
    const optLevels = props.options?.levels
    return Array.isArray(optLevels) && optLevels.length > 0
        ? optLevels
        : ['偏干', '正常', '偏稀']
})

// Reversed levels for Y-axis display (highest level at top)
const reversedLevels = computed(() => [...levels.value].reverse())

// Number of levels for dynamic rendering
const levelCount = computed(() => levels.value.length)

// Check if a row is the "middle" row (highlighted differently)
const isMiddleRow = (index) => {
    const count = levelCount.value
    if (count <= 2) return false
    return index === Math.floor(count / 2)
}

// Calculate row Y position (top-down rendering)
const getRowY = (index) => {
    const count = levelCount.value
    if (count === 3) {
        // Original fixed layout: top zone, middle zone, bottom zone
        const positions = [0, 45, 120]
        return positions[index] || 0
    }
    return (index * height) / count
}

// Calculate row height
const getRowHeight = (index) => {
    const count = levelCount.value
    if (count === 3) {
        // Original fixed layout for 3 levels
        const heights = [40, 70, 40]
        return heights[index] || 40
    }
    return height / count - 5
}

// Get fill color for row
const getRowFill = (index) => {
    return isMiddleRow(index) ? '#BAE6FD' : props.color
}

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
