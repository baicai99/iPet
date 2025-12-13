<template>
    <view class="trend-no-change-card" @click="handleCardClick">
        <text class="message">所有指标趋于稳定</text>
    </view>
</template>

<script setup lang="ts">
// ============================================================================
// Events
// ============================================================================

const handleCardClick = () => {
    // Navigate to trends page for more details
    uni.navigateTo({
        url: '/pages/trends/trends'
    })
}
</script>

<style scoped lang="scss">
.trend-no-change-card {
    background-color: #ffffff;
    border-radius: 48rpx;
    padding: 64rpx 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240rpx;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
        opacity: 0.95;
    }
}

.message {
    font-size: 32rpx;
    font-weight: 500;
    color: #64748b;
    text-align: center;
}
</style>
