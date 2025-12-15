<template>
    <!-- Only render when has enough data -->
    <view v-if="hasEnoughData" class="trend-card" @click="handleCardClick">
        <!-- Header -->
        <view class="header">
            <view class="header-left">
                <view class="icon-wrapper" :style="{ backgroundColor: themeBg, color: colors.primary }">
                    <svg class="icon" aria-hidden="true" style="font-size: 18px">
                        <use :xlink:href="'#' + icon"></use>
                    </svg>
                </view>
                <text class="title">{{ title }}</text>
            </view>
            <view class="header-right">
                <u-icon name="arrow-right" size="18" :color="colors.textMuted"></u-icon>
            </view>
        </view>

        <!-- Main Title (Smart Copywriting) -->
        <text class="main-title">{{ copywriting }}</text>

        <!-- Chart Area -->
        <view class="chart-container">
            <!-- Bars Container -->
            <view class="bars-wrapper">
                <!-- Left Side (Previous Period) -->
                <view class="bars-section bars-left" :style="{ width: leftSectionWidth }">
                    <view v-for="(val, index) in previousValues" :key="'left-' + index" class="bar-slot"
                        :style="{ width: leftSlotWidth }">
                        <view class="bar" :style="{ height: getBarHeight(val) }"></view>
                    </view>
                </view>

                <!-- Right Side (Recent Period) -->
                <view class="bars-section bars-right" :style="{ width: rightSectionWidth }">
                    <view v-for="(val, index) in recentValues" :key="'right-' + index" class="bar-slot"
                        :style="{ width: rightSlotWidth }">
                        <view class="bar bar-highlight" :style="{ height: getBarHeight(val) }"></view>
                    </view>
                </view>
            </view>

            <!-- Average Lines Overlay -->
            <view class="lines-overlay">
                <!-- Stable Mode: Single full-width orange line -->
                <template v-if="isStable">
                    <view class="avg-line avg-line-full" :style="{ top: overallLineTop, borderColor: colors.primary }">
                        <text class="avg-label avg-label-center" :style="{ color: colors.primary }">
                            {{ formatNumber(overallAvg) }} <text class="avg-unit" :style="{ color: colors.primary }">{{
                                unit }}</text>
                        </text>
                    </view>
                </template>

                <!-- Normal Mode: Two separate lines -->
                <template v-else>
                    <!-- Left Average Line -->
                    <view class="avg-line avg-line-left" :style="{
                        top: previousLineTop,
                        width: `calc(${leftSectionWidth} - 4rpx)`
                    }">
                        <text class="avg-label avg-label-left">
                            {{ formatNumber(previousAvg) }} <text class="avg-unit">{{ unit }}</text>
                        </text>
                    </view>

                    <!-- Right Average Line -->
                    <view class="avg-line avg-line-right" :style="{
                        top: recentLineTop,
                        width: `calc(${rightSectionWidth} - 4rpx)`,
                        right: 0,
                        borderColor: colors.primary
                    }">
                        <text class="avg-label avg-label-right" :style="{ color: colors.primary }">
                            {{ formatNumber(recentAvg) }} <text class="avg-unit" :style="{ color: colors.primary }">{{
                                unit }}</text>
                        </text>
                    </view>
                </template>
            </view>
        </view>

        <!-- Footer Labels -->
        <view class="footer">
            <template v-if="isStable">
                <text class="footer-label footer-label-full">{{ overallLabel }}</text>
            </template>
            <template v-else>
                <text class="footer-label" :style="{ width: leftSectionWidth }">
                    {{ previousLabel }}
                </text>
                <text class="footer-label footer-label-right" :style="{ width: rightSectionWidth }">
                    {{ recentLabel }}
                </text>
            </template>
        </view>
    </view>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { useTrendCard, type TrendCardConfig } from '@/composables/useTrendCard'
import { getMetricSentiment, getDirectionText } from '@/config/trendCopywriting'
import { GRAY_SCALE, TOKENS } from '@/config/theme'

