<template>
    <view class="mini-ring-container" :style="{ width: size + 'px', height: size + 'px' }">
        <svg :width="size" :height="size" class="ring-svg">
            <circle :cx="center" :cy="center" :r="radius" stroke="#f1f5f9" :stroke-width="stroke" fill="none" />
            <circle :cx="center" :cy="center" :r="radius" :stroke="color" :stroke-width="stroke" fill="none"
                :stroke-dasharray="circumference" :stroke-dashoffset="offset" stroke-linecap="round"
                class="progress-ring" />
        </svg>
        <text class="ring-text">{{ percentage }}%</text>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    value: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    size: {
        type: Number,
        default: 36
    }
})

const stroke = 6.6
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - stroke) / 2)
const circumference = computed(() => radius.value * 2 * Math.PI)

const percentage = computed(() => {
    const p = Math.round((props.value / props.max) * 100)
    return Math.min(Math.max(p, 0), 100)
})

const offset = computed(() => {
    return circumference.value - (percentage.value / 100) * circumference.value
})
</script>

<style scoped>
.mini-ring-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(10rpx, 12rpx);
}

.ring-svg {
    transform: rotate(-90deg);
}

.progress-ring {
    transition: stroke-dashoffset 0.5s ease;
}

.ring-text {
    position: absolute;
    font-size: 18rpx;
    font-weight: bold;
    color: #64748b;
}
</style>
