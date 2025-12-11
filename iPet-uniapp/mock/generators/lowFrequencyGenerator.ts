/**
 * Low Frequency Data Generator
 * Generates sparse event data with configurable intervals (monthly/quarterly)
 * For metrics like bathing, deworming, vaccines
 */

import type { HealthRecord } from '@shared/types/health'
import {
    getDateRange,
    addRandomInterval,
    randomInRange,
    generateId,
    formatDateISO,
    getTimestamp
} from './timeUtils'

/**
 * Configuration for low-frequency data generation
 */
export interface LowFreqConfig {
    metricKey: string
    petId: string
    intervalDays: { min: number; max: number }
    unit?: string
    years?: number
    includeFuture?: boolean
    futureDays?: { min: number; max: number }
    labels?: string[]
    metadata?: Record<string, any>
    valueRange?: { min: number; max: number }  // For numeric metrics
    decimals?: number                           // Value decimal precision
}

/**
 * Default configurations for common low-frequency metrics
 * Includes periodic events and body measurements (weekly/monthly)
 */
export const LOW_FREQ_CONFIGS: Record<string, Partial<LowFreqConfig>> = {
    // === Care Events ===
    bathing: {
        intervalDays: { min: 7, max: 14 },
        unit: 'count',
        labels: ['home', 'shop'],
        includeFuture: true,
        futureDays: { min: 3, max: 10 }
    },
    tooth_brushing: {
        intervalDays: { min: 2, max: 4 },
        unit: 'count',
        labels: [],
        includeFuture: true,
        futureDays: { min: 1, max: 3 }
    },
    deworming: {
        intervalDays: { min: 28, max: 35 },
        unit: 'count',
        labels: ['internal', 'external'],
        includeFuture: true,
        futureDays: { min: 14, max: 30 }
    },
    rabies_vaccine: {
        intervalDays: { min: 180, max: 400 },
        unit: 'count',
        labels: ['rabies', 'six_in_one', 'eight_in_one'],
        includeFuture: true,
        futureDays: { min: 30, max: 180 }
    },

    // === Body Measurements (weekly tracking) ===
    weight: {
        intervalDays: { min: 5, max: 10 },
        unit: 'kg',
        valueRange: { min: 5, max: 35 },
        decimals: 1,
        includeFuture: false
    },
    body_temp: {
        intervalDays: { min: 7, max: 14 },
        unit: '°C',
        valueRange: { min: 38.0, max: 39.5 },
        decimals: 1,
        includeFuture: false
    },
    shoulder_height: {
        intervalDays: { min: 14, max: 30 },
        unit: 'cm',
        valueRange: { min: 30, max: 55 },
        decimals: 0,
        includeFuture: false
    },
    body_fat: {
        intervalDays: { min: 14, max: 30 },
        unit: 'percent',
        valueRange: { min: 15, max: 30 },
        decimals: 1,
        includeFuture: false
    },
    bmi: {
        intervalDays: { min: 14, max: 30 },
        unit: '',
        valueRange: { min: 18, max: 28 },
        decimals: 1,
        includeFuture: false
    },
    lean_mass: {
        intervalDays: { min: 14, max: 30 },
        unit: 'kg',
        valueRange: { min: 4, max: 30 },
        decimals: 1,
        includeFuture: false
    },
    waist: {
        intervalDays: { min: 14, max: 30 },
        unit: 'cm',
        valueRange: { min: 35, max: 70 },
        decimals: 0,
        includeFuture: false
    }
}

/**
 * Generate low-frequency health records for a metric
 */
export function generateLowFrequencyData(config: LowFreqConfig): HealthRecord[] {
    const {
        metricKey,
        petId,
        intervalDays,
        unit = 'count',
        years = 2,
        includeFuture = true,
        futureDays = { min: 7, max: 30 },
        labels = [],
        metadata = {},
        valueRange,
        decimals = 0
    } = config

    const records: HealthRecord[] = []
    const { start, end } = getDateRange(years)

    let currentDate = new Date(start)
    // Add small random offset to start
    currentDate = addRandomInterval(currentDate, 0, intervalDays.min)

    // Generate historical records
    while (currentDate <= end) {
        const label = labels.length > 0
            ? labels[Math.floor(Math.random() * labels.length)]
            : undefined

        // Add some time variation within the day (9:00 - 18:00)
        const recordTime = new Date(currentDate)
        recordTime.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0)

        // Calculate value: numeric range or default to 1 (event count)
        let value: number = 1
        if (valueRange) {
            const rawValue = valueRange.min + Math.random() * (valueRange.max - valueRange.min)
            value = Number(rawValue.toFixed(decimals))
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
            label,
            metadata: {
                ...metadata,
                eventType: label,
                generatedAt: new Date().toISOString()
            }
        }

        records.push(record)

        // Jump to next occurrence
        currentDate = addRandomInterval(currentDate, intervalDays.min, intervalDays.max)
    }

    // Generate one future scheduled record if configured
    if (includeFuture) {
        const futureDate = addRandomInterval(new Date(), futureDays.min, futureDays.max)
        futureDate.setHours(10, 0, 0, 0)

        const futureLabel = labels.length > 0
            ? labels[Math.floor(Math.random() * labels.length)]
            : undefined

        const futureRecord: HealthRecord = {
            id: generateId(),
            petId,
            type: metricKey,
            value: 1,
            unit,
            date: formatDateISO(futureDate),
            updatedAt: getTimestamp(futureDate),
            status: 'pending',
            source: 'mock',
            label: futureLabel,
            metadata: {
                ...metadata,
                eventType: futureLabel,
                isScheduled: true,
                targetDate: formatDateISO(futureDate),
                generatedAt: new Date().toISOString()
            }
        }

        records.push(futureRecord)
    }

    // Sort by timestamp descending (newest/future first)
    records.sort((a, b) => b.updatedAt - a.updatedAt)

    return records
}

/**
 * Quick helper to generate data for a known metric type
 */
export function generateLowFreqDataForMetric(
    metricKey: string,
    petId: string,
    overrides?: Partial<LowFreqConfig>
): HealthRecord[] {
    const baseConfig = LOW_FREQ_CONFIGS[metricKey]

    if (!baseConfig) {
        throw new Error(`Unknown low-frequency metric: ${metricKey}`)
    }

    const config: LowFreqConfig = {
        metricKey,
        petId,
        intervalDays: baseConfig.intervalDays || { min: 30, max: 60 },
        unit: baseConfig.unit,
        labels: baseConfig.labels,
        includeFuture: baseConfig.includeFuture,
        futureDays: baseConfig.futureDays,
        ...overrides
    }

    return generateLowFrequencyData(config)
}
