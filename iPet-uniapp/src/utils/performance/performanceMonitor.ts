/**
 * Performance Monitor - 性能监控核心服务
 * 
 * 功能：
 * 1. 收集性能指标（API耗时、页面加载、缓存命中率）
 * 2. 计算聚合统计（P50/P95/P99）
 * 3. 开发环境控制台输出
 * 4. 生产环境远程上报（预留接口）
 * 
 * 使用方式：
 * - 自动集成：request.ts、errorHandler.ts、healthCacheService.ts
 * - 手动调用：performanceMonitor.trackXxx()
 * 
 * @see docs/frontend/运维与可观测性层.md
 */

import type { App } from 'vue'
import { APP_CONFIG } from '@/utils/config'

// ============================================================================
// Types
// ============================================================================

/** API 请求指标 */
interface ApiMetric {
    type: 'api'
    url: string
    method: string
    duration: number
    status: number
    timestamp: number
}

/** 页面加载指标 */
interface PageMetric {
    type: 'page'
    pageName: string
    fcp: number          // First Contentful Paint
    lcp?: number         // Largest Contentful Paint (可选)
    timestamp: number
}

/** 缓存指标 */
interface CacheMetric {
    type: 'cache'
    key: string
    hit: boolean
    timestamp: number
}

/** 错误指标 */
interface ErrorMetric {
    type: 'error'
    name: string
    message: string
    stack?: string
    context?: Record<string, any>
    timestamp: number
}

type PerformanceMetric = ApiMetric | PageMetric | CacheMetric | ErrorMetric

/** 聚合统计结果 */
export interface PerformanceMetrics {
    api: {
        total: number
        success: number
        failure: number
        successRate: number
        durations: {
            p50: number
            p95: number
            p99: number
            avg: number
        }
        byUrl: Map<string, { count: number; avgDuration: number; errorRate: number }>
    }
    page: {
        avgFcp: number
        avgLcp: number
        byPage: Map<string, { fcp: number; lcp?: number; count: number }>
    }
    cache: {
        total: number
        hits: number
        misses: number
        hitRate: number
    }
    error: {
        total: number
        byType: Map<string, number>
    }
}

// ============================================================================
// Constants
// ============================================================================

const MAX_METRICS = 1000          // 最大保留条目数
const FLUSH_DEBOUNCE_MS = 5000   // 上报 debounce 时间
const CONSOLE_COLORS = {
    api: '#4CAF50',      // 绿色
    page: '#2196F3',     // 蓝色
    cache: '#FF9800',    // 橙色
    error: '#F44336',    // 红色
    info: '#9E9E9E'      // 灰色
}

// ============================================================================
// PerformanceMonitor Class
// ============================================================================

class PerformanceMonitorImpl {
    private metrics: PerformanceMetric[] = []
    private flushTimer: ReturnType<typeof setTimeout> | null = null
    private enabled: boolean

    constructor() {
        // 根据配置决定是否启用
        this.enabled = APP_CONFIG.ENABLE_PERFORMANCE_MONITOR ?? true
    }

    // -------------------------------------------------------------------------
    // Track Methods
    // -------------------------------------------------------------------------

    /**
     * 记录 API 请求耗时
     */
    trackApiCall(url: string, method: string, duration: number, status: number): void {
        if (!this.enabled) return

        const metric: ApiMetric = {
            type: 'api',
            url: this.normalizeUrl(url),
            method: method.toUpperCase(),
            duration,
            status,
            timestamp: Date.now()
        }

        this.addMetric(metric)
        this.logDev('api', `${method.toUpperCase()} ${url} ${duration}ms (${status})`)
    }

    /**
     * 记录页面加载时间
     */
    trackPageLoad(pageName: string, fcp: number, lcp?: number): void {
        if (!this.enabled) return

        const metric: PageMetric = {
            type: 'page',
            pageName,
            fcp,
            lcp,
            timestamp: Date.now()
        }

        this.addMetric(metric)
        const lcpStr = lcp ? ` LCP: ${lcp}ms` : ''
        this.logDev('page', `${pageName} FCP: ${fcp}ms${lcpStr}`)
    }

