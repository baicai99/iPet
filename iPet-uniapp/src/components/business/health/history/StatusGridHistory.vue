<template>
    <view class="status-grid-history">
        <view v-for="(item, index) in sortedData" :key="index" class="grid-item">
            <view class="date-col">
                <text class="day">{{ getDay(item.timestamp) }}</text>
                <text class="month">{{ getMonth(item.timestamp) }}</text>
            </view>
            <view class="content-col">
                <view class="status-card" :class="getStatusClass(item.value)">
                    <view class="status-info">
                        <text class="status-label">{{ item.label || '记录' }}</text>
                        <text class="status-score" v-if="item.value">分数: {{ item.value }}</text>
                    </view>
                    <!-- Mini Grid Visualization for this specific record -->
                    <view class="mini-viz">
                        <view class="grid-dot" :style="{ left: `${item.value}%` }"></view>
                    </view>
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

const getStatusClass = (value) => {
    if (value < 30) return 'danger'
    if (value > 70) return 'warning'
    return 'normal'
}
</script>

<style lang="scss" scoped>
.status-grid-history {
    padding: 20rpx 0;
}

.grid-item {
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

.status-card {
    background-color: #f8fafc;
    border-radius: 24rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    border: 1rpx solid #f1f5f9;

    &.normal {
        background-color: #f0fdf4; // green-50
        border-color: #dcfce7;

        .status-label {
            color: #15803d;
        }

        .grid-dot {
            background-color: #15803d;
        }
    }

    &.warning {
        background-color: #fff7ed; // orange-50
        border-color: #ffedd5;

        .status-label {
            color: #c2410c;
        }

        .grid-dot {
            background-color: #c2410c;
        }
    }

    &.danger {
        background-color: #fef2f2; // red-50
        border-color: #fee2e2;

        .status-label {
            color: #b91c1c;
        }

        .grid-dot {
            background-color: #b91c1c;
        }
    }
}

.status-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.status-label {
    font-size: 28rpx;
    font-weight: 700;
    color: #334155;
}

.status-score {
    font-size: 24rpx;
    color: #94a3b8;
}

.mini-viz {
    height: 12rpx;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 999rpx;
    position: relative;
    width: 100%;
}

.grid-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background-color: #64748b;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
}

.empty-state {
    text-align: center;
    padding: 60rpx;
    color: #94a3b8;
    font-size: 28rpx;
}
</style>
