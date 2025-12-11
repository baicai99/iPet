<template>
    <view class="header-container">
        <!-- 非任务模式：图表区域 -->
        <template v-if="!isTaskMode">
            <MetricChartArea :active-tab="activeTab" :tabs="tabs" :latest-metric-display="latestMetricDisplay"
                :current-data="currentData" :is-chart-type="isChartType" :echarts-options="echartsOptions"
                :current-chart-component="currentChartComponent" :chart-options="chartOptions" :theme="theme"
                :x-axis-labels="xAxisLabels" @update:activeTab="setActiveTab" @point-click="onChartPointClick" />
        </template>

        <!-- 任务模式：使用新组件 -->
        <TaskModeSection v-else />
    </view>

    <view class="detail-container">
        <!-- 数值统计网格：使用新组件 -->
        <NumericStatsSection v-if="isNumericMetric && !isTaskMode" />

        <!-- 时间轴列表：使用新组件 -->
        <TimelineSection v-else-if="!isTaskMode" />

        <!-- 智能分析气泡 -->
        <MetricInsight :metric-key="metricKey" :metric-metadata="metricMetadata" :current-data="currentData"
            :metric-unit-label="metricUnitLabel" />

        <!-- 指标百科卡片 -->
        <MetricWiki :metric-metadata="metricMetadata" />

        <!-- 关联指标卡片 -->
        <view class="secondary-cards" v-if="formattedRelatedMetrics.length > 0">
            <view class="info-card" v-for="metric in formattedRelatedMetrics" :key="metric.key"
                @click="navigateToMetric(metric.key)">
                <view class="card-icon" :style="{ backgroundColor: metric.color.bg }">
                    <u-icon :name="metric.icon" :color="metric.color.hex" size="20"></u-icon>
                </view>
                <view class="card-value">{{ metric.displayValue }}<text class="card-unit">{{ metric.displayUnit
                }}</text>
                </view>
                <text class="card-label">{{ metric.title }}</text>
            </view>
        </view>

        <!-- 置顶开关 -->
        <view class="section-card">
            <PinSwitchRow v-model="isPinned" :label="metricStrings.PIN_LABEL" />
        </view>

        <!-- 预约管理：使用新组件 -->
        <ScheduleSection v-if="isSchedulable && !isTaskMode" />

        <!-- 历史记录按钮 -->
        <view class="section-card" @click="viewHistory">
            <HistoryButton :text="metricStrings.HISTORY_CTA" />
        </view>
    </view>

    <!-- Task Completion Modal -->
    <TaskCompletionModal v-model:show="showCompletionModal" :title="metricMetadata.title"
        :form-config="metricMetadata.formConfig" :initial-selections="initialSelections" @confirm="onModalConfirm"
        @cancel="showCompletionModal = false" />

    <!-- Completion Confirmation Picker -->
    <u-datetime-picker :show="showCompletePicker" v-model="completeTimeValue" mode="datetime" title="确认完成时间"
        @confirm="confirmCompletion" @cancel="showCompletePicker = false"></u-datetime-picker>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow, onNavigationBarButtonTap, onUnload } from '@dcloudio/uni-app'

// UI Components
import HistoryButton from '@/components/widgets/HistoryButton.vue'
import PinSwitchRow from '@/components/widgets/PinSwitchRow.vue'
import MetricInsight from '@/components/business/health/MetricInsight.vue'
import MetricWiki from '@/components/business/health/MetricWiki.vue'
import MetricChartArea from '@/components/business/health/MetricChartArea.vue'
import TaskCompletionModal from '@/components/business/health/TaskCompletionModal.vue'

// New Business Components (Refactored)
import TaskModeSection from '@/components/business/health/TaskModeSection.vue'
import NumericStatsSection from '@/components/business/health/NumericStatsSection.vue'
import TimelineSection from '@/components/business/health/TimelineSection.vue'
import ScheduleSection from '@/components/business/health/ScheduleSection.vue'

// Chart Components
import TrendLineChart from '@/components/widgets/charts/TrendLineChart.vue'
import DailyBarChart from '@/components/widgets/charts/DailyBarChart.vue'
import ProgressRingChart from '@/components/widgets/charts/ProgressRingChart.vue'
import RangeSliderChart from '@/components/widgets/charts/RangeSliderChart.vue'
import StatusIconChart from '@/components/widgets/charts/StatusIconChart.vue'
import StatusGridChart from '@/components/widgets/charts/StatusGridChart.vue'
import EventTimelineChart from '@/components/widgets/charts/EventTimelineChart.vue'
import TextChart from '@/components/widgets/charts/TextChart.vue'
import StateGridChart from '@/components/widgets/charts/StateGridChart.vue'

// Composables & Utils
import { useMetricDetail } from '@/composables/useMetricDetail'
import { useChartOptions, getDateFormat } from '@/composables/useChartOptions'
import { useHealthStore } from '@/stores/healthStore'
import { useUnitConverter } from '@/composables/useUnitConverter'
import { getMetricMetadata } from '@/data/metricMetadata'
import { STRINGS } from '@/locale/zh-Hans'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'

