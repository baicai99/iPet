<template>
    <view class="text-history">
        <view v-for="(item, index) in sortedData" :key="index" class="text-item">
            <view class="date-col">
                <text class="day">{{ getDay(item.timestamp) }}</text>
                <text class="month">{{ getMonth(item.timestamp) }}</text>
            </view>
            <view class="content-col">
                <view class="bubble">
                    <text class="text-value">{{ item.value }}</text>
                    <text class="time-tag">{{ getTime(item.timestamp) }}</text>
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
    }
})

const sortedData = computed(() => {
    return sortRecordsByTime(props.data, 'desc')
})

const getDay = (timestamp) => {
    return new Date(parseTimestamp(timestamp)).getDate()
}

const getMonth = (timestamp) => {
    return (new Date(parseTimestamp(timestamp)).getMonth() + 1) + '月'
}

const getTime = (timestamp) => {
    const d = new Date(parseTimestamp(timestamp))
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.text-history {
    padding: 20rpx 0;
}

.text-item {
    display: flex;
    margin-bottom: 24rpx;
}

.date-col {
    width: 80rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
}

.day {
    font-size: 36rpx;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
}

.month {
    font-size: 20rpx;
    color: #94a3b8;
    margin-top: 4rpx;
}

.content-col {
    flex: 1;
}

.bubble {
    background-color: #f8fafc;
    border-radius: 24rpx;
    border-top-left-radius: 4rpx;
    padding: 24rpx;
    position: relative;
}

.text-value {
    font-size: 28rpx;
    color: #334155;
    line-height: 1.5;
    display: block;
    margin-bottom: 8rpx;
}

.time-tag {
    font-size: 20rpx;
    color: #94a3b8;
    display: block;
    text-align: right;
}

.empty-state {
    text-align: center;
    padding: 60rpx;
    color: #94a3b8;
    font-size: 28rpx;
}
</style>
