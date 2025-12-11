<template>
    <view class="form-page-layout">
        <!-- Header Slot (e.g. Navigation Bar, Steps) -->
        <view v-if="$slots.header" class="layout-header">
            <slot name="header"></slot>
        </view>

        <!-- Main Content -->
        <view class="layout-content" :style="{ paddingBottom: footerPaddingBottom }">
            <slot></slot>
        </view>

        <!-- Fixed Footer -->
        <view v-if="$slots.footer" class="layout-footer">
            <slot name="footer"></slot>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    /**
     * Extra padding bottom to account for footer height.
     * Default includes safe area + roughly 120rpx for standard buttons
     */
    footerHeight?: string | number;
}>();

const footerPaddingBottom = computed(() => {
    // Default footer height estimate (padding + button)
    const base = props.footerHeight ? props.footerHeight : '148rpx';
    // Add extra 32rpx spacing so content doesn't touch the footer
    return `calc(${base} + 32rpx + env(safe-area-inset-bottom))`;
});
</script>

<style lang="scss" scoped>
.form-page-layout {
    min-height: 100vh;
    background-color: #f2f2f6;
    display: flex;
    flex-direction: column;
}

.layout-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #fff;
}

.layout-content {
    flex: 1;
    padding: 32rpx;
    /* Default padding for all form pages */
    box-sizing: border-box;
}

.layout-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #fff;
    padding: 24rpx 32rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    border-top: 1rpx solid #f3f4f6;
    z-index: 90;
}
</style>
