/**
 * useTrendCard - Trend Card Business Logic Composable
 * 
 * Handles all calculation logic for the Trend Card component:
 * - 20-data threshold check
 * - Daily → Weekly auto-progression
 * - Max 40 bars limiting
 * - Trend threshold filtering (30% default)
 * - Smart copywriting generation
 */

import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { useHealthStore } from '@/stores/healthStore'
import type { HealthRecord } from '@shared/types/health'
import { getTrendCopywriting, type TrendSentiment } from '@/config/trendCopywriting'
import { getLocalDayKey } from '@/utils/common/timeKey'
import {
    TREND_MIN_DATA_POINTS,
    TREND_THRESHOLD_PERCENT,
    TREND_WINDOW_SIZE,
    TREND_WEEKS_FOR_WEEKLY_MODE
} from '@/domain/trend/trendConstants'

// ============================================================================
// Types
// ============================================================================

export type ViewMode = 'daily' | 'weekly'
export type TrendDirection = 'up' | 'down' | 'stable'

export interface TrendCardConfig {
    /** Metric key for data fetching */
    metricKey: string
    /** Display name for copywriting (e.g., "体重", "饭量") */
    subjectName: string
    /** Sentiment: is "up" good or bad? */
    sentiment: TrendSentiment
    /** Threshold percentage for trend detection (default: 30) */
    thresholdPercent?: number
    /** Minimum data points required (default: 20) */
    minDataPoints?: number
    /** Maximum bars to display (default: 40) */
    maxBars?: number
    /** Pet ID for filtering */
    petId?: string
}

export interface TrendCardResult {
    // Display data
    previousValues: ComputedRef<number[]>
    recentValues: ComputedRef<number[]>
    previousAvg: ComputedRef<number>
    recentAvg: ComputedRef<number>
    previousLabel: ComputedRef<string>
    recentLabel: ComputedRef<string>

    // Analysis
    viewMode: ComputedRef<ViewMode>
    trendDirection: ComputedRef<TrendDirection>
    hasSignificantChange: ComputedRef<boolean>
    changePercent: ComputedRef<number>
    copywriting: ComputedRef<string>

    // State
    hasEnoughData: ComputedRef<boolean>
    totalDataPoints: ComputedRef<number>
    maxValue: ComputedRef<number>

    // Raw data access
    allRecords: ComputedRef<HealthRecord[]>
}

// ============================================================================
// Constants
// ============================================================================

// 保持默认值与 Domain 层一致，避免口径漂移
const DEFAULT_MIN_DATA_POINTS = TREND_MIN_DATA_POINTS
const DEFAULT_MAX_BARS = TREND_WINDOW_SIZE
const DEFAULT_THRESHOLD_PERCENT = TREND_THRESHOLD_PERCENT
const WEEKS_FOR_WEEKLY_MODE = TREND_WEEKS_FOR_WEEKLY_MODE

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Group records by date (YYYY-MM-DD)
 */