    /**
     * 记录缓存命中/未命中
     */
    trackCacheHit(key: string, hit: boolean): void {
        if (!this.enabled) return

        const metric: CacheMetric = {
            type: 'cache',
            key,
            hit,
            timestamp: Date.now()
        }

        this.addMetric(metric)
        this.logDev('cache', `${hit ? 'HIT' : 'MISS'}: ${key}`)
    }

    /**
     * 记录错误
     */
    trackError(error: Error, context?: Record<string, any>): void {
        if (!this.enabled) return

        const metric: ErrorMetric = {
            type: 'error',
            name: error.name,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        }

        this.addMetric(metric)
        this.logDev('error', `${error.name}: ${error.message}`)
    }

    // -------------------------------------------------------------------------
    // Aggregation Methods
    // -------------------------------------------------------------------------

    /**
     * 获取聚合统计
     */
    getMetrics(): PerformanceMetrics {
        const apiMetrics = this.metrics.filter((m): m is ApiMetric => m.type === 'api')
        const pageMetrics = this.metrics.filter((m): m is PageMetric => m.type === 'page')
        const cacheMetrics = this.metrics.filter((m): m is CacheMetric => m.type === 'cache')
        const errorMetrics = this.metrics.filter((m): m is ErrorMetric => m.type === 'error')

        return {
            api: this.aggregateApiMetrics(apiMetrics),
            page: this.aggregatePageMetrics(pageMetrics),
            cache: this.aggregateCacheMetrics(cacheMetrics),
            error: this.aggregateErrorMetrics(errorMetrics)
        }
    }

    private aggregateApiMetrics(metrics: ApiMetric[]) {
        const total = metrics.length
        const success = metrics.filter(m => m.status >= 200 && m.status < 300).length
        const failure = total - success
        const durations = metrics.map(m => m.duration).sort((a, b) => a - b)

        // 按 URL 分组统计
        const byUrl = new Map<string, { count: number; avgDuration: number; errorRate: number }>()
        const urlGroups = new Map<string, ApiMetric[]>()

        metrics.forEach(m => {
            const existing = urlGroups.get(m.url) || []
            existing.push(m)
            urlGroups.set(m.url, existing)
        })

        urlGroups.forEach((group, url) => {
            const errors = group.filter(m => m.status < 200 || m.status >= 300).length
            byUrl.set(url, {
                count: group.length,
                avgDuration: group.reduce((sum, m) => sum + m.duration, 0) / group.length,
                errorRate: group.length > 0 ? (errors / group.length) * 100 : 0
            })
        })

        return {
            total,
            success,
            failure,
            successRate: total > 0 ? (success / total) * 100 : 0,
            durations: {
                p50: this.percentile(durations, 50),
                p95: this.percentile(durations, 95),
                p99: this.percentile(durations, 99),
                avg: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
            },
            byUrl
        }
    }

    private aggregatePageMetrics(metrics: PageMetric[]) {
        const byPage = new Map<string, { fcp: number; lcp?: number; count: number }>()

        metrics.forEach(m => {
            const existing = byPage.get(m.pageName)
            if (existing) {
                existing.fcp = (existing.fcp * existing.count + m.fcp) / (existing.count + 1)
                if (m.lcp) {
                    existing.lcp = existing.lcp
                        ? (existing.lcp * existing.count + m.lcp) / (existing.count + 1)
                        : m.lcp
                }
                existing.count++
            } else {
                byPage.set(m.pageName, { fcp: m.fcp, lcp: m.lcp, count: 1 })
            }
        })

        const fcpSum = metrics.reduce((sum, m) => sum + m.fcp, 0)
        const lcpMetrics = metrics.filter(m => m.lcp !== undefined)
        const lcpSum = lcpMetrics.reduce((sum, m) => sum + (m.lcp || 0), 0)

        return {
            avgFcp: metrics.length > 0 ? fcpSum / metrics.length : 0,
            avgLcp: lcpMetrics.length > 0 ? lcpSum / lcpMetrics.length : 0,
            byPage
        }
    }

