/**
 * High Frequency Data Generator
 * Generates daily data patterns (2-3 times per day) simulating human behavior
 * Covers 2-year time span for metrics like meal, water, walk_duration
 */

import type { HealthRecord } from '@shared/types/health'
import {
    TimeSlot,
    TIME_SLOTS,
    getDateRange,
    iterateDays,
    getRandomTimeInSlot,
    randomInRange,
    pickRandom,
    generateId,
    formatDateISO,
    getTimestamp
} from './timeUtils'

/**
 * Configuration for high-frequency data generation
 */
export interface HighFreqConfig {
    metricKey: string
    petId: string
    timeSlots: TimeSlot[]
    valueRange: { min: number; max: number }
    unit: string
    minPerDay?: number  // Minimum occurrences per day (default: 2)
    maxPerDay?: number  // Maximum occurrences per day (default: 3)
    years?: number      // Years of data to generate (default: 2)
    decimals?: number   // Value decimal precision (default: 0)
}

/**
 * Default configurations for common high-frequency metrics
 * Covers all daily/multiple-daily tracked health metrics
 */
export const HIGH_FREQ_CONFIGS: Record<string, Partial<HighFreqConfig>> = {
    // === Nutrition Intake ===
    meal: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.lunch, TIME_SLOTS.dinner],
        valueRange: { min: 100, max: 250 },
        unit: 'g',
        minPerDay: 2,
        maxPerDay: 3
    },
    water: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.lunch, TIME_SLOTS.dinner],
        valueRange: { min: 50, max: 200 },
        unit: 'ml',
        minPerDay: 2,
        maxPerDay: 3
    },
    protein: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.dinner],
        valueRange: { min: 20, max: 60 },
        unit: 'g',
        minPerDay: 1,
        maxPerDay: 2
    },
    carb: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.dinner],
        valueRange: { min: 30, max: 80 },
        unit: 'g',
        minPerDay: 1,
        maxPerDay: 2
    },
    fat: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.dinner],
        valueRange: { min: 10, max: 40 },
        unit: 'g',
        minPerDay: 1,
        maxPerDay: 2
    },
    diet_energy: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.lunch, TIME_SLOTS.dinner],
        valueRange: { min: 200, max: 500 },
        unit: 'kcal',
        minPerDay: 2,
        maxPerDay: 3
    },
    fish_oil: {
        timeSlots: [TIME_SLOTS.breakfast],
        valueRange: { min: 1, max: 3 },
        unit: 'capsule',
        minPerDay: 1,
        maxPerDay: 1
    },
    calcium: {
        timeSlots: [TIME_SLOTS.breakfast],
        valueRange: { min: 1, max: 2 },
        unit: 'tablet',
        minPerDay: 1,
        maxPerDay: 1
    },
    fiber: {
        timeSlots: [TIME_SLOTS.dinner],
        valueRange: { min: 5, max: 15 },
        unit: 'g',
        minPerDay: 1,
        maxPerDay: 1
    },

    // === Activity ===
    walk_duration: {
        timeSlots: [TIME_SLOTS.morningWalk, TIME_SLOTS.eveningWalk],
        valueRange: { min: 15, max: 45 },
        unit: 'minute',
        minPerDay: 1,
        maxPerDay: 2
    },
    run_distance: {
        timeSlots: [TIME_SLOTS.morningWalk],
        valueRange: { min: 1, max: 5 },
        unit: 'km',
        minPerDay: 0,
        maxPerDay: 1,
        decimals: 1
    },
    run_pace: {
        timeSlots: [TIME_SLOTS.morningWalk],
        valueRange: { min: 5, max: 10 },
        unit: 'min_per_km',
        minPerDay: 0,
        maxPerDay: 1,
        decimals: 1
    },
    fitness_training: {
        timeSlots: [TIME_SLOTS.morningWalk, TIME_SLOTS.afternoonNap],
        valueRange: { min: 10, max: 30 },
        unit: 'minute',
        minPerDay: 0,
        maxPerDay: 1
    },
    training: {
        timeSlots: [TIME_SLOTS.afternoonNap],
        valueRange: { min: 5, max: 20 },
        unit: 'minute',
        minPerDay: 0,
        maxPerDay: 1
    },
    sleep_duration: {
        timeSlots: [TIME_SLOTS.bedtime],
        valueRange: { min: 8, max: 14 },
        unit: 'hour',
        minPerDay: 1,
        maxPerDay: 1,
        decimals: 1
    },

    // === Body Status (daily tracking) ===
    stool: {
        timeSlots: [TIME_SLOTS.morningWalk, TIME_SLOTS.eveningWalk],
        valueRange: { min: 1, max: 7 },  // 1=羊屎蛋, 2=干, 3=偏干, 4=正常, 5=偏稀, 6=稀, 7=水样
        unit: 'status',
        minPerDay: 1,
        maxPerDay: 2
    },
    anxiety: {
        timeSlots: [TIME_SLOTS.lunch],
        valueRange: { min: 0, max: 5 },
        unit: 'score',
        minPerDay: 1,
        maxPerDay: 1
    },
    depression: {
        timeSlots: [TIME_SLOTS.lunch],
        valueRange: { min: 0, max: 5 },
        unit: 'score',
        minPerDay: 1,
        maxPerDay: 1
    },
    vomiting: {
        timeSlots: [TIME_SLOTS.breakfast, TIME_SLOTS.dinner],
        valueRange: { min: 0, max: 2 },
        unit: 'count',
        minPerDay: 0,
        maxPerDay: 1
    }
}

