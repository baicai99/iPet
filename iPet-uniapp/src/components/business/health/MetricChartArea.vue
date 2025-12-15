<template>
    <view class="trend-card">
        <!-- 图表 Tabs -->
        <view class="chart-tabs-wrapper">
            <view class="chart-tabs">
                <view v-for="tab in tabs" :key="tab.id" class="tab-item" :class="{ active: activeTab === tab.id }"
                    @click="onTabClick(tab.id)">
                    <text class="tab-text">{{ tab.label }}</text>
                </view>
            </view>
        </view>
        <!-- 核心数值展示 (移至右上角) -->
        <view class="main-stats">
            <view class="stats-row">
                <text class="value" :class="{ 'text-sm': latestMetricDisplay.isPlaceholder }">{{
                    latestMetricDisplay.value }}</text>
                <text class="unit">{{ latestMetricDisplay.unit }}</text>
            </view>

            <!-- 动态胶囊标签 -->
            <view class="trend-pill" :class="currentData.trend > 0 ? 'trend-up' : 'trend-down'"
                v-if="currentData.trend !== 0">
                <u-icon :name="currentData.trend > 0 ? 'arrow-up' : 'arrow-down'"
                    :color="currentData.trend > 0 ? '#ea580c' : '#059669'" size="10" bold></u-icon>
                <text class="trend-text">{{ Math.abs(currentData.trend) }}</text>
            </view>
        </view>

        <!-- 图表绘制区 -->
        <view class="chart-area">
            <BaseChart v-if="isChartType" :options="echartsOptions" height="320rpx" width="100%"
                @point-click="onChartPointClick" />
            <!-- 替换动态组件为条件渲染 -->
            <template v-else>
                <TrendLineChart v-if="chartComponentName === 'TrendLineChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <DailyBarChart v-else-if="chartComponentName === 'DailyBarChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <RangeSliderChart v-else-if="chartComponentName === 'RangeSliderChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <StatusIconChart v-else-if="chartComponentName === 'StatusIconChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <StatusGridChart v-else-if="chartComponentName === 'StatusGridChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <RiskGridTrendChart v-else-if="chartComponentName === 'RiskGridTrendChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <EventTimelineChart v-else-if="chartComponentName === 'EventTimelineChart'" :data="currentData"
                    :options="chartOptions" :color="theme.hex" :time-range="activeTab" height="280rpx" />
                <TextChart v-else-if="chartComponentName === 'TextChart'" :data="currentData" :options="chartOptions"
                    :color="theme.hex" :time-range="activeTab" height="280rpx" />
            </template>
        </view>

        <!-- 底部：辅助 X 轴标签 -->
        <view class="x-axis-labels" v-if="!isChartType">
            <text v-for="(label, idx) in xAxisLabels" :key="idx" class="axis-label"
                :class="{ 'text-dark': idx === xAxisLabels.length - 1 }">
                {{ label }}
            </text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from '@/components/BaseChart.vue'
import TrendLineChart from '@/components/widgets/charts/TrendLineChart.vue'
import DailyBarChart from '@/components/widgets/charts/DailyBarChart.vue'
import RangeSliderChart from '@/components/widgets/charts/RangeSliderChart.vue'
import StatusIconChart from '@/components/widgets/charts/StatusIconChart.vue'
import StatusGridChart from '@/components/widgets/charts/StatusGridChart.vue'
import RiskGridTrendChart from '@/components/widgets/charts/RiskGridTrendChart.vue'
import EventTimelineChart from '@/components/widgets/charts/EventTimelineChart.vue'
import TextChart from '@/components/widgets/charts/TextChart.vue'

const props = defineProps<{
    activeTab: string
    tabs: any[]
    latestMetricDisplay: any
    currentData: any
    isChartType: boolean
    echartsOptions: any
    currentChartComponent: any
    chartOptions: any
    theme: any
    xAxisLabels: string[]
}>()

const emit = defineEmits(['update:activeTab', 'point-click'])

// 从组件对象中提取组件名称
const chartComponentName = computed(() => {
    if (!props.currentChartComponent) return ''
    // 获取组件的 name 属性或者从 __name 获取
    return props.currentChartComponent.__name || props.currentChartComponent.name || ''
})

const onTabClick = (id: string) => {
    emit('update:activeTab', id)
}

const onChartPointClick = (params: any) => {
    emit('point-click', params)
}
</script>

<style lang="scss" scoped>
.trend-card {
    width: 100%;
    background-color: #ffffff;
    padding: 24rpx; // p-6
    box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.03);
    border: 1rpx solid #f1f5f9;
    box-sizing: border-box;
    border-radius: 24rpx;
}

.chart-tabs-wrapper {
    width: 100%;
    margin-bottom: 32rpx;
    /* overflow-x: auto;  Removed to ensure fit layout */
}

.chart-tabs {
    display: flex;
    width: 100%;
    background-color: #f1f5f9;
    padding: 6rpx;
    border-radius: 20rpx;
    box-sizing: border-box;
}

.tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10rpx 0;
    /* Reduced horizontal padding, rely on flex centering */
    border-radius: 16rpx;
    transition: all 0.3s ease;

    &.active {
        background-color: #ffffff;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

        .tab-text {
            color: #0f172a;
            font-weight: 600;
        }
    }
}

.tab-text {
    font-size: 24rpx;
    color: #64748b;
    text-align: center;
}

.main-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
}

.stats-row {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
}

.value {
    font-size: 48rpx;
    font-family: 'Outfit';
    font-weight: 700;
    color: #0f172a;
    line-height: 1;

    &.text-sm {
        font-size: 32rpx;
        color: #64748b;
    }
}

.unit {
    font-size: 26rpx;
    color: #94a3b8;
    margin-bottom: 4rpx;
}

.trend-pill {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 4rpx 12rpx;
    border-radius: 999rpx;

    &.trend-up {
        background-color: #fff7ed;
    }

    &.trend-down {
        background-color: #ecfdf5;
    }
}

.trend-text {
    font-size: 24rpx;
    font-weight: 600;
    color: inherit;
}

.chart-area {
    width: 100%;
    margin-bottom: 16rpx;
    position: relative;
    min-height: 280rpx;
}

.x-axis-labels {
    display: flex;
    justify-content: space-between;
    padding: 0 16rpx;
}

.axis-label {
    font-size: 22rpx;
    color: #cbd5e1;

    &.text-dark {
        color: #94a3b8;
    }
}
</style>
