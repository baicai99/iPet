/**
 * useMetricDetail - 指标详情页状态管理
 * 
 * 职责：
 * - 集中管理 detail.vue 的状态和业务逻辑
 * - 通过 provide/inject 共享给子组件
 * - 避免 Props Drilling
 * 
 * 设计原则：
 * - 状态与 UI 分离
 * - 子组件通过 inject 获取状态
 */

import { ref, computed, provide, inject, nextTick } from 'vue'
import type { InjectionKey, Ref, ComputedRef } from 'vue'
import dayjs from 'dayjs'
import type { HealthRecord } from '@shared/types/health'
import { useHealthStore } from '@/stores/healthStore'
import { usePetStore } from '@/stores/petStore'
import { useMetricProcessor } from '@/composables/useMetricProcessor'
import { useUnitConverter } from '@/composables/useUnitConverter'
import { getMetricMetadata } from '@/data/metricMetadata'
import { useChartOptions, getDateFormat } from '@/composables/useChartOptions'
import { COLORS, CATEGORY_COLOR_MAP } from '@/config/theme'
import { STRINGS } from '@/locale/zh-Hans'

// ============================================================================
// Types
// ============================================================================

export interface MetricDetailContext {
    // Core State
    metricKey: Ref<string>
    metricMetadata: Ref<any>
    activeTab: Ref<string>
    chartData: Ref<{ series: any[]; stats: any }>
    loading: Ref<boolean>

    // Modal State
    showCompletionModal: Ref<boolean>
    showCompletePicker: Ref<boolean>
    completeTimeValue: Ref<number>
    pendingCompleteRecord: Ref<HealthRecord | null>
    initialSelections: Ref<string[]>

    // Computed
    isTaskMode: ComputedRef<boolean>
    isSchedulable: ComputedRef<boolean>
    isNumericMetric: ComputedRef<boolean>
    isCustomView: ComputedRef<boolean>
    theme: ComputedRef<{ hex: string; bg: string }>
    currentData: ComputedRef<any>
    tabs: ComputedRef<{ id: string; label: string }[]>
    taskList: ComputedRef<HealthRecord[]>
    activeSchedules: ComputedRef<HealthRecord[]>
    latestMetricDisplay: ComputedRef<{ value: any; unit: string; isPlaceholder?: boolean }>
    metricUnitLabel: ComputedRef<string>

    // Actions
    fetchData: () => Promise<void>
    setActiveTab: (id: string) => void
    onCompleteSchedule: (record: HealthRecord) => void
    onDeleteSchedule: (record: HealthRecord) => void
    processCompletion: (actualTime: number, selectedOptions?: string[]) => Promise<void>
    computeNextScheduleDate: (repeatMode: string, baseDate: any, referenceTime: any, scheduleMeta: any) => any
}

const METRIC_DETAIL_KEY: InjectionKey<MetricDetailContext> = Symbol('metricDetail')

// ============================================================================
// Composable
// ============================================================================

