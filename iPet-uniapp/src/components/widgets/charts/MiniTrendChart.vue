<template>
    <view class="mini-trend-chart">
        <!-- #ifdef MP-WEIXIN -->
        <qiun-data-charts v-if="hasAnyPoint" type="line" :canvasId="canvasId" :chartData="uchartsData"
            :opts="uchartsOpts" :canvas2d="true" :animation="false" :optsWatch="false"
            style="width: 100%; height: 100%;" />
        <view v-else class="empty"></view>
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <svg width="100%" height="100%" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
            <!-- Gradient Definition -->
            <defs>
                <linearGradient :id="`gradient-${id}`" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="color" stop-opacity="0.2" />
                    <stop offset="100%" :stop-color="color" stop-opacity="0" />
                </linearGradient>
            </defs>

            <!-- Area Path -->
            <path :d="areaPath" :fill="`url(#gradient-${id})`" />

            <!-- Line Path -->
            <path :d="linePath" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
        </svg>
        <!-- #endif -->
    </view>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    width: {
        type: Number,
        default: 100
    },
    height: {
        type: Number,
        default: 40
    },
    color: {
        type: String,
        default: '#ff5833'
    }
})

const instance = getCurrentInstance()
const canvasId = `mini_trend_${instance?.uid ?? Math.random().toString(36).slice(2)}`
const id = Math.random().toString(36).substr(2, 9)

const hasAnyPoint = computed(() => (
    Array.isArray(props.data) && props.data.some((v) => typeof v === 'number' && Number.isFinite(v))
))

const uchartsData = computed(() => {
    const values = Array.isArray(props.data) ? props.data : []
    return {
        categories: values.map((_v, idx) => String(idx + 1)),
        series: [
            {
                name: 'Series',
                data: values,
                connectNulls: true
            }
        ]
    }
})

const uchartsOpts = computed(() => ({
    color: [props.color],
    padding: [0, 0, 0, 0],
    enableScroll: false,
    legend: { show: false },
    xAxis: { disabled: true, disableGrid: true },
    yAxis: { disabled: true, disableGrid: true },
    dataPointShape: false,
    dataLabel: false,
    extra: {
        line: { type: 'curve', width: 2, activeType: 'none' }
    }
}))

const normalizedData = computed(() => {
    if (!props.data || props.data.length === 0) return []

    const min = Math.min(...props.data)
    const max = Math.max(...props.data)
    const range = max - min || 1

    return props.data.map((val, index) => ({
        x: (index / (props.data.length - 1)) * props.width,
        y: props.height - ((val - min) / range) * (props.height * 0.8) - (props.height * 0.1) // 10% padding top/bottom
    }))
})

const linePath = computed(() => {
    if (normalizedData.value.length < 2) return ''

    return normalizedData.value.reduce((acc, point, i) => {
        return acc + `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`
    }, '')
})

const areaPath = computed(() => {
    if (normalizedData.value.length < 2) return ''

    const first = normalizedData.value[0]
    const last = normalizedData.value[normalizedData.value.length - 1]

    return `${linePath.value} L ${last.x},${props.height} L ${first.x},${props.height} Z`
})
</script>

<style scoped>
.mini-trend-chart {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty {
    width: 100%;
    height: 100%;
}
</style>
