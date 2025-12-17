<template>
    <view class="auth-container">
        <view class="bg-decoration bg-indigo"></view>
        <view class="bg-decoration bg-orange"></view>

        <view class="content-wrapper" :class="{ 'is-mounted': mounted }">
            <view class="header-content">
                <view class="icon-box" :style="{ backgroundColor: iconBgColor }">
                    <u-icon :name="icon" size="28" :color="iconColor"></u-icon>
                </view>
                <text class="title">{{ title }}</text>
                <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
            </view>

            <slot />
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
    title: string;
    subtitle: string;
    icon?: string;
    iconColor?: string;
    iconBgColor?: string;
}>(), {
    icon: 'pulse',
    iconColor: '#6366f1',
    iconBgColor: '#eef2ff'
})

const mounted = ref(false)

onMounted(() => {
    // ✅ 小程序优化：缩短延迟
    setTimeout(() => {
        mounted.value = true
    }, 50)
})

const { title, subtitle, icon, iconColor, iconBgColor } = props
</script>

<style lang="scss" scoped>
.auth-container {
    min-height: 100vh;
    padding-top: constant(safe-area-inset-top);
    padding-top: env(safe-area-inset-top);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
    
    // ✅ 渐变背景：indigo-50 -> white -> cyan-50
    background: linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #ecfeff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 32rpx;
    padding-right: 32rpx;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

.bg-decoration {
    position: absolute;
    width: 600rpx;
    height: 600rpx;
    border-radius: 50%;
    background: radial-gradient(circle, currentColor 0%, transparent 70%);
    pointer-events: none;
    opacity: 0.3;

    &.bg-indigo {
        top: -15%;
        right: -15%;
        color: #c7d2fe;
    }

    &.bg-orange {
        bottom: -15%;
        left: -15%;
        color: #a5f3fc;
    }
}

.content-wrapper {
    width: 100%;
    max-width: 800rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    transition: opacity 0.4s ease-out, margin-top 0.4s ease-out;
    opacity: 1;
    margin-top: 64rpx;

    &.is-mounted {
        margin-top: 0;
    }
}

.header-content {
    text-align: center;
    margin-bottom: 16rpx;
}

.icon-box {
    width: 96rpx;
    height: 96rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24rpx;
    box-shadow: 0 8rpx 16rpx rgba(99, 102, 241, 0.2);
}

.title {
    font-size: 48rpx;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 16rpx;
    display: block;
    letter-spacing: 0;
}

.subtitle {
    font-size: 28rpx;
    color: #64748b;
    display: block;
    line-height: 1.5;
}
</style>
