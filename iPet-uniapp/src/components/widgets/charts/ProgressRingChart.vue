<template>
    <view class="ring-chart-container">
        <!-- Ring Chart -->
        <view class="chart-wrapper">
            <svg class="ring-svg" viewBox="0 0 100 100">
                <!-- Background Circle -->
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" stroke-width="8" fill="none" />

                <!-- Light Sleep Arc (Total Sleep) -->
                <circle cx="50" cy="50" r="40" stroke="#a5b4fc" stroke-width="8" fill="none"
                    :stroke-dasharray="`${((deep + light) / total) * 251} 251`" stroke-linecap="round" />

                <!-- Deep Sleep Arc -->
                <circle cx="50" cy="50" r="40" :stroke="color" stroke-width="8" fill="none"
                    :stroke-dasharray="`${(deep / total) * 251} 251`" stroke-linecap="round" />
            </svg>

            <!-- Center Text -->
            <view class="center-text">
                <text class="total-value">{{ total }}h</text>
                <text class="total-label">Total</text>
            </view>
        </view>

        <!-- Legend / Details -->
        <view class="details">
            <!-- Deep Sleep -->
            <view class="detail-row">
                <view class="dot" :style="{ backgroundColor: color }"></view>
                <view class="info">
                    <view class="info-header">
                        <text class="info-label">深度睡眠</text>
                        <text class="info-percent">({{ Math.round(deep / total * 100) || 0 }}%)</text>
                    </view>
                    <text class="info-value">{{ deep }}h</text>
                </view>
            </view>

            <!-- Light Sleep -->
            <view class="detail-row">
                <view class="dot light-bg"></view>
                <view class="info">
                    <view class="info-header">
                        <text class="info-label">浅度睡眠</text>
                        <text class="info-percent">({{ Math.round(light / total * 100) || 0 }}%)</text>
                    </view>
                    <text class="info-value">{{ light }}h</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    data: {
        type: Object,
        default: () => ({})
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
});

// Extract data or use defaults/mock if missing
// In a real app, these should come from props.data
const total = computed(() => props.data.total || props.data.value || 8.5);
const deep = computed(() => props.data.deep || 3.2);
const light = computed(() => props.data.light || 4.5);
const awake = computed(() => props.data.awake || 0.8);

</script>

<style lang="scss" scoped>
.ring-chart-container {
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: 100%;
    width: 100%;
}

.chart-wrapper {
    position: relative;
    width: 256rpx; // w-32 (128px) -> 256rpx
    height: 256rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ring-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
}

.center-text {
    position: absolute;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.total-value {
    font-size: 48rpx; // text-2xl
    font-weight: 900;
    color: #1e293b; // slate-800
    line-height: 1;
}

.total-label {
    font-size: 20rpx; // text-[10px]
    color: #94a3b8; // slate-400
    font-weight: 700;
}

.details {
    width: 100%;
    padding-left: 32rpx; // pl-4
    display: flex;
    flex-direction: column;
    gap: 24rpx; // space-y-3
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 16rpx; // gap-2
}

.dot {
    width: 16rpx; // w-2
    height: 16rpx; // h-2
    border-radius: 50%;

    &.light-bg {
        background-color: #a5b4fc; // indigo-300
    }
}

.info {
    flex: 1;
}

.info-header {
    display: flex;
    justify-content: space-between;
}

.info-label {
    font-size: 24rpx; // text-xs
    color: #94a3b8; // slate-400
}

.info-percent {
    font-size: 24rpx; // text-xs
    color: #94a3b8; // slate-400
}

.info-value {
    font-size: 28rpx; // text-sm
    font-weight: 700;
    color: #334155; // slate-700
}
</style>
