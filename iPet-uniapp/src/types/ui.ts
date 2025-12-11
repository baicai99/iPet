/**
 * UI-related type definitions for components
 */

/**
 * Theme color configuration for metric cards
 */
export interface ThemeColor {
    hex: string
    bg: string
    text?: string
}

/**
 * Configuration for metric card display
 */
export interface MetricCardConfig {
    key: string
    title: string
    subTitle?: string
    displayValue: string | number
    displayUnit: string
    displayDate: string
    trend: 'up' | 'down' | 'stable' | 'none'
    chartData: number[] | any[]
    theme: ThemeColor
    iconName: string
    visualizationType: string
    visualizationOptions?: Record<string, any>
    rawValue?: string | number
    timestamp?: number
    isWide: boolean
    chartHeight: string
    chartProps?: Record<string, any>
}