    private aggregateCacheMetrics(metrics: CacheMetric[]) {
        const total = metrics.length
        const hits = metrics.filter(m => m.hit).length
        const misses = total - hits

        return {
            total,
            hits,
            misses,
            hitRate: total > 0 ? (hits / total) * 100 : 0
        }
    }

    private aggregateErrorMetrics(metrics: ErrorMetric[]) {
        const byType = new Map<string, number>()

        metrics.forEach(m => {
            const count = byType.get(m.name) || 0
            byType.set(m.name, count + 1)
        })

        return {
            total: metrics.length,
            byType
        }
    }

    // -------------------------------------------------------------------------
    // Reporting Methods
    // -------------------------------------------------------------------------

    /**
     * 上报指标到远程服务器（预留接口）
     */
    async flush(): Promise<void> {
        if (!this.enabled || this.metrics.length === 0) return

        const reportUrl = APP_CONFIG.PERFORMANCE_REPORT_URL
        if (!reportUrl) {
            // 无上报地址，仅在开发环境输出汇总
            if (import.meta.env.DEV) {
                console.log('[Perf] Metrics Summary:', this.getMetrics())
            }
            return
        }

        // TODO: 实现远程上报
        // try {
        //     await fetch(reportUrl, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({
        //             metrics: this.metrics,
        //             timestamp: Date.now()
        //         })
        //     })
        //     this.metrics = [] // 上报成功后清空
        // } catch (error) {
        //     console.warn('[Perf] Failed to report metrics:', error)
        // }
    }

    /**
     * 重置所有指标
     */
    reset(): void {
        this.metrics = []
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    private addMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric)

        // 限制最大条目数，FIFO 清理
        if (this.metrics.length > MAX_METRICS) {
            this.metrics = this.metrics.slice(-MAX_METRICS)
        }

        // Debounce flush
        this.scheduleFlush()
    }

    private scheduleFlush(): void {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
        }
        this.flushTimer = setTimeout(() => {
            this.flush()
        }, FLUSH_DEBOUNCE_MS)
    }

    private normalizeUrl(url: string): string {
        // 移除 query 参数，保留路径
        return url.split('?')[0]
    }

    private percentile(sortedArr: number[], p: number): number {
        if (sortedArr.length === 0) return 0
        const index = Math.ceil((p / 100) * sortedArr.length) - 1
        return sortedArr[Math.max(0, index)]
    }

    private logDev(type: keyof typeof CONSOLE_COLORS, message: string): void {
        if (!import.meta.env.DEV) return

        const color = CONSOLE_COLORS[type]
        console.log(
            `%c[Perf]%c ${type.toUpperCase()} %c${message}`,
            `color: ${color}; font-weight: bold`,
            `color: ${color}`,
            'color: inherit'
        )
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const performanceMonitor = new PerformanceMonitorImpl()

// 暴露到 window 供开发调试
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (window as any).__PERF_MONITOR__ = performanceMonitor
}

// ============================================================================
// Global Error Handler Initialization
// ============================================================================

/**
 * 初始化全局错误捕获
 * 在 main.ts 中调用
 */
export function initGlobalErrorHandler(app: App): void {
    // Vue 组件错误捕获
    app.config.errorHandler = (err, instance, info) => {
        const error = err instanceof Error ? err : new Error(String(err))
        performanceMonitor.trackError(error, {
            component: instance?.$options?.name || 'Unknown',
            info
        })

        // 仍然在控制台输出错误
        console.error('[Vue Error]', err)
    }

    // 全局未捕获 Promise 错误（仅 H5 环境）
    if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error
                ? event.reason
                : new Error(String(event.reason))
            performanceMonitor.trackError(error, { type: 'unhandledrejection' })
        })
    }
}

// ============================================================================
// Export
// ============================================================================

export default performanceMonitor
