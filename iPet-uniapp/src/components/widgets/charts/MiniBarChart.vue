<template>
    <view class="mini-bar-chart">
        <view v-for="(d, i) in normalizedData" :key="i" class="bar" :style="{
            height: `${d.percent}%`,
            backgroundColor: color,
            opacity: i === normalizedData.length - 1 ? 1 : 0.4
        }"></view>
    </view>
</template>

<script setup>
import { computed } from 'vue'

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

const normalizedData = computed(() => {
    // 1. Clean data
    let data = (props.data || []).map(d => Number(d))

    // 2. Pad to exactly 7 items
    const targetLength = 7
    while (data.length < targetLength) {
        data.unshift(0)
    }
    if (data.length > targetLength) {
        data = data.slice(-targetLength)
    }

    // 3. Calculate percentages
    const validNums = data.filter(d => !isNaN(d))
    const max = Math.max(...validNums) || 1

    return data.map(d => {
        const val = isNaN(d) ? 0 : d
        return {
            value: val,
            percent: (val / max) * 100
        }
    })
})
</script>

<style scoped>
.mini-bar-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 100%;
    width: 100%;
    gap: 2rpx;
}

.bar {
    flex: 1;
    border-radius: 2rpx;
    min-width: 4rpx;
    transition: height 0.3s ease;
}
</style>
