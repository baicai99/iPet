<template>
    <view class="content">
        <!-- Pet Selector Carousel -->
        <PetSelectorBar v-if="activePets.length > 1" :pets="activePets" mode="select" @add="handleAddPet"
            @click="handlePetSelect" />

        <!-- Pinned Metrics -->
        <view class="section section-group">
            <view class="section-header">
                <text class="section-title">{{ t('SUMMARY.PINNED_TITLE') }}</text>
            </view>
            <template v-if="pinnedMetricKeys.length">
                <PinnedMetricsWidget :metric-keys="pinnedMetricKeys" @add="goManageMetrics"
                    @metric-click="goToMetric" />
            </template>
            <u-empty class="empty" v-else text="暂无置顶数据" mode="data"></u-empty>
            <view class="action-button">
                <u-button type="primary" plain shape="circle" :text="t('SUMMARY.PINNED_CTA')"
                    @click="goManageMetrics"></u-button>
            </view>
        </view>

        <!-- Trends -->
        <view class="section section-group">
            <view class="section-header">
                <text class="section-title">{{ t('SUMMARY.TRENDS_TITLE') }}</text>
            </view>
            <view class="trends-section" v-if="changedMetricKeys.length">
                <TrendCard v-for="key in changedMetricKeys.slice(0, 3)" :key="key" :metricKey="key"
                    :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                    :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" :themeBg="getMetricBg(key)" />
            </view>
            <u-empty v-else class="empty" text="暂无趋势变化" mode="data"></u-empty>
            <view class="action-button">
                <u-button type="primary" plain shape="circle" :text="t('SUMMARY.TRENDS_CTA')"
                    @click="goViewTrends"></u-button>
            </view>
        </view>

        <!-- Articles -->
        <view class="section section-group">
            <view class="section-header">
                <text class="section-title">{{ t('SUMMARY.ARTICLES_TITLE') }}</text>
            </view>
            <view class="articles-list" v-if="articles.length > 0">
                <ArticleCard v-for="(article, index) in articles" :key="article.id" :id="article.id"
                    :title="article.title" :summary="article.summary" :cover="article.cover"
                    :category="article.category" :isNew="isArticleNew(article.updateTime, index)"
                    :updateTime="article.updateTime" />
            </view>
            <u-empty class="empty" v-else text="暂无推荐文章" mode="list"></u-empty>
            <view class="action-button" v-if="articles.length">
                <u-button type="primary" plain shape="circle" :text="t('SUMMARY.ARTICLES_CTA')"
                    @click="goViewArticles"></u-button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { onPullDownRefresh, onShow, onHide } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import PetSelectorBar from '@/components/profile/PetSelectorBar.vue'
import PinnedMetricsWidget from '@/components/widgets/PinnedMetricsWidget.vue'
import TrendCard from '@/components/widgets/TrendCard.vue'
import ArticleCard from '@/components/business/social/ArticleCard.vue'
import { usePetViewModel } from '@/composables/usePetViewModel'
import { usePetCommands } from '@/composables/usePetCommands'
import { useHealthStore } from '@/stores/healthStore'
import { useArticleStore } from '../../stores/articleStore'
import { useAppStore } from '@/stores/appStore'
import { storeToRefs } from 'pinia'
import { onDataChanged } from '@/services/syncEvents'
import { useSummaryData } from '@/composables/useSummaryData'
import { METRIC_METADATA, type MetricKey } from '@/data/metricMetadata'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'
import type { Article } from '@/types/article'

const { t } = useI18n()

// ============================================================================
// Store & ViewModel Setup
// ============================================================================

const petViewModel = usePetViewModel()
const petCommands = usePetCommands()
const healthStore = useHealthStore()
const articleStore = useArticleStore()
const appStore = useAppStore()

const { activePets, selectedPetId, isLoading: petsLoading } = petViewModel
const { pinnedMetrics: rawPinnedMetrics } = storeToRefs(healthStore)

// ============================================================================
// Summary Data (via Composable)
// ============================================================================

const { stepTrendData, isLoading, loadSummaryData, refresh, startAutoRefresh, stopAutoRefresh } = useSummaryData(selectedPetId)

// ============================================================================
// Computed Properties
// ============================================================================

const pinnedMetricKeys = computed(() => {
    return rawPinnedMetrics.value.map(m => m.key)
})

const articles = computed<Article[]>(() => articleStore.getLatestArticles(3))

/**
 * 判断文章是否为"最新"（updateTime 在7天内，或是第一篇）
 */
const isArticleNew = (updateTime: string, index: number): boolean => {
    if (index === 0) return true // 第一篇总是显示最新标识
    if (!updateTime) return false
    const articleDate = new Date(updateTime)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
}

// ============================================================================
// Trend Change Detection (for summary display)
// ============================================================================

const TREND_METRIC_KEYS = Object.keys(METRIC_METADATA)
const THRESHOLD_PERCENT = 30
const MIN_DATA_POINTS = 20

