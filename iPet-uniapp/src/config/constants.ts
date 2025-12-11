
export enum PetType {
    Dog = 'dog',
    Cat = 'cat',
    Other = 'other'
}

export enum PetGender {
    Male = 'male',
    Female = 'female'
}

export enum VaccineStatus {
    Completed = 'completed',
    Overdue = 'overdue',
    Pending = 'pending'
}

// Time ranges for charts and data analysis
export enum TimeRange {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Year = 'year'
}

// Backward compatibility (optional, but good for transition)
export const PET_TYPES = {
    DOG: PetType.Dog,
    CAT: PetType.Cat,
    OTHER: PetType.Other
} as const

export const PET_GENDERS = {
    MALE: PetGender.Male,
    FEMALE: PetGender.Female
} as const

export const VACCINE_STATUS = {
    COMPLETED: VaccineStatus.Completed,
    OVERDUE: VaccineStatus.Overdue,
    PENDING: VaccineStatus.Pending
} as const

// ============================================================================
// 健康指标默认目标值
// ============================================================================

export const METRIC_GOALS = {
    /** 每日饭量目标（克） */
    meal: 500,
    /** 每日饮水目标（毫升） */
    water: 500,
    /** 每日步行时长目标（分钟） */
    walkDuration: 45,
    /** 每日睡眠时长上限（小时） */
    sleepDuration: 14,
} as const

// ============================================================================
// 图表配置
// ============================================================================

export const CHART_CONFIG = {
    /** 曲线平滑度 (0-1) */
    smoothing: 0.2,
    /** 最少数据点数量 */
    minDataPoints: 3,
    /** 最大标签数量 */
    maxLabels: 7,
} as const

// ============================================================================
// 缓存配置
// ============================================================================

export const CACHE_CONFIG = {
    /** 最大 Base64 转换大小（字节） */
    maxBase64Size: 100 * 1024,
    /** 最大缓存图片数量 */
    maxImageCount: 20,
} as const

// ============================================================================
// 时间常量
// ============================================================================

export const TIME = {
    /** 一小时（毫秒） */
    oneHour: 3600 * 1000,
    /** 一天（毫秒） */
    oneDay: 24 * 3600 * 1000,
    /** 防抖延迟（毫秒） */
    debounce: 200,
} as const

