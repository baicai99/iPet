<template>
    <view class="footer-row">
        <text class="footer-label">{{ label }}</text>
        <u-switch :modelValue="modelValue" @change="$emit('update:modelValue', $event)" activeColor="#F97316" size="20"></u-switch>
    </view>
</template>

<script setup>
defineProps({
    modelValue: Boolean,
    label: {
        type: String,
        default: '将此卡片置顶到首页'
    }
})
defineEmits(['update:modelValue'])
</script>

<style lang="scss" scoped>
.footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.footer-label {
    font-size: 24rpx;
    font-weight: 500;
    color: #94a3b8;
}
</style>
