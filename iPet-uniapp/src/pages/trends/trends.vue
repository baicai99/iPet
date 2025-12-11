<template>
    <view class="trends-page">
        <view class="content">
            <!-- Changed Metrics Section -->
            <view class="section-container">
                <view class="section-header">
                    <text class="section-title">有趋势变化</text>
                </view>
                <view class="trend-grid" v-if="changedMetricKeys.length">
                    <TrendCard v-for="key in changedMetricKeys" :key="key" :metricKey="key" :title="getMetricTitle(key)"
                        :icon="getMetricIcon(key)" :unit="getMetricUnit(key)" :petId="selectedPetId || ''"
                        :primaryColor="getMetricColor(key)" />
                </view>
                <u-empty v-else mode="data" text="暂无变化趋势"></u-empty>
            </view>

            <!-- Stable Metrics Section -->
            <view class="section-container">
                <view class="section-header">
                    <text class="section-title">无趋势变化</text>
                </view>
                <view class="trend-grid" v-if="stableMetricKeys.length">
                    <TrendCard v-for="key in stableMetricKeys" :key="key" :metricKey="key" :title="getMetricTitle(key)"
                        :icon="getMetricIcon(key)" :unit="getMetricUnit(key)" :petId="selectedPetId || ''"
                        :primaryColor="getMetricColor(key)" :isStable="true" />
                </view>
                <u-empty v-else mode="data" text="暂无稳定趋势"></u-empty>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TrendCard from '@/components/widgets/TrendCard.vue'
import { useHealthStore } from '@/stores/healthStore'
import { usePetViewModel } from '@/composables/usePetViewModel'
import { METRIC_METADATA, type MetricKey } from '@/data/metricMetadata'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'
import type { HealthRecord } from '@shared/types/health'

const healthStore = useHealthStore()
const petViewModel = usePetViewModel()
const { selectedPetId } = petViewModel

// Use ALL metrics from metadata
const TREND_METRIC_KEYS = Object.keys(METRIC_METADATA)

// Threshold for significant change (same as useTrendCard)
const THRESHOLD_PERCENT = 30
const MIN_DATA_POINTS = 20

// Track which metrics have significant changes
const metricChangeStatus = ref<Record<string, boolean>>({})

// Helper to calculate if a metric has significant change
function calculateHasChange(metricKey: string): boolean {
    const records = healthStore.metricHistory(metricKey) || []
    if (records.length < MIN_DATA_POINTS) return false

    // Group by date
    const groups = new Map<string, number[]>()
    for (const record of records) {
        const dateKey = record.date?.split('T')[0] || ''
        if (!dateKey) continue
        if (!groups.has(dateKey)) groups.set(dateKey, [])
        groups.get(dateKey)!.push(record.value)
    }

    // Aggregate to daily totals
    const sortedKeys = Array.from(groups.keys()).sort()
    const dailyTotals = sortedKeys.map(key => {
        const values = groups.get(key)!
        return values.reduce((a, b) => a + b, 0)
    })

    if (dailyTotals.length < MIN_DATA_POINTS) return false

    // Split into previous/recent
    const limitedPoints = dailyTotals.slice(-40)
    const midpoint = Math.floor(limitedPoints.length / 2)
    const previous = limitedPoints.slice(0, midpoint)
    const recent = limitedPoints.slice(midpoint)

    // Calculate averages
    const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length

    if (prevAvg === 0) return false

    const changePercent = Math.abs((recentAvg - prevAvg) / prevAvg * 100)
    return changePercent >= THRESHOLD_PERCENT
}

// Compute change status for all metrics
function updateChangeStatus() {
    const status: Record<string, boolean> = {}
    for (const key of TREND_METRIC_KEYS) {
        status[key] = calculateHasChange(key)
    }
    metricChangeStatus.value = status
}

// Split metrics by change status
const changedMetricKeys = computed(() => {
    return TREND_METRIC_KEYS.filter(key => metricChangeStatus.value[key] === true)
})

const stableMetricKeys = computed(() => {
    return TREND_METRIC_KEYS.filter(key => metricChangeStatus.value[key] === false)
})

// Helper functions
const getMetricTitle = (key: string) => {
    return METRIC_METADATA[key as MetricKey]?.title || key
}

const getMetricIcon = (key: string) => {
    return METRIC_METADATA[key as MetricKey]?.icon || 'chart-bar'
}

const getMetricUnit = (key: string) => {
    return METRIC_METADATA[key as MetricKey]?.displayUnit || METRIC_METADATA[key as MetricKey]?.unit || ''
}

const getMetricColor = (key: string) => {
    const category = METRIC_METADATA[key as MetricKey]?.category || 'default'
    const colorKey = CATEGORY_COLOR_MAP[category as keyof typeof CATEGORY_COLOR_MAP] || 'orange'
    return COLORS[colorKey as keyof typeof COLORS]?.hex || '#ff453a'
}

onMounted(async () => {
    if (selectedPetId.value) {
        await healthStore.fetchHealthRecords(selectedPetId.value)
        await healthStore.refreshSummary(selectedPetId.value)
        updateChangeStatus()
    }
})

// Update when pet changes
watch(selectedPetId, async (newPetId) => {
    if (newPetId) {
        await healthStore.fetchHealthRecords(newPetId)
        updateChangeStatus()
    }
})
</script>

<style scoped>
.trends-page {
    background-color: #f8f8f8;
    min-height: 100vh;
}

.content {
    padding: 24rpx;
}

.section-container {
    margin-bottom: 32rpx;
}

.section-header {
    margin-bottom: 24rpx;
    padding-left: 8rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.trend-grid {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}
</style>
