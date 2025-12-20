<template>
    <view class="page-container">
        <view class="trends-page">
            <view class="content">
                <!-- ============================================ -->
                <!-- Unified Hint Card (shown when no trends) -->
                <!-- ============================================ -->
                <TrendHintCard v-if="trendStatus.status !== 'has-trends'" :message="trendStatus.message"
                    navigate-to="/pages/metrics/list" />

                <!-- ============================================ -->
                <!-- Sections (only shown when has trends) -->
                <!-- ============================================ -->
                <template v-else>
                    <!-- Changed Metrics Section -->
                    <view v-if="changedMetricKeys.length" class="section-container">
                        <text class="section-title section-title-changed">有趋势变化</text>
                        <view class="trend-grid">
                            <TrendCard v-for="key in changedMetricKeys" :key="key" :metricKey="key"
                                :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                                :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" />
                        </view>
                    </view>

                    <!-- Stable Metrics Section -->
                    <view v-if="stableMetricKeys.length" class="section-container">
                        <text class="section-title section-title-stable">无趋势变化</text>
                        <view class="trend-grid">
                            <TrendCard v-for="key in stableMetricKeys" :key="key" :metricKey="key"
                                :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                                :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" :isStable="true" />
                        </view>
                    </view>
                </template>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import TrendCard from '@/components/widgets/TrendCard.vue'
import TrendHintCard from '@/components/widgets/TrendHintCard.vue'
import { useHealthStore } from '@/stores/healthStore'
import { usePetViewModel } from '@/composables/usePetViewModel'
import { METRIC_METADATA, type MetricKey } from '@/data/metricMetadata'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'
import { getTrendStatus } from '@/domain/trend/getTrendStatus'
import { ICONFONT_UNICODE } from '@/utils/ui/iconfont'

const healthStore = useHealthStore()
const petViewModel = usePetViewModel()
const { selectedPetId } = petViewModel

// ============================================================================
// Trend Status Detection
// ============================================================================

/**
 * ✅ 动态判断趋势数据状态
 * - 数据不足 → 显示采样提示
 * - 全部稳定 → 显示稳定提示
 * - 有趋势 → 显示趋势卡片
 */
const trendStatus = computed(() => {
    const totalDays = healthStore.getTotalRecordDays()
    return getTrendStatus(healthStore.metricTrendMap, totalDays)
})

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
    return METRIC_METADATA[key as MetricKey]?.iconUnicode || ICONFONT_UNICODE.file
}

const getMetricUnit = (key: string) => {
    return METRIC_METADATA[key as MetricKey]?.displayUnit || METRIC_METADATA[key as MetricKey]?.unit || ''
}

const getMetricColor = (key: string) => {
    const category = METRIC_METADATA[key as MetricKey]?.category || 'default'
    const colorKey = CATEGORY_COLOR_MAP[category as keyof typeof CATEGORY_COLOR_MAP] || 'orange'
    return COLORS[colorKey as keyof typeof COLORS]?.hex || '#ff453a'
}

// ============================================================================
// Lifecycle & Data Loading
// ============================================================================

onMounted(async () => {
    if (selectedPetId.value) {
        // ✅ 使用统一入口，替代双重全量请求
        await healthStore.ensureDataLoaded(selectedPetId.value)
    }
})

// Update when pet changes
watch(selectedPetId, async (newPetId) => {
    if (newPetId) {
        // ✅ 使用统一入口（自动去重）
        await healthStore.ensureDataLoaded(newPetId)
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

.section-title {
    display: block;
    margin-bottom: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.section-title-changed {
    color: #f97316;
}

.section-title-stable {
    color: #059669;
}

.trend-grid {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}
</style>
