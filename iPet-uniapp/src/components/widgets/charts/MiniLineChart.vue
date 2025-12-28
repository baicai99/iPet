<template>
    <view class="mini-chart-container" :style="containerStyle">
        <!-- #ifdef MP-WEIXIN -->
        <qiun-data-charts v-if="hasAnyPoint" type="line" :canvasId="canvasId" :chartData="uchartsData"
            :opts="uchartsOpts" :canvas2d="true" :animation="false" :optsWatch="false"
            style="width: 100%; height: 100%;" />
        <view v-else class="empty"></view>
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="chart-svg">
            <path :d="smoothPath" fill="none" :stroke="color" stroke-width="4" stroke-linecap="round"
                stroke-linejoin="round" opacity="0.5" />
        </svg>
        <!-- #endif -->
    </view>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import { normalizeData, generatePoints, generateLinePath } from '@/utils/charts/chartCore'

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

const width = 100
const height = 40

const instance = getCurrentInstance()
const canvasId = `mini_line_${instance?.uid ?? Math.random().toString(36).slice(2)}`

const normalizedData = computed(() => normalizeData(props.data))
const hasAnyPoint = computed(() => normalizedData.value.some((v) => typeof v === 'number' && Number.isFinite(v)))

const uchartsData = computed(() => {
    const values = normalizedData.value
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
    padding: [2, 2, 2, 2],
    enableScroll: false,
    legend: { show: false },
    xAxis: { disabled: true, disableGrid: true, axisLine: false, fontSize: 0 },
    yAxis: { disabled: true, disableGrid: true, axisLine: false, fontSize: 0 },
    dataPointShape: false,
    dataLabel: false,
    extra: {
        line: { type: 'curve', width: 2, activeType: 'none' }
    }
}))

const smoothPath = computed(() => {
    // 1. Normalize Data
    const data = normalizedData.value
    
    // 2. Generate Points
    const points = generatePoints(data, width, height, { top: 2, bottom: 2, left: 2, right: 2 })
    
    // 3. Generate Path (Smooth)
    return generateLinePath(points, true)
})

const containerStyle = computed(() => ({
    width: props.width,
    height: props.height
}))

</script>

<style scoped>
.mini-chart-container {
    width: 100%;
    height: 100%;
    min-width: 100rpx;
    min-height: 40rpx;
}

.empty {
    width: 100%;
    height: 100%;
}

.chart-svg {
    width: 100%;
    height: 100%;
}
</style>