/**
 * Generate high-frequency health records for a metric
 */
export function generateHighFrequencyData(config: HighFreqConfig): HealthRecord[] {
    const {
        metricKey,
        petId,
        timeSlots,
        valueRange,
        unit,
        minPerDay = 2,
        maxPerDay = 3,
        years = 2,
        decimals = 0
    } = config

    const records: HealthRecord[] = []
    const { start, end } = getDateRange(years)

    for (const day of iterateDays(start, end)) {
        // Randomly decide how many times this day (between min and max)
        const timesToday = minPerDay + Math.floor(Math.random() * (maxPerDay - minPerDay + 1))

        // Pick random time slots for today
        const selectedSlots = pickRandom(timeSlots, timesToday)

        for (const slot of selectedSlots) {
            const recordTime = getRandomTimeInSlot(day, slot)
            const value = randomInRange(valueRange.min, valueRange.max, decimals)

            // Stool status labels and emojis (PRD 3.2)
            const stoolLabels: Record<number, { label: string; emoji: string }> = {
                1: { label: '羊屎蛋', emoji: '🔴' },
                2: { label: '干', emoji: '🟠' },
                3: { label: '偏干', emoji: '🟡' },
                4: { label: '正常', emoji: '🟢' },
                5: { label: '偏稀', emoji: '🟡' },
                6: { label: '稀', emoji: '🟠' },
                7: { label: '水样', emoji: '🔴' }
            }

            const record: HealthRecord = {
                id: generateId(),
                petId,
                type: metricKey,
                value,
                unit,
                date: formatDateISO(recordTime),
                updatedAt: getTimestamp(recordTime),
                status: 'synced',
                source: 'mock',
                // Add label and emoji for stool metric
                ...(metricKey === 'stool' && stoolLabels[value] ? {
                    label: stoolLabels[value].label,
                    emoji: stoolLabels[value].emoji
                } : {}),
                metadata: {
                    timeSlot: slot.name,
                    generatedAt: new Date().toISOString()
                }
            }

            records.push(record)
        }
    }

    // Sort by timestamp descending (newest first)
    records.sort((a, b) => b.updatedAt - a.updatedAt)

    return records
}

/**
 * Quick helper to generate data for a known metric type
 */
export function generateHighFreqDataForMetric(
    metricKey: string,
    petId: string,
    overrides?: Partial<HighFreqConfig>
): HealthRecord[] {
    const baseConfig = HIGH_FREQ_CONFIGS[metricKey]

    if (!baseConfig) {
        throw new Error(`Unknown high-frequency metric: ${metricKey}`)
    }

    const config: HighFreqConfig = {
        metricKey,
        petId,
        timeSlots: baseConfig.timeSlots || [TIME_SLOTS.lunch],
        valueRange: baseConfig.valueRange || { min: 0, max: 100 },
        unit: baseConfig.unit || '',
        minPerDay: baseConfig.minPerDay,
        maxPerDay: baseConfig.maxPerDay,
        decimals: baseConfig.decimals,
        ...overrides
    }

    return generateHighFrequencyData(config)
}
