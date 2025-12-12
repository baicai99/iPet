/**
 * Fast Time Utilities - 轻量级时间工具函数
 * 
 * 用于热路径的时间计算，避免 dayjs 对象创建开销。
 * 所有函数使用纯数学计算，无外部依赖。
 */

// ============================================================================
// Constants
// ============================================================================

/** 每天毫秒数 */
export const MS_PER_DAY = 86400000

/** 每小时毫秒数 */
export const MS_PER_HOUR = 3600000

/** 每周毫秒数 */
export const MS_PER_WEEK = MS_PER_DAY * 7

// ============================================================================
// Timezone Helpers
// ============================================================================

/**
 * 获取本地时区偏移（毫秒）
 * 正数表示东时区，负数表示西时区
 */
export function getLocalTzOffsetMs(): number {
    // Date.getTimezoneOffset() 返回分钟，且符号相反
    return -new Date().getTimezoneOffset() * 60000
}

/**
 * 缓存的时区偏移（避免重复计算）
 */
let cachedTzOffset: number | null = null

/**
 * 获取缓存的时区偏移
 */
export function getCachedTzOffset(): number {
    if (cachedTzOffset === null) {
        cachedTzOffset = getLocalTzOffsetMs()
    }
    return cachedTzOffset
}

// ============================================================================
// Day Calculations
// ============================================================================

/**
 * 快速获取当天 00:00:00 的毫秒时间戳
 * 
 * @param ts - 毫秒时间戳
 * @param tzOffsetMs - 时区偏移（毫秒），默认本地时区
 * @returns 当天开始的时间戳
 */
export function startOfDayMs(ts: number, tzOffsetMs?: number): number {
    const offset = tzOffsetMs ?? getCachedTzOffset()
    // 调整到 UTC+0，取整，再调回本地时区
    return ts - ((ts + offset) % MS_PER_DAY)
}

/**
 * 快速获取第二天 00:00:00 的毫秒时间戳
 */
export function endOfDayMs(ts: number, tzOffsetMs?: number): number {
    return startOfDayMs(ts, tzOffsetMs) + MS_PER_DAY
}

/**
 * 计算两个时间戳之间相差的天数
 */
export function daysDiff(ts1: number, ts2: number, tzOffsetMs?: number): number {
    const day1 = startOfDayMs(ts1, tzOffsetMs)
    const day2 = startOfDayMs(ts2, tzOffsetMs)
    return Math.floor((day2 - day1) / MS_PER_DAY)
}

// ============================================================================
// Week Calculations (ISO Week: Monday = 1)
// ============================================================================

/**
 * 快速获取本周一 00:00:00 的毫秒时间戳（ISO 周）
 */
export function startOfWeekMs(ts: number, tzOffsetMs?: number): number {
    const dayStart = startOfDayMs(ts, tzOffsetMs)
    const date = new Date(dayStart)
    // getDay(): 0=周日, 1=周一, ..., 6=周六
    // ISO: 周一=1, ..., 周日=7
    let dayOfWeek = date.getUTCDay()
    if (dayOfWeek === 0) dayOfWeek = 7 // 周日转为 7
    return dayStart - (dayOfWeek - 1) * MS_PER_DAY
}

// ============================================================================
// Month Calculations
// ============================================================================

/**
 * 快速获取本月 1 日 00:00:00 的毫秒时间戳
 */
export function startOfMonthMs(ts: number): number {
    const date = new Date(ts)
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
}

// ============================================================================
// Key Generation
// ============================================================================

/**
 * 补零函数
 */
function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n)
}

/**
 * 快速生成日期键 YYYY-MM-DD
 * 
 * @param ts - 毫秒时间戳
 * @returns 格式化的日期字符串
 */
export function dayKey(ts: number): string {
    const d = new Date(ts)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 快速生成周键 YYYY-Www（ISO 周）
 */
export function weekKey(ts: number): string {
    const weekStart = startOfWeekMs(ts)
    const d = new Date(weekStart)
    const year = d.getFullYear()

    // 计算 ISO 周数
    const jan1 = new Date(year, 0, 1).getTime()
    const weekNum = Math.ceil((weekStart - jan1 + MS_PER_DAY) / MS_PER_WEEK)

    return `${year}-W${pad(weekNum)}`
}

/**
 * 快速生成月键 YYYY-MM
 */
export function monthKey(ts: number): string {
    const d = new Date(ts)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// ============================================================================
// Axis Generation
// ============================================================================

/**
 * 生成日级时间轴（整数步进）
 * 
 * @param startTs - 起始时间戳
 * @param count - 天数
 * @returns 时间戳数组
 */
export function generateDayAxisMs(startTs: number, count: number): number[] {
    const result: number[] = []
    let ts = startOfDayMs(startTs)

    for (let i = 0; i < count; i++) {
        result.push(ts)
        ts += MS_PER_DAY
    }

    return result
}

/**
 * 生成日级时间轴（向前推）
 * 
 * @param endTs - 结束时间戳
 * @param count - 天数
 * @returns 时间戳数组（从早到晚）
 */
export function generateDayAxisMsBackward(endTs: number, count: number): number[] {
    const endDayStart = startOfDayMs(endTs)
    const startTs = endDayStart - (count - 1) * MS_PER_DAY
    return generateDayAxisMs(startTs, count)
}

/**
 * 生成周级时间轴
 */
export function generateWeekAxisMs(startTs: number, count: number): number[] {
    const result: number[] = []
    let ts = startOfWeekMs(startTs)

    for (let i = 0; i < count; i++) {
        result.push(ts)
        ts += MS_PER_WEEK
    }

    return result
}

/**
 * 生成月级时间轴
 */
export function generateMonthAxisMs(startTs: number, count: number): number[] {
    const result: number[] = []
    const start = new Date(startTs)

    for (let i = 0; i < count; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
        result.push(d.getTime())
    }

    return result
}

// ============================================================================
// Formatting (Lightweight)
// ============================================================================

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * 格式化日期标签
 */
export function formatDayLabel(ts: number, format: 'ddd' | 'D' | 'MM/DD' | 'M/D'): string {
    const d = new Date(ts)

    switch (format) {
        case 'ddd':
            return WEEKDAYS[d.getDay()]
        case 'D':
            return String(d.getDate())
        case 'MM/DD':
            return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
        case 'M/D':
            return `${d.getMonth() + 1}/${d.getDate()}`
        default:
            return dayKey(ts)
    }
}

/**
 * 格式化月份标签
 */
export function formatMonthLabel(ts: number): string {
    const d = new Date(ts)
    return MONTHS[d.getMonth()]
}

// ============================================================================
// Comparison
// ============================================================================

/**
 * 判断两个时间戳是否在同一天
 */
export function isSameDay(ts1: number, ts2: number, tzOffsetMs?: number): boolean {
    return startOfDayMs(ts1, tzOffsetMs) === startOfDayMs(ts2, tzOffsetMs)
}

/**
 * 判断时间戳是否在范围内（包含边界）
 */
export function isInRange(ts: number, fromMs: number, toMs: number): boolean {
    return ts >= fromMs && ts <= toMs
}

/**
 * 判断时间戳是否在日范围内
 */
export function isInDayRange(ts: number, fromDayStart: number, toDayStart: number): boolean {
    const dayStart = startOfDayMs(ts)
    return dayStart >= fromDayStart && dayStart <= toDayStart
}
