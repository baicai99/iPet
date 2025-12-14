<template>
    <view class="trend-hint-card" @click="handleCardClick">
        <text class="message">{{ message }}</text>
    </view>
</template>

<script setup lang="ts">
/**
 * TrendHintCard - Generic Trend Status Hint Component
 * 
 * 职责：
 * - 单一职责：仅展示一行动态文案
 * - 不承载趋势计算或状态判断逻辑
 * - 可选导航功能
 * 
 * 设计原则：
 * - 纯展示组件：具体文案由上层传入
 * - 轻量可复用：适用于任何需要提示的场景
 */

// ============================================================================
// Props
// ============================================================================

interface Props {
    /** 提示文案 */
    message: string
    /** 点击后跳转的页面路径（可选） */
    navigateTo?: string
}

const props = withDefaults(defineProps<Props>(), {
    navigateTo: ''
})

// ============================================================================
// Events
// ============================================================================

const handleCardClick = () => {
    if (props.navigateTo) {
        uni.navigateTo({
            url: props.navigateTo
        })
    }
}
</script>

<style scoped lang="scss">
.trend-hint-card {
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
