<template>
    <view class="cloud-card">
        <view class="card-content">
            <view class="card-header">
                <view>
                    <view class="title-row">
                        <text class="card-title">{{ title }}</text>
                        <u-icon name="gift-fill" color="rgba(255,255,255,0.3)" size="24"></u-icon>
                    </view>
                    <text class="card-subtitle">{{ subtitle }}</text>
                </view>
                <view v-if="isSvip" class="svip-badge">
                    <text class="svip-text">SVIP</text>
                </view>
            </view>

            <!-- Storage Bar -->
            <view class="storage-section">
                <view class="storage-info">
                    <text>{{ storageUsed }}</text>
                    <text>{{ storageLeft }}</text>
                </view>
                <view class="progress-bar">
                    <view v-for="(item, index) in usageStats" :key="index" class="progress-segment" :class="item.type"
                        :style="{ width: item.width }"></view>
                </view>
                <view class="legend-row">
                    <view class="legend-item">
                        <view class="dot photo"></view>
                        <text>照片</text>
                    </view>
                    <view class="legend-item">
                        <view class="dot video"></view>
                        <text>视频</text>
                    </view>
                    <view class="legend-item">
                        <view class="dot medical"></view>
                        <text>病历本</text>
                    </view>
                </view>
            </view>
        </view>
        <!-- Background Decoration -->
        <u-icon name="github-circle-fill" class="bg-decoration" color="rgba(255,255,255,0.1)" size="120"></u-icon>
    </view>
</template>

<script setup>
defineProps({
    title: { type: String, default: '萌宠家庭共享' },
    subtitle: { type: String, default: '记录毛孩子的每一个可爱瞬间' },
    isSvip: { type: Boolean, default: true },
    storageUsed: { type: String, default: '已存储 32,400 张照片' },
    storageLeft: { type: String, default: '剩余 1 TB' },
    usageStats: {
        type: Array,
        default: () => [
            { type: 'photo', width: '50%' },
            { type: 'video', width: '15%' },
            { type: 'medical', width: '5%' }
        ]
    }
})
</script>

<style lang="scss" scoped>
.cloud-card {
    background: linear-gradient(135deg, #fb923c, #ef4444);
    border-radius: 32rpx;
    padding: 48rpx;
    color: white;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20rpx 30rpx -6rpx rgba(249, 115, 22, 0.3);
}

.bg-decoration {
    position: absolute;
    bottom: -48rpx;
    right: -48rpx;
    transform: rotate(-12deg);
    opacity: 0.1;
}

.card-content {
    position: relative;
    z-index: 10;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 48rpx;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.card-title {
    font-size: 48rpx;
    font-weight: 700;
}

.card-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-top: 8rpx;
    display: block;
}

.svip-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 8rpx 24rpx;
    border-radius: 9999rpx;
    backdrop-filter: blur(8rpx);
}

.svip-text {
    font-size: 24rpx;
    font-weight: 500;
}

.storage-info {
    display: flex;
    justify-content: space-between;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 16rpx;
}

.progress-bar {
    height: 24rpx;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 9999rpx;
    overflow: hidden;
    display: flex;
    width: 100%;
}

.progress-segment {
    height: 100%;
}

.progress-segment.photo {
    background: #f97316;
}

.progress-segment.video {
    background: #3b82f6;
}

.progress-segment.medical {
    background: #22c55e;
}

.legend-row {
    display: flex;
    gap: 32rpx;
    margin-top: 16rpx;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.8);
}

.dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
}

.dot.photo {
    background: #f97316;
}

.dot.video {
    background: #3b82f6;
}

.dot.medical {
    background: #22c55e;
}
</style>
