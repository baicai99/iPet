<template>
    <view v-if="anomalies.length > 0" class="anomaly-alert">
        <view class="alert-header">
            <u-icon name="warning" color="#FF9500" size="20"></u-icon>
            <text class="alert-title">异常预警</text>
        </view>

        <view class="alert-list">
            <view v-for="(anomaly, index) in anomalies" :key="index" class="alert-item"
                :class="'severity-' + anomaly.severity">
                <view class="alert-icon">
                    <u-icon :name="getSeverityIcon(anomaly.severity)" :color="getSeverityColor(anomaly.severity)"
                        size="18"></u-icon>
                </view>

                <view class="alert-content">
                    <text class="alert-message">{{ anomaly.message }}</text>
                    <text v-if="anomaly.date" class="alert-date">{{ anomaly.date }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
const props = defineProps({
    anomalies: {
        type: Array,
        default: () => []
    }
})

/**
 * 获取严重程度图标
 */
function getSeverityIcon(severity) {
    const icons = {
        danger: 'close-circle',
        warning: 'alert-circle',
        info: 'information-circle'
    }
    return icons[severity] || icons.info
}

/**
 * 获取严重程度颜色
 */
function getSeverityColor(severity) {
    const colors = {
        danger: '#FF3B30',
        warning: '#FF9500',
        info: '#007AFF'
    }
    return colors[severity] || colors.info
}
</script>

<style lang="scss" scoped>
.anomaly-alert {
    background: $uni-bg-color;
    border-radius: 24rpx;
    padding: 24rpx;
    border: 2rpx solid #FF9500;
}

.alert-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
}

.alert-title {
    @include text-headline;
    font-weight: 600;
    color: #FF9500;
}

.alert-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.alert-item {
    display: flex;
    gap: 12rpx;
    padding: 16rpx;
    background: $uni-bg-color-grey;
    border-radius: 16rpx;
    border-left: 4rpx solid transparent;

    &.severity-danger {
        border-left-color: #FF3B30;
        background: rgba(#FF3B30, 0.05);
    }

    &.severity-warning {
        border-left-color: #FF9500;
        background: rgba(#FF9500, 0.05);
    }

    &.severity-info {
        border-left-color: #007AFF;
        background: rgba(#007AFF, 0.05);
    }
}

.alert-icon {
    flex-shrink: 0;
    padding-top: 2rpx;
}

.alert-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.alert-message {
    @include text-body;
    color: $uni-text-color;
    line-height: 1.5;
}

.alert-date {
    @include text-caption-1;
    color: $uni-text-color-grey;
}
</style>
