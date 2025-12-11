/**
 * useSummaryData - Summary 页面数据处理 Composable
 * 
 * 职责：
 * - 封装趋势数据的处理和单位转换逻辑
 * - 管理 Summary 页面的数据加载状态
 * - 提供缓存策略支持 (stale-while-revalidate)
 * - 智能刷新策略（连续使用10分钟/每日首次打开）
 * 
 * 设计原则：
 * - 单一职责：只负责 Summary 页面的数据编排
 * - 复用已有 composables：useUnitConverter, useMetricTrend
 */

import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useHealthStore } from '@/stores/healthStore'
import { useUnitConverter } from '@/composables/useUnitConverter'
import { healthCacheService } from '@/services/healthCacheService'

// ============================================================================
// Types
// ============================================================================

export interface TrendRecord {
    value: number
    date?: string
}

export interface RawTrendData {
    key: string
    title?: string
    baseUnit?: string
    unitLabel?: string
    previousRecords?: TrendRecord[]
    recentRecords?: TrendRecord[]
}

export interface SummaryTrendCardData {
    title: string
    previousValues: number[]
    recentValues: number[]
    previousAvg: number
    recentAvg: number
    previousLabel: string
    recentLabel: string
}

export interface UseSummaryDataReturn {
    /** 趋势卡片数据 (如果有足够数据) */
    stepTrendData: ComputedRef<SummaryTrendCardData | null>
    /** 归一化后的趋势列表 */
    trendList: ComputedRef<RawTrendData[]>
    /** 是否正在加载 */
    isLoading: Ref<boolean>
    /** 加载 Summary 数据 */
    loadSummaryData: (petId: string) => Promise<void>
    /** 刷新 Summary 数据 */
    refresh: (petId: string) => Promise<void>
    /** 启动自动刷新（页面 onShow 时调用） */
    startAutoRefresh: () => void
    /** 停止自动刷新（页面 onHide 时调用） */
    stopAutoRefresh: () => void
}

// ============================================================================
// Constants
// ============================================================================

/** 趋势卡片最少需要的柱状图数量 */
const MIN_BARS_FOR_TREND = 20

/** 缓存有效期 (5分钟) */
const CACHE_TTL_MS = 5 * 60 * 1000

/** 自动刷新间隔（10分钟） */
const AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000

/** 自动刷新检查间隔（1分钟） */
const AUTO_REFRESH_CHECK_INTERVAL_MS = 60 * 1000

/** 上次刷新日期缓存键 */
const LAST_REFRESH_DATE_KEY = 'health_last_refresh_date'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 计算数组平均值
 */
