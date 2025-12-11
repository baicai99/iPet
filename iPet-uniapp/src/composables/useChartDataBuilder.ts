/**
 * useChartDataBuilder - 图表数据构建
 * 
 * 职责：根据可视化类型构建适合图表组件的数据格式
 * 
 * 设计原则：
 * - 策略模式：根据 visualizationType 选择构建策略
 * - 单一职责：只负责数据转换，不涉及 UI 配置
 */

import dayjs from 'dayjs'
import type { HealthRecord } from '@shared/types/health'
import { useUnitConverter } from '@/composables/useUnitConverter'
import { parseTimestamp, buildChartData, aggregateDailyData } from '@/utils/business/healthDataHelper'

export interface ChartBuildOptions {
    miniChartDays?: number
    calculationMethod?: string
    latestRecord?: HealthRecord | null
    unit?: string
}

/**
 * 为 MiniTimeline 格式化数据
 */
function formatTimelineData(chartData: any[]): { title: string; time: string }[] {
    return chartData.map(record => {
        const ts = parseTimestamp(record)
        return {
            title: ts ? dayjs(ts).format('MM-DD') : '',
            time: ''
        }
    })
}

/**
 * 转换图表数据单位
 */
function convertChartDataUnits(
    chartData: any[],
    unit: string,
    convertValue: (value: number, unit: 'weight' | 'length') => number,
    isConvertibleUnit: (unit: string) => boolean,
    visualizationType: string
): any[] {
    if (!unit || !isConvertibleUnit(unit) || !Array.isArray(chartData)) {
        return chartData
    }

    // 只有数值类型的图表需要转换
    if (!['trend_line', 'daily_bar'].includes(visualizationType)) {
        return chartData
    }

    return chartData.map(val => {
        const num = Number(val)
        return isNaN(num) ? val : convertValue(num, unit as any)
    })
}

/**
 * 构建图表数据（核心函数）
 */
export function buildChartDataForType(
    visualizationType: string,
    history: HealthRecord[],
    options: ChartBuildOptions = {}
): any[] {
    const {
        miniChartDays = 7,
        calculationMethod = 'latest',
        latestRecord
    } = options

    let chartData: any[] = []

    if (visualizationType === 'daily_bar') {
        // 日柱状图：需要按天聚合
        const latestTs = latestRecord ? parseTimestamp(latestRecord) : 0
        const anchor = Math.max(Date.now(), latestTs)
        chartData = aggregateDailyData(history, miniChartDays, calculationMethod as any, anchor)
    } else {
        // 其他类型：使用通用构建器
        chartData = buildChartData(visualizationType, history, miniChartDays)
    }

    // 特殊处理：event_timeline 需要特定格式
    if (visualizationType === 'event_timeline' && Array.isArray(chartData)) {
        chartData = formatTimelineData(chartData)
    }

    return chartData
}

/**
 * Composable 封装
 */
export function useChartDataBuilder() {
    const { convertValue, isConvertibleUnit } = useUnitConverter()

    /**
     * 构建图表数据
     */
    function buildData(
        visualizationType: string,
        history: HealthRecord[],
        options: ChartBuildOptions = {}
    ): any[] {
        let chartData = buildChartDataForType(visualizationType, history, options)

        // 单位转换
        if (options.unit) {
            chartData = convertChartDataUnits(
                chartData,
                options.unit,
                convertValue,
                isConvertibleUnit,
                visualizationType
            )
        }

        return chartData
    }

    return {
        buildData,
        formatTimelineData
    }
}
