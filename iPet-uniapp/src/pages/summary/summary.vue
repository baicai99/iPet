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

const { stepTrendData, isLoading, loadSummaryData, refresh, startAutoRefresh, stopAutoRefresh, cancelPendingRequests } = useSummaryData(selectedPetId)

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
// Trend Detection (from Store Getters)
// ============================================================================

const changedMetricKeys = computed(() => healthStore.getChangedMetricKeys())

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

// 标记是否已完成首次初始化
let isInitialized = false

const closeSplash = () => {
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus?.navigator) {
        plus.navigator.closeSplashscreen()
    }
    // #endif
}

/**
 * ✅ 单一初始化入口（onMounted ONLY）
 * 
 * 原则：
 * - initData() 只在这里触发一次
 * - 包含首次数据加载（使用 ensureDataLoaded，内置 SWR 缓存）
 * - onShow 不再触发数据加载，只做轻量恢复
 */
onMounted(() => {
    const initData = async () => {
        // 1. 水合宠物数据
        petViewModel.ensureHydrated()

        // 2. 加载静态文章数据
        articleStore.ensureLoaded()

        // 3. 首次数据加载（使用 ensureDataLoaded，优先缓存）
        if (selectedPetId.value) {
            // ✅ 使用 healthStore.ensureDataLoaded 而非 loadSummaryData
            // ensureDataLoaded 会优先返回缓存，后台刷新
            await healthStore.ensureDataLoaded(selectedPetId.value)

            // ✅ 加载 summary 特定数据（trends 等）
            await loadSummaryData(selectedPetId.value)
        }

        // 4. 关闭启动屏
        closeSplash()

        // 5. 标记已初始化
        isInitialized = true
    }

    // App Ready 检查（确保 store 已准备好）
    if (appStore.isAppReady) {
        initData()
    } else {
        const unwatch = watch(() => appStore.isAppReady, (ready) => {
            if (ready && !isInitialized) {
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

/**
 * ✅ 轻量恢复（onShow ONLY）
 * 
 * 原则：
 * - 只做"恢复"操作，不做"初始化"
 * - 启动定时器
 * - 检查数据是否过期，必要时后台刷新（SWR）
 * - 不阻塞 UI 主线程
 */
onShow(() => {
    // 1. 启动自动刷新定时器
    startAutoRefresh()

    // 2. 如果未初始化，跳过（等待 onMounted 完成）
    if (!isInitialized || !appStore.isAppReady || !selectedPetId.value) {
        return
    }

    // 3. ✅ 轻量检查：数据是否过期（SWR 模式）
    // ensureDataLoaded 内部会判断：
    // - 数据新鲜 → 立即返回（0ms）
    // - 数据过期 → 后台刷新（不阻塞）
    healthStore.ensureDataLoaded(selectedPetId.value)
})

/**
 * 页面隐藏时的清理
 */
onHide(() => {
    // 停止自动刷新
    stopAutoRefresh()

    // 取消待处理的请求（避免stale请求覆盖新数据）
    cancelPendingRequests()
})

// ============================================================================
// Pet Watch (Passive - Only Cancel Requests)
// ============================================================================

// ✅ PASSIVE WATCH: 只取消旧请求，不主动触发新请求
// 数据加载由 onShow 统一触发
watch(selectedPetId, (newPetId, oldPetId) => {
    if (oldPetId && newPetId !== oldPetId) {
        // 取消旧宠物的待处理请求
        cancelPendingRequests()
    }
    // ❌ DO NOT call loadSummaryData() here
    // ✅ 数据将在下次 onShow 时自动加载
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
