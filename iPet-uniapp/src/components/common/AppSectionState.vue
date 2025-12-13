<template>
    <view class="app-section-state">
        <!-- ✅ Skeleton State -->
        <view v-if="sectionState?.shouldShowSkeleton || state === 'loading'" class="skeleton-container"
            :style="{ minHeight: skeletonHeight }">
            <slot name="skeleton">
                <!-- 默认 Skeleton（3 卡片） -->
                <view class="default-skeleton-card" v-for="i in skeletonCount" :key="i">
                    <view class="skeleton-title"></view>
                    <view class="skeleton-content"></view>
                    <view class="skeleton-value"></view>
                </view>
            </slot>
        </view>

        <!-- ✅ Data State (Ready or Showing Cache) -->
        <view v-else-if="sectionState?.shouldShowData || state === 'ready'" class="data-container">
            <slot></slot>
        </view>

        <!-- ✅ Empty State -->
        <view v-else-if="sectionState?.shouldShowEmpty || state === 'empty'" class="empty-container">
            <slot name="empty">
                <!-- 默认 Empty -->
                <view class="empty-state">
                    <u-icon v-if="emptyConfig.icon" :name="emptyConfig.icon" size="80" color="#cbd5e1"></u-icon>
                    <text class="empty-title">{{ emptyConfig.title }}</text>
                    <text v-if="emptyConfig.description" class="empty-description">{{ emptyConfig.description }}</text>
                    <u-button v-if="emptyConfig.cta" type="primary" plain shape="circle" :text="emptyConfig.cta.text"
                        @click="handleCTA"></u-button>
                </view>
            </slot>
        </view>

        <!-- ✅ Error State -->
        <view v-else-if="sectionState?.shouldShowError || state === 'error'" class="error-container">
            <slot name="error">
                <!-- 默认 Error -->
                <view class="error-state">
                    <u-icon name="alert-circle" size="80" color="#ef4444"></u-icon>
                    <text class="error-title">{{ errorTitle }}</text>
                    <text class="error-message">{{ errorMessage }}</text>
                    <u-button v-if="showRetry" type="error" plain shape="circle" text="重试"
                        @click="$emit('retry')"></u-button>
                </view>
            </slot>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getEmptyConfig, type EmptyReason } from '@/config/emptyStateConfig'
import type { useSectionState } from '@/composables/useSectionState'

// ============================================================================
// Props
// ============================================================================

export interface AppSectionStateProps {
    /** Section state instance from useSectionState() */
    sectionState?: ReturnType<typeof useSectionState>

    /** Manual state override (if not using sectionState) */
    state?: 'loading' | 'ready' | 'empty' | 'error'

    /** Empty state reason (使用预定义配置) */
    emptyReason?: EmptyReason

    /** Custom empty config (覆盖预定义配置) */
    customEmpty?: {
        icon?: string
        title?: string
        description?: string
        ctaText?: string
        ctaAction?: () => void
    }

    /** Error message */
    error?: string | Error | null

    /** Show retry button on error */
    showRetry?: boolean

    /** Skeleton height (避免 CLS) */
    skeletonHeight?: string

    /** Number of skeleton cards */
    skeletonCount?: number
}

const props = withDefaults(defineProps<AppSectionStateProps>(), {
    emptyReason: 'no-data',
    showRetry: true,
    skeletonHeight: '220rpx',  // 锁定高度避免 CLS
    skeletonCount: 3
})

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
    retry: []
    cta: []
}>()

// ============================================================================
// Computed
// ============================================================================

/** Empty state configuration */
const emptyConfig = computed(() => {
    const base = getEmptyConfig(props.emptyReason)

    // 应用自定义覆盖
    if (props.customEmpty) {
        return {
            icon: props.customEmpty.icon || base.icon,
            title: props.customEmpty.title || base.title,
            description: props.customEmpty.description || base.description,
            cta: props.customEmpty.ctaText ? {
                text: props.customEmpty.ctaText,
                action: 'function' as const,
                handler: props.customEmpty.ctaAction
            } : base.cta
        }
    }

    return base
})

/** Error title */
const errorTitle = computed(() => {
    if (props.sectionState?.error) {
        return '加载失败'
    }
    return '出错了'
})

/** Error message */
const errorMessage = computed(() => {
    const err = props.error || props.sectionState?.error
    if (!err) return '请稍后重试'

    if (typeof err === 'string') return err
    if (err instanceof Error) return err.message
    return String(err)
})

// ============================================================================
// Methods
// ============================================================================

function handleCTA() {
    const cta = emptyConfig.value.cta
    if (!cta) return

    if (cta.action === 'navigate' && cta.target) {
        uni.navigateTo({ url: cta.target })
    } else if (cta.action === 'function' && cta.handler) {
        cta.handler()
    }

    emit('cta')
}
</script>

<style lang="scss" scoped>
.app-section-state {
    width: 100%;
}

/* ============================================================================
   Skeleton Container
   ============================================================================ */

.skeleton-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.default-skeleton-card {
    background-color: white;
    border-radius: 30rpx;
    padding: 30rpx;
    height: 220rpx;
    /* 锁定高度避免 CLS */
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.skeleton-title {
    width: 120rpx;
    height: 28rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 8rpx;
}

.skeleton-content {
    flex: 1;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 12rpx;
}

.skeleton-value {
    width: 80rpx;
    height: 32rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 8rpx;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

/* ============================================================================
   Data Container
   ============================================================================ */

.data-container {
    width: 100%;
}

/* ============================================================================
   Empty State
   ============================================================================ */

.empty-container {
    width: 100%;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 80rpx 32rpx;
    background-color: white;
    border-radius: 30rpx;
}

.empty-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #64748b;
}

.empty-description {
    font-size: 26rpx;
    color: #94a3b8;
    text-align: center;
    line-height: 1.5;
}

/* ============================================================================
   Error State
   ============================================================================ */

.error-container {
    width: 100%;
}

.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 80rpx 32rpx;
    background-color: white;
    border-radius: 30rpx;
}

.error-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #ef4444;
}

.error-message {
    font-size: 26rpx;
    color: #64748b;
    text-align: center;
    line-height: 1.5;
}
</style>