// ============================================================================
// State from Composable
// ============================================================================

const {
    metricKey,
    metricMetadata,
    activeTab,
    chartData,
    loading,
    showCompletionModal,
    showCompletePicker,
    completeTimeValue,
    pendingCompleteRecord,
    initialSelections,
    relatedMetricsData,
    isTaskMode,
    isSchedulable,
    isNumericMetric,
    isCustomView,
    theme,
    currentData,
    tabs,
    taskList,
    activeSchedules,
    latestMetricDisplay,
    metricUnitLabel,
    init,
    fetchData,
    setActiveTab,
    onCompleteSchedule,
    onDeleteSchedule,
    processCompletion,
    provideState
} = useMetricDetail()

// Provide state to child components
provideState()

// ============================================================================
// Local State & Constants
// ============================================================================

const metricStrings = STRINGS.METRICS.DETAIL
const HISTORY_UPDATE_EVENT = 'metric-history-updated'
const pendingHistoryRefresh = ref(false)

const healthStore = useHealthStore()
const { formatValueWithUnit } = useUnitConverter()

// Chart Component Map
const CHART_COMPONENTS = {
    trend_line: TrendLineChart,
    daily_bar: DailyBarChart,
    progress_ring: ProgressRingChart,
    range_slider: RangeSliderChart,
    status_icon: StatusIconChart,
    status_grid: StatusGridChart,
    event_timeline: EventTimelineChart,
    text: TextChart,
    state_grid: StateGridChart
}

// ============================================================================
// Computed: Chart Related
// ============================================================================

const currentChartComponent = computed(() => {
    const type = metricMetadata.value.visualization?.type || 'trend_line'
    return CHART_COMPONENTS[type] || TrendLineChart
})

const chartOptions = computed(() => {
    return metricMetadata.value.visualization?.options || {}
})

const xAxisLabels = computed(() => {
    const labels = currentData.value.labels
    const len = labels?.length || 0
    if (len === 0) return []
    return [labels[0], labels[Math.floor(len / 2)], labels[len - 1]]
})

const { isChartType, echartsOptions } = useChartOptions(metricMetadata, currentData, theme, activeTab)

// ============================================================================
// Computed: Related Metrics
// ============================================================================

const formattedRelatedMetrics = computed(() => {
    return relatedMetricsData.value.map((metric) => {
        if (typeof metric.value !== 'number') {
            return { ...metric, displayValue: metric.value, displayUnit: metric.unit }
        }
        const payload = formatValueWithUnit(metric.value, metric.baseUnit || metric.unit)
        const rawValue = typeof payload.value === 'number' ? payload.value : parseFloat(payload.value)
        const formattedValue = typeof rawValue === 'number' && !isNaN(rawValue)
            ? (Number.isInteger(rawValue) ? rawValue.toString() : rawValue.toFixed(1))
            : rawValue
        return { ...metric, displayValue: formattedValue, displayUnit: payload.unit || metric.unit }
    })
})

// ============================================================================
// Computed: Pin State
// ============================================================================

const isPinned = computed({
    get: () => healthStore.pinnedMetrics.some(m => m.key === metricKey.value),
    set: async (val) => {
        const petId = healthStore.currentPetId
        if (petId && metricKey.value) {
            try {
                await healthStore.togglePin(petId, metricKey.value, val)
            } catch (e) {
                uni.showToast({ title: '操作失败', icon: 'none' })
            }
        }
    }
})

// ============================================================================
// Lifecycle
// ============================================================================

const handleHistoryUpdate = (payload = {}) => {
    const key = typeof payload === 'string' ? payload : payload.key
    if (!key || key === metricKey.value) {
        pendingHistoryRefresh.value = true
    }
}

uni.$on(HISTORY_UPDATE_EVENT, handleHistoryUpdate)

onLoad((options) => {
    if (options.key) {
        init(options.key)
        if (metricMetadata.value.title) {
            uni.setNavigationBarTitle({ title: metricMetadata.value.title })
        }
        fetchData()
        fetchRelatedMetrics()
    }
})

onShow(() => {
    if (pendingHistoryRefresh.value) {
        pendingHistoryRefresh.value = false
        fetchData()
    }
})

onNavigationBarButtonTap(() => {
    uni.navigateTo({ url: `/pages/metrics/add?key=${metricKey.value || ''}` })
})

onUnload(() => {
    uni.$off(HISTORY_UPDATE_EVENT, handleHistoryUpdate)
})

watch(activeTab, () => fetchData())

watch(() => metricMetadata.value.title, (title) => {
    if (title) uni.setNavigationBarTitle({ title })
})

// ============================================================================
// Actions
// ============================================================================

