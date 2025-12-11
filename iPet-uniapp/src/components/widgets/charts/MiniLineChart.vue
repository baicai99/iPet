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

const processedData = computed(() => {
    return props.data.map(d => Number(d) || 0)
})

// Helper to calculate control points for smooth path
const getControlPoint = (current, previous, next, reverse) => {
    const p = previous || current
    const n = next || current
    const smoothing = 0.2
    const o = {
        x: n.x - p.x,
        y: n.y - p.y
    }
    const angle = Math.atan2(o.y, o.x) + (reverse ? Math.PI : 0)
    const length = Math.sqrt(Math.pow(o.x, 2) + Math.pow(o.y, 2)) * smoothing
    return {
        x: current.x + Math.cos(angle) * length,
        y: current.y + Math.sin(angle) * length
    }
}

const smoothPath = computed(() => {
    const data = processedData.value
    if (!data.length) return ''

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((d, i) => {
        // [修复 1] 处理单个点时的 X 轴除零问题，单个点居中显示
        const x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2

        // [修复 2] 处理数值全相等（或只有一个点）时的 Y 轴位置，居中显示
        const normalized = max === min ? 0.5 : (d - min) / range
        const y = height - normalized * height

        return { x, y }
    })

    if (points.length === 0) return ''

    // [修复 3] 只有一个点时，利用 LineTo 原点 + round cap 绘制一个点
    if (points.length === 1) return `M${points[0].x},${points[0].y} L${points[0].x},${points[0].y}`

    const d = points.reduce((acc, point, i, a) => {
        if (i === 0) return `M${point.x},${point.y}`

        const cps = getControlPoint(a[i - 1], a[i - 2], point)
        const cpe = getControlPoint(point, a[i - 1], a[i + 1], true)

        return `${acc} C${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`
    }, '')

    return d
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
