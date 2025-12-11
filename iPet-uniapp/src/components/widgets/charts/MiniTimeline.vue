<template>
    <view class="mini-timeline-container">
        <view v-for="(event, i) in visibleEvents" :key="i" class="timeline-item">
            <!-- Connector Line -->
            <view v-if="i !== visibleEvents.length - 1" class="timeline-line"></view>

            <!-- Dot -->
            <view class="timeline-dot" :style="{ backgroundColor: i === 0 ? color : '#cbd5e1' }"></view>

            <!-- Content -->
            <view class="timeline-content">
                <text class="event-title">{{ event.title }}</text>
                <text class="event-time">{{ event.time }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    events: {
        type: Array,
        default: () => []
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
})

const visibleEvents = computed(() => props.events.slice(0, 2))
</script>

<style scoped>
.mini-timeline-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: auto;
    height: 100%;
    gap: 16rpx;
    padding-left: 16rpx;
}

.timeline-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    position: relative;
}

.timeline-line {
    position: absolute;
    left: 6rpx;
    top: 16rpx;
    width: 2rpx;
    height: 100%;
    background-color: #f1f5f9;
}

.timeline-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    flex-shrink: 0;
    z-index: 1;
}

.timeline-content {
    display: flex;
    flex-direction: column;
    line-height: 1;
}

.event-title {
    font-size: 18rpx;
    font-weight: bold;
    color: #475569;
    margin-bottom: 4rpx;
}

.event-time {
    font-size: 16rpx;
    color: #94a3b8;
}
</style>
