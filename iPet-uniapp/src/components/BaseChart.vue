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
            resizeTimer: null,
            previousOptions: null  // ✅ 用于检测变更类型
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
            this.previousOptions = null
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
                    // 首次渲染：全量 setOption
                    this.chart.setOption(this.options)
                    this.previousOptions = this.deepClone(this.options)
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
        
        /**
         * ✅ 检测是否为结构变更
         * 
         * 结构变更场景：
         * - 切换 Tab（时间范围变化）
         * - 切换 metric
         * - 切换图表类型
         * - 首次渲染
         */
        isStructuralChange(oldOpts, newOpts) {
            if (!oldOpts || !newOpts) return true  // 首次渲染
            
            // 检查关键结构字段
            const structuralChecks = [
                // X轴结构
                () => this.getPath(oldOpts, 'xAxis.type') !== this.getPath(newOpts, 'xAxis.type'),
                // Y轴结构
                () => this.getPath(oldOpts, 'yAxis.type') !== this.getPath(newOpts, 'yAxis.type'),
                // Series 数量
                () => (oldOpts.series?.length || 0) !== (newOpts.series?.length || 0),
                // Series 类型（第一个）
                () => this.getPath(oldOpts, 'series.0.type') !== this.getPath(newOpts, 'series.0.type'),
                // Series 名称（用于区分不同 metric）
                () => this.getPath(oldOpts, 'series.0.name') !== this.getPath(newOpts, 'series.0.name')
            ]
            
            return structuralChecks.some(check => check())
        },
        
        /**
         * ✅ 增量更新（仅数据）
         * 
         * 适用场景：
         * - 数据刷新（同 Tab、同 metric）
         * - Pull-to-refresh
         * - 添加/删除记录
         */
        updateDataOnly(newOptions) {
            if (!this.chart) return
            
            console.log('[BaseChart] 📊 Incremental update (data only)')
            
            try {
                // 构建增量更新配置
                const updateConfig = {}
                
                // 更新 series.data
                if (newOptions.series && Array.isArray(newOptions.series)) {
                    updateConfig.series = newOptions.series.map((s, index) => ({
                        seriesIndex: index,
                        data: s.data
                    }))
                }
                
                // 更新 xAxis.data（类目轴）
                if (newOptions.xAxis && newOptions.xAxis.data) {
                    updateConfig.xAxis = {
                        data: newOptions.xAxis.data
                    }
                }
                
                // 使用增量 API（不触发完整重绘）
                this.chart.setOption(updateConfig, {
                    notMerge: false,   // 合并，不替换
                    lazyUpdate: false  // 立即更新
                })
            } catch (e) {
                console.warn('[BaseChart] Incremental update failed, fallback to full', e)
                this.updateFull(newOptions)
            }
        },
        
        /**
         * ❌ 全量更新（结构 + 数据）
         * 
         * 适用场景：
         * - 切换 Tab
         * - 切换 metric
         * - 切换图表类型
         */
        updateFull(newOptions) {
            if (!this.chart) return
            
            console.log('[BaseChart] 🔄 Full update (structural change)')
            
            try {
                this.chart.setOption(newOptions, true)  // notMerge: true（完全替换）
            } catch (e) {
                console.error('[BaseChart] updateChart error:', e)
            }
        },
        
        /**
         * ✅ 智能更新入口（自动选择策略）
         */
        updateChart(newValue) {
            if (!this.chart || !newValue) return
            
            // 防抖更新
            if (this.updateTimer) clearTimeout(this.updateTimer)
            this.updateTimer = setTimeout(() => {
                const startTime = performance.now()
                
                // 检测变更类型
                const isStructural = this.isStructuralChange(this.previousOptions, newValue)
                
                if (isStructural) {
                    // 结构变更：全量更新
                    this.updateFull(newValue)
                } else {
                    // 数值变更：增量更新
                    this.updateDataOnly(newValue)
                }
                
                // 性能日志
                const duration = performance.now() - startTime
                console.log(`[BaseChart] Update took ${duration.toFixed(2)}ms (${isStructural ? 'full' : 'incremental'})`)
                
                // 保存当前 options 用于下次对比
                this.previousOptions = this.deepClone(newValue)
            }, 100)
        },
        
        /**
         * 辅助函数：获取嵌套路径值
         */
        getPath(obj, path) {
            if (!obj) return undefined
            return path.split('.').reduce((acc, key) => {
                // 处理数组索引（如 'series.0.type'）
                if (/^\d+$/.test(key)) {
                    return acc?.[parseInt(key)]
                }
                return acc?.[key]
            }, obj)
        },
        
        /**
         * 辅助函数：深拷贝（简化版）
         */
        deepClone(obj) {
            if (!obj || typeof obj !== 'object') return obj
            try {
                return JSON.parse(JSON.stringify(obj))
            } catch (e) {
                return obj
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