// ============================================================================
// Props
// ============================================================================

const props = defineProps({
    /** Metric key for data fetching and navigation */
    metricKey: {
        type: String,
        required: true
    },
    /** Display title */
    title: {
        type: String,
        required: true
    },
    /** Icon name */
    icon: {
        type: String,
        default: 'chart-bar'
    },
    /** Unit display */
    unit: {
        type: String,
        default: ''
    },
    /** Pet ID filter */
    petId: {
        type: String,
        default: ''
    },
    /** Primary color */
    primaryColor: {
        type: String,
        default: '#ff453a'
    },
    /** Background color for icon wrapper */
    themeBg: {
        type: String,
        default: '#fff7ed'
    },
    /** Minimum data points (default: 20) */
    minDataPoints: {
        type: Number,
        default: 20
    },
    /** Maximum bars to display (default: 40) */
    maxBars: {
        type: Number,
        default: 40
    },
    /** Threshold percent for trend detection (default: 5) */
    thresholdPercent: {
        type: Number,
        default: 5
    },
    /** Stable mode: show single line instead of two */
    isStable: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

// ============================================================================
// Use Composable
// ============================================================================

const config: TrendCardConfig = {
    metricKey: props.metricKey,
    subjectName: props.title,
    sentiment: getMetricSentiment(props.metricKey),
    thresholdPercent: props.thresholdPercent,
    minDataPoints: props.minDataPoints,
    maxBars: props.maxBars,
    petId: props.petId || undefined
}

const {
    previousValues,
    recentValues,
    previousAvg,
    recentAvg,
    previousLabel,
    recentLabel,
    viewMode,
    trendDirection,
    hasSignificantChange,
    changePercent,
    copywriting,
    hasEnoughData,
    totalDataPoints,
    maxValue
} = useTrendCard(config)

// ============================================================================
// Colors
// ============================================================================

const colors = computed(() => {
    return {
        primary: props.primaryColor,
        textMuted: TOKENS.textMuted,
        textSecondary: TOKENS.textSecondary,
        bar: GRAY_SCALE.gray5,
        barHighlight: GRAY_SCALE.gray5
    }
})

// ============================================================================
// Layout Calculations
// ============================================================================

const totalSlots = computed(() => {
    const total = previousValues.value.length + recentValues.value.length
    return total || 1
})

const leftSectionWidth = computed(() => {
    return `${(previousValues.value.length / totalSlots.value) * 100}%`
})

const rightSectionWidth = computed(() => {
    return `${(recentValues.value.length / totalSlots.value) * 100}%`
})

const leftSlotWidth = computed(() => {
    return previousValues.value.length > 0 ? `${100 / previousValues.value.length}%` : '0%'
})

const rightSlotWidth = computed(() => {
    return recentValues.value.length > 0 ? `${100 / recentValues.value.length}%` : '0%'
})

// ============================================================================
// Average Line Positions
// ============================================================================

const previousLineTop = computed(() => {
    if (maxValue.value === 0) return '50%'
    return `${100 - (previousAvg.value / maxValue.value) * 100}%`
})

const recentLineTop = computed(() => {
    if (maxValue.value === 0) return '50%'
    return `${100 - (recentAvg.value / maxValue.value) * 100}%`
})

// Stable mode: overall average across all values
const overallAvg = computed(() => {
    const allValues = [...previousValues.value, ...recentValues.value]
    if (allValues.length === 0) return 0
    return allValues.reduce((a, b) => a + b, 0) / allValues.length
})

const overallLineTop = computed(() => {
    if (maxValue.value === 0) return '50%'
    return `${100 - (overallAvg.value / maxValue.value) * 100}%`
})

const overallLabel = computed(() => {
    const totalPoints = previousValues.value.length + recentValues.value.length
    return viewMode.value === 'weekly' ? `最近${totalPoints}周` : `最近${totalPoints}天`
})

// ============================================================================
// Bar Height
// ============================================================================

const getBarHeight = (val: number) => {
    if (maxValue.value === 0) return '50%'
    const pct = (val / maxValue.value) * 100
    return `${Math.min(Math.max(pct, 10), 100)}%`
}

// ============================================================================
// Progress Calculation (for collecting state)
// ============================================================================

const progressPercent = computed(() => {
    return Math.min((totalDataPoints.value / props.minDataPoints) * 100, 100)
})

// ============================================================================
// Trend Badge
// ============================================================================

const trendBadgeClass = computed(() => {
    return {
        'trend-badge--up': trendDirection.value === 'up',
        'trend-badge--down': trendDirection.value === 'down'
    }
})

const trendBadgeText = computed(() => {
    const direction = getDirectionText(trendDirection.value)
    const percent = Math.abs(changePercent.value).toFixed(1)
    return `${direction} ${percent}%`
})

// ============================================================================
// Formatting
// ============================================================================

const formatNumber = (num: number) => {
    return num.toLocaleString()
}

// ============================================================================
// Events
// ============================================================================

const handleCardClick = () => {
    emit('click', props.metricKey)
    // Navigate to detail page
    uni.navigateTo({
        url: `/pages/metrics/detail?key=${props.metricKey}`
    })
}
</script>

<style scoped lang="scss">
.trend-card {
    background-color: #ffffff;
    border-radius: 48rpx;
    padding: 32rpx;
    min-height: 400rpx;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:active {
        opacity: 0.95;
    }

}

// Header
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.icon-wrapper {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.title {
    font-size: 34rpx;
    font-weight: 700;
    letter-spacing: -0.5rpx;
    color: #334155;
    /* slate-700 */
}

.view-mode-badge {
    background-color: rgba(255, 69, 58, 0.15);
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    margin-left: 8rpx;
}

.view-mode-text {
    font-size: 20rpx;
    color: #ff453a;
    font-weight: 500;
}

.header-right {
    padding: 8rpx;
}

.main-title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: #000000;
    line-height: 1.3;
    margin-bottom: 48rpx;
    letter-spacing: -0.5rpx;
}

// Chart
.chart-container {
    position: relative;
    height: 260rpx;
    width: 100%;
    margin-bottom: 16rpx;
}

.bars-wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
}

.bars-section {
    display: flex;
    height: 100%;
}

.bar-slot {
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.bar {
    background-color: #e5e5ea;
    border-radius: 4rpx 4rpx 0 0;
    width: 65%;
    transition: height 0.3s ease-out;
}

.bar-highlight {
    background-color: #e5e5ea;
}

// Average Lines
.lines-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.avg-line {
    position: absolute;
    border-top: 6rpx solid;
    border-radius: 4rpx;
    transition: top 0.3s ease-out;
}

.avg-line-left {
    left: 0;
    border-color: #8e8e93;
}

.avg-line-right {
    border-color: #ff453a;
}

.avg-label {
    position: absolute;
    top: -48rpx;
    font-size: 32rpx;
    font-weight: 700;
    font-family: ui-monospace, 'SF Mono', monospace;
    letter-spacing: -1rpx;
    white-space: nowrap;
}

.avg-label-left {
    left: 0;
    color: #8e8e93;
}

.avg-label-right {
    right: 0;
    color: #ff453a;
}

// Stable mode: full-width line
.avg-line-full {
    left: 0;
    right: 0;
    width: 100% !important;
    border-color: #ff453a;
}

.avg-label-center {
    right: 0;
    color: #ff453a;
}

.avg-unit {
    font-size: 24rpx;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin-left: 2rpx;
}

// Footer
.footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 24rpx;
}

.footer-label {
    font-size: 24rpx;
    font-weight: 500;
    color: #8e8e93;
    text-align: left;
    padding-left: 4rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.footer-label-right {
    text-align: right;
}

.footer-label-full {
    width: 100%;
    text-align: right;
}
</style>
