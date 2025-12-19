/**
 * usePerformanceTracker - 页面性能追踪 Composable
 * 
 * 用于在页面组件中追踪 FCP (First Contentful Paint) 和 LCP (Largest Contentful Paint)
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { usePerformanceTracker } from '@/composables/usePerformanceTracker'
 * 
 * usePerformanceTracker('summary')
 * </script>
 * ```
 */

import { onMounted, onUnmounted } from 'vue'
import { performanceMonitor } from '@/utils/performance/performanceMonitor'

/**
 * 页面性能追踪 Composable
 * 
 * @param pageName - 页面名称（用于标识）
 * @param options - 追踪选项
 */
export function usePerformanceTracker(
    pageName: string,
    options?: {
        /** 是否追踪 LCP（需要观察特定元素） */
        trackLcp?: boolean
        /** LCP 元素选择器 */
        lcpSelector?: string
    }
) {
    const startTime = Date.now()
    let lcpObserver: PerformanceObserver | null = null

    onMounted(() => {
        // 记录 FCP（onMounted 时间近似 FCP）
        const fcp = Date.now() - startTime

        // 简单场景：只追踪 FCP
        if (!options?.trackLcp) {
            performanceMonitor.trackPageLoad(pageName, fcp)
            return
        }

        // 高级场景：追踪 LCP（仅 H5 环境支持）
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries()
                    const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
                    const lcp = Math.round(lastEntry.startTime)
                    performanceMonitor.trackPageLoad(pageName, fcp, lcp)
                    lcpObserver?.disconnect()
                })
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

                // 5 秒后强制上报（防止 LCP 事件永不触发）
                setTimeout(() => {
                    if (lcpObserver) {
                        performanceMonitor.trackPageLoad(pageName, fcp)
                        lcpObserver.disconnect()
                        lcpObserver = null
                    }
                }, 5000)
            } catch {
                // PerformanceObserver 不支持 LCP，降级为只记录 FCP
                performanceMonitor.trackPageLoad(pageName, fcp)
            }
        } else {
            // 非 H5 环境，只记录 FCP
            performanceMonitor.trackPageLoad(pageName, fcp)
        }
    })

    onUnmounted(() => {
        if (lcpObserver) {
            lcpObserver.disconnect()
            lcpObserver = null
        }
    })
}

export default usePerformanceTracker
