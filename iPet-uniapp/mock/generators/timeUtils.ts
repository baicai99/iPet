/**
 * Time Utilities for Mock Data Generation
 * Provides date range calculations, iteration helpers, and random time generation
 */

/**
 * Time slot definition for realistic human activity patterns
 */
export interface TimeSlot {
    name: string
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
}

/**
 * Common time slots for pet care activities
 */
export const TIME_SLOTS = {
    breakfast: { name: 'breakfast', startHour: 7, startMinute: 0, endHour: 9, endMinute: 0 },
    lunch: { name: 'lunch', startHour: 11, startMinute: 30, endHour: 13, endMinute: 30 },
    dinner: { name: 'dinner', startHour: 17, startMinute: 30, endHour: 19, endMinute: 30 },
    morningWalk: { name: 'morningWalk', startHour: 6, startMinute: 30, endHour: 8, endMinute: 0 },
    eveningWalk: { name: 'eveningWalk', startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
    afternoonNap: { name: 'afternoonNap', startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
    bedtime: { name: 'bedtime', startHour: 21, startMinute: 0, endHour: 23, endMinute: 0 }
} as const

/**
 * Get date range going back N years from current time
 */
export function getDateRange(years: number = 2): { start: Date; end: Date } {
    const end = new Date()
    const start = new Date()
    start.setFullYear(start.getFullYear() - years)
    return { start, end }
}

/**
 * Iterate over each day in a date range
 */
export function* iterateDays(start: Date, end: Date): Generator<Date> {
    const current = new Date(start)
    current.setHours(0, 0, 0, 0)

    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)

    while (current <= endDate) {
        yield new Date(current)
        current.setDate(current.getDate() + 1)
    }
}

/**
 * Get a random time within a specified time slot on a given date
 */
export function getRandomTimeInSlot(date: Date, slot: TimeSlot): Date {
    const result = new Date(date)

    const startMinutes = slot.startHour * 60 + slot.startMinute
    const endMinutes = slot.endHour * 60 + slot.endMinute
    const randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes))

    result.setHours(Math.floor(randomMinutes / 60), randomMinutes % 60, Math.floor(Math.random() * 60), 0)
    return result
}

/**
 * Add a random interval (in days) to a date
 */
export function addRandomInterval(date: Date, minDays: number, maxDays: number): Date {
    const result = new Date(date)
    const randomDays = minDays + Math.floor(Math.random() * (maxDays - minDays + 1))
    result.setDate(result.getDate() + randomDays)
    return result
}

/**
 * Generate a random number within a range with optional decimal precision
 */
export function randomInRange(min: number, max: number, decimals: number = 0): number {
    const value = min + Math.random() * (max - min)
    return Number(value.toFixed(decimals))
}

/**
 * Pick random items from an array
 */
export function pickRandom<T>(arr: T[], count: number = 1): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, arr.length))
}

/**
 * Generate a UUID-like ID
 */
export function generateId(): string {
    return 'mock_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]
}

/**
 * Get timestamp in milliseconds
 */
export function getTimestamp(date: Date): number {
    return date.getTime()
}