function groupByDate(records: HealthRecord[]): Map<string, number[]> {
    const groups = new Map<string, number[]>()

    for (const record of records) {
        const dateKey = getLocalDayKey(record.date)
        if (!dateKey) continue

        if (!groups.has(dateKey)) {
            groups.set(dateKey, [])
        }
        groups.get(dateKey)!.push(record.value)
    }

    return groups
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Group records by week (YYYY-Www)
 */
function groupByWeek(records: HealthRecord[]): Map<string, number[]> {
    const groups = new Map<string, number[]>()

    for (const record of records) {
        if (!record.date) continue

        const date = new Date(record.date)
        const weekKey = `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`

        if (!groups.has(weekKey)) {
            groups.set(weekKey, [])
        }
        groups.get(weekKey)!.push(record.value)
    }

    return groups
}

/**
 * Aggregate values in a group (sum for daily metrics, average for measurements)
 */
function aggregateValues(values: number[], method: 'sum' | 'avg' = 'sum'): number {
    if (values.length === 0) return 0
    const sum = values.reduce((a, b) => a + b, 0)
    return method === 'avg' ? sum / values.length : sum
}

/**
 * Calculate average of an array
 */
function calcAverage(values: number[]): number {
    const valid = values.filter(v => typeof v === 'number' && !Number.isNaN(v))
    if (!valid.length) return 0
    return valid.reduce((a, b) => a + b, 0) / valid.length
}

// ============================================================================
// Main Composable
// ============================================================================

export function useTrendCard(config: TrendCardConfig): TrendCardResult {
    const healthStore = useHealthStore()

    const {
        metricKey,
        subjectName,
        sentiment,
        thresholdPercent = DEFAULT_THRESHOLD_PERCENT,
        minDataPoints = DEFAULT_MIN_DATA_POINTS,
        maxBars = DEFAULT_MAX_BARS,
        petId
    } = config

    // -------------------------------------------------------------------------
    // Raw Data
    // -------------------------------------------------------------------------

    const allRecords = computed<HealthRecord[]>(() => {
        const records = healthStore.metricHistory(metricKey) || []
        if (petId) {
            return records.filter(r => r.petId === petId)
        }
        return records
    })

    // -------------------------------------------------------------------------
    // View Mode Detection
    // -------------------------------------------------------------------------

    const viewMode = computed<ViewMode>(() => {
        // Group by week to check if we have enough weeks
        const weeklyGroups = groupByWeek(allRecords.value)

        // Switch to weekly view if we have >= 20 weeks of data
        if (weeklyGroups.size >= WEEKS_FOR_WEEKLY_MODE) {
            return 'weekly'
        }

        return 'daily'
    })

    // -------------------------------------------------------------------------
    // Aggregated Data Points
    // -------------------------------------------------------------------------

    const aggregatedDataPoints = computed<number[]>(() => {
        const records = allRecords.value
        if (records.length === 0) return []

        const groups = viewMode.value === 'weekly'
            ? groupByWeek(records)
            : groupByDate(records)

        // Sort by key (date/week) ascending
        const sortedKeys = Array.from(groups.keys()).sort()

        // Aggregate each group
        const points = sortedKeys.map(key => {
            const values = groups.get(key)!
            return aggregateValues(values, 'sum')
        })

        return points
    })

    // -------------------------------------------------------------------------
    // Data Threshold Check
    // -------------------------------------------------------------------------

    const totalDataPoints = computed(() => aggregatedDataPoints.value.length)

    const hasEnoughData = computed(() => totalDataPoints.value >= minDataPoints)

    // -------------------------------------------------------------------------
    // Split into Previous/Recent Groups (max 40 bars total)
    // -------------------------------------------------------------------------

    const displayData = computed(() => {
        const allPoints = aggregatedDataPoints.value

        // Take only the most recent maxBars points
        const limitedPoints = allPoints.slice(-maxBars)

        // Split roughly 50/50 for comparison
        const midpoint = Math.floor(limitedPoints.length / 2)

        const previous = limitedPoints.slice(0, midpoint)
        const recent = limitedPoints.slice(midpoint)

        return { previous, recent }
    })

    const previousValues = computed(() => displayData.value.previous)
    const recentValues = computed(() => displayData.value.recent)

    // -------------------------------------------------------------------------
    // Averages
    // -------------------------------------------------------------------------

    const previousAvg = computed(() => calcAverage(previousValues.value))
    const recentAvg = computed(() => calcAverage(recentValues.value))

    // -------------------------------------------------------------------------
    // Trend Analysis
    // -------------------------------------------------------------------------

    const changePercent = computed(() => {
        if (previousAvg.value === 0) return 0
        return ((recentAvg.value - previousAvg.value) / previousAvg.value) * 100
    })

    const hasSignificantChange = computed(() => {
        return Math.abs(changePercent.value) > thresholdPercent  // 使用 > 而非 >=，与 domain 层保持一致
    })

    const trendDirection = computed<TrendDirection>(() => {
        if (!hasSignificantChange.value) return 'stable'
        return changePercent.value > 0 ? 'up' : 'down'
    })

    // -------------------------------------------------------------------------
    // Labels
    // -------------------------------------------------------------------------

    const previousLabel = computed(() => {
        const count = previousValues.value.length
        const unit = viewMode.value === 'weekly' ? '周' : '天'
        return `过去${count}${unit}`
    })

    const recentLabel = computed(() => {
        const count = recentValues.value.length
        const unit = viewMode.value === 'weekly' ? '周' : '天'
        return `最近${count}${unit}`
    })

    // -------------------------------------------------------------------------
    // Smart Copywriting
    // -------------------------------------------------------------------------

    const copywriting = computed(() => {
        return getTrendCopywriting({
            subject: subjectName,
            timeRange: recentLabel.value,
            direction: trendDirection.value,
            sentiment
        })
    })

    // -------------------------------------------------------------------------
    // Max Value for Chart Scaling
    // -------------------------------------------------------------------------

    const maxValue = computed(() => {
        const allValues = [...previousValues.value, ...recentValues.value]
        if (allValues.length === 0) return 100
        return Math.max(...allValues) * 1.2 // 20% headroom
    })

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------

    return {
        previousValues,
        recentValues,
        previousAvg,
        recentAvg,
        previousLabel,
        recentLabel,
        viewMode,
        trendDirection,
        hasSignificantChange,
        changePercent,
        copywriting,
        hasEnoughData,
        totalDataPoints,
        maxValue,
        allRecords
    }
}
