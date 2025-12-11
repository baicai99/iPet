<template>
    <view class="mini-range-slider">
        <view class="slider-track">
            <!-- Comfort Zone -->
            <view class="comfort-zone" :style="{
                left: `${toPercent(range[0])}%`,
                width: `${toPercent(range[1]) - toPercent(range[0])}%`,
                backgroundColor: color
            }"></view>

            <!-- Current Value Indicator -->
            <view class="current-indicator" :style="{
                left: `${toPercent(current)}%`,
                borderColor: color
            }"></view>
        </view>
        <view class="slider-labels">
            <text class="label-text">{{ min }}</text>
            <text class="label-text">{{ max }}</text>
        </view>
    </view>
</template>

<script setup>
const props = defineProps({
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    current: {
        type: Number,
        default: 50
    },
    range: {
        type: Array,
        default: () => [30, 70]
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const toPercent = (val) => {
    const p = ((val - props.min) / (props.max - props.min)) * 100
    return Math.min(Math.max(p, 0), 100)
}
</script>

<style scoped>
.mini-range-slider {
    width: 40%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 4rpx;
}

.slider-track {
    position: relative;
    width: 100%;
    height: 16rpx;
    background-color: #f1f5f9;
    border-radius: 999rpx;
}

.comfort-zone {
    position: absolute;
    height: 100%;
    border-radius: 999rpx;
    opacity: 0.3;
}

.current-indicator {
    position: absolute;
    width: 24rpx;
    height: 24rpx;
    background-color: #ffffff;
    border: 4rpx solid;
    border-radius: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
    transition: left 0.5s ease;
}

.slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4rpx;
}

.label-text {
    font-size: 16rpx;
    font-weight: 500;
    color: #cbd5e1;
}
</style>
