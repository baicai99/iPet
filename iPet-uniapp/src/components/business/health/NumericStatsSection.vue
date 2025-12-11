<template>
    <view class="stats-grid-wrapper">
        <view class="stats-grid">
            <view class="grid-item">
                <text class="grid-label">{{ labels.AVG }}</text>
                <text class="grid-value">{{ currentData.avg }}</text>
            </view>
            <view class="grid-item">
                <text class="grid-label">{{ labels.MAX }}</text>
                <text class="grid-value">{{ currentData.max }}</text>
            </view>
            <view class="grid-item">
                <text class="grid-label">{{ labels.MIN }}</text>
                <text class="grid-value">{{ currentData.min }}</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { useMetricDetailContext } from '@/composables/useMetricDetail'
import { STRINGS } from '@/locale/zh-Hans'

const { currentData } = useMetricDetailContext()

const labels = STRINGS.METRICS.DETAIL.GRID_LABELS
</script>

<style lang="scss" scoped>
.stats-grid-wrapper {
    margin-bottom: 24rpx;
}

.stats-grid {
    display: flex;
    gap: 16rpx;
}

.grid-item {
    flex: 1;
    background: #f8fafc;
    border-radius: 16rpx;
    padding: 20rpx;
    text-align: center;
}

.grid-label {
    display: block;
    font-size: 24rpx;
    color: #94a3b8;
    margin-bottom: 8rpx;
}

.grid-value {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
}
</style>
