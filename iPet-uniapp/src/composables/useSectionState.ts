/**
 * useSectionState - 分区状态机 Composable
 * 
 * 职责：
 * - 管理 UI 区块的独立状态（替代全局 boolean loading）
 * - 提供清晰的状态转换 API
 * - 支持多个 section 并行加载
 * 
 * 状态机：
 * unknown → loading → ready/empty/error
 *         ↓
 *    showing_cache (有缓存时)
 */

import { ref, computed } from 'vue'

// ============================================================================
// Types
// ============================================================================

/**
 * 区块状态枚举
 */
export type SectionState =
    | 'unknown'        // 未加载（初始状态）
    | 'loading'        // 首次加载中
    | 'showing_cache'  // 展示缓存数据（后台可能在刷新）
    | 'empty'          // 已确认为空
    | 'ready'          // 有数据且已就绪
    | 'error'          // 加载失败

/**
 * 状态转换选项
 */
export interface StateTransitionOptions {
    /** 是否有缓存数据 */
    hasCache?: boolean
    /** 是否有数据 */
    hasData?: boolean
    /** 错误信息 */
    error?: Error | string | null
}

// ============================================================================
// Composable
// ============================================================================

export function useSectionState(initialState: SectionState = 'unknown') {
    const state = ref<SectionState>(initialState)
    const error = ref<string | null>(null)

    // ✅ P0-2: 记录是否曾经有过数据（防止回退到 empty）
    const hasEverHadData = ref(false)

    // -------------------------------------------------------------------------
    // State Queries (Computed)
    // -------------------------------------------------------------------------

    /** 是否未加载 */
    const isUnknown = computed(() => state.value === 'unknown')

    /** 是否加载中（首次） */
    const isLoading = computed(() => state.value === 'loading')

    /** 是否展示缓存 */
    const isShowingCache = computed(() => state.value === 'showing_cache')

    /** 是否为空 */
    const isEmpty = computed(() => state.value === 'empty')

    /** 是否就绪 */
    const isReady = computed(() => state.value === 'ready')

    /** 是否错误 */
    const isError = computed(() => state.value === 'error')

    /** 是否应该显示 skeleton（未加载或首次加载中） */
    const shouldShowSkeleton = computed(() =>
        state.value === 'loading' && !isShowingCache.value
    )

    /** 是否应该显示数据（ready 或 showing_cache） */
    const shouldShowData = computed(() => {
        const result = state.value === 'ready' || state.value === 'showing_cache'

        // ✅ DEBUG: 追踪状态
        if (import.meta.env.DEV) {
            console.log('[useSectionState] shouldShowData:', {
                result,
                state: state.value,
                hasEverHadData: hasEverHadData.value
            })
        }

        return result
    })

    /** 是否应该显示空态（已确认为空，且非加载中） */
    const shouldShowEmpty = computed(() =>
        state.value === 'empty'
    )

    /** 是否应该显示错误态 */
    const shouldShowError = computed(() =>
        state.value === 'error'
    )

    // -------------------------------------------------------------------------
    // State Transitions
    // -------------------------------------------------------------------------

    /**
     * 开始加载
     * unknown → loading (无缓存)
     * unknown → showing_cache (有缓存)
     */
    function startLoading(options: StateTransitionOptions = {}) {
        if (options.hasCache) {
            state.value = 'showing_cache'
            hasEverHadData.value = true  // ✅ 有缓存 = 曾经有数据
        } else {
            state.value = 'loading'
        }
        error.value = null
    }

    /**
     * ✅ P0-2 FIX: 加载成功（防止回退到 empty）
     * 
     * 核心规则：
     * 1. 如果曾经有过数据(hasEverHadData=true)，且当前是 ready/showing_cache
     * 2. 新数据为空(hasData=false)
     * 3. 不切换到 empty，保持当前状态（展示旧数据）
     * 
     * 允许的路径：
     * - loading → ready (首次有数据)
     * - loading → empty (首次确认无数据)
     * - showing_cache → ready (刷新成功)
     * - ready → ready (刷新成功)
     * 
     * 禁止的路径：
     * - showing_cache → empty ❌ (保持 showing_cache)
     * - ready → empty ❌ (保持 ready)
     */
    function loadSuccess(options: StateTransitionOptions = {}) {
        const currentHasData = state.value === 'ready' || state.value === 'showing_cache'

        if (options.hasData) {
            // ✅ 有新数据：正常切换到 ready
            state.value = 'ready'
            hasEverHadData.value = true
        } else {
            // ⚠️ 新数据为空
            // P0-2 规则：如果曾经有数据，不允许回退到 empty
            if (hasEverHadData.value && currentHasData) {
                // 🔒 保持当前状态（ready 或 showing_cache），不回退
                console.warn(
                    `[SectionState] P0-2: Preventing regression to empty. ` +
                    `Current state: ${state.value}, keeping old data.`
                )
                // state.value 保持不变
            } else {
                // ✅ 首次加载且确认无数据 → 可以切换到 empty
                state.value = 'empty'
            }
        }
        error.value = null
    }

    /**
     * 加载失败
     * loading/showing_cache → error (失败且无缓存)
     * showing_cache → showing_cache (失败但有缓存，保持缓存)
     */
    function loadError(err: Error | string) {
        const errorMsg = typeof err === 'string' ? err : err.message

        // 如果有缓存，失败后继续展示缓存
        if (state.value === 'showing_cache') {
            console.warn('[SectionState] Load failed but keeping cache:', errorMsg)
            // 保持 showing_cache 状态
        } else {
            state.value = 'error'
        }

        error.value = errorMsg
    }

    /**
     * 重置状态
     */
    function reset() {
        state.value = 'unknown'
        error.value = null
        hasEverHadData.value = false  // ✅ 重置数据历史
    }

    /**
     * 直接设置状态（用于特殊场景）
     */
    function setState(newState: SectionState, errorMsg?: string) {
        state.value = newState
        if (errorMsg) {
            error.value = errorMsg
        } else {
            error.value = null
        }

        // ✅ 更新数据历史标记
        if (newState === 'ready' || newState === 'showing_cache') {
            hasEverHadData.value = true
        }
    }

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------

    return {
        // Raw State
        state,
        error,
        hasEverHadData,  // ✅ 暴露数据历史标记（供调试）

        // State Queries
        isUnknown,
        isLoading,
        isShowingCache,
        isEmpty,
        isReady,
        isError,

        // UI Helpers
        shouldShowSkeleton,
        shouldShowData,
        shouldShowEmpty,
        shouldShowError,

        // State Transitions
        startLoading,
        loadSuccess,
        loadError,
        reset,
        setState
    }
}

