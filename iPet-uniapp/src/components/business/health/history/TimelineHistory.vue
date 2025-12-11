<template>
    <view class="timeline-history">
        <view v-for="(item, index) in sortedData" :key="index" class="timeline-item">
            <view class="timeline-left">
                <view class="line" :class="{ 'first': index === 0, 'last': index === sortedData.length - 1 }"></view>
                <view class="dot" :style="{ backgroundColor: color }"></view>
            </view>
            <view class="timeline-content">
                <view class="time-header">
                    <text class="date">{{ formatDate(item.timestamp) }}</text>
                    <text class="time" v-if="item.time">{{ item.time }}</text>
                </view>
                <view class="event-card">
                    <text class="event-title">{{ item.title || '记录' }}</text>
                    <text class="event-desc" v-if="item.description">{{ item.description }}</text>
                </view>
            </view>
        </view>
        <view v-if="sortedData.length === 0" class="empty-state">
            <text>暂无记录</text>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'
import { sortRecordsByTime, parseTimestamp } from '@/utils/business/healthDataHelper'

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

const sortedData = computed(() => {
    return sortRecordsByTime(props.data, 'desc')
})

const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(parseTimestamp(timestamp))
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style lang="scss" scoped>
.timeline-history {
    padding: 20rpx 0;
}

.timeline-item {
    display: flex;
    margin-bottom: 32rpx;
    position: relative;
}

.timeline-left {
    width: 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 24rpx;
    position: relative;
}

.line {
    position: absolute;
    top: 0;
    bottom: -32rpx;
    width: 2rpx;
    background-color: #e2e8f0;
    z-index: 0;

    &.first {
        top: 24rpx;
    }

    &.last {
        bottom: auto;
        height: 24rpx;
    }
}

.dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    border: 4rpx solid #fff;
    box-shadow: 0 0 0 2rpx #e2e8f0;
    z-index: 1;
    margin-top: 10rpx;
}

.timeline-content {
    flex: 1;
}

.time-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 12rpx;
}

.date {
    font-size: 28rpx;
    font-weight: 600;
    color: #1e293b;
}

.time {
    font-size: 24rpx;
    color: #94a3b8;
}

.event-card {
    background-color: #f8fafc;
    border-radius: 16rpx;
    padding: 24rpx;
}

.event-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #334155;
    display: block;
    margin-bottom: 8rpx;
}

.event-desc {
    font-size: 24rpx;
    color: #64748b;
    line-height: 1.4;
}

.empty-state {
    text-align: center;
    padding: 60rpx;
    color: #94a3b8;
    font-size: 28rpx;
}
</style>
