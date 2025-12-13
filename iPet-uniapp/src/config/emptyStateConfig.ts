/**
 * emptyStateConfig.ts - 空态配置中心
 * 
 * 职责：
 * - 根据 reason 提供统一的空态文案
 * - 提供可选的 CTA 配置
 * - 支持多语言扩展
 */

// ============================================================================
// Types
// ============================================================================

/**
 * 空态原因枚举
 */
export type EmptyReason =
    | 'no-data'           // 无数据（首次使用）
    | 'no-pinned'         // 无置顶指标
    | 'no-trends'         // 无趋势变化
    | 'no-articles'       // 无推荐文章
    | 'no-records'        // 无历史记录
    | 'no-search-results' // 搜索无结果
    | 'network-error'     // 网络错误
    | 'permission-denied' // 权限不足
    | 'not-found'         // 资源不存在

/**
 * CTA 配置
 */
export interface CTAConfig {
    text: string
    action: 'navigate' | 'function' | 'none'
    target?: string  // 导航目标 URL
    handler?: () => void  // 自定义处理函数
}

/**
 * 空态配置
 */
export interface EmptyStateConfig {
    icon?: string       // uView icon 名称
    title: string       // 标题
    description?: string  // 描述文本
    cta?: CTAConfig    // CTA 按钮配置
}

// ============================================================================
// Empty State Configurations
// ============================================================================

export const EMPTY_STATE_CONFIG: Record<EmptyReason, EmptyStateConfig> = {
    'no-data': {
        icon: 'file-text',
        title: '暂无数据',
        description: '开始记录您的宠物健康数据吧',
        cta: {
            text: '立即添加',
            action: 'navigate',
            target: '/pages/metrics/add'
        }
    },

    'no-pinned': {
        icon: 'star',
        title: '暂无置顶指标',
        description: '置顶常用指标，快速查看健康状况',
        cta: {
            text: '管理指标',
            action: 'navigate',
            target: '/pages/metrics/list'
        }
    },

    'no-trends': {
        icon: 'trending-up',
        title: '暂无趋势变化',
        description: '持续记录数据，系统将为您分析趋势'
    },

    'no-articles': {
        icon: 'book',
        title: '暂无推荐文章',
        description: '相关科普文章即将上线'
    },

    'no-records': {
        icon: 'clock',
        title: '暂无历史记录',
        description: '添加记录后将在此展示',
        cta: {
            text: '添加记录',
            action: 'navigate',
            target: '/pages/metrics/add'
        }
    },

    'no-search-results': {
        icon: 'search',
        title: '未找到相关结果',
        description: '请尝试其他搜索词'
    },

    'network-error': {
        icon: 'wifi-off',
        title: '网络连接失败',
        description: '请检查网络设置后重试',
        cta: {
            text: '重试',
            action: 'function'
        }
    },

    'permission-denied': {
        icon: 'lock',
        title: '权限不足',
        description: '请联系管理员获取访问权限'
    },

    'not-found': {
        icon: 'alert-circle',
        title: '内容不存在',
        description: '该内容可能已被删除或移动'
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 获取空态配置
 */
export function getEmptyConfig(reason: EmptyReason): EmptyStateConfig {
    return EMPTY_STATE_CONFIG[reason] || EMPTY_STATE_CONFIG['no-data']
}

/**
 * 自定义空态配置（覆盖默认配置）
 */
export function customEmptyConfig(
    reason: EmptyReason,
    overrides: Partial<EmptyStateConfig>
): EmptyStateConfig {
    const base = getEmptyConfig(reason)
    return { ...base, ...overrides }
}
