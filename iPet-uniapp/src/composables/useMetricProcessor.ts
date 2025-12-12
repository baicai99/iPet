/**
 * useMetricProcessor - 指标处理 Facade
 * 
 * 职责：作为协调者（Facade），组合多个专注的 composables 来提供完整的指标 UI 配置
 * 
 * 设计原则：
 * - Facade 模式：对外提供统一接口，内部委托给专门的 composables
 * - 高内聚低耦合：每个子 composable 只负责单一职责
 * - 向后兼容：保持原有 API 不变
 * 
 * 依赖的 Composables：
 * - useMetricConfig: 静态配置获取
 * - useMetricData: 数据获取与处理
 * - useChartDataBuilder: 图表数据构建
 * - useTrendCalculator: 趋势计算
 * - useMetricFormatter: 数值格式化（已有）
 */

import dayjs from 'dayjs'
import type { HealthRecord } from '@shared/types/health'
import type { ThemeColor } from '@/types/ui'
import { useMetricConfig, type MetricStaticConfig } from '@/composables/useMetricConfig'
import { useMetricData } from '@/composables/useMetricData'
import { useChartDataBuilder } from '@/composables/useChartDataBuilder'
import { useTrendCalculator } from '@/composables/useTrendCalculator'

// ============================================================================
// Types
// ============================================================================

export interface ProcessedMetricConfig {
    key: string
    title: string
    subTitle: string
    displayValue: string | number
    displayUnit: string
    displayDate: string
    trend: 'up' | 'down' | 'stable' | 'none'
    chartData: any[]
    theme: ThemeColor
    iconName: string
    visualizationType: string
    visualizationOptions: Record<string, any> | undefined
    rawValue: any
    timestamp: number
    isWide: boolean
    chartHeight: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 将选项值映射为标签
 */
function mapOptionsToLabels(options: string[], configOptions: any[]): string {
    if (!options || !options.length) return ''
    return options.map(opt => {
        const found = configOptions.find(o => o.value === opt)
        return found ? found.label : opt
    }).join('+')
}

/**
 * 处理 event_timeline 类型的显示格式
 */
function formatEventTimelineDisplay(
    formatted: { displayValue: any; displayUnit: any; isValueText?: boolean },
    nextSchedule: any,
    formConfig: any,
    key: string,
    timestamp: number
): void {
    if (nextSchedule) {
        const ts = nextSchedule.metadata?.targetDate || nextSchedule.date || nextSchedule.timestamp || nextSchedule.updatedAt
        const now = dayjs()
        const isToday = dayjs(ts).isSame(now, 'day')

        let typeLabel = ''
        if (formConfig?.options && nextSchedule.metadata?.selectedOptions) {
            typeLabel = mapOptionsToLabels(nextSchedule.metadata.selectedOptions, formConfig.options)
        }

        formatted.displayValue = dayjs(ts).format('MM-DD')
        const prefix = isToday ? '今天' : '下次'
        formatted.displayUnit = typeLabel ? `${prefix} · ${typeLabel}` : prefix
        formatted.isValueText = true
    } else if (key === 'deworming') {
        formatted.displayValue = '暂无待办计划'
        formatted.displayUnit = '点击添加'
        formatted.isValueText = true
    } else if (timestamp) {
        formatCountdownOrPast(formatted, timestamp)
    }
}

/**
 * 格式化倒计时或过去时间
 */
function formatCountdownOrPast(
    formatted: { displayValue: any; displayUnit: any; isValueText?: boolean },
    timestamp: number
): void {
    const nowMs = Date.now()

    if (timestamp > nowMs) {
        // 未来事件 - 显示倒计时
        const diff = timestamp - nowMs
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        const months = Math.floor(days / 30)
        const hours = Math.ceil(diff / (1000 * 60 * 60))

        if (months >= 1) {
            formatted.displayValue = months
            formatted.displayUnit = '月后'
        } else if (days >= 1) {
            formatted.displayValue = days
            formatted.displayUnit = '天后'
        } else {
            formatted.displayValue = hours
            formatted.displayUnit = '小时后'
        }
        formatted.isValueText = true
    } else {
        // 过去事件 - 显示日期
        formatted.displayValue = dayjs(timestamp).format('MM-DD')
        formatted.displayUnit = ''
        formatted.isValueText = true
    }
}

// ============================================================================
// Main Composable
// ============================================================================

export function useMetricProcessor() {
    // 组合子 composables
    const { getConfig } = useMetricConfig()
    const { getData, findNextSchedule } = useMetricData()
    const { buildData } = useChartDataBuilder()
    const { calculate: calculateTrend } = useTrendCalculator()

    /**
     * 获取完整的指标 UI 配置
     */
    function getMetricUIConfig(key: string): ProcessedMetricConfig | null {
        // 1. 获取静态配置
        const config = getConfig(key)
        if (!config) return null

        // 2. 获取数据
        const data = getData(key, config.unit, config.calculationMethod)

        // 3. 处理显示格式
        const formatted = { ...data.formatted }

        // 特殊处理 event_timeline
        if (config.visualizationType === 'event_timeline') {
            const nextSchedule = findNextSchedule(data.history)
            formatEventTimelineDisplay(
                formatted,
                nextSchedule,
                config.formConfig,
                key,
                data.timestamp
            )
        }

        // 特殊处理 risk_grid：将数值转换为语义标签
        if (config.visualizationType === 'risk_grid') {
            const riskLabels: Record<number, string> = {
                1: '最轻',
                2: '轻度',
                3: '中度',
                4: '重度'
            }
            const rawVal = formatted.rawValue
            if (typeof rawVal === 'number' && riskLabels[rawVal]) {
                formatted.displayValue = riskLabels[rawVal]
                formatted.displayUnit = ''
            }
        }

        // 4. 构建图表数据
        const chartData = buildData(config.visualizationType, data.history, {
            miniChartDays: config.miniChartDays,
            calculationMethod: config.calculationMethod,
            latestRecord: data.latestRecord,
            unit: config.unit
        })

        // 5. 计算趋势
        const trend = calculateTrend(data.history)

        // 6. 组装返回结果
        return {
            key,
            title: config.title,
            subTitle: config.description,
            displayValue: (formatted.displayValue ?? '暂无数据') as string | number,
            displayUnit: config.displayUnit || formatted.displayUnit || '',
            displayDate: data.displayDate,
            trend,
            chartData,
            theme: config.theme,
            iconName: config.iconName,
            visualizationType: config.visualizationType,
            visualizationOptions: config.visualizationOptions,
            rawValue: formatted.rawValue,
            timestamp: data.timestamp,
            isWide: config.isWide,
            chartHeight: config.chartHeight
        }
    }

    return {
        getMetricUIConfig,
        processMetric: getMetricUIConfig // 向后兼容别名
    }
}
