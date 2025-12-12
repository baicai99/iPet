<template>
    <view class="bar-chart-container">
        <view class="bars-wrapper">
            <view v-for="(d, i) in values" :key="i" class="bar-column" @click="activeIndex = i">
                <!-- Tooltip -->
                <view class="tooltip" :class="{ 'visible': activeIndex === i }">
                    {{ d }}{{ unit }}
                </view>

                <!-- Bar -->
                <view class="bar" :style="{
                    height: `${(d / max) * 100}%`,
                    backgroundColor: color,
                    minHeight: Number(d) > 0 ? '8rpx' : '0'
                }" :class="{ 'active': activeIndex === i }"></view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { normalizeData } from '@/utils/charts/chartCore';

const props = defineProps({
    data: {
        type: Object,
        default: () => ({ values: [] })
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
});

const activeIndex = ref(-1);

const values = computed(() => {
    // Standardize data padding to 7 days
    return normalizeData(props.data.values, { 
        targetLength: 7, 
        padDirection: 'start' 
    });
});

const unit = computed(() => props.data.unit || '');
const max = computed(() => {
    if (values.value.length === 0) return 1;
    return Math.max(...values.value) || 1;
});
</script>

<style lang="scss" scoped>
.bar-chart-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.bars-wrapper {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 100%;
    width: 100%;
    gap: 8rpx; // gap-2
}

.bar-column {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    position: relative;
}

.tooltip {
    position: absolute;
    top: -64rpx; // -top-8
    background-color: #1e293b; // slate-800
    color: #fff;
    font-size: 20rpx; // text-[10px]
    padding: 4rpx 8rpx; // py-1 px-2
    border-radius: 8rpx;
    opacity: 0;
    transition: opacity 0.2s;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;

    &.visible {
        opacity: 1;
    }
}

.bar {
    width: 100%;
    border-top-left-radius: 4rpx; // rounded-t-sm
    border-top-right-radius: 4rpx;
    opacity: 0.8;
    transition: opacity 0.2s;
    min-height: 8rpx; // min-h-[4px]

    &.active {
        opacity: 1;
    }
}
</style>
