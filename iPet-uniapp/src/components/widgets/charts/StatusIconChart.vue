<template>
    <view class="status-icon-container">
        <view class="status-item">
            <text class="status-emoji">{{ currentEmoji }}</text>
            <text class="status-label">{{ currentValue }} (Current)</text>
        </view>

        <view class="divider"></view>

        <view class="status-item previous">
            <text class="status-emoji-sm">😴</text>
            <text class="status-label-sm">平静 (2h ago)</text>
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

const currentEmoji = computed(() => {
    // Try to find emoji in data, or default
    if (props.data.values && props.data.values.length > 0) {
        const last = props.data.values[props.data.values.length - 1];
        // If it's a string (emoji), return it
        if (typeof last === 'string') return last;
    }
    return props.data.data || '😸';
});

const currentValue = computed(() => {
    return props.data.value || props.data.unit || '兴奋';
});

</script>

<style lang="scss" scoped>
.status-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    gap: 64rpx; // gap-8
}

.status-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    &.previous {
        opacity: 0.5;
    }
}

.status-emoji {
    font-size: 96rpx; // text-6xl (60px) -> 120rpx, but 96rpx is safer
    margin-bottom: 16rpx; // mb-2
    line-height: 1;
}

.status-label {
    font-size: 28rpx; // text-sm
    font-weight: 700;
    color: #475569; // slate-600
}

.divider {
    height: 96rpx; // h-12
    width: 2rpx; // w-[1px]
    background-color: #f1f5f9; // slate-100
}

.status-emoji-sm {
    font-size: 72rpx; // text-4xl
    margin-bottom: 16rpx; // mb-2
    line-height: 1;
}

.status-label-sm {
    font-size: 20rpx; // text-xs
    font-weight: 700;
    color: #64748b; // slate-500
}
</style>
