/**
 * @typedef {import('../types/healthMetric').HealthMetricCategory} HealthMetricCategory
 */

/**
 * Category metadata including display names and icons.
 * @typedef {Object} CategoryMetadata
 * @property {string} key - The category key
 * @property {string} title - Display title
 * @property {string} icon - Icon name (for u-icon or similar)
 * @property {string} [description] - Optional description
 */

/**
 * Centralized category configuration.
 * Maps each category to its display metadata.
 * @type {Record<string, CategoryMetadata>}
 */
export const CATEGORIES = {
    breathing: {
        key: 'breathing',
        title: '呼吸',
        icon: 'heart', // Placeholder, adjust to actual uview icon
        description: '呼吸频率和质量监测'
    },
    activity: {
        key: 'activity',
        title: '活动能力',
        icon: 'walk',
        description: '日常活动和运动数据'
    },
    fitnessRecord: {
        key: 'fitnessRecord',
        title: '健身记录',
        icon: 'hourglass',
        description: '训练和健身活动记录'
    },
    periodTracking: {
        key: 'periodTracking',
        title: '经期跟踪',
        icon: 'calendar',
        description: '生理周期监测'
    },
    bodyMeasurement: {
        key: 'bodyMeasurement',
        title: '身体测量',
        icon: 'man',
        description: '体重、体脂等身体指标'
    },
    vitalSigns: {
        key: 'vitalSigns',
        title: '生命体征',
        icon: 'pulse',
        description: '心率、体温等生命体征'
    },
    sleep: {
        key: 'sleep',
        title: '睡眠',
        icon: 'moon',
        description: '睡眠时长和质量'
    },
    hearing: {
        key: 'hearing',
        title: '听觉',
        icon: 'volume',
        description: '听力健康监测'
    },
    mentalHealth: {
        key: 'mentalHealth',
        title: '心理健康',
        icon: 'smile',
        description: '情绪和心理状态'
    },
    heart: {
        key: 'heart',
        title: '心脏',
        icon: 'heart-fill',
        description: '心脏健康指标'
    },
    nutritionIntake: {
        key: 'nutritionIntake',
        title: '营养摄入',
        icon: 'shopping-cart',
        description: '饮食和营养数据'
    },
    medication: {
        key: 'medication',
        title: '用药',
        icon: 'bag',
        description: '药物使用记录'
    },
    symptoms: {
        key: 'symptoms',
        title: '症状',
        icon: 'info-circle',
        description: '健康症状记录'
    },
    otherData: {
        key: 'otherData',
        title: '其他数据',
        icon: 'grid',
        description: '其他健康相关数据'
    }
}

/**
 * Get category metadata by key.
 * Provides a fallback for unknown categories.
 * 
 * @param {string} category - The category key
 * @returns {CategoryMetadata} Category metadata
 */
export function getCategoryMetadata(category: keyof typeof CATEGORIES | string) {
    return (CATEGORIES as Record<string, typeof CATEGORIES[keyof typeof CATEGORIES]>)[category] || {
        key: category,
        title: category,
        icon: 'question-circle'
    }
}

/**
 * Get the display title for a category.
 * 
 * @param {string} category - The category key
 * @returns {string} The localized category title
 */
export function getCategoryTitle(category: keyof typeof CATEGORIES | string): string {
    return (CATEGORIES as Record<string, typeof CATEGORIES[keyof typeof CATEGORIES]>)[category]?.title || category
}

/**
 * Get the icon name for a category.
 * 
 * @param {string} category - The category key
 * @returns {string} The icon name
 */
export function getCategoryIcon(category: keyof typeof CATEGORIES | string): string {
    return (CATEGORIES as Record<string, typeof CATEGORIES[keyof typeof CATEGORIES]>)[category]?.icon || 'question-circle'
}

/**
 * Get all category keys.
 * 
 * @returns {string[]} Array of all category keys
 */
export function getAllCategories() {
    return Object.keys(CATEGORIES)
}
