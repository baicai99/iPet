<template>
    <view class="trend-status-card" @click="handleCardClick">
        <view class="icon-wrapper" :style="{ backgroundColor: iconBgColor }">
            <u-icon :name="icon" :color="iconColor" :size="iconSize" />
        </view>
        <text class="title">{{ title }}</text>
        <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
    </view>
</template>

<script setup lang="ts">
/**
 * TrendStatusCard - Trend Status Display Card Component
 * 
 * 职责：
 * - 显示特殊状态提示（如"所有指标平稳"）
 * - 带图标、标题、副标题的卡片样式
 * - 可选点击导航功能
 * 
 * 设计原则：
 * - 纯展示组件：具体文案和样式由上层传入
 * - 轻量可复用：适用于各种状态展示场景
 */

// ============================================================================
// Props
// ============================================================================

interface Props {
    /** 图标名称 (u-icon name) */
    icon: string
    /** 图标颜色 */
    iconColor?: string
    /** 图标背景色 */
    iconBgColor?: string
    /** 图标尺寸 */
    iconSize?: string | number
    /** 主标题 */
    title: string
    /** 副标题（可选） */
    subtitle?: string
    /** 点击后跳转的页面路径（可选） */
    navigateTo?: string
}

const props = withDefaults(defineProps<Props>(), {
    iconColor: '#10b981',
    iconBgColor: '#d1fae5',
    iconSize: 32,
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
.trend-status-card {
    background-color: #ffffff;
    border-radius: 48rpx;
    padding: 48rpx 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
        opacity: 0.95;
    }
}

.icon-wrapper {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8rpx;
}

.title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    line-height: 1.4;
}

.subtitle {
    font-size: 28rpx;
    font-weight: 400;
    color: #64748b;
    text-align: center;
    line-height: 1.4;
}
</style>
