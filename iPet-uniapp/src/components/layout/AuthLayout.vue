<template>
    <view class="auth-container">
        <view class="bg-decoration bg-indigo"></view>
        <view class="bg-decoration bg-orange"></view>

        <view class="content-wrapper" :class="{ 'is-mounted': mounted }">
            <view class="header-card">
                <view class="sparkline-container">
                    <HeaderSparkline :color="sparklineColor" />
                </view>

                <view class="header-content">
                    <view class="icon-box" :style="{ backgroundColor: iconBgColor }">
                        <u-icon :name="icon" size="28" :color="iconColor"></u-icon>
                    </view>
                    <text class="title">{{ title }}</text>
                    <text class="subtitle">{{ subtitle }}</text>
                </view>
            </view>

            <slot />
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeaderSparkline from '@/pages/login/components/HeaderSparkline.vue'

const props = withDefaults(defineProps<{
    title: string;
    subtitle: string;
    icon?: string;
    iconColor?: string;
    iconBgColor?: string;
    sparklineColor?: string;
}>(), {
    icon: 'pulse',
    iconColor: '#6366f1',
    iconBgColor: '#eef2ff',
    sparklineColor: '#6366f1'
})

const mounted = ref(false)

onMounted(() => {
    setTimeout(() => {
        mounted.value = true
    }, 100)
})

const { title, subtitle, icon, iconColor, iconBgColor, sparklineColor } = props
</script>

<style lang="scss" scoped>
.auth-container {
    // ✅ 小程序兼容：保持 100vh 用于居中布局
    // 注：小程序环境下 100vh 表现稳定，不会被 tabbar 遮挡
    height: 100vh;
    background-color: var(--app-background);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 32rpx;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

.bg-decoration {
    position: absolute;
    width: 600rpx;
    height: 600rpx;
    border-radius: 50%;
    filter: blur(64px);
    pointer-events: none;
    opacity: 0.2;

    &.bg-indigo {
        top: -10%;
        right: -10%;
        background-color: #c7d2fe;
    }

    &.bg-orange {
        bottom: -10%;
        left: -10%;
        background-color: #fed7aa;
    }
}

.content-wrapper {
    width: 100%;
    max-width: 800rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    transition: all 0.7s ease-out;
    opacity: 0;
    transform: translateY(64rpx);

    &.is-mounted {
        opacity: 1;
        transform: translateY(0);
    }
}

.header-card {
    background-color: var(--app-card-bg);
    border-radius: 40rpx;
    padding: 40rpx;
    box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.04);
    border: 1px solid var(--app-border-color);
    position: relative;
    overflow: hidden;
}

.sparkline-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80rpx;
    pointer-events: none;
}

.header-content {
    position: relative;
    z-index: 10;
}

.icon-box {
    width: 88rpx;
    height: 88rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.title {
    @include text-large-title;
    color: var(--app-text-primary);
    margin-bottom: 8rpx;
    display: block;
    letter-spacing: -1px;
}

.subtitle {
    @include text-subhead;
    color: var(--app-text-muted);
    display: block;
}
</style>
