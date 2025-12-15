<template>
    <view class="metric-list-card" :class="{ 'hover-shadow': true }" @click="handleClick">
        <!-- Header: Title & Date -->
        <view class="header">
            <view class="title-section">
                <view class="icon-wrapper" :style="{ backgroundColor: themeBg, color: themeColor }">
                    <svg class="icon" aria-hidden="true" style="font-size: 18px">
                        <use :xlink:href="'#' + iconName"></use>
                    </svg>
                </view>
                <text class="title">{{ title }}</text>
            </view>
            <view class="date-badge">
                <text class="date-text">{{ tag }}</text>
            </view>
        </view>

        <!-- Content: Value & Chart -->
        <view class="content" :style="{ height: chartHeight }">
            <!-- Left: Value -->
            <view class="value-section" :class="{ wide: isWide }">
                <view class="value-row">
                    <text :class="isValueText ? 'value-text' : 'value'">{{ valueStr }}</text>
                    <text v-if="unitStr && valueStr !== '暂无数据' && valueStr !== '暂无待办计划'" class="unit">{{ unitStr
                        }}</text>
                </view>
            </view>

            <!-- Right: Chart -->
            <view class="chart-section" :class="{ 'wide-chart': isWide }" :style="{ height: chartHeight }"
                v-if="hasChartData">
                <!-- 条件渲染替代动态组件 -->
                <MiniLineChart v-if="chartComponentName === 'MiniLineChart'" v-bind="resolvedChartProps" />
                <MiniBarChart v-else-if="chartComponentName === 'MiniBarChart'" v-bind="resolvedChartProps" />
                <MiniRangeSlider v-else-if="chartComponentName === 'MiniRangeSlider'" v-bind="resolvedChartProps" />
                <MiniStatus v-else-if="chartComponentName === 'MiniStatus'" v-bind="resolvedChartProps" />
                <MiniTimeline v-else-if="chartComponentName === 'MiniTimeline'" v-bind="resolvedChartProps" />
                <MiniStatusGrid v-else-if="chartComponentName === 'MiniStatusGrid'" v-bind="resolvedChartProps" />
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { MetricCardConfig } from '@/types/ui'
import { resolveChartAdapter } from '@/composables/useChartAdapter'
import MiniLineChart from '@/components/widgets/charts/MiniLineChart.vue'
import MiniBarChart from '@/components/widgets/charts/MiniBarChart.vue'
import MiniRangeSlider from '@/components/widgets/charts/MiniRangeSlider.vue'
import MiniStatus from '@/components/widgets/charts/MiniStatus.vue'
import MiniTimeline from '@/components/widgets/charts/MiniTimeline.vue'
import MiniStatusGrid from '@/components/widgets/charts/MiniStatusGrid.vue'

const props = defineProps({
    config: {
        type: Object as PropType<MetricCardConfig>,
        default: null
    },
    // Legacy props for backward compatibility (optional)
    title: { type: String, default: '' },
    valueStr: { type: String, default: '' },
    unitStr: { type: String, default: '' },
    tag: { type: String, default: '' },
    themeColor: { type: String, default: '#f97316' },
    themeBg: { type: String, default: '#fff7ed' },
    iconName: { type: String, default: 'grid' },
    chartComponent: { type: Object, default: null },
    chartProps: { type: Object, default: () => ({}) },
    chartHeight: { type: String, default: '80rpx' },
    isWide: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'click'])

// Computed properties to merge config and legacy props
const title = computed(() => props.config?.title || props.title)
const valueStr = computed(() => props.config ? String(props.config.displayValue) : props.valueStr)
const unitStr = computed(() => props.config?.displayUnit || props.unitStr)
const tag = computed(() => props.config?.displayDate || props.tag)
const themeColor = computed(() => props.config?.theme.hex || props.themeColor)
const themeBg = computed(() => props.config?.theme.bg || props.themeBg)
const iconName = computed(() => props.config?.iconName || props.iconName)
const chartHeight = computed(() => props.config?.chartHeight || props.chartHeight)
const isWide = computed(() => props.config?.isWide || props.isWide)

const isValueText = computed(() => {
    return isNaN(Number(valueStr.value))
})

// Chart Resolution
const resolvedChartComponent = computed(() => {
    if (props.config) {
        const { component } = resolveChartAdapter(
            props.config.visualizationType,
            props.config.visualizationOptions,
            'mini'
        )
        return component
    }
    return props.chartComponent
})

