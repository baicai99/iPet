<template>
    <view class="mini-status-container">
        <view class="status-circle" :style="{ backgroundColor: bgColor }">
            <text class="status-emoji">{{ emoji }}</text>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    emoji: {
        type: String,
        default: '😐'
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

// Helper to convert hex to rgba with opacity
const hexToRgba = (hex, alpha) => {
    const sanitized = hex.replace('#', '')
    if (sanitized.length !== 6) return hex
    const r = parseInt(sanitized.slice(0, 2), 16)
    const g = parseInt(sanitized.slice(2, 4), 16)
    const b = parseInt(sanitized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const bgColor = computed(() => hexToRgba(props.color, 0.12))
</script>

<style scoped>
.mini-status-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    height: 100%;
}

.status-circle {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(10rpx, 12rpx);
}

.status-emoji {
    font-size: 40rpx;
    line-height: 1;
}
</style>
