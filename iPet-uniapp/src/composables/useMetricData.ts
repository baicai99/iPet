/**
 * useMetricData - 指标数据获取与处理
 * 
 * 职责：从 Store 获取指标数据并计算展示值
 * 
 * 设计原则：
 * - 单一职责：只负责数据获取和基础处理
 * - 与 UI 配置解耦
 */

import dayjs from 'dayjs'
import type { HealthRecord } from '@shared/types/health'
import { useHealthStore } from '@/stores/healthStore'
import { useMetricFormatter } from '@/composables/useMetricFormatter'
import { parseTimestamp, getLatestRecord } from '@/utils/business/healthDataHelper'
import { formatSmartDate } from '@/utils/common/formatHelper'

export interface MetricDataResult {
    history: HealthRecord[]
    latestRecord: HealthRecord | null
    rawValue: string | number | undefined
    formatted: {
        displayValue: string | number
        displayUnit: string
        isValueText: boolean
        rawValue: any
    }
    displayDate: string
    timestamp: number
}

/**
 * 根据计算方法获取原始值
 */
export function calculateRawValue(
    history: HealthRecord[],
    latestRecord: HealthRecord | null,
    calculationMethod: string
): string | number | undefined {
    // Extended record type for label property
    interface ExtendedHealthRecord extends HealthRecord {
        label?: string
    }

    if (calculationMethod === 'sum') {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const todayRecords = history.filter(record => parseTimestamp(record) >= startOfDay)

        if (history.length > 0) {
            return todayRecords.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
        }
        return undefined
    }

    return latestRecord
        ? ((latestRecord as ExtendedHealthRecord).label || latestRecord.value)
        : undefined
}

/**
 * Composable 封装
 */
export function useMetricData() {
    const healthStore = useHealthStore()
    const { formatMetric } = useMetricFormatter()

    /**
     * 获取指标数据
     */
    function getData(key: string, unit?: string, calculationMethod: string = 'latest'): MetricDataResult {
        const history: HealthRecord[] = healthStore.metricHistory(key) || []
        const latestRecord = getLatestRecord(history)

        const rawValue = calculateRawValue(history, latestRecord, calculationMethod)
        const formatted = formatMetric(rawValue, unit, rawValue, unit)

        const timestamp = parseTimestamp(latestRecord)
        const displayDate = timestamp
            ? formatSmartDate(new Date(timestamp).toISOString())
            : ''

        return {
            history,
            latestRecord,
            rawValue,
            formatted,
            displayDate,
            timestamp
        }
    }

    /**
     * 查找下一个计划事件
     */
    function findNextSchedule(history: HealthRecord[]): HealthRecord | null {
        const now = dayjs()
        const futureEvents = history
            .filter(record => {
                const r = record as any
                const ts = r.metadata?.targetDate || r.date || r.timestamp || r.updatedAt
                return ts && dayjs(ts).endOf('day').isAfter(now)
            })
            .sort((a, b) => {
                const rA = a as any
                const rB = b as any
                const tsA = rA.metadata?.targetDate || rA.date || rA.timestamp || rA.updatedAt
                const tsB = rB.metadata?.targetDate || rB.date || rB.timestamp || rB.updatedAt
                return (tsA || 0) - (tsB || 0)
            })

        return futureEvents[0] || null
    }

    return {
        getData,
        findNextSchedule,
        calculateRawValue
    }
}
