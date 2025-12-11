/**
 * useMetricConfig - 指标静态配置获取
 * 
 * 职责：获取并组装指标的静态配置（元数据、主题、图标等）
 * 
 * 设计原则：
 * - 单一职责：只负责静态配置
 * - 与数据层解耦：不依赖 Store
 */

import { getMetricMetadata, type MetricMetadata } from '@/data/metricMetadata'
import { getThemeColor, getMetricIcon } from '@/utils/business/uiMapper'
import type { ThemeColor } from '@/types/ui'

export interface MetricStaticConfig {
    key: string
    title: string
    description: string
    theme: ThemeColor
    iconName: string
    visualizationType: string
    visualizationOptions: Record<string, any> | undefined
    isWide: boolean
    chartHeight: string
    unit: string
    displayUnit: string
    calculationMethod: string
    miniChartDays: number
    formConfig: any
}

// 需要宽卡片的可视化类型
const WIDE_VISUALIZATION_TYPES = [
    'event_timeline',
    'range_slider',
    'status_grid',
    'state_grid'  // Kept for backward compatibility with existing metadata
]

/**
 * 获取指标的静态配置
 */
export function getMetricStaticConfig(key: string): MetricStaticConfig | null {
    const metadata = getMetricMetadata(key)
    if (!metadata) return null

    const visualizationType = metadata.visualization?.type || 'trend_line'
    const visualizationOptions = metadata.visualization?.options

    const theme = getThemeColor(metadata.category)
    const iconName = metadata.icon || getMetricIcon(metadata.title, metadata.category)

    const isWide = WIDE_VISUALIZATION_TYPES.includes(visualizationType)
    const chartHeight = (typeof visualizationOptions?.height === 'string' ? visualizationOptions.height : null) ||
        (visualizationType === 'progress_ring' ? '110rpx' : '80rpx')

    const miniChartDays = (metadata as any).timeDisplay?.miniChartDays || 7

    return {
        key,
        title: metadata.title,
        description: metadata.description || '',
        theme,
        iconName,
        visualizationType,
        visualizationOptions,
        isWide,
        chartHeight,
        unit: metadata.unit || '',
        displayUnit: metadata.displayUnit || metadata.unit || '',
        calculationMethod: metadata.calculationMethod || 'latest',
        miniChartDays,
        formConfig: metadata.formConfig
    }
}

/**
 * Composable 封装
 */
export function useMetricConfig() {
    return {
        getConfig: getMetricStaticConfig
    }
}
