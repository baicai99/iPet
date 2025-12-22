/**
 * useMetricSeriesData - 指标系列数据获取层
 * 
 * 职责：
 * - 使用 metricSeriesV2 聚合管线获取图表数据
 * - 提供响应式的 series 数据
 * - 与 useMetricViewModel 配合使用
 * 
 * 设计原则：
 * - 纯数据获取，无 UI 逻辑
 * - 按需刷新，支持缓存
 * 
 * 对应 PRD 8.2.2 节：Composable 瘦身 - 数据获取层
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useHealthStore } from '@/stores/healthStore'
import { getMetricMetadata, type MetricKey } from '@/data/metricMetadata'
import type { MetricSeriesResponse, HealthRecord } from '@shared/types/health'

// ============================================================================
// Types
// ============================================================================

export interface UseMetricSeriesDataReturn {
    /** 当前指标 key */
    metricKey: Ref<string>
    /** 当前选中的时间范围 */
    activeRange: Ref<string>
    /** 图表系列数据（使用 V2 聚合管线） */
    seriesData: Ref<MetricSeriesResponse | null>
    /** 原始历史记录（非日程） */
    historyRecords: ComputedRef<HealthRecord[]>
    /** 计划/日程记录 */
    scheduleRecords: ComputedRef<HealthRecord[]>
    /** 是否加载中 */
    loading: Ref<boolean>
    /** 初始化 */
    init: (key: string) => void
    /** 切换时间范围 */
    setRange: (range: string) => void
    /** 刷新数据 */
    refresh: () => Promise<void>
}

// ============================================================================
// Constants
// ============================================================================

/** 默认时间范围 */
const DEFAULT_RANGE = 'week'

/** 范围到 bucket 的映射 */
const RANGE_TO_BUCKET: Record<string, 'day' | 'calendarWeek' | 'calendarMonth'> = {
    day: 'day',
    week: 'day',
    month: 'day',
    six_month: 'calendarWeek',
    year: 'calendarMonth'
}

// ============================================================================
// Composable
// ============================================================================

/**
 * useMetricSeriesData - 指标系列数据获取 Composable
 * 
 * @returns 数据获取相关的状态和方法
 * 
 * @example
 * ```ts
 * const { metricKey, seriesData, init, setRange, refresh } = useMetricSeriesData()
 * 
 * onMounted(() => {
 *   init('weight')
 * })
 * 
 * // 配合 ViewModel 使用
 * const { chartData } = useMetricViewModel(seriesData, { key: 'weight', title: '体重', unit: 'kg' })
 * ```
 */
export function useMetricSeriesData(): UseMetricSeriesDataReturn {
    const healthStore = useHealthStore()

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    const metricKey = ref<string>('')
    const activeRange = ref<string>(DEFAULT_RANGE)
    const seriesData = ref<MetricSeriesResponse | null>(null)
    const loading = ref(false)

    // -------------------------------------------------------------------------
    // Computed
    // -------------------------------------------------------------------------

    /**
     * 原始历史记录（非日程）
     */
    const historyRecords = computed<HealthRecord[]>(() => {
        if (!metricKey.value) return []
        const history = healthStore.metricHistory(metricKey.value) || []
        return history.filter((r: HealthRecord) => !r.metadata?.isScheduled)
    })

    /**
     * 计划/日程记录
     */
    const scheduleRecords = computed<HealthRecord[]>(() => {
        if (!metricKey.value) return []
        const history = healthStore.metricHistory(metricKey.value) || []
        return history
            .filter((r: HealthRecord) => !!r.metadata?.isScheduled)
            .sort((a: HealthRecord, b: HealthRecord) => {
                const tsA = a.metadata?.targetDate || a.date || a.updatedAt
                const tsB = b.metadata?.targetDate || b.date || b.updatedAt
                return new Date(tsA as any).getTime() - new Date(tsB as any).getTime()
            })
    })

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------

    /**
     * 初始化
     */
    function init(key: string): void {
        metricKey.value = key

        // 设置默认时间范围
        const meta = getMetricMetadata(key as MetricKey)
        if (meta?.timeDisplay?.detailDefaultTab) {
            activeRange.value = meta.timeDisplay.detailDefaultTab as string
        } else if (meta?.interactionMode === 'task') {
            activeRange.value = 'today'
        } else {
            activeRange.value = DEFAULT_RANGE
        }
    }

    /**
     * 切换时间范围
     */
    function setRange(range: string): void {
        activeRange.value = range
    }

    /**
     * 刷新数据（使用 V2 聚合管线）
     */
    async function refresh(): Promise<void> {
        if (!metricKey.value) return

        loading.value = true
        try {
            const bucket = RANGE_TO_BUCKET[activeRange.value] || 'day'

            // 使用新的 V2 接口，带缓存
            const data = healthStore.metricSeriesV2(
                metricKey.value,
                activeRange.value,
                bucket
            )

            seriesData.value = data
        } catch (error) {
            console.error('[useMetricSeriesData] Failed to refresh:', error)
            seriesData.value = null
        } finally {
            loading.value = false
        }
    }

    // -------------------------------------------------------------------------
    // Auto-refresh on range change
    // -------------------------------------------------------------------------

    watch(activeRange, () => {
        if (metricKey.value) {
            refresh()
        }
    })

    return {
        metricKey,
        activeRange,
        seriesData,
        historyRecords,
        scheduleRecords,
        loading,
        init,
        setRange,
        refresh
    }
}

export default useMetricSeriesData
