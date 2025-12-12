<template>
    <view class="mini-status-grid">
        <svg width="100%" height="100%" viewBox="0 0 100 40" class="overflow-visible">
            <!-- 3-Zone Background Layers -->
            <rect v-for="(zone, i) in 3" :key="`bg-${i}`" x="0" :y="getZoneY(i)" width="100" :height="getZoneHeight(i)"
                :fill="getZoneFill(i)" :fill-opacity="i === 1 ? 1 : 0.1" rx="2" />

            <!-- Data Points - unified blue color for mini charts -->
            <circle v-for="(point, i) in chartPoints" :key="`pt-${i}`" :cx="point.x" :cy="point.y" r="2.5"
                :fill="pointColor" stroke="white" stroke-width="1.5" />
        </svg>
    </view>
</template>

<script setup>
import { computed } from 'vue'
import { processChartPoints, SEGMENT_COUNTS, STATUS_COLORS } from '@/utils/charts/statusGridUtils'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    options: {
        type: Object,
        default: () => ({})
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const width = 100
const height = 40

// 固定使用 7 天（周视图）的网格分段
const segments = SEGMENT_COUNTS.week

// 统一使用蓝色（不同指标的"正常"定义不同，迷你图不区分状态颜色）
const pointColor = STATUS_COLORS.normal

// 3-zone layout (proportionally scaled from main chart)
const zoneHeights = [10, 20, 10] // dry, normal, wet
const zonePositions = [0, 10, 30]

const getZoneY = (index) => zonePositions[index]
const getZoneHeight = (index) => zoneHeights[index]
const getZoneFill = (index) => index === 1 ? STATUS_COLORS.zone : props.color

// Process data points using shared utility
const chartPoints = computed(() => {
    let dataArray = []

    if (Array.isArray(props.data) && props.data.length > 0) {
        dataArray = props.data
    } else if (props.data?.values && props.data.values.length > 0) {
        dataArray = props.data.values
    }

    // 使用网格吸附（非时间戳定位），timeRange 固定为 week
    return processChartPoints(dataArray, width, height, segments, false, 'week')
})
</script>

<style scoped>
.mini-status-grid {
    width: 37.5%;
    height: 100%;
    margin-left: auto;
}

.overflow-visible {
    overflow: visible;
}
</style>
