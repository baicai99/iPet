<template>
  <!-- 可复用的趋势卡片基础布局 -->
  <view class="base-trend-card" @click="handleClick">
    <!-- Loading State -->
    <view v-if="loading" class="loading-state">
      <view class="skeleton header-skeleton"></view>
      <view class="skeleton title-skeleton"></view>
      <view class="skeleton chart-skeleton"></view>
    </view>

    <!-- Empty State -->
    <view v-else-if="!hasData" class="empty-state">
      <u-icon name="chart-bar" size="40" color="#c7c7cc"></u-icon>
      <text class="empty-text">{{ emptyText }}</text>
      <text class="empty-hint">{{ emptyHint }}</text>
    </view>

    <!-- Normal Content -->
    <template v-else>
      <!-- Header -->
      <slot name="header">
        <view class="header">
          <view class="header-left">
            <view class="icon-wrapper" :style="{ backgroundColor: themeBg, color: primaryColor }">
              <text class="iconfont" style="font-size: 18px">{{ icon }}</text>
            </view>
            <text class="title">{{ title }}</text>
          </view>
          <view class="header-right">
            <u-icon name="arrow-right" size="18" :color="textMuted"></u-icon>
          </view>
        </view>
      </slot>

      <!-- Main Title -->
      <slot name="main-title">
        <text class="main-title">{{ computedMainTitle }}</text>
      </slot>

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
        <slot name="lines-overlay">
          <view class="lines-overlay">
            <!-- Stable Mode: Single full-width line -->
            <template v-if="isStable">
              <view class="avg-line avg-line-full" :style="{ top: overallLineTop, borderColor: primaryColor }">
                <text class="avg-label avg-label-center" :style="{ color: primaryColor }">
                  {{ formatNumber(overallAvg) }} <text class="avg-unit" :style="{ color: primaryColor }">{{ unit
                    }}</text>
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
                borderColor: primaryColor
              }">
                <text class="avg-label avg-label-right" :style="{ color: primaryColor }">
                  {{ formatNumber(recentAvg) }} <text class="avg-unit" :style="{ color: primaryColor }">{{ unit
                    }}</text>
                </text>
              </view>
            </template>
          </view>
        </slot>
      </view>

      <!-- Footer Labels -->
      <slot name="footer">
        <view class="footer">
          <template v-if="isStable">
            <text class="footer-label footer-label-full">{{ overallLabel }}</text>
          </template>
          <template v-else>
            <text class="footer-label" :style="{ width: leftSectionWidth }">{{ previousLabel }}</text>
            <text class="footer-label footer-label-right" :style="{ width: rightSectionWidth }">{{ recentLabel }}</text>
          </template>
        </view>
      </slot>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TOKENS } from '@/config/theme'
import { ICONFONT_UNICODE } from '@/utils/ui/iconfont'
import { formatHeadline } from '@/domain/trend/trendFormatter'
import type { TrendResult } from '@/domain/trend/trendTypes'

// ============================================================================
// Props
// ============================================================================

const props = withDefaults(defineProps<{
  /** 显示标题 */
  title?: string
  /** 主标题文案（兼容模式，推荐使用 trendResult） */
  mainTitle?: string
  /** 趋势判定结果（新模式：配合 metricName 使用 formatHeadline） */
  trendResult?: TrendResult
  /** 指标名称（配合 trendResult 使用） */
  metricName?: string
  /** 图标名称 */
  icon?: string
  /** 单位 */
  unit?: string
  /** 主题色 */
  primaryColor?: string
  /** 主题背景色 */
  themeBg?: string
  /** 历史区间数值数组 */
  previousValues?: number[]
  /** 近期区间数值数组 */
  recentValues?: number[]
  /** 历史区间平均值 */
  previousAvg?: number
  /** 近期区间平均值 */
  recentAvg?: number
  /** 历史区间标签 */
  previousLabel?: string
  /** 近期区间标签 */
  recentLabel?: string
  /** 最大值（用于计算柱状图高度） */
  maxValue?: number
  /** 加载状态 */
  loading?: boolean
  /** 稳定模式：显示单条横线 */
  isStable?: boolean
  /** 空状态文本 */
  emptyText?: string
  /** 空状态提示 */
  emptyHint?: string
}>(), {
  title: '',
  mainTitle: '',
  icon: ICONFONT_UNICODE.file,
  unit: '',
  primaryColor: '#ff453a',
  themeBg: '#fff7ed',
  previousValues: () => [],
  recentValues: () => [],
  previousAvg: 0,
  recentAvg: 0,
  previousLabel: '',
  recentLabel: '',
  maxValue: 0,
  loading: false,
  isStable: false,
  emptyText: '暂无趋势数据',
  emptyHint: '需要至少2周的数据才能显示趋势'
})

