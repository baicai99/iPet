<template>
    <view class="step-count-trend-card">
        <!-- Loading State -->
        <view v-if="loading" class="loading-state">
            <view class="skeleton header-skeleton"></view>
            <view class="skeleton title-skeleton"></view>
            <view class="skeleton chart-skeleton"></view>
        </view>

        <!-- Empty State -->
        <view v-else-if="!hasData" class="empty-state">
            <u-icon name="chart-bar" size="40" color="#c7c7cc"></u-icon>
            <text class="empty-text">暂无趋势数据</text>
            <text class="empty-hint">需要至少2周的数据才能显示趋势</text>
        </view>

        <!-- Normal Content -->
        <template v-else>
            <!-- Header -->
            <view class="header">
                <view class="header-left">
                    <u-icon :name="icon" size="20" :color="colors.primary"></u-icon>
                    <text class="title" :style="{ color: colors.primary }">{{ resolvedTitle }}</text>
                </view>
                <view class="header-right" @click="handleClick">
                    <u-icon name="arrow-right" size="18" :color="colors.textGray"></u-icon>
                </view>
            </view>

            <!-- Main Title -->
            <text class="main-title">
                你的{{ resolvedTitle }}在过去 {{ resolvedRecentLabel }} 有所{{ trendDirection }}。
            </text>

            <!-- Chart Area -->
            <view class="chart-container">
                <!-- Bars Container -->
                <view class="bars-wrapper">
                    <!-- Left Side (Previous Period) -->
                    <view class="bars-section bars-left" :style="{ width: leftSectionWidth }">
                        <view v-for="(val, index) in resolvedPreviousValues" :key="'left-' + index" class="bar-slot"
                            :style="{ width: leftSlotWidth }">
                            <view class="bar" :style="{ height: getBarHeight(val) }"></view>
                        </view>
                    </view>

                    <!-- Right Side (Recent Period) -->
                    <view class="bars-section bars-right" :style="{ width: rightSectionWidth }">
                        <view v-for="(val, index) in resolvedRecentValues" :key="'right-' + index" class="bar-slot"
                            :style="{ width: rightSlotWidth }">
                            <view class="bar bar-highlight" :style="{ height: getBarHeight(val) }"></view>
                        </view>
                    </view>
                </view>

                <!-- Average Lines Overlay -->
                <view class="lines-overlay">
                    <!-- Left Average Line -->
                    <view class="avg-line avg-line-left" :style="{
                        top: previousLineTop,
                        width: `calc(${leftSectionWidth} - 4rpx)`
                    }">
                        <text class="avg-label avg-label-left" :style="{ color: colors.textGray }">
                            {{ formatNumber(resolvedPreviousAvg) }} <text class="avg-unit">{{ unit }}</text>
                        </text>
                    </view>

                    <!-- Right Average Line -->
                    <view class="avg-line avg-line-right" :style="{
                        top: recentLineTop,
                        width: `calc(${rightSectionWidth} - 4rpx)`,
                        right: 0
                    }">
                        <text class="avg-label avg-label-right" :style="{ color: colors.primary }">
                            {{ formatNumber(resolvedRecentAvg) }}
                        </text>
                    </view>
                </view>
            </view>

            <!-- Footer Labels -->
            <view class="footer">
                <text class="footer-label" :style="{ color: colors.textGray, width: leftSectionWidth }">
                    {{ resolvedPreviousLabel }}
                </text>
                <text class="footer-label footer-label-right"
                    :style="{ color: colors.textGray, width: rightSectionWidth }">
                    {{ resolvedRecentLabel }}
                </text>
            </view>
        </template>
    </view>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { GRAY_SCALE } from '@/config/theme'

// 计算平均值的辅助函数
const calcAverage = (values: number[]): number => {
    const valid = values.filter(v => typeof v === 'number' && !Number.isNaN(v))
    if (!valid.length) return 0
    return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1))
}

