<template>
    <view class="state-grid-container" :style="{ height: height }">
        <!-- Y轴标签栏 (左侧) -->
        <view class="y-axis-labels">
            <!-- 倒序渲染标签，让索引大的在上面 (Visual Top) -->
            <view v-for="(label, i) in reversedLevels" :key="i" class="y-label-item">
                <text class="y-label-text">{{ label }}</text>
            </view>
        </view>

        <!-- 网格绘图区 (右侧) -->
        <view class="chart-content">
            <svg width="100%" height="100%" :viewBox="`0 0 ${width} ${chartHeight}`" preserveAspectRatio="none"
                style="overflow: visible;">
                <!-- A. 绘制背景条 (Rows) -->
                <rect v-for="(level, i) in levels" :key="`bg-${i}`" x="0" :y="getRowY(i) + 4" :width="width"
                    :height="rowHeight - 8" :fill="color" fill-opacity="0.08" rx="4" />

                <!-- B. 绘制连线 (增加趋势感) -->
                <polyline fill="none" :stroke="color" stroke-width="2" stroke-opacity="0.4" stroke-linecap="round"
                    stroke-linejoin="round" :points="polylinePoints" />

                <!-- C. 绘制数据点 -->
                <circle v-for="(val, i) in safeValues" :key="`dot-${i}`" :cx="getPointX(i)" :cy="getPointY(val)" r="5"
                    :fill="color" stroke="white" stroke-width="2" />
            </svg>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    data: {
        type: Object,
        required: true,
        default: () => ({ values: [] })
    },
    options: {
        type: Object,
        default: () => ({ levels: [] })
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    height: {
        type: String,
        default: '320rpx'
    }
})

// Constants for SVG coordinate system
// Note: In UniApp/Vue, we might need to use fixed numbers for viewBox calculation if we want it responsive
// or use percentages. Here we use a virtual coordinate system of 300x160 as in the React example
// and let SVG scale it.
const width = 300
const chartHeight = 160

const levels = computed(() => {
    return Array.isArray(props.options.levels) && props.options.levels.length > 0
        ? props.options.levels
        : ['Low', 'High']
})

const reversedLevels = computed(() => {
    return [...levels.value].reverse()
})

const safeValues = computed(() => {
    return Array.isArray(props.data.values) ? props.data.values : []
})

const rowHeight = computed(() => {
    return chartHeight / levels.value.length
})

const colWidth = computed(() => {
    return width / (safeValues.value.length || 1)
})

// Helper to get Y position for a row index (0 to N-1)
// In the React code: const rowIndex = (safeLevels.length - 1) - i; const y = rowIndex * rowHeight;
// Here 'i' is the index in the original levels array (0=Low, N=High)
// We want Low at bottom, High at top.
// SVG Y=0 is top.
// So High (index N-1) should be at Y=0.
// Low (index 0) should be at Y=Height-rowHeight.
const getRowY = (levelIndex) => {
    // levelIndex: 0 (Low) -> should be at bottom
    // visualRowIndex: (N-1) - 0 = N-1 (Bottom)
    const visualRowIndex = (levels.value.length - 1) - levelIndex
    return visualRowIndex * rowHeight.value
}

const getPointX = (index) => {
    return index * colWidth.value + colWidth.value / 2
}

const getPointY = (value) => {
    // value is the level index (0, 1, 2...)
    // Same logic as getRowY, plus centering in the row
    const visualRowIndex = (levels.value.length - 1) - value
    return visualRowIndex * rowHeight.value + rowHeight.value / 2
}

const polylinePoints = computed(() => {
    return safeValues.value.map((val, i) => {
        const x = getPointX(i)
        const y = getPointY(val)
        return `${x},${y}`
    }).join(' ')
})
</script>

<style lang="scss" scoped>
.state-grid-container {
    display: flex;
    width: 100%;
    // height is controlled by prop
}

.y-axis-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-right: 24rpx; // pr-3
    width: 80rpx; // w-14 approx
    flex-shrink: 0;
    text-align: right;
}

.y-label-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.y-label-text {
    font-size: 20rpx; // text-[10px]
    font-weight: 700;
    color: #94a3b8; // slate-400
}

.chart-content {
    flex: 1;
    height: 100%;
    position: relative;
}
</style>
