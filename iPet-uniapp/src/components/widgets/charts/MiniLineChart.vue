<template>
    <view class="mini-chart-container">
        <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="chart-svg">
            <path :d="smoothPath" fill="none" :stroke="color" stroke-width="4" stroke-linecap="round"
                stroke-linejoin="round" opacity="0.5" />
        </svg>
    </view>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeData, generatePoints, generateLinePath } from '@/utils/charts/chartCore'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const width = 100
const height = 40

const smoothPath = computed(() => {
    // 1. Normalize Data
    const data = normalizeData(props.data)
    
    // 2. Generate Points
    const points = generatePoints(data, width, height)
    
    // 3. Generate Path (Smooth)
    return generateLinePath(points, true)
})
</script>

<style scoped>
.mini-chart-container {
    width: 100%;
    height: 100%;
    min-width: 100rpx;
    min-height: 40rpx;
}

.chart-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}
</style>