const changedMetricKeys = computed(() => {
    return TREND_METRIC_KEYS.filter(key => {
        const records = healthStore.metricHistory(key) || []
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

        // Split and calculate
        const limitedPoints = dailyTotals.slice(-40)
        const midpoint = Math.floor(limitedPoints.length / 2)
        const previous = limitedPoints.slice(0, midpoint)
        const recent = limitedPoints.slice(midpoint)

        const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length

        if (prevAvg === 0) return false

        const changePercent = Math.abs((recentAvg - prevAvg) / prevAvg * 100)
        return changePercent >= THRESHOLD_PERCENT
    })
})

// Helper functions for TrendCard props
const getMetricTitle = (key: string) => METRIC_METADATA[key as MetricKey]?.title || key
const getMetricIcon = (key: string) => METRIC_METADATA[key as MetricKey]?.icon || 'chart-bar'
const getMetricUnit = (key: string) => METRIC_METADATA[key as MetricKey]?.displayUnit || METRIC_METADATA[key as MetricKey]?.unit || ''
const getMetricColor = (key: string) => {
    const category = METRIC_METADATA[key as MetricKey]?.category || 'default'
    const colorKey = CATEGORY_COLOR_MAP[category as keyof typeof CATEGORY_COLOR_MAP] || 'orange'
    return COLORS[colorKey as keyof typeof COLORS]?.hex || '#ff453a'
}
const getMetricBg = (key: string) => {
    const category = METRIC_METADATA[key as MetricKey]?.category || 'default'
    const colorKey = CATEGORY_COLOR_MAP[category as keyof typeof CATEGORY_COLOR_MAP] || 'orange'
    return COLORS[colorKey as keyof typeof COLORS]?.bg || '#fff7ed'
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

const closeSplash = () => {
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus?.navigator) {
        plus.navigator.closeSplashscreen()
    }
    // #endif
}

onShow(() => {
    // 启动自动刷新（T5.1：连续使用 > 10 分钟自动刷新）
    startAutoRefresh()

    // 每次页面显示时，如果 App 已准备好，刷新关键数据
    if (appStore.isAppReady) {
        // 强制刷新宠物列表，解决登录后数据不显示的问题
        petViewModel.refresh()

        // 如果有选中的宠物，也刷新健康摘要
        if (selectedPetId.value) {
            loadSummaryData(selectedPetId.value)
        }
    }
})

onHide(() => {
    // 停止自动刷新
    stopAutoRefresh()
})

onMounted(() => {
    const initData = () => {
        petViewModel.ensureHydrated()
        // 加载静态文章数据
        articleStore.ensureLoaded()
        // Initial load
        if (selectedPetId.value) {
            healthStore.initSummaryPage(selectedPetId.value, { force: false })
                .catch((error: unknown) => {
                    console.error('Failed to hydrate summary snapshot', error)
                })
        }
        closeSplash()
    }

    if (appStore.isAppReady) {
        initData()
    } else {
        const unwatch = watch(() => appStore.isAppReady, (ready) => {
            if (ready) {
                initData()
                unwatch()
            }
        })
    }

    // Subscribe to data changes
    onDataChanged((event) => {
        if (event.reason === 'metrics:record-added' && selectedPetId.value) {
            // Refresh summary silently
            refresh(selectedPetId.value)
        }
    })
})

onPullDownRefresh(async () => {
    try {
        await petViewModel.refresh()
        if (selectedPetId.value) {
            await refresh(selectedPetId.value)
        }
    } finally {
        uni.stopPullDownRefresh()
    }
})

// ============================================================================
// Navigation Handlers
// ============================================================================

const handleAddPet = () => {
    uni.navigateTo({ url: '/pages/my/pet/add' })
}

const handlePetSelect = (petId: string) => {
    petViewModel.selectPet(petId)
}

const goManageMetrics = () => {
    uni.navigateTo({ url: '/pages/metrics/list' })
}

const goToMetric = (key: string) => {
    uni.navigateTo({ url: `/pages/metrics/detail?key=${key}` })
}

const goViewTrends = () => {
    uni.navigateTo({ url: '/pages/trends/trends' })
}

const goViewArticles = () => {
    uni.navigateTo({ url: '/pages/articles/list' })
}
</script>

<style lang="scss" scoped>
.empty {
    background-color: white;
    border-radius: 30rpx;
    padding: 30rpx;
}

.trends-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.articles-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.content {
    padding: 24rpx 0;
    /* Step 1: Flex layout for root */
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    overflow-x: hidden;
}

.section {
    padding: 0 32rpx;
    /* Step 2: Remove margin-bottom, handled by gap */
    /* margin-bottom: 32rpx; */
}

.section-group {
    /* Step 3: Internal spacing for groups */
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-title {
    font-size: 34rpx;
    font-weight: bold;
    color: $uni-text-color;
}

.empty-trend {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64rpx 32rpx;
    gap: 16rpx;
    background-color: white;
    border-radius: 48rpx;
}

.empty-trend-text {
    font-size: 28rpx;
    color: #8e8e93;
}
</style>
