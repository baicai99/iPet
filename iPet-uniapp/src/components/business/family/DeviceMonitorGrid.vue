<template>
    <view class="smart-grid">
        <!-- GPS -->
        <view class="smart-card gps-card" @click="handleSmartFeature('gps')">
            <view class="card-top">
                <view class="icon-box blue">
                    <u-icon name="map-fill" size="20" color="#2563eb"></u-icon>
                </view>
                <view class="status-badge">
                    <view class="status-dot"></view>
                    <text>在线</text>
                </view>
            </view>
            <view class="card-bottom">
                <text class="feature-title">GPS 项圈定位</text>
                <text class="feature-desc">旺财位于广州天河公园</text>
                <text class="feature-sub">距离您 800米</text>
            </view>
        </view>

        <!-- Activity -->
        <view class="smart-card" @click="handleSmartFeature('activity')">
            <view class="card-top">
                <view class="icon-box red">
                    <u-icon name="heart-fill" size="20" color="#dc2626"></u-icon>
                </view>
                <u-icon name="arrow-right" size="18" color="#d1d5db"></u-icon>
            </view>
            <view class="card-bottom">
                <text class="feature-title">今日运动量</text>
                <view class="activity-data">
                    <text class="activity-num">12,504</text>
                    <text class="activity-unit">步</text>
                </view>
                <text class="activity-status">↑ 达标 120% (旺财)</text>
            </view>
        </view>

        <!-- Camera -->
        <view class="smart-card small" @click="handleSmartFeature('camera')">
            <view class="card-row">
                <view class="icon-box gray">
                    <u-icon name="camera-fill" size="20" color="#4b5563"></u-icon>
                </view>
                <text class="feature-title">家中监控</text>
            </view>
            <text class="feature-desc mt-2">检测到“汤圆”正在吃猫粮</text>
        </view>

        <!-- Album -->
        <view class="smart-card small" @click="handleSmartFeature('album')">
            <view class="card-row">
                <view class="icon-box yellow">
                    <u-icon name="photo-fill" size="20" color="#ca8a04"></u-icon>
                </view>
                <text class="feature-title">AI 萌宠集锦</text>
            </view>
            <text class="feature-desc mt-2">已生成“周未公园游”视频</text>
        </view>
    </view>
</template>

<script setup>
const emit = defineEmits(['click'])

const handleSmartFeature = (feature) => {
    emit('click', feature)
}
</script>

<style lang="scss" scoped>
.smart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32rpx;
}

.smart-card {
    background: white;
    padding: 32rpx;
    border-radius: 32rpx;
    border: 2rpx solid #f3f4f6;
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.smart-card.gps-card {
    height: 320rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.icon-box {
    padding: 16rpx;
    border-radius: 16rpx;
}

.icon-box.blue {
    background: #dbeafe;
}

.icon-box.red {
    background: #fee2e2;
}

.icon-box.gray {
    background: #f3f4f6;
}

.icon-box.yellow {
    background: #fef9c3;
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: #dcfce7;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    font-size: 20rpx;
    color: #15803d;
    font-weight: 500;
}

.status-dot {
    width: 12rpx;
    height: 12rpx;
    background: #22c55e;
    border-radius: 50%;
}

.card-bottom {
    display: flex;
    flex-direction: column;
}

.feature-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #111827;
}

.feature-desc {
    font-size: 24rpx;
    color: #6b7280;
    margin-top: 8rpx;
}

.feature-sub {
    font-size: 20rpx;
    color: #3b82f6;
    margin-top: 8rpx;
}

.activity-data {
    display: flex;
    align-items: flex-end;
    gap: 8rpx;
    margin-top: 8rpx;
}

.activity-num {
    font-size: 48rpx;
    font-weight: 700;
    color: #111827;
}

.activity-unit {
    font-size: 24rpx;
    color: #6b7280;
    margin-bottom: 8rpx;
}

.activity-status {
    font-size: 24rpx;
    color: #16a34a;
    margin-top: 8rpx;
}

.smart-card.small {
    height: 256rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.card-row {
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.mt-2 {
    margin-top: 16rpx;
}
</style>
