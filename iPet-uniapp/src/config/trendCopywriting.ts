/**
 * Trend Copywriting Configuration
 * 
 * Provides smart, context-aware text generation for trend cards.
 * Supports sentiment-based messaging (positive/negative metrics).
 */

// ============================================================================
// Types
// ============================================================================

export type TrendSentiment = 'positive' | 'negative' | 'neutral'
export type TrendDirection = 'up' | 'down' | 'stable'

export interface CopywritingParams {
    /** What is being measured (e.g., "体重", "饭量") */
    subject: string
    /** Time range description (e.g., "过去20周") */
    timeRange: string
    /** Trend direction */
    direction: TrendDirection
    /** Is "up" good or bad for this metric? */
    sentiment: TrendSentiment
}

// ============================================================================
// Templates
// ============================================================================

/**
 * Templates organized by direction and sentiment
 * {subject} and {timeRange} are placeholders
 */
const TEMPLATES = {
    up: {
        positive: [
            "你的 {subject} 在 {timeRange} 有所增加，继续保持！",
            "{timeRange} 以来，{subject} 持续上升，很棒！"
        ],
        negative: [
            "{timeRange} 以来，你的 {subject} 有所上升，需要关注。",
            "你的 {subject} 在 {timeRange} 呈上升趋势。"
        ],
        neutral: [
            "你的 {subject} 在 {timeRange} 有所增加。"
        ]
    },
    down: {
        positive: [
            "{timeRange} 以来，你的 {subject} 呈现下降趋势，效果显著！",
            "你的 {subject} 在 {timeRange} 有所减少，继续加油！"
        ],
        negative: [
            "你的 {subject} 在 {timeRange} 有所减少，建议调整。",
            "{timeRange} 以来，{subject} 有所下降。"
        ],
        neutral: [
            "你的 {subject} 在 {timeRange} 有所减少。"
        ]
    },
    stable: {
        positive: [
            "你最近 {timeRange} 的 {subject} 保持稳定，没有明显波动。",
            "{timeRange} 内，{subject} 基本持平。"
        ],
        negative: [
            "你最近 {timeRange} 的 {subject} 保持稳定，没有明显波动。"
        ],
        neutral: [
            "你最近 {timeRange} 的 {subject} 保持稳定。"
        ]
    }
}

// ============================================================================
// Emoji Mapping
// ============================================================================

const TREND_EMOJI = {
    up: {
        positive: '📈',
        negative: '⚠️',
        neutral: '📊'
    },
    down: {
        positive: '🎉',
        negative: '📉',
        neutral: '📊'
    },
    stable: {
        positive: '✨',
        negative: '—',
        neutral: '—'
    }
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate trend copywriting based on context
 */
export function getTrendCopywriting(params: CopywritingParams): string {
    const { subject, timeRange, direction, sentiment } = params

    const templates = TEMPLATES[direction][sentiment]
    const template = templates[Math.floor(Math.random() * templates.length)]

    return template
        .replace('{subject}', subject)
        .replace('{timeRange}', timeRange)
}

/**
 * Get emoji for trend direction + sentiment
 */
export function getTrendEmoji(direction: TrendDirection, sentiment: TrendSentiment): string {
    return TREND_EMOJI[direction][sentiment]
}

/**
 * Get simple direction text
 */
export function getDirectionText(direction: TrendDirection): string {
    switch (direction) {
        case 'up':
            return '增加'
        case 'down':
            return '减少'
        case 'stable':
            return '稳定'
    }
}

// ============================================================================
// Metric Sentiment Configuration
// ============================================================================

/**
 * Default sentiment for common metrics
 * "positive" = up is good, down is bad
 * "negative" = up is bad, down is good
 */
export const METRIC_SENTIMENTS: Record<string, TrendSentiment> = {
    // Up is good (more is better)
    meal: 'neutral',
    water: 'positive',
    walk_duration: 'positive',
    run_distance: 'positive',

    fitness_training: 'positive',
    training: 'positive',

    // Down is good (less is better)
    weight: 'negative',
    body_fat: 'negative',
    anxiety: 'negative',
    depression: 'negative',
    vomiting: 'negative',

    // Neutral (depends on context)
    body_temp: 'neutral',
    stool: 'neutral'
}

/**
 * Get sentiment for a metric key
 */
export function getMetricSentiment(metricKey: string): TrendSentiment {
    return METRIC_SENTIMENTS[metricKey] || 'neutral'
}
