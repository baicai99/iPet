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

const healthStore = useHealthStore()
const petViewModel = usePetViewModel()
const { selectedPetId } = petViewModel

// ============================================================================
// Trend Detection (from Store Getters)
// ============================================================================

const changedMetricKeys = computed(() => healthStore.getChangedMetricKeys())
const stableMetricKeys = computed(() => healthStore.getStableMetricKeys())

// ============================================================================
// Helper Functions
// ============================================================================
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
    }
})

// Update when pet changes
watch(selectedPetId, async (newPetId) => {
    if (newPetId) {
        await healthStore.fetchHealthRecords(newPetId)
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