// Extract component name for conditional rendering
const chartComponentName = computed(() => {
    if (!resolvedChartComponent.value) return ''
    return resolvedChartComponent.value.__name || resolvedChartComponent.value.name || ''
})

const resolvedChartProps = computed(() => {
    if (props.config) {
        const { props: baseChartProps } = resolveChartAdapter(
            props.config.visualizationType,
            props.config.visualizationOptions,
            'mini'
        )

        // Handle emoji for status_icon
        let statusEmoji = ''
        if (props.config.visualizationType === 'status_icon') {
            const val = props.config.chartData || props.config.rawValue
            statusEmoji = (typeof val === 'string') ? val : '😐'
        }

        // state_grid 使用统一的蓝色，不跟随主题色变化
        const chartColor = props.config.visualizationType === 'state_grid'
            ? '#3b82f6'
            : themeColor.value

        return {
            ...baseChartProps,
            data: Object.freeze(props.config.chartData),
            events: Object.freeze(props.config.chartData),
            emoji: statusEmoji,
            color: chartColor,
            strokeColor: baseChartProps.strokeColor || themeColor.value,
            barColor: baseChartProps.barColor || themeColor.value,
            activeColor: baseChartProps.activeColor || themeColor.value,
            trackColor: baseChartProps.trackColor || themeBg.value,
            lineColor: baseChartProps.lineColor || themeColor.value,
            ...props.config.chartProps // Allow overriding if needed
        }
    }
    return props.chartProps
})

const hasChartData = computed(() => {
    const p = resolvedChartProps.value
    if (!p) return false

    // risk_grid metrics don't show mini charts - only semantic label
    if (props.config?.visualizationType === 'risk_grid') return false

    // If we have a component but no data, check if it needs data
    // For status_icon, data might be in 'emoji' or 'data'
    if (props.config?.visualizationType === 'status_icon') return true

    if (Array.isArray(p.data) && p.data.length > 0) return true
    if (Array.isArray(p.events) && p.events.length > 0) return true
    if (typeof p.data === 'number' || typeof p.data === 'string') return true

    // Check for empty arrays
    if (Array.isArray(p.data) && p.data.length === 0) return false

    // Default to true if we have a component, assuming it handles empty state or is static
    return !!resolvedChartComponent.value
})

const handleClick = () => {
    if (props.config?.key) {
        emit('select', props.config.key)
        emit('click', props.config.key)
    } else {
        emit('select')
    }
}
</script>

<style scoped>
.metric-list-card {
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 180rpx;
    border: 1px solid #f1f5f9;
    /* slate-100 */
    box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.2s ease;
    position: relative;
}

.hover-shadow:active {
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
}

.title-section {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.icon-wrapper {
    width: 56rpx;
    /* p-1.5 approx */
    height: 56rpx;
    border-radius: 16rpx;
    /* rounded-lg */
    display: flex;
    align-items: center;
    justify-content: center;
}

.title {
    font-size: 28rpx;
    /* text-sm */
    font-weight: 700;
    /* font-bold */
    color: #334155;
    /* slate-700 */
}

.date-badge {
    padding: 4rpx 16rpx;
    border-radius: 999rpx;
    background-color: #f8fafc;
    /* slate-50 */
    transform: translate(6rpx, -10rpx);
}

.date-text {
    font-size: 20rpx;
    /* text-[10px] */
    font-weight: 500;
    /* font-medium */
    color: #94a3b8;
    /* slate-400 */
}

.content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    /* height removed here, handled by style binding */
}

.value-section {
    display: flex;
    align-items: baseline;
    transform: translateY(4rpx);
}

.value-section.wide {
    min-width: 120rpx;
}

.value-row {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
}

.value {
    font-size: 48rpx;
    /* text-2xl */
    font-weight: 900;
    /* font-black */
    color: #1e293b;
    /* slate-800 */
    line-height: 1;
    letter-spacing: -1rpx;
    /* tracking-tight */
}

.value-text {
    font-size: 28rpx;
    font-weight: 600;
    color: #64748b;
    /* slate-500 */
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240rpx;
}

.unit {
    font-size: 24rpx;
    /* text-xs */
    font-weight: 700;
    /* font-bold */
    color: #94a3b8;
    /* slate-400 */
}

.chart-section {
    /* height removed here, handled by style binding */
    width: 200rpx;
    /* w-24 approx */
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
}

.chart-section.wide-chart {
    flex: 1;
    padding-left: 16rpx;
}

.chart-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
    background: rgba(0, 0, 0, 0.03);
}
</style>
