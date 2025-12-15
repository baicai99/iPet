/**
 * ChartSpec - Unified Chart Data Interface
 * 
 * This interface decouples business logic from chart library specifics.
 * All chart components should accept ChartSpec, not library-specific options.
 */

/**
 * Supported chart types
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'area'

/**
 * Single data series for charts
 */
export interface ChartSeries {
  /** Series identifier/legend name */
  name: string
  /** Data points (null for missing data) */
  data: (number | null)[]
  /** Optional color override */
  color?: string
  /** For line charts: show area fill */
  areaStyle?: boolean
}

/**
 * Chart specification - library-agnostic chart configuration
 */
export interface ChartSpec {
  /** Chart type */
  type: ChartType
  /** X-axis category labels */
  categories: string[]
  /** Data series */
  series: ChartSeries[]
  /** Optional chart title */
  title?: string
  /** Y-axis unit label (e.g., "kg", "°C") */
  yAxisName?: string
  /** Y-axis minimum value */
  min?: number
  /** Y-axis maximum value */
  max?: number
  /** Primary theme color */
  color?: string
  /** Show animation */
  animation?: boolean
  /** Show legend */
  showLegend?: boolean
  /** Connect null data points (for line/area charts) */
  connectNulls?: boolean
  /** Missing data handling policy */
  missingPolicy?: 'null' | 'zero' | 'carry'
}

/**
 * Helper: Create a simple line chart spec
 */
export function createLineChartSpec(
  categories: string[],
  values: (number | null)[],
  options: Partial<ChartSpec> = {}
): ChartSpec {
  return {
    type: 'line',
    categories,
    series: [{
      name: options.title || 'Value',
      data: values,
      areaStyle: true
    }],
    animation: false,
    showLegend: false,
    ...options
  }
}
