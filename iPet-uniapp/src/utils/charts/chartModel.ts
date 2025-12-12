/**
 * ChartModel - 统一图表模型类型定义
 * 
 * 渲染器无关的中间层数据结构。
 * Mini Charts (SVG) 和 Detail Charts (ECharts) 共享同一套模型。
 */

import type { MetricDomain, MissingPolicy, MetricRange } from '@shared/types/health'

// ============================================================================
// Axis Configuration
// ============================================================================

/**
 * 时间轴配置
 */
export interface AxisConfig {
    /** 时间戳数组（毫秒） */
    timestamps: number[]
    /** 标签数组（与 timestamps 一一对应） */
    labels: string[]
    /** dayjs 格式化字符串 */
    tickFormat: string
    /** 刻度数量 */
    tickCount: number
    /** 轴类型 */
    type: 'time' | 'category'
}

// ============================================================================
// Data Points
// ============================================================================

/**
 * 统一数据点
 * 
 * 包含原始值和归一化坐标，可直接用于 SVG 渲染。
 */
export interface ChartDataPoint {
    /** 时间戳（毫秒） */
    ts: number
    /** 原始值（null = 缺失） */
    value: number | null
    /** SVG X 坐标（0-100 归一化） */
    x: number
    /** SVG Y 坐标（0-100 归一化），null = 不绘制 */
    y: number | null
    /** 日期标签 */
    label: string
    /** 原始索引 */
    index: number
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * 图表统计信息
 */
export interface ChartStats {
    /** 最小值 */
    min: number
    /** 最大值 */
    max: number
    /** 平均值 */
    avg: number
    /** 总和（累计类指标） */
    total?: number
    /** 有效数据点数 */
    count: number
    /** 最新值 */
    latest?: number
}

// ============================================================================
// Annotations
// ============================================================================

/**
 * 图表标注
 */
export interface ChartAnnotation {
    /** 时间戳 */
    ts: number
    /** 标注标签 */
    label: string
    /** 标注类型 */
    type: 'min' | 'max' | 'event' | 'milestone'
    /** X 坐标（0-100） */
    x: number
    /** Y 坐标（0-100） */
    y?: number
}

// ============================================================================
// Semantic Metadata
// ============================================================================

/**
 * 图表语义元数据
 */
export interface ChartSemantic {
    /** 指标键 */
    metricKey: string
    /** 时间范围 */
    range: MetricRange
    /** 时间粒度 */
    bucket: 'day' | 'calendarWeek' | 'calendarMonth'
    /** 单位 */
    unit: string
    /** 显示单位 */
    displayUnit: string
    /** 标题 */
    title: string
    /** 指标类型 */
    domain?: MetricDomain
    /** 缺失值策略 */
    missingPolicy?: MissingPolicy
}

// ============================================================================
// Chart Model (Main Interface)
// ============================================================================

/**
 * 统一图表模型
 * 
 * 渲染器无关的图表数据结构。
 * Mini Charts 和 Detail Charts 使用相同的模型。
 */
export interface ChartModel {
    /** 时间轴配置 */
    axis: AxisConfig
    /** 数据点数组 */
    points: ChartDataPoint[]
    /** 统计信息 */
    stats: ChartStats
    /** 标注（可选） */
    annotations?: ChartAnnotation[]
    /** 语义元数据 */
    semantic: ChartSemantic
    /** Y 轴域（用于渲染） */
    yDomain: {
        min: number
        max: number
        range: number
    }
}

// ============================================================================
// Builder Options
// ============================================================================

/**
 * 图表模型构建选项
 */
export interface ChartModelOptions {
    /** SVG 视图宽度 */
    width?: number
    /** SVG 视图高度 */
    height?: number
    /** 内边距 */
    padding?: {
        top?: number
        right?: number
        bottom?: number
        left?: number
    }
    /** 是否生成标注 */
    includeAnnotations?: boolean
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * 旧版数据格式（用于向后兼容）
 */
export interface LegacyChartData {
    values: (number | null)[]
    unit?: string
}

/**
 * 从 ChartModel 转换为旧版格式
 */
export function toLegacyFormat(model: ChartModel): LegacyChartData {
    return {
        values: model.points.map(p => p.value),
        unit: model.semantic.displayUnit || model.semantic.unit
    }
}
