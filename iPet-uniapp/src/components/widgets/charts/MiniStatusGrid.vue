<template>
    <view class="mini-status-grid">
        <svg width="100%" height="100%" viewBox="0 0 100 40" class="overflow-visible">
            <!-- Dynamic Background Layers based on levels -->
            <rect v-for="(level, i) in levelCount" :key="`bg-${i}`" x="0" :y="getRowY(i)" width="100"
                :height="getRowHeight(i)" :fill="getRowFill(i)" :fill-opacity="isMiddleRow(i) ? 1 : 0.1" rx="2" />

            <!-- Data Points -->
            <circle v-for="(val, i) in validData" :key="i" :cx="getX(i)" :cy="getY(val)" r="2.5" :fill="color"
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
        default: () => ({})
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const width = 100
const height = 40
const colWidth = width / 7

// Determine number of levels from options or default to 3
const levelCount = computed(() => {
    const levels = props.options?.levels
    return Array.isArray(levels) && levels.length > 0 ? levels.length : 3
})

// Check if a row is the "middle" row (highlighted differently)
const isMiddleRow = (index) => {
    const count = levelCount.value
    if (count <= 2) return false
    // For 3 levels: middle is index 1
    // For 5 levels: middle is index 2
    return index === Math.floor(count / 2)
}

// Calculate row Y position (top-down rendering)
const getRowY = (index) => {
    const count = levelCount.value
    if (count === 3) {
        // Original fixed layout: top=0, middle=10, bottom=32
        const positions = [0, 10, 32]
        return positions[index] || 0
    }
    // Dynamic layout for other level counts
    return (index * height) / count
}

// Calculate row height
const getRowHeight = (index) => {
    const count = levelCount.value
    if (count === 3) {
        // Original fixed layout: top=8, middle=20, bottom=8
        const heights = [8, 20, 8]
        return heights[index] || 8
    }
    // Dynamic layout for other level counts
    return height / count - 2
}

// Get fill color for row
const getRowFill = (index) => {
    return isMiddleRow(index) ? '#BAE6FD' : props.color
}

const validData = computed(() => {
    return props.data.filter(val => val !== null && val !== undefined).slice(0, 7)
})

const getX = (i) => {
    return i * colWidth + colWidth / 2
}

const getY = (val) => {
    return height - (val / 100) * height
}
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
