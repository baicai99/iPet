<template>
  <BaseCanvasChart 
    :spec="spec"
    :options="options"
    :height="height"
    :width="width"
    @point-click="handlePointClick"
    @chart-ready="handleChartReady"
  />
</template>

<script setup lang="ts">
/**
 * BaseChart - 图表代理组件
 * 
 * ⚠️ MIGRATION NOTE:
 * This component has been converted from ECharts+renderjs to a pure proxy.
 * It now delegates all rendering to BaseCanvasChart (uCharts).
 * 
 * The `options` prop is DEPRECATED and kept only for backward compatibility.
 * New code should use the `spec` prop with ChartSpec interface.
 * 
 * @deprecated options - Use spec instead
 */

import { defineProps, defineEmits } from 'vue'
import BaseCanvasChart from './BaseCanvasChart.vue'
import type { ChartSpec } from '@/types/chart'

const props = defineProps<{
  /** Recommended: Use ChartSpec for new implementations */
  spec?: ChartSpec
  /** @deprecated Use spec instead. Will be removed after migration. */
  options?: Record<string, unknown>
  height?: string
  width?: string
}>()

const emit = defineEmits<{
  'point-click': [params: any]
  'chart-ready': []
}>()

function handlePointClick(params: any) {
  emit('point-click', params)
}

function handleChartReady() {
  emit('chart-ready')
}
</script>

<style scoped>
/* No styles needed - pure proxy component */
</style>
