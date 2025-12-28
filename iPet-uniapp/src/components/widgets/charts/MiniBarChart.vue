<template>
    <view class="mini-bar-chart" :style="containerStyle">
        <view v-for="(d, i) in normalizedData" :key="i" class="bar" :style="{
            height: `${d.percent}%`,
            backgroundColor: color,
            opacity: i === normalizedData.length - 1 ? 1 : 0.4
        }"></view>
    </view>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeData } from '@/utils/charts/chartCore'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    width: {
        type: String,
        default: '200rpx'
    },
    height: {
        type: String,
        default: '80rpx'
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const normalizedData = computed(() => {
    // 1. Normalize Data (pad to 7 items)
    const data = normalizeData(props.data, { targetLength: 7, padDirection: 'start' })

    // 2. Calculate percentages
    const max = Math.max(...data) || 1

    return data.map(d => ({
        value: d,
        percent: (d / max) * 100
    }))
})

const containerStyle = computed(() => ({
    width: props.width,
    height: props.height
}))
</script>

<style scoped>
.mini-bar-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 100%;
    width: 100%;
    gap: 2rpx;
    min-width: 100rpx;
    min-height: 40rpx;
}

.bar {
    flex: 1 0 8rpx;
    border-radius: 2rpx;
    min-width: 8rpx;
    transition: height 0.3s ease;
}
</style>
