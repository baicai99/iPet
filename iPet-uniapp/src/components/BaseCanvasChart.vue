<template>
    <view class="canvas-chart-container" :style="{ height, width }">
        <qiun-data-charts 
            v-if="hasData" 
            :type="uchartsType" 
            :opts="chartOpts" 
            :chartData="chartData" 
            :canvas2d="true"
            :ontouch="true" 
            :animation="false"
            @complete="handleComplete"
            @getIndex="handleGetIndex"
        />
        <view v-else class="empty-state">
            <text class="empty-text">暂无数据</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
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
}>()

const emit = defineEmits<{
    'point-click': [params: unknown]
    'chart-ready': []
}>()

// Default dimensions
const height = computed(() => props.height || '300rpx')
const width = computed(() => props.width || '100%')

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
    const themeColor = props.spec?.color || '#3b82f6'

    return {
        color: [themeColor],
        padding: [15, 10, 0, 15],
        enableScroll: false,
        legend: {
            show: props.spec?.showLegend ?? false
        },
        xAxis: {
            disableGrid: true,
            labelCount: 5,
            fontSize: 10,
            fontColor: '#94a3b8'
        },
        yAxis: {
            disabled: false,
            disableGrid: false,
            splitNumber: 4,
            gridColor: '#f1f5f9',
            gridType: 'dash',
            dashLength: 4,
            fontSize: 10,
            fontColor: '#94a3b8',
            data: [{
                min: props.spec?.min,
                max: props.spec?.max,
                title: props.spec?.yAxisName || ''
            }]
        },
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
})

const hasData = computed(() => {
    const data = chartData.value
    return data.categories?.length > 0 && data.series?.length > 0
})

/**
 * Convert ChartSpec to uCharts data format
 */
function specToUChartsData(spec: ChartSpec) {
  return {
    categories: spec.categories,
    series: spec.series.map((s: ChartSeries) => {
      let processedData: (number | null)[]
      
      // Handle null values based on chart type and policy
      if (spec.type === 'bar') {
        // Bar charts: apply missingPolicy
        const policy = spec.missingPolicy || 'zero'
        processedData = s.data.map((v, idx) => {
          if (v === null || v === undefined) {
            if (policy === 'zero') return 0
            if (policy === 'carry') {
              // Find nearest previous valid value
              for (let i = idx - 1; i >= 0; i--) {
                if (s.data[i] !== null && s.data[i] !== undefined) {
                  return s.data[i]!
                }
              }
              return 0  // Fallback to 0 if no previous value
            }
            return 0  // 'null' policy also uses 0 for bars (no gap support)
          }
          return v
        })
      } else {
        // Line/Area charts: preserve null for gaps
        processedData = s.data
      }
      
      return {
        name: s.name,
        data: processedData,
        color: s.color
      }
    })
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
  const series = spec.series[0]
  const value = series?.data[index]
  
  emit('point-click', {
    dataIndex: index,
    name: category,
    value: value,
    seriesName: series?.name
  })
}
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
