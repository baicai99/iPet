/**
 * useSummaryData - Summary 页面数据处理 Composable
 * 
 * 职责：
 * - 封装趋势数据的处理和单位转换逻辑
 * - 管理 Summary 页面的数据加载状态
 * - 提供缓存策略支持 (stale-while-revalidate)
 * 
 * 设计原则：
 * - 单一职责：只负责 Summary 页面的数据编排
 * - 复用已有 composables：useUnitConverter, useMetricTrend
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useHealthStore } from '@/stores/healthStore'
import { useUnitConverter } from '@/composables/useUnitConverter'

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
}

// ============================================================================
// Constants
// ============================================================================

/** 趋势卡片最少需要的柱状图数量 */
const MIN_BARS_FOR_TREND = 20

/** 缓存有效期 (5分钟) */
const CACHE_TTL_MS = 5 * 60 * 1000

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

// ============================================================================
// Composable
// ============================================================================

export function useSummaryData(petId: Ref<string | null>): UseSummaryDataReturn {
    const healthStore = useHealthStore()
    const { trends, lastUpdated } = storeToRefs(healthStore)
    const { resolveUnitLabel, convertValue, isConvertibleUnit } = useUnitConverter()

    const isLoading = ref(false)

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
                value: convertValue(numeric, unit as 'kg' | 'cm')
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
     * 加载 Summary 数据 (带缓存策略)
     */
    async function loadSummaryData(targetPetId: string): Promise<void> {
        if (!targetPetId) return

        // 缓存策略：如果数据新鲜 (< 5分钟) 且有数据，静默更新（无 loading 状态）
        const now = Date.now()
        const isFresh = (now - (lastUpdated.value || 0)) < CACHE_TTL_MS
        const hasData = healthStore.tasks.length > 0 ||
            healthStore.pinnedMetrics.length > 0 ||
            healthStore.trends.length > 0

        const shouldShowLoading = !isFresh || !hasData

        if (shouldShowLoading) {
            isLoading.value = true
            healthStore.resetSummarySnapshot()
        }

        try {
            await healthStore.initSummaryPage(targetPetId, { force: true })
        } catch (error) {
            console.error('Failed to load summary data', error)
        } finally {
            if (shouldShowLoading) {
                isLoading.value = false
            }
        }
    }

    /**
     * 刷新 Summary 数据
     */
    async function refresh(targetPetId: string): Promise<void> {
        if (!targetPetId) return
        await healthStore.refreshSummary(targetPetId)
    }

    // -------------------------------------------------------------------------
    // Auto-load on petId change
    // -------------------------------------------------------------------------

    watch(petId, (newId) => {
        if (newId) {
            loadSummaryData(newId)
        }
    })

    return {
        stepTrendData,
        trendList,
        isLoading,
        loadSummaryData,
        refresh
    }
}
