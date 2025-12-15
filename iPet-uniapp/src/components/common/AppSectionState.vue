<template>
    <!-- ✅ P0 FIX: 固定壳 + Overlay 架构，彻底消灭 CLS -->
    <view class="app-section-state" :style="{ minHeight: shellMinHeight }">
        <!-- ✅ 数据容器：始终存在，提供稳定的高度基准 -->
        <view class="data-container" :class="{ 'data-visible': showData }">
            <slot></slot>
        </view>

        <!-- ✅ Loading Overlay: 使用 v-if 完全移除 DOM (小程序兼容) -->
        <view v-if="showLoading" class="loading-overlay">
            <u-loading-icon mode="circle" size="24" />
            <text class="loading-text">加载中...</text>
        </view>

        <!-- ✅ Empty Overlay: 使用 v-if 完全移除 DOM (小程序兼容) -->
        <view v-if="showEmpty" class="empty-overlay">
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

        <!-- ✅ Error Overlay：绝对定位盖在数据层上 -->
        <view v-if="showError" class="error-overlay">
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

    /** ✅ Section 最小高度（锁定首屏稳定性） */
    minHeight?: string
}

const props = withDefaults(defineProps<AppSectionStateProps>(), {
    emptyReason: 'no-data',
    showRetry: true,
    minHeight: '708rpx'  // ✅ 默认最小高度
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

/** ✅ Shell 最小高度 */
const shellMinHeight = computed(() => {
    return props.minHeight
})

/** Should show loading state */
const showLoading = computed(() => {
    const result = props.sectionState?.isLoading?.value || props.state === 'loading'
    return result
})

/** Should show data */
const showData = computed(() => {
    const result = props.sectionState?.shouldShowData?.value || props.state === 'ready'

    // ✅ DEBUG: 追踪 showData 变化
    if (import.meta.env.DEV) {
        console.log('[AppSectionState] showData:', {
            result,
            state: props.sectionState?.state?.value,
            shouldShowData: props.sectionState?.shouldShowData?.value,
            propsState: props.state
        })
    }

    return result
})

/** Should show empty state */
const showEmpty = computed(() => {
    const result = props.sectionState?.shouldShowEmpty?.value || props.state === 'empty'
    return result
})

/** Should show error state */
const showError = computed(() => {
    const result = props.sectionState?.shouldShowError?.value || props.state === 'error'
    return result
})

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
/* ============================================================================
   P0 FIX: 固定壳 + Overlay 架构
   ============================================================================
   核心原则：
   1. .app-section-state 是固定高度的壳（min-height 锁定）
   2. .data-container 始终存在，提供基准高度
   3. 所有状态层（loading/empty/error）都是绝对定位的 overlay
   4. 状态切换只改变 z-index/opacity，不改变布局高度
   ============================================================================ */

.app-section-state {
    width: 100%;
    position: relative;
    /* ✅ 锁定最小高度 = skeleton 高度，避免 CLS */
    /* min-height 由 props.minHeight 动态设置 */
}

/* ============================================================================
   Data Container (Always Present - Provides Stable Height)
   ============================================================================ */

.data-container {
    width: 100%;
    min-height: inherit;
    /* 继承外壳的 min-height */
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    /* 首次显示时的过渡 */

    /* ✅ 数据可见时才显示 */
    &.data-visible {
        opacity: 1;
        z-index: 1;
        /* 确保在最上层 */
        transition: none;
        /* ✅ BUG FIX: 禁用 transition,防止 Wave 2/3 触发响应式更新时闪烁 */
    }
}

/* ============================================================================
   Overlay Layers (Absolute Positioned - No Layout Impact)
   ============================================================================ */

.loading-overlay,
.empty-overlay,
.error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
    /* 盖在数据层上 */
    background-color: transparent;
    transition: opacity 0.2s ease-in-out;
}

/* ============================================================================
   Loading Overlay
   ============================================================================ */

.loading-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: inherit;
    background-color: rgba(255, 255, 255, 0.95);

    /* ✅ 小程序兼容: 使用 padding 替代 gap */
    padding: 16rpx 0;
}

.loading-text {
    font-size: 28rpx;
    color: #8e8e93;
    margin-top: 16rpx;
}


/* ============================================================================
   Empty Overlay
   ============================================================================ */

.empty-overlay {
    background-color: rgba(255, 255, 255, 0.98);
    /* 半透明背景 */
    backdrop-filter: blur(4px);
    /* 模糊背后内容 */
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 32rpx;
    background-color: white;
    border-radius: 30rpx;
    min-height: 400rpx;
    /* 确保空态有足够高度 */

    /* ✅ 小程序兼容: 使用通用标签选择器替代 > * (小程序不支持) */
    view,
    text,
    button,
    image {
        margin-bottom: 16rpx;
    }

    view:last-child,
    text:last-child,
    button:last-child,
    image:last-child {
        margin-bottom: 0;
    }
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
   Error Overlay
   ============================================================================ */

.error-overlay {
    background-color: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(4px);
}

.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 32rpx;
    background-color: white;
    border-radius: 30rpx;
    min-height: 400rpx;

    /* ✅ 小程序兼容: 使用通用标签选择器替代 > * (小程序不支持) */
    view,
    text,
    button,
    image {
        margin-bottom: 16rpx;
    }

    view:last-child,
    text:last-child,
    button:last-child,
    image:last-child {
        margin-bottom: 0;
    }
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