const props = defineProps({
    // 趋势对象（兼容 TrendAnalysisCard 用法）
    trend: {
        type: Object as () => {
            key?: string
            title?: string
            previousRecords?: Array<{ value: number }>
            recentRecords?: Array<{ value: number }>
            hasChange?: boolean
            changeText?: string
            unitLabel?: string
        } | null,
        default: null
    },
    // 标题
    title: {
        type: String,
        default: ''
    },
    // 图标
    icon: {
        type: String,
        default: 'chart-bar'
    },
    // 单位
    unit: {
        type: String,
        default: ''
    },
    // 历史区间数值数组
    previousValues: {
        type: Array as () => number[],
        default: () => []
    },
    // 近期区间数值数组
    recentValues: {
        type: Array as () => number[],
        default: () => []
    },
    // 历史区间平均
    previousAvg: {
        type: Number,
        default: 0
    },
    // 近期区间平均
    recentAvg: {
        type: Number,
        default: 0
    },
    // 历史区间标签
    previousLabel: {
        type: String,
        default: ''
    },
    // 近期区间标签
    recentLabel: {
        type: String,
        default: ''
    },
    // 最大值（用于计算柱状图高度）
    maxVal: {
        type: Number,
        default: 0 // 0 表示自动计算
    },
    // 主题色
    primaryColor: {
        type: String,
        default: '#ff453a' // iOS 红色
    },
    // 加载状态
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

// 解析 trend 对象或使用单独的 props
const resolvedTitle = computed(() => {
    return props.title || props.trend?.title || '趋势'
})

const resolvedPreviousValues = computed(() => {
    if (props.previousValues.length > 0) return props.previousValues
    if (props.trend?.previousRecords) {
        return props.trend.previousRecords.map(r => Number(r.value))
    }
    return []
})

const resolvedRecentValues = computed(() => {
    if (props.recentValues.length > 0) return props.recentValues
    if (props.trend?.recentRecords) {
        return props.trend.recentRecords.map(r => Number(r.value))
    }
    return []
})

const resolvedPreviousAvg = computed(() => {
    if (props.previousAvg > 0) return props.previousAvg
    return calcAverage(resolvedPreviousValues.value)
})

const resolvedRecentAvg = computed(() => {
    if (props.recentAvg > 0) return props.recentAvg
    return calcAverage(resolvedRecentValues.value)
})

const resolvedPreviousLabel = computed(() => {
    return props.previousLabel || `${resolvedPreviousValues.value.length}周平均`
})

const resolvedRecentLabel = computed(() => {
    return props.recentLabel || `${resolvedRecentValues.value.length}周平均`
})

// 是否有数据
const hasData = computed(() => {
    return resolvedPreviousValues.value.length > 0 || resolvedRecentValues.value.length > 0
})

// 颜色配置
const colors = computed(() => ({
    primary: props.primaryColor,
    textGray: GRAY_SCALE.light.gray,
    bar: GRAY_SCALE.light.gray5
}))

// 趋势方向文本
const trendDirection = computed(() => {
    return resolvedRecentAvg.value < resolvedPreviousAvg.value ? '减少' : '增加'
})

// 自动计算最大值
const computedMaxVal = computed(() => {
    if (props.maxVal > 0) return props.maxVal
    const allValues = [...resolvedPreviousValues.value, ...resolvedRecentValues.value]
    if (allValues.length === 0) return 100
    return Math.max(...allValues) * 1.2 // 留 20% 余量
})

// 布局计算
const totalSlots = computed(() => {
    const total = resolvedPreviousValues.value.length + resolvedRecentValues.value.length
    return total || 1
})

const leftSectionWidth = computed(() => {
    return `${(resolvedPreviousValues.value.length / totalSlots.value) * 100}%`
})

const rightSectionWidth = computed(() => {
    return `${(resolvedRecentValues.value.length / totalSlots.value) * 100}%`
})

const leftSlotWidth = computed(() => {
    return resolvedPreviousValues.value.length > 0 ? `${100 / resolvedPreviousValues.value.length}%` : '0%'
})

const rightSlotWidth = computed(() => {
    return resolvedRecentValues.value.length > 0 ? `${100 / resolvedRecentValues.value.length}%` : '0%'
})

// 平均线位置
const previousLineTop = computed(() => {
    if (computedMaxVal.value === 0) return '50%'
    return `${100 - (resolvedPreviousAvg.value / computedMaxVal.value) * 100}%`
})

const recentLineTop = computed(() => {
    if (computedMaxVal.value === 0) return '50%'
    return `${100 - (resolvedRecentAvg.value / computedMaxVal.value) * 100}%`
})

// 柱状图高度计算
const getBarHeight = (val: number) => {
    if (computedMaxVal.value === 0) return '50%'
    const pct = (val / computedMaxVal.value) * 100
    return `${Math.min(Math.max(pct, 10), 100)}%`
}

// 格式化数字
const formatNumber = (num: number) => {
    return num.toLocaleString()
}

// 点击事件
const handleClick = () => {
    emit('click')
}
</script>

<style scoped lang="scss">
.step-count-trend-card {
    background-color: #ffffff;
    border-radius: 48rpx;
    padding: 32rpx;
    min-height: 400rpx;
}

// Loading State
.loading-state {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8rpx;
}

.header-skeleton {
    height: 40rpx;
    width: 120rpx;
}

.title-skeleton {
    height: 48rpx;
    width: 80%;
}

.chart-skeleton {
    height: 260rpx;
    width: 100%;
    border-radius: 16rpx;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

// Empty State
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64rpx 32rpx;
    gap: 16rpx;
}

.empty-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #8e8e93;
}

.empty-hint {
    font-size: 24rpx;
    color: #c7c7cc;
}

// Header
.header {
    @include flex-between;
    margin-bottom: 8rpx;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.title {
    font-size: 34rpx;
    font-weight: 700;
    letter-spacing: -0.5rpx;
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

.avg-unit {
    font-size: 24rpx;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin-left: 2rpx;
}

.footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 24rpx;
}

.footer-label {
    font-size: 24rpx;
    font-weight: 500;
    text-align: left;
    padding-left: 4rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.footer-label-right {
    text-align: right;
}
</style>
