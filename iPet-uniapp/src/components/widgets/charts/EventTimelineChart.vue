<template>
    <view class="timeline-chart-container">
        <view class="timeline-list" v-if="items.length > 0">
            <view v-for="(item, i) in items" :key="i" class="timeline-item">
                <!-- Dot -->
                <view class="dot" :class="{ 'active': i === 0, 'inactive': i !== 0 }"
                    :style="i === 0 ? { backgroundColor: color, boxShadow: `0 0 0 8rpx ${color}30` } : {}"></view>

                <!-- Text -->
                <text class="item-text" :class="{ 'active-text': i === 0, 'inactive-text': i !== 0 }">
                    {{ item.time || item.title || item }}
                </text>
            </view>
        </view>
        <view v-else class="empty-state">
            <text class="empty-text">暂无记录</text>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';

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

const items = computed(() => {
    if (props.data.rawEvents && props.data.rawEvents.length > 0) {
        return props.data.rawEvents;
    }
    if (props.data.values && props.data.values.length > 0) {
        return props.data.values;
    }
    return props.data.data || [];
});

</script>

<style lang="scss" scoped>
.timeline-chart-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 32rpx; // pl-4
}

.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 32rpx; // space-y-4
}

.timeline-item {
    display: flex;
    align-items: center;
    gap: 24rpx; // gap-3

    &.opacity-50 {
        opacity: 0.5;
    }
}

.dot {
    width: 16rpx; // w-2
    height: 16rpx; // h-2
    border-radius: 50%;

    &.inactive {
        background-color: #e2e8f0; // bg-slate-200
    }
}

.item-text {
    font-size: 28rpx; // text-sm

    &.active-text {
        font-weight: 700;
        color: #1e293b; // slate-800
    }

    &.inactive-text {
        color: #94a3b8; // slate-400
    }
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
}

.empty-text {
    font-size: 24rpx;
    color: #94a3b8;
}
</style>
