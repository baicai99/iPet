<template>
    <view class="content">
        <!-- ✅ Lightweight Refresh Indicator (后台刷新时的轻量态) -->
        <view v-if="isBackgroundRefreshing" class="refresh-indicator">
            <u-loading-icon mode="circle" size="20" color="#ff6b35" />
        </view>

        <!-- Pet Selector Carousel -->
        <PetSelectorBar v-if="activePets.length > 1" :pets="activePets" mode="select" @add="handleAddPet"
            @click="handlePetSelect" />

        <!-- Pinned Metrics -->
        <view class="section section-group">
            <view class="section-header">
                <text class="section-title">{{ t('SUMMARY.PINNED_TITLE') }}</text>
            </view>

            <!-- ✅ Show data when has pinned metrics -->
            <PinnedMetricsWidget v-if="pinnedMetricKeys.length > 0" :metric-keys="pinnedMetricKeys"
                @add="goManageMetrics" @metric-click="goToMetric" />

            <!-- ✅ Show hint card when no pinned metrics -->
            <TrendHintCard v-else message="当前没有任何置顶" navigate-to="/pages/metrics/list" />

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

            <!-- ✅ 使用统一 AppSectionState 组件 -->
            <AppSectionState :section-state="trendsState" :min-height="trendsMinHeight">
                <!-- ✅ Three-State Rendering Logic -->
                <!-- State 1: Has Trends - Show TrendCard list -->
                <view v-if="changedMetricKeys.length > 0" class="trends-section">
                    <TrendCard v-for="key in changedMetricKeys.slice(0, 3)" :key="key" :metricKey="key"
                        :title="getMetricTitle(key)" :icon="getMetricIcon(key)" :unit="getMetricUnit(key)"
                        :petId="selectedPetId || ''" :primaryColor="getMetricColor(key)" :themeBg="getMetricBg(key)" />
                </view>
                <!-- State 2: No Change - Show dynamic hint (insufficient data OR stable) -->
                <view v-else class="trends-section">
                    <TrendHintCard :message="trendStatusHint.message" navigate-to="/pages/trends/trends" />
                </view>
                <!-- State 3: Loading - Skeleton handled by AppSectionState -->
            </AppSectionState>

            <view class="action-button">
                <u-button type="primary" plain shape="circle" :text="t('SUMMARY.TRENDS_CTA')"
                    @click="goViewTrends"></u-button>
            </view>
        </view>

        <!-- Articles -->
        <view class="section section-group">
            <view class="section-header">
                <text class="section-title">{{ articlesSectionTitle }}</text>
            </view>

            <!-- ✅ 使用统一 AppSectionState 组件 -->
            <AppSectionState :section-state="articlesState" empty-reason="no-articles" min-height="500rpx">
                <!-- Data Slot -->
                <view class="articles-list">
                    <ArticleCard v-for="(article, index) in articles" :key="article.id" :id="article.id"
                        :title="article.title" :summary="article.summary" :cover="article.cover"
                        :category="article.category" :isNew="isArticleNew(article.updateTime, index)"
                        :updateTime="article.updateTime" />
                </view>
            </AppSectionState>

            <view class="action-button" v-if="articles.length">
                <u-button type="primary" plain shape="circle" :text="t('SUMMARY.ARTICLES_CTA')"
                    @click="goViewArticles"></u-button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, nextTick } from 'vue'  // ✅ Added ref for skeleton state, nextTick for reactivity timing
