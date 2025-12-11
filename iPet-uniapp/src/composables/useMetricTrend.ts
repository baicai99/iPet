import { computed, type Ref, type ComputedRef } from 'vue'
import { useHealthStore } from '@/stores/healthStore'

/**
 * 计算数组平均值
 */
const calcAverage = (values: number[]): number => {
    const valid = values.filter(v => typeof v === 'number' && !Number.isNaN(v))
    if (!valid.length) return 0
    return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1))
}

export interface TrendAnalysis {
    /** 指标 key */
    key: string
    /** 标题 */
    title: string
    /** 历史区间数值数组 */
    previousValues: number[]
    /** 近期区间数值数组 */
    recentValues: number[]
    /** 历史区间平均值 */
    previousAvg: number
    /** 近期区间平均值 */
    recentAvg: number
    /** 历史区间标签 */
    previousLabel: string
    /** 近期区间标签 */
    recentLabel: string
    /** 趋势方向: 'up' | 'down' | 'stable' */
    direction: 'up' | 'down' | 'stable'
    /** 变化文案 */
    changeText: string
    /** 最大值 (用于图表缩放) */
    maxValue: number
}

export interface UseMetricTrendReturn {
    /** 原始趋势数据 */
    rawTrend: ComputedRef<any>
    /** 分析后的趋势数据 */
    analyzedTrend: ComputedRef<TrendAnalysis | null>
    /** 是否有足够数据显示趋势 */
    hasEnoughData: ComputedRef<boolean>
    /** 是否正在加载 */
    loading: ComputedRef<boolean>
}

/**
 * 获取并分析指定指标的趋势数据
 * 
 * @param metricKey 指标 key，如 'weight', 'step_count' 等
 * @returns 趋势分析结果
 */
export function useMetricTrend(metricKey: string | Ref<string>): UseMetricTrendReturn {
    const healthStore = useHealthStore()

    const resolvedKey = computed(() =>
        typeof metricKey === 'string' ? metricKey : metricKey.value
    )

    // 从 store 获取原始趋势数据
    const rawTrend = computed(() => {
        return healthStore.trends.find((t: any) => t.key === resolvedKey.value)
    })

    // 分析趋势数据
    const analyzedTrend = computed<TrendAnalysis | null>(() => {
        const trend = rawTrend.value
        if (!trend) return null

        const previousRecords = trend.previousRecords || []
        const recentRecords = trend.recentRecords || []

        const previousValues = previousRecords.map((r: any) => Number(r.value))
        const recentValues = recentRecords.map((r: any) => Number(r.value))

        const previousAvg = calcAverage(previousValues)
        const recentAvg = calcAverage(recentValues)

        // 计算趋势方向
        let direction: 'up' | 'down' | 'stable' = 'stable'
        const threshold = 0.5
        if (Math.abs(recentAvg - previousAvg) >= threshold) {
            direction = recentAvg > previousAvg ? 'up' : 'down'
        }

        // 计算最大值用于图表缩放
        const allValues = [...previousValues, ...recentValues]
        const maxValue = allValues.length > 0
            ? Math.max(...allValues) * 1.2 // 留 20% 余量
            : 100

        return {
            key: trend.key,
            title: trend.title || '',
            previousValues,
            recentValues,
            previousAvg,
            recentAvg,
            previousLabel: `${previousValues.length}周平均`,
            recentLabel: `${recentValues.length}周平均`,
            direction,
            changeText: trend.changeText || '',
            maxValue
        }
    })

    // 是否有足够数据
    const hasEnoughData = computed(() => {
        const trend = analyzedTrend.value
        if (!trend) return false
        return trend.previousValues.length >= 1 && trend.recentValues.length >= 1
    })

    // 加载状态 (从 store 获取)
    const loading = computed(() => healthStore.loading)

    return {
        rawTrend,
        analyzedTrend,
        hasEnoughData,
        loading
    }
}

/**
 * 获取第一个有数据的趋势指标 (用于 summary 页面展示)
 */
export function useFirstAvailableTrend(): UseMetricTrendReturn & {
    availableKey: ComputedRef<string | null>
} {
    const healthStore = useHealthStore()

    // 找到第一个有足够数据的趋势
    const availableKey = computed(() => {
        const trends = healthStore.trends || []
        for (const trend of trends) {
            const prev = trend.previousRecords || []
            const recent = trend.recentRecords || []
            if (prev.length >= 1 && recent.length >= 1) {
                return trend.key
            }
        }
        return null
    })

    const result = useMetricTrend(availableKey as unknown as Ref<string>)

    return {
        ...result,
        availableKey
    }
}