// ============================================================================
// State Machine Diagram (P0-2 Updated)
// ============================================================================

/**
 * 状态转换图：
 * 
 *                  ┌─────────┐
 *                  │ unknown │
 *                  └────┬────┘
 *                       │ startLoading()
 *               ┌───────┴───────┐
 *               │               │
 *       hasCache=true    hasCache=false
 *               │               │
 *               ▼               ▼
 *      ┌────────────────┐  ┌─────────┐
 *      │ showing_cache  │  │ loading │
 *      └───────┬────────┘  └────┬────┘
 *              │                │
 *              │  loadSuccess() │
 *              │                │
 *       ┌──────┴────────────────┴──────┐
 *       │                               │
 *  hasData=true                   hasData=false
 *       │                               │
 *       ▼                               ▼
 *  ┌────────┐                      ┌───────┐
 *  │ ready  │                      │ empty │ (仅首次无数据时)
 *  └────┬───┘                      └───────┘
 *       │
 *       │ loadSuccess(hasData=true)
 *       ├──────────────────────────────┐
 *       │                              │
 *       ▼                              │
 *  ┌────────┐                          │
 *  │ ready  │ (数据刷新)                │
 *  └────────┘                          │
 *                                      │
 *  🔒 P0-2 防回退规则：                 │
 *  如果 hasEverHadData=true:            │
 *    ready → empty ❌ (保持 ready)     │
 *    showing_cache → empty ❌          │
 *                   (保持 showing_cache)│
 *                                      │
 *       loadError() + hasCache         │
 *              │                       │
 *              ▼                       │
 *      ┌────────────────┐             │
 *      │ showing_cache  │◄────────────┘
 *      └────────────────┘
 * 
 *       loadError() + !hasCache
 *              │
 *              ▼
 *         ┌────────┐
 *         │ error  │
 *         └────────┘
 */
