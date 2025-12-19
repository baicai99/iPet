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
                        <view class="section-header section-header-changed">
                            <view class="section-header-content">
                                <view class="section-icon section-icon-changed">
                                    <svg class="icon" aria-hidden="true" style="font-size: 20px">
                                        <use xlink:href="#trending-up"></use>
                                    </svg>
                                </view>
                                <text class="section-title">有趋势变化</text>
                            </view>
                            <view class="section-badge section-badge-changed">
                                <text class="section-badge-text">{{ changedMetricKeys.length }}</text>
                            </view>
                        </view>
                        <view class="trend-grid">
                            <TrendCard v-for="key in changedMetricKeys" :key="key" :metricKey="key"
                                :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                                :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" />
                        </view>
                    </view>

                    <!-- Stable Metrics Section -->
                    <view v-if="stableMetricKeys.length" class="section-container">
                        <view class="section-header section-header-stable">
                            <view class="section-header-content">
                                <view class="section-icon section-icon-stable">
                                    <svg class="icon" aria-hidden="true" style="font-size: 20px">
                                        <use xlink:href="#checkmark-circle"></use>
                                    </svg>
                                </view>
                                <text class="section-title section-title-stable">无趋势变化</text>
                            </view>
                            <view class="section-badge section-badge-stable">
                                <text class="section-badge-text">{{ stableMetricKeys.length }}</text>
                            </view>
                        </view>
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

.section-header {
    margin-bottom: 24rpx;
    padding: 20rpx 24rpx;
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border-radius: 24rpx;
    border-left: 6rpx solid #fb923c;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-header-content {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.section-icon {
    width: 48rpx;
    height: 48rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.section-icon-changed {
    background: linear-gradient(135deg, #ff6b35 0%, #f97316 100%);
    color: #ffffff;
    box-shadow: 0 4rpx 12rpx rgba(251, 146, 60, 0.25);
}

.section-icon-stable {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.25);
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.section-title-stable {
    color: #059669;
}

.section-badge {
    min-width: 44rpx;
    height: 44rpx;
    padding: 0 12rpx;
    border-radius: 22rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.section-badge-changed {
    background: linear-gradient(135deg, #ff6b35 0%, #f97316 100%);
    box-shadow: 0 2rpx 8rpx rgba(251, 146, 60, 0.3);
}

.section-badge-stable {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.section-badge-text {
    font-size: 24rpx;
    font-weight: 700;
    color: #ffffff;
}

.section-badge-stable .section-badge-text {
    color: #059669;
}

.section-header-changed {
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border-left-color: #fb923c;
}

.section-header-stable {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-left-color: #22c55e;
}

.trend-grid {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}
</style>
