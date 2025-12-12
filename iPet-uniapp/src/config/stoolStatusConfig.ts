/**
 * Stool Status Configuration
 * 
 * Centralized configuration for the 7-level stool status system.
 * This is the single source of truth for stool status definitions.
 */

export type StoolZone = 'dry' | 'normal' | 'wet'
export type StoolSeverity = 'severe' | 'moderate' | 'mild' | 'normal'

export interface StoolStatusOption {
    value: number
    label: string
    zone: StoolZone
    severity: StoolSeverity
    emoji?: string
}

/**
 * 7-level stool status definitions
 * Values 1-7 map to the visual 3-zone display:
 * - 1-3: Dry zone (偏干区)
 * - 4: Normal zone (正常区)
 * - 5-7: Wet zone (偏稀区)
 */
export const STOOL_STATUS_OPTIONS: StoolStatusOption[] = [
    { value: 1, label: '羊屎蛋', zone: 'dry', severity: 'severe', emoji: '🔴' },
    { value: 2, label: '干', zone: 'dry', severity: 'moderate', emoji: '🟠' },
    { value: 3, label: '偏干', zone: 'dry', severity: 'mild', emoji: '🟡' },
    { value: 4, label: '正常', zone: 'normal', severity: 'normal', emoji: '🟢' },
    { value: 5, label: '偏稀', zone: 'wet', severity: 'mild', emoji: '🟡' },
    { value: 6, label: '稀', zone: 'wet', severity: 'moderate', emoji: '🟠' },
    { value: 7, label: '水样', zone: 'wet', severity: 'severe', emoji: '🔴' }
]

/**
 * Get stool status config by value
 */
export function getStoolStatusByValue(value: number): StoolStatusOption | undefined {
    return STOOL_STATUS_OPTIONS.find(opt => opt.value === value)
}

/**
 * Get zone for a given value (for visual mapping)
 * Returns 'normal' for invalid values
 */
export function getZoneForValue(value: number): StoolZone {
    if (value >= 1 && value <= 3) return 'dry'
    if (value === 4) return 'normal'
    if (value >= 5 && value <= 7) return 'wet'
    return 'normal'
}

/**
 * Get display label for a given value
 */
export function getLabelForValue(value: number): string {
    const status = getStoolStatusByValue(value)
    return status?.label || '未知'
}

/**
 * Get emoji for a given value
 */
export function getEmojiForValue(value: number): string {
    const status = getStoolStatusByValue(value)
    return status?.emoji || ''
}

/**
 * Map value (1-7) to Y-axis position (0-100 scale for chart rendering)
 * Zone distribution: dry (top 33%), normal (middle 33%), wet (bottom 33%)
 */
export function mapValueToY(value: number): number {
    // Within each zone, spread values evenly
    // Values 1-3 -> 75-95 (dry zone, top)
    // Value 4 -> 50 (normal zone, middle)
    // Values 5-7 -> 5-25 (wet zone, bottom)
    switch (value) {
        case 1: return 90 // Top of dry zone
        case 2: return 80
        case 3: return 70 // Bottom of dry zone
        case 4: return 50 // Center of normal zone
        case 5: return 30 // Top of wet zone
        case 6: return 20
        case 7: return 10 // Bottom of wet zone
        default: return 50
    }
}

/**
 * Convert legacy 0-100 scale values to 1-7 scale
 * For backward compatibility with existing data
 */
export function convertLegacyValue(legacyValue: number): number {
    if (legacyValue <= 0) return 4 // Default to normal
    if (legacyValue <= 14) return 1
    if (legacyValue <= 28) return 2
    if (legacyValue <= 42) return 3
    if (legacyValue <= 58) return 4
    if (legacyValue <= 72) return 5
    if (legacyValue <= 86) return 6
    return 7
}

/**
 * Check if a value is in the legacy 0-100 scale
 */
export function isLegacyValue(value: number): boolean {
    return value > 7 || (value > 0 && value < 1)
}
