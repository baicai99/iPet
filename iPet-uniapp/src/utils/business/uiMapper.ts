// React-style color palette
import { ICONFONT_UNICODE } from '@/utils/ui/iconfont'

export const COLORS: Record<string, { bg: string, hex: string }> = {
    orange: { bg: '#fff7ed', hex: '#f97316' }, // orange-50, orange-500
    emerald: { bg: '#ecfdf5', hex: '#10b981' }, // emerald-50, emerald-500
    indigo: { bg: '#eef2ff', hex: '#6366f1' }, // indigo-50, indigo-500
    cyan: { bg: '#ecfeff', hex: '#06b6d4' },   // cyan-50, cyan-500
    rose: { bg: '#fff1f2', hex: '#f43f5e' },   // rose-50, rose-500
    amber: { bg: '#fffbeb', hex: '#f59e0b' },  // amber-50, amber-500
    blue: { bg: '#eff6ff', hex: '#3b82f6' },    // blue-50, blue-500
    stone: { bg: '#f5f5f4', hex: '#78716c' }   // stone-100, stone-500
}

// Map categories to colors
export const CATEGORY_COLOR_MAP: Record<string, string> = {
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

// Icon mapping
export const ICON_MAP: Record<string, string> = {
    '体重': ICONFONT_UNICODE.weight,
    '肩高': ICONFONT_UNICODE.shoulderHeight,
    '体温': ICONFONT_UNICODE.bodyTemp,
    '今日饭量': ICONFONT_UNICODE.meal,
    '今日喝水': ICONFONT_UNICODE.water,
    '默认': ICONFONT_UNICODE.file
}

/**
 * Get theme color object based on category
 * @param {string} category 
 * @returns {{bg: string, hex: string}}
 */
export const getThemeColor = (category: string) => {
    const key = category
    const colorKey = CATEGORY_COLOR_MAP[key] || CATEGORY_COLOR_MAP.default
    return COLORS[colorKey] || COLORS.orange
}

/**
 * Get icon name based on title and category
 * @param {string} title 
 * @param {string} category 
 * @returns {string}
 */
export const getMetricIcon = (title: string, category: string) => {
    // Try to match by title first (simple mapping)
    for (const key in ICON_MAP) {
        if (title && title.includes(key)) return ICON_MAP[key]
    }
    // Fallback based on category
    if (category === 'activity') return ICONFONT_UNICODE.walkDuration
    if (category === 'nutritionIntake') return ICONFONT_UNICODE.meal
    if (category === 'vitalSigns') return ICONFONT_UNICODE.bodyTemp

    return ICONFONT_UNICODE.file
}
