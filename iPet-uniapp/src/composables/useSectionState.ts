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
    const shouldShowData = computed(() =>
        state.value === 'ready' || state.value === 'showing_cache'
    )

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
        } else {
            state.value = 'loading'
        }
        error.value = null
    }

    /**
     * 加载成功
     * loading/showing_cache → ready (有数据)
     * loading/showing_cache → empty (无数据)
     */
    function loadSuccess(options: StateTransitionOptions = {}) {
        if (options.hasData) {
            state.value = 'ready'
        } else {
            state.value = 'empty'
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
    }

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------

    return {
        // Raw State
        state,
        error,

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
// State Machine Diagram
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
 *  │ ready  │                      │ empty │
 *  └────────┘                      └───────┘
 *       ▲
 *       │
 *       │ loadError() + hasCache
 *       │
 *  ┌────────────────┐
 *  │ showing_cache  │
 *  └────────────────┘
 * 
 *       loadError() + !hasCache
 *              │
 *              ▼
 *         ┌────────┐
 *         │ error  │
 *         └────────┘
 */