import { onPullDownRefresh, onShow, onHide } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import PetSelectorBar from '@/components/profile/PetSelectorBar.vue'
import PinnedMetricsWidget from '@/components/widgets/PinnedMetricsWidget.vue'
import TrendCard from '@/components/widgets/TrendCard.vue'
import TrendHintCard from '@/components/widgets/TrendHintCard.vue'  // ✅ UPDATED: Use generic hint card
import ArticleCard from '@/components/business/social/ArticleCard.vue'
import AppSectionState from '@/components/common/AppSectionState.vue'  // ✅ NEW: 统一状态组件
import { usePetViewModel } from '@/composables/usePetViewModel'
import { usePetCommands } from '@/composables/usePetCommands'
import { useHealthStore } from '@/stores/healthStore'
import { useArticleStore } from '@/modules/articles/store/articleStore'
import { useAppStore } from '@/stores/appStore'
import { storeToRefs } from 'pinia'
import { onDataChanged } from '@/services/syncEvents'
import { useSummaryData } from '@/composables/useSummaryData'
import { METRIC_METADATA, type MetricKey } from '@/data/metricMetadata'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'
import type { ArticleManifestItem } from '@/modules/articles/domain/types'
import healthCacheService from '@/services/healthCacheService'  // ✅ NEW: 同步读取缓存
import { useSectionState } from '@/composables/useSectionState'  // ✅ NEW: 分区状态机
import { getTrendStatus } from '@/domain/trend/getTrendStatus'  // ✅ FIX: Import trend status detection

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
const { pinnedMetrics: rawPinnedMetrics, tasks, trends, dailySummaries } = storeToRefs(healthStore)  // ✅ NEW: 增加 tasks/trends/dailySummaries 用于同步缓存填充

// ✅ Section-Based State Machine（替代全局 loading）
const pinnedState = useSectionState()   // 置顶指标独立状态
const trendsState = useSectionState()   // 趋势独立状态
const articlesState = useSectionState() // 文章独立状态

// 🐛 DEBUG: Watch state transitions
watch(() => pinnedState.state.value, (newState) => {
    console.log('[DEBUG] pinnedState changed:', newState,
        'shouldShowData:', pinnedState.shouldShowData.value)
})
watch(() => trendsState.state.value, (newState) => {
    console.log('[DEBUG] trendsState changed:', newState,
        'shouldShowData:', trendsState.shouldShowData.value)
})
watch(() => articlesState.state.value, (newState) => {
    console.log('[DEBUG] articlesState changed:', newState,
        'shouldShowData:', articlesState.shouldShowData.value)
})

// ✅ 保留轻量刷新态（所有 section 共用）
const isBackgroundRefreshing = ref(false)

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

/**
 * ✅ Dynamic min-height for pinned section
 * - Formula: cardHeight * count + gap * (count-1)
 * - Card height: 180rpx, Gap: 16rpx
 * - Examples: 1 card = 180rpx, 2 cards = 376rpx, 3 cards = 548rpx
 */
const pinnedMinHeight = computed(() => {
    const count = pinnedMetricKeys.value.length
    if (count === 0) return '180rpx' // Minimum height for empty state
    const totalHeight = 180 * count + 16 * (count - 1)
    return `${totalHeight}rpx`
})

/**
 * ✅ Dynamic min-height for trends section
 * - Has trends (3 cards): 732rpx = 220*3 + 24*2 (gaps)
 * - No change (1 card): 264rpx = 240 (card height) + 24 (gap reserve)
 */
const trendsMinHeight = computed(() => {
    return changedMetricKeys.value.length > 0 ? '732rpx' : '264rpx'
})

const articles = computed<ArticleManifestItem[]>(() => articleStore.getLatestArticles(3))

/**
 * 文章区块标题兜底，避免 i18n 异常时出现空白
 */
const articlesSectionTitle = computed(() => {
    const title = t('SUMMARY.ARTICLES_TITLE')
    return title && title !== 'SUMMARY.ARTICLES_TITLE' ? title : '文章'
})

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

/**
 * ✅ FIX: 动态判断趋势提示状态
 * 区分"数据不足"和"所有指标稳定"两种情况
 */