const emit = defineEmits<{
  click: []
}>()

// ============================================================================
// Computed
// ============================================================================

const textMuted = computed(() => TOKENS.textMuted)

/** 计算主标题：优先使用 trendResult + metricName 生成 headline */
const computedMainTitle = computed(() => {
  if (props.trendResult && props.metricName) {
    return formatHeadline(props.metricName, props.trendResult)
  }
  return props.mainTitle
})

/** 是否有数据 */
const hasData = computed(() =>
  props.previousValues.length > 0 || props.recentValues.length > 0
)

/** 总槽位数 */
const totalSlots = computed(() => {
  const total = props.previousValues.length + props.recentValues.length
  return total || 1
})

/** 左侧区域宽度 */
const leftSectionWidth = computed(() =>
  `${(props.previousValues.length / totalSlots.value) * 100}%`
)

/** 右侧区域宽度 */
const rightSectionWidth = computed(() =>
  `${(props.recentValues.length / totalSlots.value) * 100}%`
)

/** 左侧槽位宽度 */
const leftSlotWidth = computed(() =>
  props.previousValues.length > 0 ? `${100 / props.previousValues.length}%` : '0%'
)

/** 右侧槽位宽度 */
const rightSlotWidth = computed(() =>
  props.recentValues.length > 0 ? `${100 / props.recentValues.length}%` : '0%'
)

/** 历史平均线位置 */
const previousLineTop = computed(() => {
  if (props.maxValue === 0) return '50%'
  return `${100 - (props.previousAvg / props.maxValue) * 100}%`
})

/** 近期平均线位置 */
const recentLineTop = computed(() => {
  if (props.maxValue === 0) return '50%'
  return `${100 - (props.recentAvg / props.maxValue) * 100}%`
})

/** 整体平均值（稳定模式使用） */
const overallAvg = computed(() => {
  const allValues = [...props.previousValues, ...props.recentValues]
  if (allValues.length === 0) return 0
  return allValues.reduce((a, b) => a + b, 0) / allValues.length
})

/** 整体平均线位置 */
const overallLineTop = computed(() => {
  if (props.maxValue === 0) return '50%'
  return `${100 - (overallAvg.value / props.maxValue) * 100}%`
})

/** 整体标签 */
const overallLabel = computed(() => {
  const totalPoints = props.previousValues.length + props.recentValues.length
  return `最近${totalPoints}周`
})

// ============================================================================
// Methods
// ============================================================================

/** 计算柱状图高度 */
const getBarHeight = (val: number) => {
  if (props.maxValue === 0) return '50%'
  const pct = (val / props.maxValue) * 100
  return `${Math.min(Math.max(pct, 10), 100)}%`
}

/** 格式化数字 */
const formatNumber = (num: number) => num.toLocaleString()

/** 点击事件 */
const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
/* ============================================================================
   Base Trend Card - 可复用的趋势卡片基础样式
   ============================================================================ */

.base-trend-card {
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

/* ============================================================================
   Loading State
   ============================================================================ */

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

/* ============================================================================
   Empty State
   ============================================================================ */

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

/* ============================================================================
   Header
   ============================================================================ */

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
}

.header-right {
  padding: 8rpx;
}

/* ============================================================================
   Main Title
   ============================================================================ */

.main-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #000000;
  line-height: 1.3;
  margin-bottom: 48rpx;
  letter-spacing: -0.5rpx;
}

/* ============================================================================
   Chart
   ============================================================================ */

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

/* ============================================================================
   Average Lines
   ============================================================================ */

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

.avg-line-full {
  left: 0;
  right: 0;
  width: 100% !important;
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

/* ============================================================================
   Footer
   ============================================================================ */

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
