import request from '@/utils/common/request'
import type { InsightSuggestion, TrendDirection } from '@/types/insight'

const insightCache = new Map<string, InsightSuggestion>()

export const insightService = {
    getTrendInsight(key: string, direction: TrendDirection): Promise<InsightSuggestion> {
        return request<InsightSuggestion>({
            url: '/insights/trend',
            method: 'GET',
            data: { key, direction }
        })
    },

    async getInsight(key: string): Promise<InsightSuggestion> {
        if (insightCache.has(key)) {
            console.log(`[InsightService] Cache hit for ${key}`)
            return insightCache.get(key)!
        }

        console.log(`[InsightService] Fetching insight for ${key}`)

        const result = await request<InsightSuggestion>({
            url: `/insights/${key}`,
            method: 'GET'
        })

        insightCache.set(key, result)
        return result
    }
}
