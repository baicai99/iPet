/**
 * Insight Types
 */

export type TrendDirection = 'up' | 'down' | 'stable'

export interface InsightSuggestion {
    id: string
    key: string
    title: string
    content: string
    severity?: 'info' | 'warning' | 'critical'
    actionText?: string
    actionUrl?: string
}