function calcAverage(values: number[]): number {
    const valid = values.filter(v => typeof v === 'number' && !Number.isNaN(v))
    if (!valid.length) return 0
    return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1))
}

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
function getTodayDateString(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * 检查是否为今日首次打开
 */
function isFirstOpenToday(): boolean {
    try {
        const lastDate = uni.getStorageSync(LAST_REFRESH_DATE_KEY)
        const today = getTodayDateString()
        return lastDate !== today
    } catch {
        return true
    }
}

/**
 * 记录今日已刷新
 */
function markTodayRefreshed(): void {
    try {
        uni.setStorageSync(LAST_REFRESH_DATE_KEY, getTodayDateString())
    } catch (e) {
        console.warn('[useSummaryData] Failed to mark today refreshed:', e)
    }
}

// ============================================================================
// Composable
// ============================================================================

export function useSummaryData(petId: Ref<string | null>): UseSummaryDataReturn {
    const healthStore = useHealthStore()
    const { trends, lastUpdated, tasks, pinnedMetrics, dailySummaries } = storeToRefs(healthStore)
    const { resolveUnitLabel, convertValue, isConvertibleUnit } = useUnitConverter()

    const isLoading = ref(false)

    // -------------------------------------------------------------------------
    // Smart Refresh State (T5.1, T5.2)
    // -------------------------------------------------------------------------

    /** 页面进入时间戳 */
    let pageEnterTime: number = 0

    /** 自动刷新定时器 */
    let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

    /** 是否已触发每日首次刷新 */
    let dailyRefreshTriggered = false

    // -------------------------------------------------------------------------
    // Unit Conversion Helpers
    // -------------------------------------------------------------------------

    /**
     * 格式化趋势单位标签
     */
    function formatTrendUnitLabel(trend: RawTrendData): string {
        if (!trend?.baseUnit || !isConvertibleUnit(trend.baseUnit)) {
            return trend?.unitLabel ?? ''
        }
        const resolvedUnit = resolveUnitLabel(trend.baseUnit)
        if (!trend.unitLabel) {
            return resolvedUnit
        }
        const separatorIndex = trend.unitLabel.indexOf('/')
        if (separatorIndex === -1) {
            return resolvedUnit
        }
        const suffix = trend.unitLabel.slice(separatorIndex)
        return `${resolvedUnit}${suffix}`
    }

    /**
     * 转换趋势记录的值
     */
    function convertTrendRecords(
        records: Array<{ value: number }> | undefined,
        unit?: string | null
    ): TrendRecord[] {
        if (!unit || !isConvertibleUnit(unit) || !Array.isArray(records)) {
            return Array.isArray(records) ? records : []
        }
        return records.map((record) => {
            const numeric = typeof record.value === 'number' ? record.value : Number(record.value)
            if (Number.isNaN(numeric)) {
                return { ...record }
            }
            return {
                ...record,
                value: convertValue(numeric, unit === 'kg' ? 'weight' : 'length')
            }
        })
    }

    /**
     * 归一化趋势数据 (应用单位转换)
     */
    function normalizeTrend(trend: RawTrendData): RawTrendData {
        if (!trend || !trend.baseUnit || !isConvertibleUnit(trend.baseUnit)) {
            return trend
        }
        return {
            ...trend,
            unitLabel: formatTrendUnitLabel(trend),
            previousRecords: convertTrendRecords(trend.previousRecords, trend.baseUnit),
            recentRecords: convertTrendRecords(trend.recentRecords, trend.baseUnit)
        }
    }

    // -------------------------------------------------------------------------
    // Computed Properties
    // -------------------------------------------------------------------------

    /**
     * 归一化后的趋势列表
     */
    const trendList = computed<RawTrendData[]>(() => {
        return (trends.value as RawTrendData[]).map(normalizeTrend)
    })

    /**
     * 趋势卡片数据 - 用于 StepCountTrendCard
     */
    const stepTrendData = computed<SummaryTrendCardData | null>(() => {
        // 查找第一个有足够数据的趋势指标
        const trend = trendList.value.find((t) => {
            const prev = t.previousRecords || []
            const recent = t.recentRecords || []
            const totalBars = prev.length + recent.length
            return totalBars >= MIN_BARS_FOR_TREND
        })

        if (!trend) return null

        const previousValues = (trend.previousRecords || []).map((r) => Number(r.value))
        const recentValues = (trend.recentRecords || []).map((r) => Number(r.value))

        return {
            title: trend.title || '趋势',
            previousValues,
            recentValues,
            previousAvg: calcAverage(previousValues),
            recentAvg: calcAverage(recentValues),
            previousLabel: `${previousValues.length}周平均`,
            recentLabel: `${recentValues.length}周平均`
        }
    })

    // -------------------------------------------------------------------------
    // Data Loading
    // -------------------------------------------------------------------------

    /**
     * 加载 Summary 数据 (带缓存策略 - stale-while-revalidate)
     * 
     * 策略：
     * 1. 优先从本地缓存读取，立即渲染首屏
     * 2. 后台静默请求最新数据
     * 3. 请求成功后更新缓存和 UI
     * 4. 请求失败时继续展示缓存数据 + Toast 提示
     */
    async function loadSummaryData(targetPetId: string): Promise<void> {
        if (!targetPetId) return

        // Step 1: 尝试从本地缓存读取
        const cachedSnapshot = healthCacheService.getSummarySnapshot()
        const hasCachedData = cachedSnapshot && (
            cachedSnapshot.tasks?.length > 0 ||
            cachedSnapshot.pinnedMetrics?.length > 0 ||
            cachedSnapshot.trends?.length > 0
        )

        // 如果有缓存，立即渲染（不显示 loading）
        if (hasCachedData) {
            tasks.value = cachedSnapshot.tasks || []
            pinnedMetrics.value = cachedSnapshot.pinnedMetrics || []
            trends.value = cachedSnapshot.trends || []
            dailySummaries.value = cachedSnapshot.dailySummaries || {}
        }

        // 检查缓存是否过期
        const cacheExpired = healthCacheService.isExpired('Summary_Snapshot')

        // 检查是否为每日首次打开（T5.2）
        const needDailyRefresh = isFirstOpenToday() && !dailyRefreshTriggered

        // 如果无缓存或缓存过期，需要清晰地显示 loading
        const shouldShowLoading = !hasCachedData

        if (shouldShowLoading) {
            isLoading.value = true
            healthStore.resetSummarySnapshot()
        }

        // Step 2: 后台请求最新数据
        try {
            const shouldForceRefresh = cacheExpired || !hasCachedData || needDailyRefresh
            await healthStore.initSummaryPage(targetPetId, { force: shouldForceRefresh })

            // Step 3: 成功后更新缓存
            const newSnapshot = {
                tasks: healthStore.tasks,
                pinnedMetrics: healthStore.pinnedMetrics,
                trends: healthStore.trends,
                dailySummaries: healthStore.dailySummaries,
                petId: targetPetId,
                timestamp: Date.now()
            }
            healthCacheService.setSummarySnapshot(newSnapshot)

            // 标记今日已刷新（T5.2）
            if (needDailyRefresh) {
                markTodayRefreshed()
                dailyRefreshTriggered = true
            }

        } catch (error) {
            console.error('Failed to load summary data', error)

            // Step 4: 降级处理
            if (hasCachedData) {
                // 有缓存：显示 Toast 提示，继续展示缓存数据
                uni.showToast({
                    title: '网络异常，显示历史数据',
                    icon: 'none',
                    duration: 2000
                })
            }
            // 无缓存：不做特殊处理，会显示空状态
        } finally {
            if (shouldShowLoading) {
                isLoading.value = false
            }
        }
    }

    /**
     * 强制刷新 Summary 数据（清除缓存后重新请求）
     */
    async function refresh(targetPetId: string): Promise<void> {
        if (!targetPetId) return

        // 强制刷新时清除缓存
        healthCacheService.remove('Summary_Snapshot')

        isLoading.value = true
        try {
            await healthStore.refreshSummary(targetPetId)

            // 更新缓存
            const newSnapshot = {
                tasks: healthStore.tasks,
                pinnedMetrics: healthStore.pinnedMetrics,
                trends: healthStore.trends,
                dailySummaries: healthStore.dailySummaries,
                petId: targetPetId,
                timestamp: Date.now()
            }
            healthCacheService.setSummarySnapshot(newSnapshot)

            // 标记今日已刷新
            markTodayRefreshed()
        } finally {
            isLoading.value = false
        }
    }

    // -------------------------------------------------------------------------
    // Smart Refresh (T5.1: 连续使用 > 10 分钟自动刷新)
    // -------------------------------------------------------------------------

    /**
     * 静默刷新（不显示 loading）
     */
    async function silentRefresh(): Promise<void> {
        const currentPetId = petId.value
        if (!currentPetId) return

        try {
            await healthStore.refreshSummary(currentPetId)

            // 更新缓存
            const newSnapshot = {
                tasks: healthStore.tasks,
                pinnedMetrics: healthStore.pinnedMetrics,
                trends: healthStore.trends,
                dailySummaries: healthStore.dailySummaries,
                petId: currentPetId,
                timestamp: Date.now()
            }
            healthCacheService.setSummarySnapshot(newSnapshot)

            console.log('[useSummaryData] Silent refresh completed')
        } catch (error) {
            console.warn('[useSummaryData] Silent refresh failed:', error)
        }
    }

    /**
     * 检查是否需要自动刷新
     */
    function checkAutoRefresh(): void {
        if (!pageEnterTime) return

        const elapsed = Date.now() - pageEnterTime
        if (elapsed >= AUTO_REFRESH_INTERVAL_MS) {
            // 重置计时器
            pageEnterTime = Date.now()
            // 触发静默刷新
            silentRefresh()
        }
    }

    /**
     * 启动自动刷新（页面 onShow 时调用）
     */
    function startAutoRefresh(): void {
        // 记录进入时间
        pageEnterTime = Date.now()

        // 清理旧定时器
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer)
        }

        // 启动新定时器（每分钟检查一次）
        autoRefreshTimer = setInterval(checkAutoRefresh, AUTO_REFRESH_CHECK_INTERVAL_MS)

        console.log('[useSummaryData] Auto refresh started')
    }

    /**
     * 停止自动刷新（页面 onHide 时调用）
     */
    function stopAutoRefresh(): void {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer)
            autoRefreshTimer = null
        }
        pageEnterTime = 0

        console.log('[useSummaryData] Auto refresh stopped')
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    // Auto-load on petId change
    watch(petId, (newId) => {
        if (newId) {
            loadSummaryData(newId)
        }
    })

    // Cleanup on unmount
    onUnmounted(() => {
        stopAutoRefresh()
    })

    return {
        stepTrendData,
        trendList,
        isLoading,
        loadSummaryData,
        refresh,
        startAutoRefresh,
        stopAutoRefresh
    }
}
