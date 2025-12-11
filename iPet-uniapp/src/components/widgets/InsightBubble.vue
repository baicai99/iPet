<template>
    <view class="insight-bubble">
        <u-icon name="info-circle-fill" color="#fb923c" size="18" class="insight-icon"></u-icon>
        <text class="insight-text">
            <slot></slot>
        </text>
    </view>
</template>

<style lang="scss" scoped>
.insight-bubble {
    background: linear-gradient(to right, #fff7ed, #fff);
    border: 1rpx solid #ffedd5;
    padding: 24rpx;
    border-radius: 24rpx;
    display: flex;
    gap: 24rpx;
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;
}

.insight-icon {
    margin-top: 4rpx;
}

.insight-text {
    font-size: 24rpx;
    color: #475569;
    line-height: 1.6;
    font-weight: 500;
    flex: 1;
}
</style>
