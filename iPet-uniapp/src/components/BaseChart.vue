<template>
    <view class="chart-container" :style="{ height, width }">
        <view class="echarts-view" :prop="options" :change:prop="echarts.updateChart" :chartId="chartId"
            :change:chartId="echarts.idChange" :id="chartId"></view>
    </view>
</template>

<script>
export default {
    name: 'BaseChart',
    emits: ['point-click', 'chart-ready'],
    props: {
        options: {
            type: Object,
            default: () => ({})
        },
        height: {
            type: String,
            default: '300rpx'
        },
        width: {
            type: String,
            default: '100%'
        }
    },
    data() {
        return {
            chartId: `chart-${Math.random().toString(36).slice(2)}`
        }
    },
    methods: {
        onChartClick(params) {
            this.$emit('point-click', params)
        },
        onChartReady() {
            this.$emit('chart-ready')
        }
    }
}
</script>

<script module="echarts" lang="renderjs">
// 【关键修改】按需引入 echarts，减小包体积
import { use, init } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent
} from 'echarts/components';

// 注册必须的组件
use([
    CanvasRenderer,
    LineChart,
    BarChart,
    PieChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent
]);

export default {
    data() {
        return {
            chart: null,
            resizeHandler: null,
            retryCount: 0,
            chartId: '',
            resizeObserver: null,
            updateTimer: null,
            resizeTimer: null
        }
    },
    mounted() {
        // 等待逻辑层传递 chartId
    },
    // 组件销毁前清理监听器和实例
    beforeDestroy() {
        this.disposeChart()
    },
    beforeUnmount() {
        this.disposeChart()
    },
    methods: {
        disposeChart() {
            if (this.resizeHandler && typeof window !== 'undefined') {
                window.removeEventListener('resize', this.resizeHandler)
                this.resizeHandler = null
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect()
                this.resizeObserver = null
            }
            if (this.chart) {
                this.chart.dispose()
                this.chart = null
            }
            if (this.updateTimer) {
                clearTimeout(this.updateTimer)
                this.updateTimer = null
            }
            if (this.resizeTimer) {
                clearTimeout(this.resizeTimer)
                this.resizeTimer = null
            }
        },
        idChange(newValue) {
            if (newValue) {
                this.chartId = newValue
                if (!this.chart) {
                    this.initChart()
                }
            }
        },
        initChart() {
            if (!this.chartId) return

            this.$nextTick(() => {
                const el = document.getElementById(this.chartId)
                if (!el) return

                // 检查容器尺寸，若为0则尝试等待或监听
                if (el.clientWidth === 0 || el.clientHeight === 0) {
                    if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
                        this.resizeObserver = new ResizeObserver((entries) => {
                            for (const entry of entries) {
                                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                                    this.resizeObserver.disconnect()
                                    this.resizeObserver = null
                                    this.initChart()
                                }
                            }
                        })
                        this.resizeObserver.observe(el)
                        return
                    }
                    
                    if (this.retryCount > 30) return
                    this.retryCount = (this.retryCount || 0) + 1
                    setTimeout(() => { this.initChart() }, 200)
                    return
                }
                this.retryCount = 0

                // 初始化图表
                this.chart = init(el)
                
                if (this.options) {
                    this.chart.setOption(this.options)
                }

                // 监听点击事件传回逻辑层
                this.chart.on('click', (params) => {
                    this.$ownerInstance.callMethod('onChartClick', params)
                })

                // 防抖的 resize 处理
                this.resizeHandler = () => {
                    if (this.resizeTimer) clearTimeout(this.resizeTimer)
                    this.resizeTimer = setTimeout(() => {
                        this.chart && this.chart.resize()
                    }, 200)
                }
                if (typeof window !== 'undefined') {
                    window.addEventListener('resize', this.resizeHandler)
                }

                this.$ownerInstance.callMethod('onChartReady')
            })
        },
        updateChart(newValue) {
            if (this.chart && newValue) {
                // 防抖更新
                if (this.updateTimer) clearTimeout(this.updateTimer)
                this.updateTimer = setTimeout(() => {
                    try {
                        // 使用全量包后，containLabel 等特性通常能正常工作，或直接被支持
                        this.chart.setOption(newValue, true)
                    } catch (e) {
                        console.error('[BaseChart] updateChart error:', e)
                    }
                }, 100)
            }
        }
    }
}
</script>

<style scoped>
.chart-container {
    position: relative;
    overflow: hidden;
}

.echarts-view {
    width: 100%;
    height: 100%;
}
</style>
