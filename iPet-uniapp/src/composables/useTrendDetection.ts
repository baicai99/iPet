/**
 * useTrendDetection - Trend Detection Composable
 * 
 * @deprecated Use `healthStore.getChangedMetricKeys()` and related getters directly
 * 
 * 迁移指南：
 * ```typescript
 * // 旧方式（Composable）
 * const { changedMetricKeys, stableMetricKeys } = useTrendDetection()
 * 
 * // 新方式（Store Getters）
 * const healthStore = useHealthStore()
 * const changedMetricKeys = computed(() => healthStore.getChangedMetricKeys())
 * const stableMetricKeys = computed(() => healthStore.getStableMetricKeys())
 * ```
 * 
 * 职责迁移：
 * - ❌ 旧：业务逻辑在 composable
 * - ✅ 新：业务逻辑在 healthStore getters
 * - ✅ 新：Views 极度简化，只负责渲染
 * - ✅ 新：单测从"测页面"变成"测 store"
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { useHealthStore } from '@/stores/healthStore'
import type { TrendAnalysis } from '@/domain/trend/detectSignificantChanges'

// ============================================================================
// Types
// ============================================================================

export interface UseTrendDetectionReturn {
    /** 有显著变化的指标键列表 */
    changedMetricKeys: ComputedRef<string[]>
    /** 稳定的指标键列表 */
    stableMetricKeys: ComputedRef<string[]>
    /** 完整的趋势分析结果 */
    trendAnalysis: ComputedRef<Record<string, TrendAnalysis>>
    /** 获取单个指标的分析结果 */
    getAnalysis: (metricKey: string) => TrendAnalysis | null
}

// ============================================================================
// Deprecated Composable (Thin Wrapper)
// ============================================================================

/**
 * @deprecated 请直接使用 healthStore getters
 * 
 * 此 composable 保留仅为向后兼容，内部已重构为调用 healthStore getters。
 * 
 * 新代码请使用：
 * - `healthStore.getChangedMetricKeys()`
 * - `healthStore.getStableMetricKeys()`
 * - `healthStore.getTrendAnalysis()`
 * - `healthStore.getMetricTrendStatus(key)`
 * 
 * @param metricKeys 忽略（已废弃，现在总是分析所有指标）
 * @param config 忽略（已废弃，配置在 domain 层）
 */
export function useTrendDetection(
    metricKeys?: string[] | Ref<string[]>,
    config?: any
): UseTrendDetectionReturn {
    const healthStore = useHealthStore()

    // 直接委托给 store getters
    return {
        changedMetricKeys: computed(() => healthStore.getChangedMetricKeys()),
        stableMetricKeys: computed(() => healthStore.getStableMetricKeys()),
        trendAnalysis: computed(() => healthStore.trendAnalysis),
        getAnalysis: (metricKey: string) => healthStore.trendAnalysis[metricKey] || null
    }
}
