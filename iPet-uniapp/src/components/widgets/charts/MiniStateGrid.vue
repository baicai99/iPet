<template>
    <view class="mini-state-grid">
        <svg width="100%" height="100%" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none"
            style="overflow: visible;">
            <!-- Background Rows -->
            <rect v-for="(level, i) in levels" :key="`bg-${i}`" x="0" :y="getRowY(i)" :width="width"
                :height="rowHeight - 2" :fill="color" fill-opacity="0.1" rx="2" />



            <!-- Dots -->
            <circle v-for="(pt, i) in points" :key="`dot-${i}`" :cx="pt.x" :cy="pt.y" r="3.5" :fill="color"
                stroke="white" stroke-width="1.5" />
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
    options: {
        type: Object,
        default: () => ({ levels: [] })
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const width = 120
const height = 60

const levels = computed(() => {
    return Array.isArray(props.options.levels) && props.options.levels.length > 0
        ? props.options.levels
        : ['Low', 'High']
})

const rowHeight = computed(() => height / levels.value.length)

const numericData = computed(() => {
    return props.data.map(val => {
        if (typeof val === 'number') return val
        if (typeof val === 'string') {
            const index = levels.value.indexOf(val)
            return index !== -1 ? index : 0
        }
        return 0
    })
})

const getRowY = (levelIndex) => {
    // levelIndex 0 (Low) -> Bottom
    // visualRowIndex = (N-1) - levelIndex
    const visualRowIndex = (levels.value.length - 1) - levelIndex
    return visualRowIndex * rowHeight.value
}

const getPointPosition = (val, i) => {
    const count = numericData.value.length
    const colWidth = width / (count || 1)
    const x = i * colWidth + colWidth / 2

    const visualRowIndex = (levels.value.length - 1) - val
    const y = visualRowIndex * rowHeight.value + rowHeight.value / 2

    return { x, y }
}

const points = computed(() => {
    return numericData.value.map((val, i) => getPointPosition(val, i))
})


</script>

<style scoped>
.mini-state-grid {
    width: 40%;
    height: 100%;
}
</style>
