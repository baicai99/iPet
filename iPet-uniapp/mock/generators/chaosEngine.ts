/**
 * Chaos Engine - Abnormal Data Injection for Testing
 * Injects edge cases like data voids, outliers, null fields, and network delays
 */

import type { HealthRecord } from '@shared/types/health'

/**
 * Chaos engineering configuration
 */
export interface ChaosConfig {
    enabled: boolean
    dataVoidProbability: number      // 0-1: Probability of skipping a day's data
    outlierProbability: number       // 0-1: Probability of extreme values
    nullFieldProbability: number     // 0-1: Probability of null/missing fields
    networkDelayMs?: { min: number; max: number }  // Random delay range in ms
}

/**
 * Default chaos configuration (conservative for development)
 */
export const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
    enabled: true,
    dataVoidProbability: 0.02,      // 2% of days have no data
    outlierProbability: 0.01,       // 1% of values are outliers
    nullFieldProbability: 0.005,    // 0.5% of records have null fields
    networkDelayMs: { min: 0, max: 300 }
}

/**
 * Outlier value ranges for different metric types
 */
const OUTLIER_RANGES: Record<string, { min: number; max: number }> = {
    meal: { min: 500, max: 800 },           // Unusually high meal
    water: { min: 800, max: 1500 },         // Excessive water
    body_temp: { min: 34, max: 42 },        // Fever or hypothermia
    walk_duration: { min: 120, max: 240 },  // Very long walks
    weight: { min: 1, max: 50 },            // Extreme weights
    sleep_duration: { min: 2, max: 20 }     // Very short or long sleep
}

/**
 * Get current chaos configuration (can be extended to read from env)
 */
export function getChaosConfig(): ChaosConfig {
    // Could be extended to check environment variables
    return { ...DEFAULT_CHAOS_CONFIG }
}

/**
 * Check if chaos should be applied based on probability
 */
function shouldApplyChaos(probability: number): boolean {
    return Math.random() < probability
}

/**
 * Inject outlier values into a record
 */
function injectOutlier(record: HealthRecord): HealthRecord {
    const outlierRange = OUTLIER_RANGES[record.type]
    if (!outlierRange) return record

    const outlierValue = outlierRange.min + Math.random() * (outlierRange.max - outlierRange.min)

    return {
        ...record,
        value: Number(outlierValue.toFixed(1)),
        metadata: {
            ...record.metadata,
            chaosInjected: 'outlier',
            originalValue: record.value
        }
    }
}

/**
 * Inject null fields into a record
 */
function injectNullField(record: HealthRecord): HealthRecord {
    const nullableFields: (keyof HealthRecord)[] = ['notes', 'source', 'label', 'emoji']
    const fieldToNull = nullableFields[Math.floor(Math.random() * nullableFields.length)]

    // Sometimes null an important field for more severe testing
    const severeNull = Math.random() < 0.1

    const result: HealthRecord = { ...record }

    if (severeNull) {
        // Null the value itself (rare but important to test)
        result.value = null as any
        result.metadata = {
            ...result.metadata,
            chaosInjected: 'null_value'
        }
    } else {
        (result as any)[fieldToNull] = null
        result.metadata = {
            ...result.metadata,
            chaosInjected: `null_${fieldToNull}`
        }
    }

    return result
}

/**
 * Apply chaos injection to a list of records
 * This modifies records based on configured probabilities
 */
export function injectChaos(
    records: HealthRecord[],
    config: ChaosConfig = DEFAULT_CHAOS_CONFIG
): HealthRecord[] {
    if (!config.enabled || records.length === 0) {
        return records
    }

    // Track which days to void
    const daysToVoid = new Set<string>()
    const allDates = [...new Set(records.map(r => r.date))]

    for (const date of allDates) {
        if (shouldApplyChaos(config.dataVoidProbability)) {
            daysToVoid.add(date)
        }
    }

    // Process records
    const result: HealthRecord[] = []

    for (const record of records) {
        // Skip records from voided days
        if (daysToVoid.has(record.date)) {
            continue
        }

        let processedRecord = { ...record }

        // Apply outlier injection
        if (shouldApplyChaos(config.outlierProbability)) {
            processedRecord = injectOutlier(processedRecord)
        }

        // Apply null field injection
        if (shouldApplyChaos(config.nullFieldProbability)) {
            processedRecord = injectNullField(processedRecord)
        }

        result.push(processedRecord)
    }

    return result
}

/**
 * Generate a random network delay based on config
 */
export function getRandomNetworkDelay(config: ChaosConfig = DEFAULT_CHAOS_CONFIG): number {
    if (!config.enabled || !config.networkDelayMs) {
        return 0
    }

    const { min, max } = config.networkDelayMs
    return Math.floor(min + Math.random() * (max - min))
}

/**
 * Apply network delay to a promise (for use in handlers)
 */
export async function withNetworkDelay<T>(
    data: T,
    config: ChaosConfig = DEFAULT_CHAOS_CONFIG
): Promise<T> {
    const delay = getRandomNetworkDelay(config)

    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    return data
}