async function fetchRelatedMetrics() {
    const relatedKeys = metricMetadata.value.relatedMetrics || []
    if (relatedKeys.length > 0) {
        const relatedData = healthStore.latestMetrics(relatedKeys)
        relatedMetricsData.value = relatedData.map(item => {
            const meta = getMetricMetadata(item.key) || {}
            const category = meta.category || 'default'
            const colorKey = CATEGORY_COLOR_MAP[category] || CATEGORY_COLOR_MAP.default
            return {
                ...item,
                title: meta.title,
                unit: meta.displayUnit || meta.unit || '',
                baseUnit: meta.unit || '',
                color: COLORS[colorKey],
                icon: getIconName(meta.title)
            }
        })
    } else {
        relatedMetricsData.value = []
    }
}

function getIconName(title) {
    if (title?.includes('体重')) return 'grid'
    if (title?.includes('体温')) return 'heart'
    if (title?.includes('睡眠')) return 'moon'
    if (title?.includes('饭')) return 'bag'
    return 'grid'
}

function viewHistory() {
    uni.navigateTo({ url: `/pages/metrics/history?key=${metricKey.value}` })
}

function navigateToMetric(key) {
    uni.redirectTo({ url: `/pages/metrics/detail?key=${key}` })
}

function onChartPointClick(params) {
    if (params?.value) {
        uni.showToast({ title: `${params.name || ''}: ${params.value}`, icon: 'none' })
    }
}

async function onModalConfirm(data) {
    if (!pendingCompleteRecord.value) return
    showCompletionModal.value = false
    loading.value = true
    try {
        await processCompletion(data.completionTime, data.selectedOptions)
    } catch (err) {
        console.error('Check-off failed', err)
        uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
        loading.value = false
        pendingCompleteRecord.value = null
    }
}

async function confirmCompletion(e) {
    if (!pendingCompleteRecord.value) return
    const actualTime = e.value
    showCompletePicker.value = false
    loading.value = true
    try {
        await processCompletion(actualTime)
    } catch (err) {
        console.error('Check-off failed', err)
        uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
        loading.value = false
        pendingCompleteRecord.value = null
    }
}
</script>

<style lang="scss" scoped>
.deworming-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.header-container {
    width: 100%;
    background-color: #ffffff;
    padding-bottom: 24rpx;
}

.detail-container {
    background-color: #f1f1f6;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    min-height: 100vh;
}

.section-card {
    background-color: #ffffff;
    border-radius: 24rpx;
    padding: 32rpx;
}

.action-btn-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.action-btn-text {
    font-size: 30rpx;
    color: #1e293b;
    font-weight: 500;
}

/* Secondary Cards Grid */
.secondary-cards {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;
}

.info-card {
    flex: 1;
    min-width: 45%;
    background: #ffffff;
    border-radius: 20rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.card-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-value {
    font-size: 36rpx;
    font-weight: 600;
    color: #1e293b;
}

.card-unit {
    font-size: 24rpx;
    color: #64748b;
    margin-left: 8rpx;
}

.card-label {
    font-size: 24rpx;
    color: #94a3b8;
}

/* Stats Grid (kept for backward compatibility) */
.stats-grid-wrapper {
    margin-bottom: 24rpx;
}

.stats-grid {
    display: flex;
    gap: 16rpx;
}

.grid-item {
    flex: 1;
    background: #f8fafc;
    border-radius: 16rpx;
    padding: 20rpx;
    text-align: center;
}

.grid-label {
    display: block;
    font-size: 24rpx;
    color: #94a3b8;
    margin-bottom: 8rpx;
}

.grid-value {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
}

/* Timeline Card (kept for backward compatibility) */
.timeline-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32rpx;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.icon-box {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-text {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
}

.subtitle {
    font-size: 24rpx;
    color: #94a3b8;
}

.main-stats {
    text-align: right;
}

.stats-row {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
}

.value {
    font-size: 48rpx;
    font-weight: 700;
    color: #1e293b;
}

.unit {
    font-size: 24rpx;
    color: #94a3b8;
}

.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
}

.timeline-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    margin-top: 8rpx;
    flex-shrink: 0;
}

.timeline-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.timeline-title {
    font-size: 28rpx;
    color: #64748b;

    &.active {
        color: #1e293b;
        font-weight: 500;
    }
}

.timeline-time {
    font-size: 24rpx;
    color: #94a3b8;
}

.empty-state {
    padding: 48rpx 0;
    text-align: center;
}

.empty-text {
    font-size: 28rpx;
    color: #94a3b8;
}

/* Task Mode Styles */
.task-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin: 0 24rpx 24rpx;
}

.chart-tabs-wrapper {
    margin-bottom: 24rpx;
}

.chart-tabs {
    display: flex;
    gap: 16rpx;
    background: #f1f5f9;
    border-radius: 16rpx;
    padding: 8rpx;
}

.tab-item {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    border-radius: 12rpx;
    transition: all 0.2s ease;

    &.active {
        background: #fff;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
    }
}

.tab-text {
    font-size: 26rpx;
    color: #64748b;

    .active & {
        color: #1e293b;
        font-weight: 500;
    }
}
</style>
