
const hexToRgba = (hex: string, alpha: number): string => {
    const sanitized = hex.replace('#', '')
    if (sanitized.length !== 6) return hex
    const r = parseInt(sanitized.slice(0, 2), 16)
    const g = parseInt(sanitized.slice(2, 4), 16)
    const b = parseInt(sanitized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const BASE_COLORS = {
    white: '#ffffff',
    black: '#000000',
    darkSurface: '#1c1c1e',
    darkBorder: '#3a3a3c',
    gray200: '#e5e5ea',
    gray400: '#8e8e93',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate400: '#94a3b8',
    slate800: '#1e293b',
    navy900: '#0f172a'
}

const createTheme = (color: string) => ({
    cardBg: hexToRgba(color, 0.12),
    titleText: color,
    dateBg: hexToRgba(color, 0.2),
    dateText: color,
    valueText: '#0f172a',
    unitText: '#6b7280',
    stroke: color,
    trendUp: color,
    trendDown: color
})

export const THEME_CONFIG = {
    default: createTheme('#3b82f6'),
    breathing: createTheme('#68CCE5'),
    activity: createTheme('#CF8136'),
    fitnessRecord: createTheme('#FC502D'),
    periodTracking: createTheme('#E8577A'),
    bodyMeasurement: createTheme('#AF52DE'),
    vitalSigns: createTheme('#D9333C'),
    sleep: createTheme('#61ACCA'),
    hearing: createTheme('#2F7CF6'),
    mentalHealth: createTheme('#4DC2C2'),
    heart: createTheme('#FA4351'),
    nutritionIntake: createTheme('#6FCE63'),
    medication: createTheme('#67D5E9'),
    symptoms: createTheme('#6D5ADD'),
    otherData: createTheme('#417AB9')
}

// React-style color palette
export const COLORS = {
    orange: { bg: '#fff7ed', hex: '#f97316' },
    emerald: { bg: '#ecfdf5', hex: '#10b981' },
    indigo: { bg: '#eef2ff', hex: '#6366f1' },
    cyan: { bg: '#ecfeff', hex: '#06b6d4' },
    rose: { bg: '#fff1f2', hex: '#f43f5e' },
    amber: { bg: '#fffbeb', hex: '#f59e0b' },
    blue: { bg: '#eff6ff', hex: '#3b82f6' },
    stone: { bg: '#f5f5f4', hex: '#78716c' }
}

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
}

// ============================================================================
// Design Tokens - 语义化颜色
// ============================================================================

export const TOKENS = {
    // 品牌色
    primary: '#3b82f6',      // blue-500
    secondary: '#64748b',    // slate-500

    // 状态色
    success: '#10b981',      // emerald-500
    warning: '#f59e0b',      // amber-500
    danger: '#ef4444',       // red-500
    info: '#06b6d4',         // cyan-500

    // 文本色
    textPrimary: '#1e293b',     // slate-800
    textSecondary: '#64748b',   // slate-500
    textMuted: '#94a3b8',       // slate-400
    textDisabled: '#cbd5e1',    // slate-300

    // 背景色
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',     // slate-50
    bgTertiary: '#f1f5f9',      // slate-100

    // 边框色
    borderLight: '#e2e8f0',     // slate-200
    borderMedium: '#cbd5e1',    // slate-300

    // 阴影
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.1)',
} as const

/**
 * Dark Mode Tokens
 */
export const TOKENS_DARK = {
    // 背景色
    bgPrimary: '#1c1c1e',
    bgSecondary: '#2c2c2e',
    bgTertiary: '#3a3a3c',

    // 文本色
    textPrimary: '#ffffff',
    textSecondary: '#ebebf5',
    textMuted: '#8e8e93',
    textDisabled: '#636366',

    // 边框色
    borderLight: '#3a3a3c',
    borderMedium: '#48484a',

    // 趋势卡片专用
    barColor: '#48484a',
    barHighlight: '#636366',
    avgLineColor: '#8e8e93',
    avgLineHighlight: '#ff453a',
} as const

export type ThemeColor = keyof typeof COLORS


