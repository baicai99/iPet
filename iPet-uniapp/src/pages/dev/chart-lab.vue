<template>
  <view class="lab-container">
    <view class="header">
      <text class="title">图表测试实验室</text>
      <text class="subtitle">Chart Lab - 验证所有图表类型和边界情况</text>
    </view>

    <view class="test-case" v-for="test in testCases" :key="test.name">
      <text class="test-title">{{ test.name }}</text>
      <text class="test-desc">{{ test.description }}</text>
      <BaseCanvasChart 
        :spec="test.spec" 
        height="300rpx" 
        width="100%"
        @point-click="handleClick"
        @chart-ready="handleReady(test.name)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseCanvasChart from '@/components/BaseCanvasChart.vue'
import type { ChartSpec } from '@/types/chart'

const testCases = ref([
  {
    name: '1. 空数据测试',
    description: '验证空数据时的空状态显示',
    spec: {
      type: 'line',
      categories: [],
      series: [],
      color: '#3b82f6'
    } as ChartSpec
  },
  {
    name: '2. 单点数据测试',
    description: '验证只有一个数据点时的显示（应显示为圆点）',
    spec: {
      type: 'area',
      categories: ['周一'],
      series: [{ name: '体重', data: [5.2] }],
      min: 0,
      max: 10,
      color: '#3b82f6',
      yAxisName: 'kg'
    } as ChartSpec
  },
  {
    name: '3. 中间缺失（null）- 不连接',
    description: '验证 null 值断点显示（connectNulls=false）',
    spec: {
      type: 'area',
      categories: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '体重', data: [5.0, 5.1, null, null, 5.3, 5.4, 5.5] }],
      connectNulls: false,
      color: '#3b82f6',
      yAxisName: 'kg'
    } as ChartSpec
  },
  {
    name: '4. 中间缺失（null）- 连接断点',
    description: '验证 connectNulls=true 时跨越断点连接',
    spec: {
      type: 'area',
      categories: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '体重', data: [5.0, 5.1, null, null, 5.3, 5.4, 5.5] }],
      connectNulls: true,
      color: '#10b981',
      yAxisName: 'kg'
    } as ChartSpec
  },
  {
    name: '5. Bar 图 - 全 0',
    description: '验证柱状图全 0 时的显示',
    spec: {
      type: 'bar',
      categories: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '饮水量', data: [0, 0, 0, 0, 0, 0, 0] }],
      min: 0,
      max: 500,
      color: '#06b6d4',
      yAxisName: 'ml'
    } as ChartSpec
  },
  {
    name: '6. Bar 图 - 缺失值（zero 策略）',
    description: '验证 bar 图 missingPolicy=zero 时 null 转 0',
    spec: {
      type: 'bar',
      categories: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '饮水量', data: [100, 200, null, null, 300, 250, 180] }],
      missingPolicy: 'zero',
      color: '#06b6d4',
      yAxisName: 'ml'
    } as ChartSpec
  },
  {
    name: '7. Bar 图 - 缺失值（carry 策略）',
    description: '验证 bar 图 missingPolicy=carry 时 null 使用前值',
    spec: {
      type: 'bar',
      categories: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '饮水量', data: [100, 200, null, null, 300, 250, 180] }],
      missingPolicy: 'carry',
      color: '#8b5cf6',
      yAxisName: 'ml'
    } as ChartSpec
  },
  {
    name: '8. 极值测试（min=max）',
    description: '验证所有值相同时的 Y 轴计算',
    spec: {
      type: 'line',
      categories: ['一', '二', '三', '四', '五'],
      series: [{ name: '体温', data: [38.5, 38.5, 38.5, 38.5, 38.5] }],
      color: '#ef4444',
      yAxisName: '°C'
    } as ChartSpec
  },
  {
    name: '9. 大数据量测试（year 视图）',
    description: '验证 12 个月数据的渲染性能',
    spec: {
      type: 'area',
      categories: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
      series: [{
        name: '体重',
        data: Array.from({ length: 12 }, (_, i) => 5.0 + Math.random() * 2)
      }],
      color: '#f59e0b',
      yAxisName: 'kg'
    } as ChartSpec
  },
  {
    name: '10. Line 图 - 基础折线',
    description: '验证基础折线图显示',
    spec: {
      type: 'line',
      categories: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '心率', data: [72, 75, 68, 80, 76, 74, 71] }],
      color: '#ec4899',
      yAxisName: 'bpm'
    } as ChartSpec
  }
])

function handleClick(params: any) {
  console.log('Point clicked:', params)
  uni.showToast({
    title: `${params.name}: ${params.value}`,
    icon: 'none',
    duration: 2000
  })
}

function handleReady(testName: string) {
  console.log(`Chart ready: ${testName}`)
}
</script>

<style lang="scss" scoped>
.lab-container {
  min-height: 100vh;
  padding: 24rpx;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 32rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.test-case {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.test-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8rpx;
  display: block;
}

.test-desc {
  font-size: 24rpx;
  color: #64748b;
  margin-bottom: 16rpx;
  display: block;
  line-height: 1.5;
}
</style>
