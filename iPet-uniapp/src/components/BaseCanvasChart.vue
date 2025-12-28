<template>
  <view class="canvas-chart-container" :style="{ height: containerHeight, width: containerWidth }">
    <!-- ✅ FIX: Only render when data is FULLY ready -->
    <qiun-data-charts v-if="isDataReady" :type="uchartsType" :opts="safeChartOpts" :chartData="safeChartData"
      :canvas2d="true" :canvasId="canvasId" :ontouch="true" :animation="false" :optsWatch="false"
      style="width: 100%; height: 100%;" @complete="handleComplete" @getIndex="handleGetIndex" />
    <view v-else class="empty-state">
      <text class="empty-text">{{ hasData ? '数据加载中...' : '暂无数据' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, toRaw, getCurrentInstance, ref, onMounted, onUnmounted } from 'vue'
import type { ChartSpec, ChartSeries } from '@/types/chart'

/**
 * BaseCanvasChart - Cross-platform Canvas Chart Component
 * 
 * Uses qiun-data-charts (uCharts) for WeChat MiniProgram compatibility.
 * Accepts ChartSpec as input, converts to uCharts format internally.
 */

const props = defineProps<{
  /** Chart specification (library-agnostic) */
  spec?: ChartSpec
  /** Legacy: echarts options (for backward compatibility during migration) */
  options?: Record<string, unknown>
  /** Chart height */
  height?: string
  /** Chart width */
  width?: string
  /** Metric key for stable canvasId generation */
  metricKey?: string
  /** Active tab for stable canvasId generation */
  activeTab?: string
  /** Whether to show x/y axis (default: true) */
  showAxis?: boolean
}>()

const emit = defineEmits<{
  'point-click': [params: unknown]
  'chart-ready': []
}>()

// ✅ FIX: Stable canvasId based on metricKey + activeTab (not random)
const systemInfo = uni.getSystemInfoSync()
const instance = getCurrentInstance()
const uidSuffix = instance?.uid ?? Math.random().toString(36).slice(2)
const canvasId = computed(() => {
  const key = props.metricKey || `uid${uidSuffix}`
  const tab = props.activeTab || 'default'
  return `chart_${key}_${tab}`
})

// Cache dimensions to prevent recalculation on every render
const cachedDimensions = ref<{ width: number; height: number } | null>(null)

// Convert height (default 320rpx -> px)
const canvasHeightPx = computed(() => {
  // Use cached value if available
  if (cachedDimensions.value) return cachedDimensions.value.height

  const h = props.height || '320rpx'
  if (h.endsWith('rpx')) {
    return uni.upx2px(parseInt(h))
  }
  if (h.endsWith('px')) {
    return parseInt(h)
  }
  // Fallback: treat as rpx
  return uni.upx2px(320)
})

// Convert width (default 100% -> windowWidth)
const canvasWidthPx = computed(() => {
  // Use cached value if available
  if (cachedDimensions.value) return cachedDimensions.value.width

  const w = props.width || '100%'
  if (w === '100%') {
    return systemInfo.windowWidth
  }
  if (w.endsWith('rpx')) {
    return uni.upx2px(parseInt(w))
  }
  if (w.endsWith('px')) {
    return parseInt(w)
  }
  // Fallback
  return systemInfo.windowWidth
})

// Container style (keep original for layout)
const containerHeight = computed(() => props.height || '320rpx')
const containerWidth = computed(() => props.width || '100%')

/**
 * Map ChartSpec type to uCharts type
 */
const uchartsType = computed(() => {
  const type = props.spec?.type || 'line'
  const typeMap: Record<string, string> = {
    'line': 'line',
    'bar': 'column',
    'area': 'area',
    'pie': 'pie'
  }
  return typeMap[type] || 'line'
})

const showAxis = computed(() => props.showAxis !== false)

/**
 * Convert ChartSpec or legacy echarts options to uCharts format
 */
const chartData = computed(() => {
  // Priority 1: Use ChartSpec if provided
  if (props.spec) {
    return specToUChartsData(props.spec)
  }

  // Priority 2: Convert legacy echarts options
  if (props.options) {
    return echartsOptionsToUChartsData(props.options)
  }

  return { categories: [], series: [] }
})

/**
 * uCharts display options
 */
const chartOpts = computed(() => {
  try {
    const themeColor = props.spec?.color || '#3b82f6'

    return {
      color: [themeColor],
      padding: showAxis.value ? [15, 0, 0, 10] : [0, 0, 0, 0],
      enableScroll: false,
      legend: {
        show: props.spec?.showLegend ?? false
      },
      xAxis: {
        disabled: !showAxis.value,
        disableGrid: true,
        fontSize: 10,
        fontColor: '#94a3b8'
      },
      yAxis: {
        disabled: !showAxis.value,
        disableGrid: false,
        splitNumber: 4,
        gridColor: '#f1f5f9',
        gridType: 'dash',
        dashLength: 4,
        fontSize: 10,
        fontColor: '#94a3b8',
        min: props.spec?.min,
        max: props.spec?.max,
        tofix: 0
      },
      dataLabel: false,
      extra: {
        line: {
          type: 'curve',
          width: 2,
          activeType: 'hollow',
          connectNulls: props.spec?.connectNulls ?? false
        },
        area: {
          opacity: 0.2,
          gradient: true,
          connectNulls: props.spec?.connectNulls ?? false
        },
        column: {
          width: 15,
          meterBorder: 1,
          meterFillColor: themeColor,
          activeBgColor: themeColor,
          activeBgOpacity: 0.08
        }
      }
    }
  } catch (e) {
    console.error('❌ [BaseCanvasChart] chartOpts error:', e)
    return {}
  }
})

// ✅ FIX 3: Serialize to plain objects (avoid Proxy issues in MiniProgram)
const safeChartData = computed(() => {
  try {
    const raw = toRaw(chartData.value)
    const serialized = JSON.parse(JSON.stringify(raw))

    // ✅ Ensure all required fields exist with defaults
    return {
      categories: Array.isArray(serialized.categories) ? serialized.categories : [],
      series: (Array.isArray(serialized.series) ? serialized.series : []).map((s: any) => ({
        name: s?.name || 'Series',
        data: Array.isArray(s?.data) ? s.data : [],
        color: s?.color,
        connectNulls: s?.connectNulls
      }))
    }
  } catch (e) {
    console.error('❌ [BaseCanvasChart] safeChartData error:', e)
    return { categories: [], series: [] }
  }
})

const safeChartOpts = computed(() => {
  try {
    const raw = toRaw(chartOpts.value)
    return JSON.parse(JSON.stringify(raw))
  } catch (e) {
    console.error('❌ [BaseCanvasChart] safeChartOpts error:', e)
    return {}
  }
})

// ✅ FIX 3: Enhanced data validation - only true when data structure is complete
const hasData = computed(() => {
  const data = safeChartData.value

  // Basic checks
  if (!data.categories || !Array.isArray(data.categories)) return false
  if (!data.series || !Array.isArray(data.series)) return false
  if (data.categories.length === 0) return false
  if (data.series.length === 0) return false

  // Ensure series has valid data array
  const firstSeries = data.series[0]
  if (!firstSeries || !Array.isArray(firstSeries.data)) return false

  return true
})

// ✅ FIX 4: Strict data readiness check - prevents qiun-data-charts from mounting with incomplete data
const isDataReady = computed(() => {
  if (!hasData.value) return false

  const data = safeChartData.value
  const opts = safeChartOpts.value

  // Validate data structure completeness
  const categoriesValid = Array.isArray(data.categories) && data.categories.length > 0
  const seriesValid = Array.isArray(data.series) && data.series.length > 0
  const dataArrayValid = data.series.every((s: any) => Array.isArray(s.data) && s.data.length > 0)
  const lengthMatch = data.series.every((s: any) => s.data.length === data.categories.length)

  // Validate opts has required fields
  const optsValid = opts && typeof opts === 'object' && Object.keys(opts).length > 0

  const ready = categoriesValid && seriesValid && dataArrayValid && lengthMatch && optsValid

  return ready
})

/**
 * Convert ChartSpec to uCharts data format
 */
function specToUChartsData(spec: ChartSpec) {
  try {
    // ✅ FIX 4: Validate and clean data
    const categories = spec.categories || []
    const series = spec.series.map((s: ChartSeries) => {
      let processedData: (number | null)[]

      // Handle null values based on chart type and policy
      if (spec.type === 'bar') {
        // Bar charts: apply missingPolicy (uCharts supports null gaps)
        const policy = spec.missingPolicy || 'null'
        processedData = s.data.map((v, idx) => {
          // ✅ Clean invalid values
          if (v === null || v === undefined || !Number.isFinite(v)) {
            if (policy === 'zero') return 0
            if (policy === 'carry') {
              // Find nearest previous valid value
              for (let i = idx - 1; i >= 0; i--) {
                const prev = s.data[i]
                if (prev !== null && prev !== undefined && Number.isFinite(prev)) {
                  return prev
                }
              }
              return null
            }
            return null
          }
          return v
        })
      } else {
        // Line/Area charts: preserve null for gaps, but clean invalid numbers
        processedData = s.data.map(v => {
          if (v === null || v === undefined) return null
          if (!Number.isFinite(v)) {
            return null
          }
          return v
        })
      }

      return {
        name: s.name,
        data: processedData,
        color: s.color,
        connectNulls: spec.connectNulls ?? false
      }
    })

    // ✅ Validate length consistency
    const expectedLength = categories.length
    series.forEach((s, idx) => {
      if (s.data.length !== expectedLength) {
        console.error(`❌ [BaseCanvasChart] Length mismatch: categories=${expectedLength}, series[${idx}].data=${s.data.length}`)
        // Truncate or pad to match
        if (s.data.length > expectedLength) {
          s.data = s.data.slice(0, expectedLength)
        } else {
          while (s.data.length < expectedLength) {
            s.data.push(null)
          }
        }
      }
    })

    const result = { categories, series }
    return result
  } catch (e) {
    console.error('❌ [BaseCanvasChart] specToUChartsData error:', e)
    return { categories: [], series: [] }
  }
}

/**
 * Convert legacy echarts options to uCharts data format
 * This enables gradual migration without breaking existing code
 */
function echartsOptionsToUChartsData(options: Record<string, unknown>) {
  try {
    const xAxis = options.xAxis as { data?: string[] } | undefined
    const series = options.series as Array<{ name?: string; data?: (number | null)[] }> | undefined

    const categories = xAxis?.data || []
    const seriesData = (series || []).map((s, idx) => ({
      name: s.name || `Series ${idx + 1}`,
      data: (s.data || []).map(v => v ?? 0)
    }))

    return {
      categories,
      series: seriesData
    }
  } catch (e) {
    console.warn('[BaseCanvasChart] Failed to convert echarts options:', e)
    return { categories: [], series: [] }
  }
}

/**
 * Handle chart render complete
 */
function handleComplete() {
  // Cache dimensions on first render to prevent redundant calculations
  if (!cachedDimensions.value) {
    cachedDimensions.value = {
      width: canvasWidthPx.value,
      height: canvasHeightPx.value
    }
  }
  emit('chart-ready')
}

/**
 * Handle chart point click
 */
function handleGetIndex(e: any) {
  const index = e.currentIndex
  if (index === undefined || index === null) return

  const spec = props.spec
  if (!spec) return

  const category = spec.categories[index]
  const fallbackCategory = (() => {
    if (category) return category
    if (props.activeTab === 'day') return String(index)
    if (props.activeTab === 'month') return String(index + 1)
    return ''
  })()
  const series = spec.series[0]
  const value = series?.data[index]

  emit('point-click', {
    dataIndex: index,
    name: fallbackCategory,
    value: value,
    seriesName: series?.name
  })
}

/**
 * Clear dimension cache (called on window resize)
 */
function invalidateDimensionCache() {
  cachedDimensions.value = null
}

// Listen for window resize events (orientation change, etc.)
let resizeListener: (() => void) | null = null

onMounted(() => {
  resizeListener = () => {
    invalidateDimensionCache()
  }
  uni.onWindowResize(resizeListener)
})

onUnmounted(() => {
  if (resizeListener) {
    uni.offWindowResize(resizeListener)
    resizeListener = null
  }
})
</script>

<style scoped>
.canvas-chart-container {
  position: relative;
  overflow: hidden;
}

.empty-state {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 24rpx;
  color: #94a3b8;
}
</style>
