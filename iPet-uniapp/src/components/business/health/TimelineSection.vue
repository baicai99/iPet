<template>
    <view class="timeline-card">
        <!-- 顶部: 标题 & 计数 -->
        <view class="card-header">
            <view class="header-left">
                <view class="icon-box" :style="{ backgroundColor: theme.bg }">
                    <u-icon :name="iconName" :color="theme.hex" size="20"></u-icon>
                </view>
                <view class="header-text">
                    <text class="title">{{ metricMetadata.title }}</text>
                    <text class="subtitle">{{ strings.TIMELINE_SUBTITLE }}</text>
                </view>
            </view>
            <!-- 总记录数 -->
            <view class="main-stats">
                <view class="stats-row">
                    <text class="value">{{ currentData.rawEvents?.length || 0 }}</text>
                    <text class="unit">{{ strings.TIMELINE_UNIT }}</text>
                </view>
            </view>
        </view>

        <!-- 时间轴列表 -->
        <view class="timeline-list">
            <view v-for="(item, index) in currentData.rawEvents" :key="index" class="timeline-item">
                <view class="timeline-dot" :style="{ backgroundColor: index === 0 ? theme.hex : '#e2e8f0' }">
                </view>
                <view class="timeline-content">
                    <text class="timeline-title" :class="{ 'active': index === 0 }">{{ item.title || item.value ||
                        item }}</text>
                    <text class="timeline-time">{{ item.time || item.date || 'Unknown Date' }}</text>
                </view>
            </view>
            <!-- 空状态 -->
            <view v-if="!currentData.rawEvents?.length" class="empty-state">
                <text class="empty-text">{{ strings.NO_RECORDS }}</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMetricDetailContext } from '@/composables/useMetricDetail'
import { STRINGS } from '@/locale/zh-Hans'

const {
    theme,
    metricMetadata,
    currentData
} = useMetricDetailContext()

const strings = STRINGS.METRICS.DETAIL

const iconName = computed(() => {
    const title = metricMetadata.value.title || ''
    if (title.includes('体重')) return 'grid'
    if (title.includes('体温')) return 'heart'
    if (title.includes('睡眠')) return 'moon'
    if (title.includes('饭')) return 'bag'
    return 'grid'
})
</script>

<style lang="scss" scoped>
.timeline-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32rpx;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.icon-box {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-text {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
}

.subtitle {
    font-size: 24rpx;
    color: #94a3b8;
}

.main-stats {
    text-align: right;
}

.stats-row {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
}

.value {
    font-size: 48rpx;
    font-weight: 700;
    color: #1e293b;
}

.unit {
    font-size: 24rpx;
    color: #94a3b8;
}

.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
}

.timeline-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    margin-top: 8rpx;
    flex-shrink: 0;
}

.timeline-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.timeline-title {
    font-size: 28rpx;
    color: #64748b;

    &.active {
        color: #1e293b;
        font-weight: 500;
    }
}

.timeline-time {
    font-size: 24rpx;
    color: #94a3b8;
}

.empty-state {
    padding: 48rpx 0;
    text-align: center;
}

.empty-text {
    font-size: 28rpx;
    color: #94a3b8;
}
</style>
