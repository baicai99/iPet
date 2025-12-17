import designTokens from '@/design/tokens.json'

/**
 * 颜色工具函数
 */
const hexToRgba = (hex: string, alpha?: number): string => {
    // 移除 # 前缀
    const sanitized = hex.replace('#', '')

    let r: number, g: number, b: number, a: number

    // 支持 3、4、6、8 位 hex
    if (sanitized.length === 3) {
        // #RGB -> #RRGGBB
        r = parseInt(sanitized[0] + sanitized[0], 16)
        g = parseInt(sanitized[1] + sanitized[1], 16)
        b = parseInt(sanitized[2] + sanitized[2], 16)
        a = alpha !== undefined ? alpha : 1
    } else if (sanitized.length === 4) {
        // #RGBA -> #RRGGBBAA ✨ 新增
        r = parseInt(sanitized[0] + sanitized[0], 16)
        g = parseInt(sanitized[1] + sanitized[1], 16)
        b = parseInt(sanitized[2] + sanitized[2], 16)
        const hexA = parseInt(sanitized[3] + sanitized[3], 16)
        a = alpha !== undefined ? alpha : hexA / 255
    } else if (sanitized.length === 6) {
        // #RRGGBB
        r = parseInt(sanitized.slice(0, 2), 16)
        g = parseInt(sanitized.slice(2, 4), 16)
        b = parseInt(sanitized.slice(4, 6), 16)
        a = alpha !== undefined ? alpha : 1
    } else if (sanitized.length === 8) {
        // #RRGGBBAA - 智能处理 ✨ 改进
        r = parseInt(sanitized.slice(0, 2), 16)
        g = parseInt(sanitized.slice(2, 4), 16)
        b = parseInt(sanitized.slice(4, 6), 16)
        const hexA = parseInt(sanitized.slice(6, 8), 16)
        // 如果调用者传了 alpha，使用传入值；否则使用 hex 中的 alpha
        a = alpha !== undefined ? alpha : hexA / 255
    } else {
        // 不合法格式，返回黑色
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[hexToRgba] Invalid hex color: ${hex}`)
        }
        return `rgba(0, 0, 0, ${alpha !== undefined ? alpha : 0})`
    }

    // 检查 NaN
    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[hexToRgba] Failed to parse hex color: ${hex}`)
        }
        return `rgba(0, 0, 0, ${alpha !== undefined ? alpha : 0})`
    }

    // 严格约束 alpha 范围
    const clampedAlpha = Math.max(0, Math.min(1, a))

    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`
}

/**
 * 颜色变体类型
 */
type ColorVariants = {
    primary: string
    secondary: string
    tertiary: string
    quaternary: string
}

/**
 * 为颜色创建不同透明度变体
 */
const createColorVariants = (hex: string): ColorVariants => ({
    primary: hex,                      // 100%
    secondary: hexToRgba(hex, 0.8),    // 80%
    tertiary: hexToRgba(hex, 0.6),     // 60%
    quaternary: hexToRgba(hex, 0.4)    // 40%
})

/**
 * 系统强调色 (Accent Colors)
 * 12种标准强调色，支持亮色和暗色模式
 * 每种颜色包含 4 个透明度级别：primary(100%), secondary(80%), tertiary(60%), quaternary(40%)
 */

const ACCENT_BASE = designTokens.colors.palette.accent
type AccentName = keyof typeof ACCENT_BASE

// 定义 Light 模式（作为基准）
const ACCENT_LIGHT = (Object.keys(ACCENT_BASE) as AccentName[]).reduce((acc, key) => {
    acc[key] = createColorVariants(ACCENT_BASE[key])
    return acc
}, {} as Record<AccentName, ColorVariants>)

// 导出 ACCENT_COLORS (仅 light 模式)
export const ACCENT_COLORS = ACCENT_LIGHT

/**
 * 系统灰阶色 (Gray Scale)
 * 6个灰度级别，支持亮色和暗色模式
 */

// 定义 Light 模式（作为基准）
const GRAY_LIGHT = designTokens.colors.palette.gray

// 导出 GRAY_SCALE (兼容 light 访问方式)
export const GRAY_SCALE = { light: GRAY_LIGHT, ...GRAY_LIGHT } as const

/**
 * 字重系统 (Font Weights)
 * 9 个标准字重级别，对应 iOS/San Francisco 字体规范
 */
export const FONT_WEIGHTS = {
    ultraLight: '100',  // UltraLight - 最细
    thin: '200',        // Thin - 极细
    light: '300',       // Light - 细
    regular: '400',     // Regular - 常规
    medium: '500',      // Medium - 中等
    semibold: '600',    // Semibold - 半粗
    bold: '700',        // Bold - 粗体
    heavy: '800',       // Heavy - 重磅
    black: '900'        // Black - 最粗
} as const

/**
 * 文本样式系统 (Typography)
 * 定义标准文本样式，包含字号、行高和字重
 * 单位：rpx（响应式像素，适配多端）1pt = 2rpx
 */
export const TYPOGRAPHY = {
    largeTitle: {
        fontSize: designTokens.typography.largeTitle.fontSizeRpx,
        lineHeight: designTokens.typography.largeTitle.lineHeight,
        fontWeight: String(designTokens.typography.largeTitle.fontWeight)
    },
    title2: {
        fontSize: designTokens.typography.title2.fontSizeRpx,
        lineHeight: designTokens.typography.title2.lineHeight,
        fontWeight: String(designTokens.typography.title2.fontWeight)
    },
    headline: {
        fontSize: designTokens.typography.headline.fontSizeRpx,
        lineHeight: designTokens.typography.headline.lineHeight,
        fontWeight: String(designTokens.typography.headline.fontWeight)
    },
    body: {
        fontSize: designTokens.typography.body.fontSizeRpx,
        lineHeight: designTokens.typography.body.lineHeight,
        fontWeight: String(designTokens.typography.body.fontWeight)
    },
    subhead: {
        fontSize: designTokens.typography.subhead.fontSizeRpx,
        lineHeight: designTokens.typography.subhead.lineHeight,
        fontWeight: String(designTokens.typography.subhead.fontWeight)
    },
    caption1: {
        fontSize: designTokens.typography.caption1.fontSizeRpx,
        lineHeight: designTokens.typography.caption1.lineHeight,
        fontWeight: String(designTokens.typography.caption1.fontWeight)
    },
    caption2: {
        fontSize: designTokens.typography.caption2.fontSizeRpx,
        lineHeight: designTokens.typography.caption2.lineHeight,
        fontWeight: String(designTokens.typography.caption2.fontWeight)
    }
} as const

/**
 * 单位转换工具
 */
export const toPx = (rpx: number): number => rpx / 2
export const toRpx = (px: number): number => px * 2



// ============================================================================
// Colors - 分类颜色系统
// ============================================================================

/**
 * 构建分类颜色（预计算版本）
 */
const buildColors = () => {
    const accent = ACCENT_COLORS
    const gray = GRAY_SCALE

    return {
        orange: {
            bg: '#fff7ed',
            hex: accent.orange.primary
        },
        emerald: {
            bg: '#ecfdf5',
            hex: accent.green.primary
        },
        indigo: {
            bg: '#eef2ff',
            hex: accent.indigo.primary
        },
        cyan: {
            bg: '#ecfeff',
            hex: accent.cyan.primary
        },
        rose: {
            bg: '#fff1f2',
            hex: accent.pink.primary
        },
        amber: {
            bg: '#fffbeb',
            hex: accent.yellow.primary
        },
        blue: {
            bg: '#eff6ff',
            hex: accent.blue.primary
        },
        stone: {
            bg: '#f5f5f4',
            hex: gray.gray2
        }
    } as const
}

/**
 * COLORS 配置
 */
export const COLORS = buildColors()

export const CATEGORY_COLOR_MAP = {
    bodyMeasurement: 'orange',
    vitalSigns: 'rose',
    nutritionIntake: 'emerald',
    activity: 'amber',
    sleep: 'indigo',
    mentalHealth: 'cyan',
    medication: 'cyan',
    otherData: 'blue',
    excretion: 'stone',
    default: 'orange'
} as const satisfies Record<string, ThemeColor>

// ============================================================================
// Design Tokens - 语义化颜色
// ============================================================================

/**
 * 主题令牌（按模式预计算）
 */
export const TOKENS = {
    // 品牌色
    primary: ACCENT_COLORS.blue.primary,
    secondary: GRAY_SCALE.gray,

    // 状态色
    success: ACCENT_COLORS.green.primary,
    warning: ACCENT_COLORS.yellow.primary,
    danger: ACCENT_COLORS.red.primary,
    info: ACCENT_COLORS.cyan.primary,

    // 文本色
    textPrimary: designTokens.colors.semantic.textPrimary,
    textSecondary: designTokens.colors.semantic.textSecondary,
    textMuted: designTokens.colors.semantic.textMuted,
    textDisabled: designTokens.colors.semantic.textDisabled,

    // 背景色
    bgPrimary: designTokens.colors.semantic.bgPrimary,        // 主背景色
    bgSecondary: designTokens.colors.semantic.bgNavbar,       // 导航栏/二级背景
    bgCard: designTokens.colors.semantic.bgCard,              // 卡片背景

    // 边框色
    borderLight: designTokens.colors.semantic.borderColor,
    borderMedium: designTokens.colors.semantic.borderColor,

    // 阴影
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.1)',
} as const

// ============================================================================
// Component Tokens - 组件级专用颜色
// ============================================================================

/**
 * 趋势卡片专用令牌
 */
export const TREND_TOKENS = {
    barColor: GRAY_SCALE.gray5,
    barHighlight: GRAY_SCALE.gray4,
    avgLineColor: GRAY_SCALE.gray,
    avgLineHighlight: ACCENT_COLORS.red.primary,
} as const

export type ThemeColor = keyof typeof COLORS

// ============================================================================
// 类型系统 & 主题解析
// ============================================================================



/**
 * 主题令牌接口（确保 light/dark 同构）
 */
export interface ThemeTokens {
    // 品牌色
    primary: string
    secondary: string

    // 状态色
    success: string
    warning: string
    danger: string
    info: string

    // 文本色
    textPrimary: string
    textSecondary: string
    textMuted: string
    textDisabled: string

    // 背景色
    bgPrimary: string
    bgSecondary: string
    bgCard: string

    // 边框色
    borderLight: string
    borderMedium: string

    // 阴影
    shadowSm: string
    shadowMd: string
}

/**
 * 分类颜色映射类型约束
 */
export type CategoryKey = keyof typeof CATEGORY_COLOR_MAP
export type ValidCategoryColorMap = Record<CategoryKey, ThemeColor>

/**
 * 获取主题令牌
 */
export function resolveTheme(): ThemeTokens {
    return TOKENS
}

/**
 * 获取颜色配置
 */
export function resolveColors() {
    return COLORS
}

/**
 * 获取趋势卡片令牌
 */
export function resolveTrendTokens() {
    return TREND_TOKENS
}
