<template>
    <view class="mini-status-grid">
        <svg width="100%" height="100%" viewBox="0 0 100 40" class="overflow-visible">
            <!-- Background Layers -->
            <!-- Top (Dry) -->
            <rect x="0" y="0" width="100" height="8" :fill="color" fill-opacity="0.1" rx="2" />

            <!-- Middle (Normal) -->
            <rect x="0" y="10" width="100" height="20" fill="#BAE6FD" rx="2" />

            <!-- Bottom (Wet) -->
            <rect x="0" y="32" width="100" height="8" :fill="color" fill-opacity="0.1" rx="2" />

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
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const width = 100
const height = 40
const colWidth = width / 7

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
