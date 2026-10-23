<template>
    <view class="page-container">
        <view class="trends-page">
            <u-pull-refresh class="pull-refresh" :refreshing="isPullRefreshing" @refresh="handlePullRefresh">
                <view class="content">
                <!-- ============================================ -->
                <!-- 判断逻辑：基于「是否有任何指标满足数据要求」 -->
                <!-- ============================================ -->

                <!-- 
                    全局空态：仅当「没有任何指标有足够数据」时显示
                    - changedMetricKeys.length === 0 (没有趋势变化的指标)
                    - stableMetricsWithData.length === 0 (没有稳定的指标)
                    - 说明：所有指标都还在采集阶段
                -->
                <template v-if="!hasAnyMetricWithSufficientData">
                    <TrendHintCard 
                        :message="samplingMessage"
                        navigate-to="/pages/metrics/list" 
                    />
                    
                    <!-- 仍然显示正在采集的指标列表 -->
                    <view v-if="insufficientDataMetrics.length > 0" class="section-container" style="margin-top: 32rpx;">
                        <text class="section-title section-title-sampling">正在采集样本</text>
                        <view class="sampling-hint-card">
                            <text class="sampling-hint-text">以下指标正在采集数据中，累计 20 天后将显示趋势分析</text>
                            <view class="sampling-tags">
                                <text v-for="key in insufficientDataMetrics" :key="key" class="sampling-tag">
                                    {{ getMetricTitle(key) }}
                                </text>
                            </view>
                        </view>
                    </view>
                </template>

                <!-- ============================================ -->
                <!-- 正常展示：有指标满足数据要求时 -->
                <!-- ============================================ -->
                <template v-else>
                    <!-- Section 1: Changed Metrics (存在趋势变化) -->
                    <view v-if="changedMetricKeys.length > 0" class="section-container">
                        <text class="section-title section-title-changed">存在趋势变化</text>
                        <view class="trend-grid">
                            <TrendCard v-for="key in changedMetricKeys" :key="key" :metricKey="key"
                                :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                                :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" />
                        </view>
                    </view>

                    <!-- Section 2: Stable Metrics with sufficient data (无趋势变化) -->
                    <view v-if="stableMetricsWithData.length > 0" class="section-container">
                        <text class="section-title section-title-stable">无趋势变化</text>
                        <view class="trend-grid">
                            <TrendCard v-for="key in stableMetricsWithData" :key="key" :metricKey="key"
                                :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                                :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" :isStable="true" />
                        </view>
                    </view>

                    <!-- Section 3: Metrics still sampling (正在采集样本) -->
                    <view v-if="insufficientDataMetrics.length > 0" class="section-container">
                        <text class="section-title section-title-sampling">正在采集样本</text>
                        <view class="sampling-hint-card">
                            <text class="sampling-hint-text">以下指标正在采集数据中，累计 20 天后将显示趋势分析</text>
                            <view class="sampling-tags">
                                <text v-for="key in insufficientDataMetrics" :key="key" class="sampling-tag">
                                    {{ getMetricTitle(key) }}
                                </text>
                            </view>
                        </view>
                    </view>
                </template>
                </view>
            </u-pull-refresh>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import TrendCard from '@/components/widgets/TrendCard.vue'
import TrendHintCard from '@/components/widgets/TrendHintCard.vue'
import { useHealthStore } from '@/stores/healthStore'
import { usePetViewModel } from '@/composables/usePetViewModel'
import { METRIC_METADATA, type MetricKey } from '@/data/metricMetadata'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'
import { ICONFONT_UNICODE } from '@/utils/ui/iconfont'

const healthStore = useHealthStore()
const petViewModel = usePetViewModel()
const { selectedPetId } = petViewModel
const isPullRefreshing = ref(false)

// ============================================================================
// Trend Detection (from Store Getters)
// ============================================================================

const changedMetricKeys = computed(() => healthStore.getChangedMetricKeys())

// ✅ NEW: 获取数据充足且稳定的指标
const stableMetricsWithData = computed(() => healthStore.getStableMetricsWithSufficientData())

// ✅ NEW: 获取数据不足的指标（正在采集中）
const insufficientDataMetrics = computed(() => healthStore.getMetricsWithInsufficientData())

/**
 * ✅ 核心判断：是否有任何指标达到数据充足状态
 * 
 * 判断依据：
 * - changedMetricKeys 中的指标都有足够数据（否则不可能检测出趋势变化）
 * - stableMetricsWithData 中的指标也有足够数据（函数定义保证）
 * 
 * 当此值为 true 时，应展示趋势分析结果
 * 当此值为 false 时，说明所有指标都还在采集阶段
 */
const hasAnyMetricWithSufficientData = computed(() => {
    return changedMetricKeys.value.length > 0 || stableMetricsWithData.value.length > 0
})

/**
 * ✅ 采样阶段的提示文案
 */
const samplingMessage = computed(() => {
    const totalDays = healthStore.getTotalRecordDays()
    return `正在采集样本，累计采样 ${totalDays} 天`
})

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

const handlePullRefresh = async () => {
    isPullRefreshing.value = true
    try {
        if (selectedPetId.value) {
            await healthStore.ensureDataLoaded(selectedPetId.value)
        }
    } finally {
        isPullRefreshing.value = false
    }
}
</script>

<style scoped>
.trends-page {
    background-color: #f8f8f8;
    min-height: 100vh;
}

.pull-refresh {
    height: 100vh;
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

.section-title-sampling {
    color: #6366f1;
}

.sampling-hint-card {
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 32rpx;
}

.sampling-hint-text {
    display: block;
    font-size: 28rpx;
    color: #64748b;
    margin-bottom: 24rpx;
    line-height: 1.5;
}

.sampling-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.sampling-tag {
    background-color: #f1f5f9;
    color: #475569;
    font-size: 26rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
}
</style>
