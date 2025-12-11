<template>
    <view class="range-slider-container">
        <!-- Top Labels -->
        <view class="labels">
            <text class="label-text">{{ min }}{{ data.unit || '' }}</text>
            <text class="label-text highlight" v-if="range && range.length === 2">{{ range[0] }}{{ data.unit || '' }} -
                {{ range[1]
                }}{{ data.unit || '' }}</text>
            <text class="label-text">{{ max }}{{ data.unit || '' }}</text>
        </view>

        <!-- Slider Track -->
        <view class="track">
            <!-- Comfort Zone -->
            <view v-if="range && range.length === 2" class="comfort-zone" :style="{
                left: `${toPercent(range[0])}%`,
                width: `${toPercent(range[1]) - toPercent(range[0])}%`,
                backgroundColor: color
            }"></view>

            <!-- Ticks -->
            <view class="ticks">
                <view v-for="p in [0, 25, 50, 75, 100]" :key="p" class="tick" :style="{ left: `${p}%` }"></view>
            </view>

            <!-- Current Value Indicator -->
            <view class="indicator" v-if="hasData" :style="{
                left: `${toPercent(current)}%`,
                borderColor: color
            }">
                <view class="indicator-dot" :style="{ backgroundColor: color }"></view>
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
    options: {
        type: Object,
        default: () => ({})
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
});

const min = computed(() => props.options.min || props.data.min || 0);
const max = computed(() => props.options.max || props.data.max || 100);
const current = computed(() => {
    if (props.data.values && props.data.values.length > 0) {
        return props.data.values[props.data.values.length - 1];
    }
    return props.data.current || 0;
});
const range = computed(() => props.options.range || props.data.range || [20, 80]);

const hasData = computed(() => {
    return (props.data.values && props.data.values.length > 0) ||
        (props.data.current !== undefined && props.data.current !== null);
});

const toPercent = (val) => {
    const m = min.value;
    const M = max.value;
    if (M === m) return 0;
    const p = ((val - m) / (M - m)) * 100;
    return Math.max(0, Math.min(100, p));
};
</script>

<style lang="scss" scoped>
.range-slider-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 32rpx;
    box-sizing: border-box;
}

.labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 48rpx;

    .label-text {
        font-size: 24rpx;
        color: #94a3b8; // slate-400
        font-weight: 500;
        letter-spacing: 0.05em;

        &.highlight {
            color: #64748b; // slate-500
            font-weight: 700;
        }
    }
}

.track {
    position: relative;
    width: 100%;
    height: 32rpx; // h-4 (16px) -> 32rpx
    background-color: #f1f5f9; // slate-100
    border-radius: 9999rpx;
}

.comfort-zone {
    position: absolute;
    height: 100%;
    border-radius: 9999rpx;
    opacity: 0.2;
    transition: all 0.5s;
}

.ticks {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    padding: 0 2rpx; // px-[1px]
    pointer-events: none;

    .tick {
        height: 100%;
        width: 2rpx; // 1px
        background-color: rgba(255, 255, 255, 0.5);
    }
}

.indicator {
    position: absolute;
    height: 64rpx; // h-8 (32px) -> 64rpx
    width: 64rpx;
    background-color: #fff;
    border: 8rpx solid; // border-4
    border-radius: 50%;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); // shadow-md
    top: -16rpx; // -top-2 (-8px) -> -16rpx
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.5s;

    .indicator-dot {
        width: 16rpx; // w-2
        height: 16rpx; // h-2
        border-radius: 50%;
    }
}
</style>
