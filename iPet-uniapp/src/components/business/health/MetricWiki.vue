<template>
    <view class="section-card" v-if="metricMetadata.description || metricMetadata.recommendation">
        <view class="card-header-sm">
            <view class="header-icon-bg">
                <u-icon name="file-text-fill" size="18" color="#3b82f6"></u-icon>
            </view>
            <text class="header-title">指标百科</text>
        </view>

        <view class="encyclopedia-content">
            <!-- 定义 -->
            <view class="ency-item" v-if="metricMetadata.description">
                <view class="ency-label-row">
                    <u-icon name="info-circle" size="16" color="#94a3b8"></u-icon>
                    <text class="ency-label">什么是{{ metricMetadata.title }}？</text>
                </view>
                <text class="ency-text">{{ metricMetadata.description }}</text>
            </view>

            <!-- 正常范围 -->
            <view class="ency-item recommendation-box" v-if="metricMetadata.recommendation">
                <view class="ency-label-row">
                    <u-icon name="checkmark-circle" size="16" color="#059669"></u-icon>
                    <text class="ency-label text-green">正常参考范围</text>
                </view>
                <text class="ency-text highlight">{{ metricMetadata.recommendation }}</text>
            </view>

            <!-- 贴士 -->
            <view class="ency-item" v-if="metricMetadata.tips">
                <view class="ency-label-row">
                    <u-icon name="bulb" size="16" color="#f59e0b"></u-icon>
                    <text class="ency-label text-orange">测量贴士</text>
                </view>
                <text class="ency-text">{{ metricMetadata.tips }}</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
defineProps<{
    metricMetadata: any
}>()
</script>

<style lang="scss" scoped>
.section-card {
    width: 100%;
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 24rpx 32rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
    border: 1rpx solid #f1f5f9;
    box-sizing: border-box;
}

.card-header-sm {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.header-icon-bg {
    width: 48rpx;
    height: 48rpx;
    border-radius: 14rpx;
    background-color: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1e293b;
}

.encyclopedia-content {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.ency-item {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    &.recommendation-box {
        background-color: #f0fdf4;
        padding: 20rpx;
        border-radius: 16rpx;
        border: 1rpx solid #dcfce7;
    }
}

.ency-label-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.ency-label {
    font-size: 26rpx;
    font-weight: 500;
    color: #475569;

    &.text-green {
        color: #059669;
    }

    &.text-orange {
        color: #d97706;
    }
}

.ency-text {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.6;
    margin-left: 24rpx + 8rpx; // align with text start

    &.highlight {
        color: #15803d;
        font-weight: 500;
    }
}
</style>
