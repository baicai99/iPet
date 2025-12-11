<template>
    <view class="big-detail-card">
        <view class="card-header">
            <view class="header-left">
                <view class="title-row">
                    <view class="icon-wrapper" :class="config.theme.text">
                        <u-icon :name="config.icon" size="20" :color="themeColor"></u-icon>
                    </view>
                    <text class="card-title">{{ config.title }}</text>
                </view>
                <text class="card-subtitle">
                    {{ config.date === 'Live' ? '实时监控中' : `更新于 ${config.date}` }}
                </text>
            </view>
            <view class="header-right">
                <text class="header-value">{{ config.value }}</text>
                <text class="header-unit">{{ config.unit || 'Current' }}</text>
            </view>
        </view>

        <view class="tabs-container">
            <view v-for="tab in tabs" :key="tab" class="tab-item"
                :class="{ 'active': activeTab === tab, [config.theme.text]: activeTab === tab }"
                @click="activeTab = tab">
                <text class="tab-text">{{ tab }}</text>
            </view>
        </view>

        <view class="chart-area">
            <component :is="detailChartComponent" :data="config.data" :color="themeColor" v-bind="detailChartProps" />
        </view>

        <view class="card-footer">
            <view class="footer-left" @click="isPinned = !isPinned">
                <view class="pin-switch"
                    :class="isPinned ? config.theme.bg.replace('bg-', 'bg-').replace('50', '500') : 'bg-slate-200'"
                    :style="{ backgroundColor: isPinned ? themeColor : cardColors.switchTrack }">
                    <view class="pin-knob" :class="{ 'pinned': isPinned }"></view>
                </view>
                <text class="footer-label">{{ isPinned ? 'Pinned' : 'Pin' }}</text>
            </view>
            <view class="footer-right">
                <text class="detail-link">Detail</text>
                <u-icon name="arrow-right" size="14" :color="cardColors.iconMuted"></u-icon>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue'
import { BASE_COLORS, COLORS } from '@/config/theme'
import { useChartAdapter } from '@/composables/useChartAdapter'

const props = defineProps({
    config: {
        type: Object,
        required: true,
        default: () => ({
            id: '',
            title: '',
            date: '',
            value: '',
            unit: '',
            icon: 'grid',
            chartType: 'line',
            data: [],
            options: {},
            theme: { hex: COLORS.blue.hex, bg: 'bg-blue-50', text: 'text-blue-500' }
        })
    }
})

const activeTab = ref('周')
const isPinned = ref(false)
const tabs = ['日', '周', '月', '6个月', '年']

const themeColor = computed(() => props.config.theme.hex)
const cardColors = computed(() => ({
    background: BASE_COLORS.white,
    border: BASE_COLORS.slate100,
    title: BASE_COLORS.slate800,
    subtitle: BASE_COLORS.slate400,
    value: BASE_COLORS.slate800,
    unit: BASE_COLORS.slate400,
    tabsBg: BASE_COLORS.slate50,
    tabActiveBg: BASE_COLORS.white,
    tabText: BASE_COLORS.slate400,
    footerBorder: BASE_COLORS.slate100,
    footerText: BASE_COLORS.slate400,
    switchTrack: BASE_COLORS.slate200,
    switchKnob: BASE_COLORS.white,
    iconMuted: BASE_COLORS.slate400
}))

const chartType = computed(() => props.config.chartType as string || 'line')
const chartOptions = computed(() => props.config.options || {})
const { component: detailChartComponent, props: detailChartProps } = useChartAdapter(
    chartType.value,
    chartOptions.value,
    'detail'
)
</script>

<style lang="scss" scoped>
.big-detail-card {
    background-color: v-bind('cardColors.background');
    border-radius: 48rpx;
    padding: 48rpx;
    box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.03);
    border: 1rpx solid v-bind('cardColors.border');
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: all 0.3s;
    box-sizing: border-box;

    &:active {
        box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.06);
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 48rpx;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.card-title {
    font-size: 36rpx;
    font-weight: 700;
    color: v-bind('cardColors.title');
}

.card-subtitle {
    font-size: 24rpx;
    color: v-bind('cardColors.subtitle');
    margin-top: 8rpx;
    display: block;
}

.header-right {
    text-align: right;
}

.header-value {
    font-size: 60rpx;
    font-weight: 900;
    color: v-bind('cardColors.value');
    letter-spacing: -2rpx;
    line-height: 1;
    display: block;
}

.header-unit {
    font-size: 24rpx;
    font-weight: 700;
    color: v-bind('cardColors.unit');
    text-transform: uppercase;
    display: block;
}

.tabs-container {
    background-color: v-bind('cardColors.tabsBg');
    padding: 8rpx;
    border-radius: 24rpx;
    display: flex;
    margin-bottom: 48rpx;
    flex-shrink: 0;
}

.tab-item {
    flex: 1;
    padding: 12rpx 0;
    text-align: center;
    border-radius: 16rpx;
    transition: all 0.3s;

    &.active {
        background-color: v-bind('cardColors.tabActiveBg');
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
    }
}

.tab-text {
    font-size: 24rpx;
    font-weight: 700;
    color: v-bind('cardColors.tabText');
}

.chart-area {
    height: 320rpx;
    width: 100%;
    margin-bottom: 48rpx;
    position: relative;
    flex-shrink: 0;
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 32rpx;
    border-top: 1rpx solid v-bind('cardColors.footerBorder');
    margin-top: auto;
}

.footer-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.pin-switch {
    width: 80rpx;
    height: 40rpx;
    border-radius: 9999rpx;
    position: relative;
    transition: background-color 0.3s;
}

.pin-knob {
    position: absolute;
    top: 4rpx;
    left: 4rpx;
    width: 32rpx;
    height: 32rpx;
    background-color: v-bind('cardColors.switchKnob');
    border-radius: 50%;
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
    transition: transform 0.3s;

    &.pinned {
        transform: translateX(40rpx);
    }
}

.footer-label {
    font-size: 20rpx;
    font-weight: 700;
    color: v-bind('cardColors.footerText');
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.footer-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.detail-link {
    font-size: 24rpx;
    font-weight: 700;
    color: v-bind('cardColors.footerText');
}
</style>
