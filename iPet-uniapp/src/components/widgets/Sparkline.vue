<template>
    <view class="sparkline" :style="containerSize">
        <svg v-if="points.length" :viewBox="`0 0 ${width} ${height}`" width="100%" height="100%"
            preserveAspectRatio="none">
            <defs>
                <linearGradient :id="areaId" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="strokeColor" :stop-opacity="0.3" />
                    <stop offset="100%" :stop-color="strokeColor" :stop-opacity="0" />
                </linearGradient>
            </defs>
            <path v-if="showArea" class="sparkline-area" :d="areaPath" :fill="`url(#${areaId})`"></path>
            <polyline class="sparkline-line" :points="points" :stroke="strokeColor" fill="none"
                stroke-linecap="round"></polyline>
        </svg>
        <view v-else class="sparkline-empty"></view>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    width: {
        type: Number,
        default: 120
    },
    height: {
        type: Number,
        default: 60
    },
    stroke: {
        type: String,
        default: 'var(--uni-color-primary, #2563EB)'
    },
    showArea: {
        type: Boolean,
        default: true
    }
})

const areaId = `sparkline-area-${Math.random().toString(36).slice(2)}`

const containerSize = computed(() => ({
    width: `${props.width}rpx`,
    height: `${props.height}rpx`
}))

const parsedValues = computed(() => {
    const values = (props.data || [])
        .map((point) => {
            if (typeof point === 'number') return point
            if (point && typeof point === 'object' && point.value !== undefined) {
                const value = Number(point.value)
                return Number.isNaN(value) ? null : value
            }
            return null
        })
        .filter((val) => typeof val === 'number')
    return values.slice(-20)
})

const bounds = computed(() => {
    const values = parsedValues.value
    if (!values.length) return { min: 0, max: 0 }
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (min === max) {
        return { min: min - 1, max: max + 1 }
    }
    return { min, max }
})

const points = computed(() => {
    const values = parsedValues.value
    if (!values.length) return ''

    const { min, max } = bounds.value
    const range = max - min || 1
    const count = values.length - 1
    return values
        .map((value, index) => {
            const x = count > 0 ? (index / count) * props.width : props.width / 2
            const normalized = (value - min) / range
            const y = props.height - normalized * props.height
            return `${x},${y}`
        })
        .join(' ')
})

const areaPath = computed(() => {
    if (!points.value) return ''
    return `M${points.value} L ${props.width} ${props.height} L 0 ${props.height} Z`
})

const strokeColor = computed(() => props.stroke)
</script>

<style lang="scss" scoped>
.sparkline {
    width: 120rpx;
    height: 60rpx;
    border-radius: 16rpx;
    background: transparent;
}

svg {
    width: 100%;
    height: 100%;
}

.sparkline-line {
    stroke-width: 2;
}

.sparkline-empty {
    width: 100%;
    height: 100%;
    border-radius: 16rpx;
    background: $uni-bg-color-grey;
}
</style>