export function useMetricDetail() {
    const healthStore = useHealthStore()
    const petStore = usePetStore()
    const { processMetric } = useMetricProcessor()
    const { convertValue, resolveUnitLabel } = useUnitConverter()

    const metricStrings = STRINGS.METRICS.DETAIL

    // -------------------------------------------------------------------------
    // Core State
    // -------------------------------------------------------------------------

    const metricKey = ref('')
    const metricMetadata = ref<any>({})
    const activeTab = ref('week')
    const chartData = ref<{ series: any[]; stats: any }>({ series: [], stats: {} })
    const loading = ref(false)
    const relatedMetricsData = ref<any[]>([])
    const latestValue = ref<any>(null)

    // Modal State
    const showCompletionModal = ref(false)
    const showCompletePicker = ref(false)
    const completeTimeValue = ref(Number(new Date()))
    const pendingCompleteRecord = ref<HealthRecord | null>(null)
    const initialSelections = ref<string[]>([])

    // -------------------------------------------------------------------------
    // Computed: Mode Detection
    // -------------------------------------------------------------------------

    const isTaskMode = computed(() => {
        return metricMetadata.value.interactionMode === 'task' ||
            (metricMetadata.value.features?.schedulable &&
                metricMetadata.value.valueType !== 'number')
    })

    const isSchedulable = computed(() => {
        return !!metricMetadata.value.features?.schedulable
    })

    const isNumericMetric = computed(() => {
        return metricMetadata.value.valueType === 'number'
    })

    const isCustomView = computed(() => {
        const vizType = metricMetadata.value.visualization?.type
        return vizType && !['trend_line', 'daily_bar'].includes(vizType)
    })

    // -------------------------------------------------------------------------
    // Computed: UI Config
    // -------------------------------------------------------------------------

    const theme = computed(() => {
        const category = metricMetadata.value.category || 'default'
        const colorKey = (CATEGORY_COLOR_MAP as Record<string, string>)[category] || CATEGORY_COLOR_MAP.default
        return (COLORS as Record<string, { hex: string; bg: string }>)[colorKey]
    })

    const metricBaseUnit = computed(() => metricMetadata.value.unit || '')
    const metricUnitLabel = computed(() => resolveUnitLabel(metricBaseUnit.value))

    const tabs = computed(() => {
        if (isTaskMode.value) {
            return [
                { id: 'today', label: '今天' },
                { id: 'week', label: '本周' },
                { id: 'all', label: '计划' }
            ]
        }
        return [
            { id: 'day', label: metricStrings.TABS.DAY },
            { id: 'week', label: metricStrings.TABS.WEEK },
            { id: 'month', label: metricStrings.TABS.MONTH },
            { id: 'six_month', label: metricStrings.TABS.SIX_MONTH },
            { id: 'year', label: metricStrings.TABS.YEAR }
        ]
    })

    // -------------------------------------------------------------------------
    // Computed: Data Processing
    // -------------------------------------------------------------------------

    const currentData = computed(() => {
        const { series = [], stats = {} } = chartData.value || {}

        if (isCustomView.value) {
            const formattedEvents = (series || []).map((record: any) => {
                const ts = record.date || record.updatedAt || record.timestamp
                return {
                    title: ts ? dayjs(ts).format('MM-DD') : (record.label || record.value || '记录'),
                    time: '',
                    value: record.value,
                    timestamp: typeof ts === 'number' ? ts : dayjs(ts).valueOf(),
                    date: ts ? dayjs(ts).format('YYYY-MM-DD') : null
                }
            })

            // For state_grid charts, return structured values array
            const vizType = metricMetadata.value.visualization?.type
            if (vizType === 'state_grid') {
                return {
                    values: formattedEvents, // Array of {value, timestamp, date} objects
                    labels: [],
                    unit: metricUnitLabel.value,
                    ...stats,
                    trend: 0,
                    rawEvents: formattedEvents
                }
            }

            return {
                values: [],
                labels: [],
                unit: metricUnitLabel.value,
                ...stats,
                trend: 0,
                rawEvents: formattedEvents
            }
        }

        const normalizedSeries = Array.isArray(series) ? series : []
        const convertedValues = normalizedSeries.map((item: any) => {
            const value = typeof item.value === 'number' ? item.value : Number(item.value)
            return Number.isNaN(value) ? 0 : convertValue(value, metricBaseUnit.value as any)
        })
        const convertedStats = {
            avg: typeof stats.avg === 'number' ? convertValue(stats.avg, metricBaseUnit.value as any) : stats.avg ?? '--',
            min: typeof stats.min === 'number' ? convertValue(stats.min, metricBaseUnit.value as any) : stats.min ?? '--',
            max: typeof stats.max === 'number' ? convertValue(stats.max, metricBaseUnit.value as any) : stats.max ?? '--'
        }

        const trend = convertedValues.length >= 2
            ? Number((convertedValues[convertedValues.length - 1] - convertedValues[convertedValues.length - 2]).toFixed(1))
            : 0

        const formatLabel = getDateFormat(activeTab.value)
        const labels = normalizedSeries.map((item: any) => formatLabel(item.timestamp))

        return {
            values: convertedValues,
            labels,
            timestamps: normalizedSeries.map((item: any) => item.timestamp),
            unit: metricUnitLabel.value,
            ...convertedStats,
            trend
        }
    })

    const latestMetricDisplay = computed(() => {
        const displayData = processMetric(metricKey.value)

        if (!displayData) {
            return { value: '暂无数据', unit: '' }
        }

        const isPlaceholder = typeof displayData.displayValue === 'string' && displayData.displayValue.length > 20

        return {
            value: displayData.displayValue,
            unit: displayData.displayUnit,
            isPlaceholder
        }
    })

    const activeSchedules = computed(() => {
        const history = healthStore.metricHistory(metricKey.value) || []
        return history
            .filter((record: HealthRecord) => !!record.metadata?.isScheduled)
            .sort((a: HealthRecord, b: HealthRecord) => {
                const tsA = a.metadata?.targetDate || a.date || a.updatedAt
                const tsB = b.metadata?.targetDate || b.date || b.updatedAt
                return dayjs(tsA).valueOf() - dayjs(tsB).valueOf()
            })
    })

    const taskList = computed(() => {
        if (!isTaskMode.value) return []
        const history = healthStore.metricHistory(metricKey.value) || []

        let tasks = history.filter((h: HealthRecord) => !!h.metadata?.isScheduled)

        if (activeTab.value !== 'all') {
            const now = dayjs()
            if (activeTab.value === 'today') {
                const endOfToday = now.endOf('day').valueOf()
                tasks = tasks.filter((t: HealthRecord) => {
                    const d = t.metadata?.targetDate || t.date
                    return dayjs(d).valueOf() <= endOfToday
                })
            } else if (activeTab.value === 'week') {
                const endOfWeek = now.endOf('week').valueOf()
                tasks = tasks.filter((t: HealthRecord) => {
                    const d = t.metadata?.targetDate || t.date
                    return dayjs(d).valueOf() <= endOfWeek
                })
            }
        }

        return tasks.sort((a: HealthRecord, b: HealthRecord) => {
            const dA = a.metadata?.targetDate || a.date
            const dB = b.metadata?.targetDate || b.date
            return dayjs(dA).valueOf() - dayjs(dB).valueOf()
        })
    })

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------

    async function fetchData() {
        if (!metricKey.value) return
        loading.value = true

        try {
            let newChartData = { series: [] as any[], stats: {} }

            if (isCustomView.value) {
                // 自定义视图：先确保数据已加载，再使用历史记录
                const petId = petStore.selectedPetId
                if (petId) {
                    await healthStore.fetchHealthRecords(petId)
                }
                const allHistory = healthStore.metricHistory(metricKey.value)

                // 按时间范围过滤数据
                const now = dayjs()
                let cutoffTime: number
                let aggregationBucket: 'none' | 'day' | 'week' | 'month' = 'none'

                switch (activeTab.value) {
                    case 'day':
                        cutoffTime = now.startOf('day').valueOf()
                        aggregationBucket = 'none' // 显示所有数据点
                        break
                    case 'week':
                        cutoffTime = now.subtract(6, 'day').startOf('day').valueOf()
                        aggregationBucket = 'none' // 显示所有数据点
                        break
                    case 'month':
                        cutoffTime = now.subtract(29, 'day').startOf('day').valueOf()
                        aggregationBucket = 'day' // 聚合到每天
                        break
                    case 'six_month':
                        cutoffTime = now.subtract(6, 'month').startOf('day').valueOf()
                        aggregationBucket = 'week' // 聚合到每周
                        break
                    case 'year':
                        cutoffTime = now.subtract(1, 'year').startOf('day').valueOf()
                        aggregationBucket = 'month' // 聚合到每月
                        break
                    default:
                        cutoffTime = now.subtract(6, 'day').startOf('day').valueOf()
                        aggregationBucket = 'none'
                }

                // 过滤时间范围内的数据
                const filteredHistory = (allHistory || []).filter((r: HealthRecord) => {
                    if (r.metadata?.isScheduled === true) return false
                    const recordTime = r.updatedAt || new Date(r.date).getTime()
                    return recordTime >= cutoffTime
                })

                // 根据聚合粒度进行数据聚合
                let aggregatedData: any[]
                if (aggregationBucket === 'none') {
                    // 不聚合，直接使用原始数据
                    aggregatedData = filteredHistory
                } else {
                    // 按时间桶聚合，取每个桶的最后一条记录（最新状态）
                    const buckets = new Map<string, HealthRecord>()

                    for (const record of filteredHistory) {
                        const recordTime = dayjs(record.updatedAt || record.date)
                        let bucketKey: string

                        switch (aggregationBucket) {
                            case 'day':
                                bucketKey = recordTime.format('YYYY-MM-DD')
                                break
                            case 'week':
                                // 使用周一作为周的开始，格式为 YYYY-MM-DD（周一的日期）
                                bucketKey = recordTime.startOf('week').format('YYYY-MM-DD')
                                break
                            case 'month':
                                bucketKey = recordTime.format('YYYY-MM')
                                break
                            default:
                                bucketKey = recordTime.format('YYYY-MM-DD')
                        }

                        // 保留最新的记录（覆盖旧的）
                        const existing = buckets.get(bucketKey)
                        const recordTs = record.updatedAt || new Date(record.date).getTime()
                        if (!existing || recordTs > (existing.updatedAt || new Date(existing.date).getTime())) {
                            buckets.set(bucketKey, record)
                        }
                    }

                    aggregatedData = Array.from(buckets.values())
                        .sort((a, b) => {
                            const tsA = a.updatedAt || new Date(a.date).getTime()
                            const tsB = b.updatedAt || new Date(b.date).getTime()
                            return tsA - tsB
                        })
                }

                newChartData = {
                    series: aggregatedData,
                    stats: { avg: '--', min: '--', max: '--' }
                }
            } else {
                // 使用新的 V2 聚合管线（带缓存）
                const rangeMap: Record<string, 'day' | 'calendarWeek' | 'calendarMonth'> = {
                    day: 'day',
                    week: 'day',
                    month: 'day',
                    six_month: 'calendarWeek',
                    year: 'calendarMonth'
                }
                const bucket = rangeMap[activeTab.value] || 'day'

                const seriesResponse = healthStore.metricSeriesV2(
                    metricKey.value,
                    activeTab.value,
                    bucket
                )

                // 转换为现有 chartData 格式以保持兼容性
                if (seriesResponse && seriesResponse.points) {
                    newChartData = {
                        series: seriesResponse.points.map(p => ({
                            timestamp: p.ts,
                            value: p.value,
                            date: new Date(p.ts).toISOString()
                        })),
                        stats: seriesResponse.stats
                    }
                } else {
                    // 回退到旧接口
                    const res = healthStore.metricSeries(metricKey.value, activeTab.value)
                    newChartData = res
                }
            }

            chartData.value = { series: [], stats: {} }
            await nextTick()
            chartData.value = newChartData

            const displayData = processMetric(metricKey.value)
            if (displayData) {
                latestValue.value = displayData.rawValue
            }
        } catch (e) {
            console.error('Failed to fetch metric data:', e)
        } finally {
            loading.value = false
        }
    }

    function setActiveTab(id: string) {
        activeTab.value = id
    }

    function init(key: string) {
        metricKey.value = key
        metricMetadata.value = getMetricMetadata(key) || {}

        if (isTaskMode.value) {
            activeTab.value = 'today'
        } else {
            const defaultTab = metricMetadata.value.timeDisplay?.detailDefaultTab
            if (defaultTab) {
                activeTab.value = defaultTab
            }
        }
    }

    // -------------------------------------------------------------------------
    // Schedule Logic
    // -------------------------------------------------------------------------

    function createAnchoredInterval(baseDate: any, referenceTime: any, unit: string, step: number = 1) {
        const diff = referenceTime.diff(baseDate, unit, true)
        const increments = diff > 0 ? Math.floor(diff / step) + 1 : 1
        const totalSteps = Math.max(increments, 1)
        return baseDate.add(totalSteps * step, unit)
    }

    function advanceWithPattern(startDate: any, referenceTime: any, picker: (date: any) => any) {
        let candidate = picker(startDate)
        let guard = 0
        while (candidate.isSameOrBefore(referenceTime) && guard < 200) {
            candidate = picker(candidate)
            guard += 1
        }
        return candidate
    }

    function getNextWeekdayDate(date: any) {
        const day = date.day()
        if (day === 5) return date.add(3, 'day')
        if (day === 6) return date.add(2, 'day')
        if (day === 0) return date.add(1, 'day')
        return date.add(1, 'day')
    }

    function getNextWeekendDate(date: any) {
        const day = date.day()
        if (day === 6) return date.add(1, 'day')
        if (day === 0) return date.add(6, 'day')
        const daysToSat = (6 - day + 7) % 7
        return date.add(daysToSat, 'day')
    }

    function computeNextScheduleDate(repeatMode: string, baseDate: any, referenceTime: any, scheduleMeta: any) {
        switch (repeatMode) {
            case 'hour':
                return createAnchoredInterval(baseDate, referenceTime, 'hour', 1)
            case 'day':
                return createAnchoredInterval(baseDate, referenceTime, 'day', 1)
            case 'week':
                return createAnchoredInterval(baseDate, referenceTime, 'week', 1)
            case 'biweek':
                return createAnchoredInterval(baseDate, referenceTime, 'week', 2)
            case 'month':
                return createAnchoredInterval(baseDate, referenceTime, 'month', 1)
            case 'month_3':
                return createAnchoredInterval(baseDate, referenceTime, 'month', 3)
            case 'month_6':
                return createAnchoredInterval(baseDate, referenceTime, 'month', 6)
            case 'year':
                return createAnchoredInterval(baseDate, referenceTime, 'year', 1)
            case 'weekdays':
                return advanceWithPattern(baseDate, referenceTime, getNextWeekdayDate)
            case 'weekends':
                return advanceWithPattern(baseDate, referenceTime, getNextWeekendDate)
            case 'custom': {
                const rule = scheduleMeta.reminder?.customRule
                const step = rule?.value && rule.value > 0 ? rule.value : 1
                const unit = rule?.unit || 'day'
                return createAnchoredInterval(baseDate, referenceTime, unit, step)
            }
            default:
                return createAnchoredInterval(baseDate, referenceTime, 'day', 1)
        }
    }

    function onCompleteSchedule(record: HealthRecord) {
        if (record) {
            pendingCompleteRecord.value = record
            initialSelections.value = record.metadata?.selectedOptions || []

            if (metricMetadata.value.formConfig?.options?.length > 0) {
                showCompletionModal.value = true
            } else {
                completeTimeValue.value = Number(new Date())
                showCompletePicker.value = true
            }
        } else {
            uni.showToast({ title: '未找到预约记录', icon: 'none' })
        }
    }

    async function onDeleteSchedule(record: HealthRecord) {
        if (!record) {
            uni.showToast({ title: '未找到预约记录', icon: 'none' })
            return
        }

        uni.showModal({
            title: '删除预约',
            content: '确定删除该计划吗？',
            confirmColor: '#ef4444',
            success: async (res: any) => {
                if (!res.confirm) return
                loading.value = true
                try {
                    await healthStore.deleteRecord(record.id)
                    uni.showToast({ title: '已删除', icon: 'success' })
                    await fetchData()
                } catch (error) {
                    console.error('Delete schedule failed', error)
                    uni.showToast({ title: '删除失败', icon: 'none' })
                } finally {
                    loading.value = false
                }
            }
        })
    }

    async function processCompletion(actualTime: number, selectedOptions: string[] = []) {
        const scheduleRecord = pendingCompleteRecord.value
        if (!scheduleRecord) return

        const scheduleMeta = scheduleRecord.metadata || {}
        const features = metricMetadata.value.features || {}

        // Create history record
        const historyPayload = {
            petId: petStore.selectedPetId,
            type: metricKey.value,
            value: 1,
            unit: metricMetadata.value.unit || '',
            updatedAt: actualTime,
            date: dayjs(actualTime).toISOString(),
            notes: scheduleRecord.notes || '',
            metadata: {
                isScheduled: false,
                sourceScheduleId: scheduleRecord.id,
                originalTargetDate: scheduleMeta.targetDate,
                selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined
            }
        }
        await healthStore.addRecord(historyPayload as any)

        // Delete pending schedule
        await healthStore.deleteRecord(scheduleRecord.id)

        // Handle recurrence
        const repeatMode = scheduleMeta.repeat
        if (repeatMode && repeatMode !== 'none') {
            const recurrenceMode = features.recurrenceMode || 'anchor'
            const referenceTime = dayjs(actualTime)
            const baseDate = recurrenceMode === 'elastic'
                ? referenceTime
                : dayjs(scheduleMeta.targetDate || referenceTime.valueOf())
            const nextDate = computeNextScheduleDate(repeatMode, baseDate, referenceTime, scheduleMeta)

            const newPayload = {
                petId: petStore.selectedPetId,
                type: metricKey.value,
                value: 1,
                unit: metricMetadata.value.unit || '',
                updatedAt: Date.now(),
                date: nextDate.toISOString(),
                notes: '',
                metadata: {
                    isScheduled: true,
                    targetDate: nextDate.valueOf(),
                    repeat: repeatMode,
                    reminder: scheduleMeta.reminder,
                    selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined
                }
            }
            await healthStore.addRecord(newPayload as any)
        }

        uni.showToast({ title: '完成！', icon: 'success' })
        await fetchData()
    }

    // -------------------------------------------------------------------------
    // Provide for Children
    // -------------------------------------------------------------------------

    function provideState() {
        provide(METRIC_DETAIL_KEY, {
            metricKey,
            metricMetadata,
            activeTab,
            chartData,
            loading,
            showCompletionModal,
            showCompletePicker,
            completeTimeValue,
            pendingCompleteRecord,
            initialSelections,
            isTaskMode,
            isSchedulable,
            isNumericMetric,
            isCustomView,
            theme,
            currentData,
            tabs,
            taskList,
            activeSchedules,
            latestMetricDisplay,
            metricUnitLabel,
            fetchData,
            setActiveTab,
            onCompleteSchedule,
            onDeleteSchedule,
            processCompletion,
            computeNextScheduleDate
        })
    }

    return {
        // State
        metricKey,
        metricMetadata,
        activeTab,
        chartData,
        loading,
        showCompletionModal,
        showCompletePicker,
        completeTimeValue,
        pendingCompleteRecord,
        initialSelections,
        relatedMetricsData,

        // Computed
        isTaskMode,
        isSchedulable,
        isNumericMetric,
        isCustomView,
        theme,
        currentData,
        tabs,
        taskList,
        activeSchedules,
        latestMetricDisplay,
        metricUnitLabel,

        // Actions
        init,
        fetchData,
        setActiveTab,
        onCompleteSchedule,
        onDeleteSchedule,
        processCompletion,
        computeNextScheduleDate,
        provideState
    }
}

/**
 * 在子组件中使用：注入 context
 */
export function useMetricDetailContext() {
    const context = inject(METRIC_DETAIL_KEY)
    if (!context) {
        throw new Error('useMetricDetailContext must be used within a component that provides MetricDetail context')
    }
    return context
}
