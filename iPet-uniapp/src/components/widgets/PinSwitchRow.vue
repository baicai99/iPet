<template>
    <view class="footer-row">
        <text class="footer-label">{{ label }}</text>
        <u-switch v-model="internalValue" activeColor="#F97316" size="20"></u-switch>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    label: {
        type: String,
        default: '将此卡片置顶到首页'
    }
})

const emit = defineEmits(['update:modelValue'])

/**
 * ✅ FIX: Bidirectional binding for v-model
 * Replaces incorrect :modelValue/@change pattern
 */
const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})
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
