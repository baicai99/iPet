/**
 * Mock Data Generators - Unified Export
 * 
 * This module provides data generation capabilities for the mock system:
 * - High-frequency: daily activities (meal, water, walks)
 * - Low-frequency: periodic events (bathing, vaccines, deworming)
 * - Chaos engine: edge case injection for testing
 */

// Time utilities
export {
    type TimeSlot,
    TIME_SLOTS,
    getDateRange,
    iterateDays,
    getRandomTimeInSlot,
    addRandomInterval,
    randomInRange,
    pickRandom,
    generateId,
    formatDateISO,
    getTimestamp
} from './timeUtils'

// High-frequency data generation
export {
    type HighFreqConfig,
    HIGH_FREQ_CONFIGS,
    generateHighFrequencyData,
    generateHighFreqDataForMetric
} from './highFrequencyGenerator'

// Low-frequency data generation
export {
    type LowFreqConfig,
    LOW_FREQ_CONFIGS,
    generateLowFrequencyData,
    generateLowFreqDataForMetric
} from './lowFrequencyGenerator'

// Chaos engineering
export {
    type ChaosConfig,
    DEFAULT_CHAOS_CONFIG,
    getChaosConfig,
    injectChaos,
    getRandomNetworkDelay,
    withNetworkDelay
} from './chaosEngine'

/**
 * List of metrics that use high-frequency generation pattern
 * (Daily or multiple times per day)
 */
export const HIGH_FREQ_METRICS = [
    // Nutrition
    'meal', 'water', 'protein', 'carb', 'fat', 'diet_energy', 'fish_oil', 'calcium', 'fiber',
    // Activity
    'walk_duration', 'run_distance', 'run_pace', 'fitness_training', 'training', 'sleep_duration',
    // Body Status (daily tracking)
    'stool', 'anxiety', 'depression', 'vomiting'
]

/**
 * List of metrics that use low-frequency generation pattern
 * (Weekly, monthly, or less frequent)
 */
export const LOW_FREQ_METRICS = [
    // Care Events
    'bathing', 'tooth_brushing', 'deworming', 'rabies_vaccine',
    // Body Measurements (weekly/monthly tracking)
    'weight', 'body_temp', 'shoulder_height', 'body_fat', 'bmi', 'lean_mass', 'waist'
]

/**
 * All supported metrics for mock data generation
 */
export const ALL_MOCK_METRICS = [...HIGH_FREQ_METRICS, ...LOW_FREQ_METRICS]
