<template>
    <!-- ✅ 使用 Section 结构，与 Summary View 保持一致 -->
    <view class="wiki-section" v-if="metricMetadata.description || metricMetadata.recommendation">
        <view class="section-header">
            <text class="section-title">指标百科</text>
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
                    <u-icon name="info-circle" size="16" color="#f59e0b"></u-icon>
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
.wiki-section {
    /* ✅ Section 结构：无卡片外观 */
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-header {
    margin-bottom: 8rpx;
}

.section-title {
    font-size: 32rpx;
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
    /* ✅ 每个 item 独立卡片样式 */
    background-color: #ffffff;
    padding: 24rpx;
    border-radius: 20rpx;

    &.recommendation-box {
        /* 正常参考范围：绿色主题 */
        background-color: #f0fdf4;
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

    &.highlight {
        color: #15803d;
        font-weight: 500;
    }
}
</style>
