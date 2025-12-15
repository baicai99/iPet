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

// 定义 Light 模式（作为基准）
const ACCENT_LIGHT = {
    red: createColorVariants('#FF383C'),
    orange: createColorVariants('#FF8D28'),
    yellow: createColorVariants('#FFCC00'),
    green: createColorVariants('#34C759'),
    mint: createColorVariants('#00C8B3'),
    teal: createColorVariants('#00C3D0'),
    cyan: createColorVariants('#00C0E8'),
    blue: createColorVariants('#0088FF'),
    indigo: createColorVariants('#6155F5'),
    purple: createColorVariants('#CB30E0'),
    pink: createColorVariants('#FF2D55'),
    brown: createColorVariants('#AC7F5E')
} as const

// 导出 ACCENT_COLORS (仅 light 模式)
export const ACCENT_COLORS = ACCENT_LIGHT

/**
 * 系统灰阶色 (Gray Scale)
 * 6个灰度级别，支持亮色和暗色模式
 */

// 定义 Light 模式（作为基准）
const GRAY_LIGHT = {
    gray: '#8E8E93',
    gray2: '#AEAEB2',
    gray3: '#C7C7CC',
    gray4: '#D1D1D6',
    gray5: '#E5E5EA',
    gray6: '#F2F2F7'
} as const

// 导出 GRAY_SCALE (仅 light 模式)
export const GRAY_SCALE = GRAY_LIGHT

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
        fontSize: 68,        // 68rpx (34pt × 2)
        lineHeight: 82,      // 82rpx (41pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    title1: {
        fontSize: 56,        // 56rpx (28pt × 2)
        lineHeight: 68,      // 68rpx (34pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    title2: {
        fontSize: 44,        // 44rpx (22pt × 2)
        lineHeight: 56,      // 56rpx (28pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    title3: {
        fontSize: 40,        // 40rpx (20pt × 2)
        lineHeight: 50,      // 50rpx (25pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    headline: {
        fontSize: 34,        // 34rpx (17pt × 2)
        lineHeight: 44,      // 44rpx (22pt × 2)
        fontWeight: FONT_WEIGHTS.semibold
    },
    body: {
        fontSize: 34,        // 34rpx (17pt × 2)
        lineHeight: 44,      // 44rpx (22pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    callout: {
        fontSize: 32,        // 32rpx (16pt × 2)
        lineHeight: 42,      // 42rpx (21pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    subhead: {
        fontSize: 30,        // 30rpx (15pt × 2)
        lineHeight: 40,      // 40rpx (20pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    footnote: {
        fontSize: 26,        // 26rpx (13pt × 2)
        lineHeight: 36,      // 36rpx (18pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    caption1: {
        fontSize: 24,        // 24rpx (12pt × 2)
        lineHeight: 32,      // 32rpx (16pt × 2)
        fontWeight: FONT_WEIGHTS.regular
    },
    caption2: {
        fontSize: 22,        // 22rpx (11pt × 2)
        lineHeight: 26,      // 26rpx (13pt × 2)
        fontWeight: FONT_WEIGHTS.regular
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
    textPrimary: '#1e293b',
    textSecondary: GRAY_SCALE.gray2,
    textMuted: GRAY_SCALE.gray,
    textDisabled: GRAY_SCALE.gray3,

    // 背景色
    bgPrimary: '#f2f1f5',        // 主背景色
    bgSecondary: '#fbfbfd',      // 导航栏/二级背景
    bgCard: '#ffffff',           // 卡片背景

    // 边框色
    borderLight: GRAY_SCALE.gray4,
    borderMedium: GRAY_SCALE.gray3,

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
