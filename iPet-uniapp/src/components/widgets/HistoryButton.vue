<template>
    <view class="action-btn" hover-class="btn-hover" @click="$emit('click')">
        <text>{{ text }}</text>
        <u-icon name="arrow-right" size="14" color="#64748b"></u-icon>
    </view>
</template>

<script setup>
defineProps({
    text: {
        type: String,
        default: '查看完整历史记录'
    }
})
defineEmits(['click'])
</script>

<style lang="scss" scoped>
.action-btn {
    width: 100%;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    font-size: 24rpx;
    font-weight: 700;
    color: #64748b;
    transition: background-color 0.2s;

    &.btn-hover {
        background-color: #f8fafc;
    }
}
</style>