const trendStatusHint = computed(() => {
    const totalDays = healthStore.getTotalRecordDays()
    return getTrendStatus(healthStore.metricTrendMap, totalDays)
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
 * ✅ SHELL FIRST 架构（P0 优化）
 * 
 * 核心原则：
 * 1. 页面壳永远先出（同步渲染，< 150ms）
 * 2. 缓存数据立即上屏（同步读取，0ms）
 * 3. appReady 仅控制后台刷新时机，不阻塞渲染
 * 
 * 改进前：appReady 阻塞 -> 全白屏 -> 数据到达才显示
 * 改进后：壳立即出现 -> 缓存立即填充 -> 后台刷新
 */
onMounted(() => {
    // ============================================================================
    // Phase 1: 同步渲染页面壳 + 应用缓存（0-50ms，不等待任何异步）
    // ============================================================================

    // 1.1 同步水合宠物数据（从 localStorage 读取，同步操作）
    petViewModel.ensureHydrated()

    // 1.2 同步加载静态文章数据（从本地JSON读取，同步操作）
    articleStore.ensureLoaded()

    // 1.3 ✅ 核心优化：同步应用 Summary 缓存快照 + 分区状态初始化
    if (selectedPetId.value) {
        const cachedSnapshot = healthCacheService.getSummarySnapshot()

        // ✅ 分区判断缓存
        const hasPinnedCache = cachedSnapshot?.pinnedMetrics?.length > 0
        const hasTrendsCache = cachedSnapshot?.trends?.length > 0
        const hasArticlesCache = articleStore.getLatestArticles(3).length > 0

        // ✅ 分区启动加载（有缓存 → showing_cache，无缓存 → loading）
        pinnedState.startLoading({ hasCache: hasPinnedCache })
        trendsState.startLoading({ hasCache: hasTrendsCache })
        articlesState.startLoading({ hasCache: hasArticlesCache })

        if (cachedSnapshot) {
            // 立即填充缓存数据到 UI（不等待网络请求）
            tasks.value = cachedSnapshot.tasks || []
            rawPinnedMetrics.value = cachedSnapshot.pinnedMetrics || []
            trends.value = cachedSnapshot.trends || []
            dailySummaries.value = cachedSnapshot.dailySummaries || {}
            console.log('[Summary] 📸 Cache applied synchronously:', {
                tasks: tasks.value.length,
                pinnedMetrics: rawPinnedMetrics.value.length,
                trends: trends.value.length
            })
        }
    }

    // 1.4 立即关闭启动屏（不等待数据加载）
    closeSplash()

    // ============================================================================
    // Phase 2: 后台数据刷新（异步，由 appReady 控制时机）
    // ============================================================================

    const backgroundRefresh = async () => {
        if (!selectedPetId.value) return

        // 2.0 判断是否有缓存数据（用于轻量刷新态）
        const hasCacheData = tasks.value.length > 0 || rawPinnedMetrics.value.length > 0 || trends.value.length > 0

        if (hasCacheData) {
            // ✅ 后台刷新有缓存：显示轻量刷新 indicator
            isBackgroundRefreshing.value = true
            console.log('[Summary] 🔄 Background refresh with cache (lightweight indicator)')
        }

        try {
            // ============================================================================
            // ✅ Wave 1: 置顶指标（最高优先级，立即加载）
            // ============================================================================
            console.log('[Summary] 🌊 Wave 1: Loading pinned metrics (immediate)')
            console.log('[DEBUG] pinnedState before Wave 1:', pinnedState.state.value)

            await healthStore.ensureDataLoaded(selectedPetId.value)

            // ✅ Wait for Vue reactivity to settle before transitioning state
            await nextTick()

            const hasPinnedData = rawPinnedMetrics.value.length > 0
            console.log('[DEBUG] hasPinnedData:', hasPinnedData, 'rawPinnedMetrics:', rawPinnedMetrics.value.length)
            pinnedState.loadSuccess({ hasData: hasPinnedData })
            console.log('[DEBUG] pinnedState after loadSuccess:', pinnedState.state.value)
            console.log('[Summary] ✅ Wave 1 complete: Pinned metrics ready')

            // ✅ Save summary snapshot to cache after successful load
            healthCacheService.setSummarySnapshot({
                tasks: tasks.value,
                pinnedMetrics: rawPinnedMetrics.value,
                trends: trends.value,
                dailySummaries: dailySummaries.value
            })
            console.log('[Summary] 💾 Summary snapshot saved to cache')

            // ============================================================================
            // ✅ Wave 2: 趋势数据（次优先级，延迟 100ms）
            // ⚠️ BUG FIX: Wave 1 已加载 pinnedMetrics,Wave 2 不应再次请求
            // 否则会导致 pinnedMetrics 重新赋值 → 组件重新渲染 → 闪烁!
            // ============================================================================
            setTimeout(async () => {
                console.log('[Summary] 🌊 Wave 2: Loading trends (delayed 100ms)')
                console.log('[DEBUG] trendsState before Wave 2:', trendsState.state.value)

                try {
                    if (!selectedPetId.value) return

                    // ✅ BUG FIX: 注释掉 loadSummaryData,因为它会重新加载 pinnedMetrics
                    // await loadSummaryData(selectedPetId.value)

                    // ✅ Wave 2 只需要判断 trends 是否有数据
                    // trends 数据已经在 Wave 1 的 ensureDataLoaded 中加载了
                    // await nextTick()  // 不再需要,因为没有异步加载

                    // 趋势区块的「无数据」由内部 HintCard 负责展示，这里不进入 empty（避免出现“暂无数据/立即添加”空态）
                    console.log('[DEBUG] trends:', trends.value.length)
                    trendsState.loadSuccess({ hasData: true })
                    console.log('[DEBUG] trendsState after loadSuccess:', trendsState.state.value)
                    console.log('[Summary] ✅ Wave 2 complete: Trends ready')
                } catch (error) {
                    console.warn('[Summary] Wave 2 failed:', error)
                    trendsState.loadError(error as Error)
                }
            }, 100)  // Wave 2 延迟

            // ============================================================================
            // ✅ Wave 3: 文章推荐（低优先级，延迟 500ms）
            // ============================================================================
            setTimeout(() => {
                console.log('[Summary] 🌊 Wave 3: Loading articles (delayed 500ms)')
                console.log('[DEBUG] articlesState before Wave 3:', articlesState.state.value)

                try {
                    const hasArticlesData = articleStore.getLatestArticles(3).length > 0
                    console.log('[DEBUG] hasArticlesData:', hasArticlesData, 'articles:', articleStore.getLatestArticles(3).length)
                    articlesState.loadSuccess({ hasData: hasArticlesData })
                    console.log('[DEBUG] articlesState after loadSuccess:', articlesState.state.value)
                    console.log('[Summary] ✅ Wave 3 complete: Articles ready')
                } catch (error) {
                    console.warn('[Summary] Wave 3 failed:', error)
                    articlesState.loadError(error as Error)
                }
            }, 500)  // Wave 3 延迟

        } catch (error) {
            console.warn('[Summary] Wave 1 failed:', error)
            // ✅ Wave 1 失败时的错误处理
            pinnedState.loadError(error as Error)
            // Wave 2/3 会独立处理自己的错误
        } finally {
            // ✅ 清理刷新态（Wave 1 完成后立即清理）
            isBackgroundRefreshing.value = false
            isInitialized = true
        }
    }

    // 2.3 ✅ appReady 仅控制后台刷新时机，不阻塞首屏渲染
    if (appStore.isAppReady) {
        // App 已就绪，立即开始后台刷新
        backgroundRefresh()
    } else {
        // App 未就绪，等待就绪后再刷新（但页面壳和缓存已经展示）
        const unwatch = watch(() => appStore.isAppReady, (ready) => {
            if (ready && !isInitialized) {
                backgroundRefresh()
                unwatch()
            }
        })
    }

    // ============================================================================
    // Phase 3: 订阅数据变更事件
    // ============================================================================

    onDataChanged((event) => {
        if (event.reason === 'metrics:record-added' && selectedPetId.value) {
            // 静默刷新 summary
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
// Pet Watch (Active - Load Data on Switch)
// ============================================================================

// ✅ ACTIVE WATCH: Load new pet data when switching
watch(selectedPetId, async (newPetId, oldPetId) => {
    if (oldPetId && newPetId !== oldPetId && newPetId) {
        console.log('[Summary] 🔄 Pet switched:', oldPetId, '→', newPetId)

        // 1. Cancel old requests
        cancelPendingRequests()

        // 2. Reset section states to loading (no cache on switch)
        pinnedState.startLoading({ hasCache: false })
        trendsState.startLoading({ hasCache: false })
        articlesState.startLoading({ hasCache: false })

        // 3. Clear existing data to prevent showing stale content
        rawPinnedMetrics.value = []
        trends.value = []
        tasks.value = []
        dailySummaries.value = {}

        // 4. Load data for new pet
        try {
            await healthStore.ensureDataLoaded(newPetId)
            await nextTick()

            // Update section states based on loaded data
            const hasPinnedData = rawPinnedMetrics.value.length > 0
            // 趋势区块不使用 empty 状态，避免显示“暂无数据/立即添加”
            const hasArticlesData = articles.value.length > 0

            pinnedState.loadSuccess({ hasData: hasPinnedData })
            trendsState.loadSuccess({ hasData: true })
            articlesState.loadSuccess({ hasData: hasArticlesData })

            console.log('[Summary] ✅ Pet data loaded:', {
                pinned: hasPinnedData,
                trends: trends.value.length,
                articles: hasArticlesData
            })

            // 5. Save new cache
            healthCacheService.setSummarySnapshot({
                tasks: tasks.value,
                pinnedMetrics: rawPinnedMetrics.value,
                trends: trends.value,
                dailySummaries: dailySummaries.value
            })
        } catch (error) {
            console.error('[Summary] ❌ Failed to load pet data:', error)
            pinnedState.loadError(error as Error)
            trendsState.loadError(error as Error)
        }
    }
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

<!-- MiniProgram specific styles (non-scoped) -->
<style lang="scss">
/* 微信小程序页面背景色 */
page {
    background-color: #f2f1f5;
}
</style>

<style lang="scss" scoped>
.empty {
    background-color: #ffffff;          // 兜底值
    background-color: var(--app-card-bg); // H5 支持 CSS var
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
    @include text-title-2;
    color: #1f2937;                 // 兜底值，确保小程序显示
    color: var(--app-text-primary); // H5 / 支持 CSS var 的平台走这一条
}

.empty-trend {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64rpx 32rpx;
    gap: 16rpx;
    background-color: #ffffff;          // 兜底值
    background-color: var(--app-card-bg); // H5 支持 CSS var
    border-radius: 48rpx;
}

.empty-trend-text {
    @include text-body;
    color: #9ca3af;                 // 兜底值
    color: var(--app-text-muted);   // H5 支持 CSS var
}

/* ✅ Lightweight Refresh Indicator */
.refresh-indicator {
    position: fixed;
    top: 20rpx;
    right: 32rpx;
    z-index: 1000;
    padding: 12rpx 20rpx;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 40rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 12rpx;
}

/* ✅ Section Error State */
.error-state {
    padding: 48rpx 32rpx;
    text-align: center;
    background-color: #ffffff;          // 兜底值
    background-color: var(--app-card-bg); // H5 支持 CSS var
    border-radius: 30rpx;
}

.error-text {
    @include text-body;
    color: #dc2626;                   // 兜底值
    color: var(--app-danger-color);   // H5 支持 CSS var
}
</style>
