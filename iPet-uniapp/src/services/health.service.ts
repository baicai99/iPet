import request from '@/utils/common/request'
import type { HealthRecord } from '@shared/types/health'

export const healthService = {
    async getHealthRecords(petId?: string, page?: number, limit?: number, metricKey?: string): Promise<HealthRecord[]> {
        return request({
            url: '/health',
            method: 'GET',
            data: { petId, page, limit, type: metricKey }
        })
    },

    async createHealthRecord(data: Partial<HealthRecord>): Promise<HealthRecord> {
        return request({
            url: '/health',
            method: 'POST',
            data
        })
    },

    async updateHealthRecord(id: string, data: Partial<HealthRecord>): Promise<HealthRecord> {
        return request({
            url: `/health/${id}`,
            method: 'PATCH' as any,
            data
        })
    },

    async deleteHealthRecord(id: string): Promise<void> {
        return request({
            url: `/health/${id}`,
            method: 'DELETE'
        })
    },

    async toggleMetricPin(petId: string, metricKey: string, isPinned: boolean): Promise<void> {
        return request({
            url: '/health/metrics/pin',
            method: 'POST',
            data: { petId, metricKey, isPinned }
        })
    },

    /**
     * ✅ NEW: Get pre-aggregated metric series from backend
     * 
     * Eliminates client-side main thread aggregation (100-200ms)
     * 
     * @param petId Pet ID
     * @param metricKey Metric type (e.g., 'weight', 'meal')
     * @param range Time range ('day', 'week', 'month', 'six_month', 'year')
     * @param bucket Aggregation granularity ('none', 'day', 'week', 'month')
     * @returns Promise with aggregated series data and stats
     */
    async getMetricSeries(
        petId: string,
        metricKey: string,
        range: string = 'week',
        bucket: string = 'none'
    ) {
        const response = await request<{
            series: Array<{ value: number; date: string; timestamp: number }>
            stats: { avg: number | null; min: number | null; max: number | null; count: number }
            meta: any
        }>({
            url: '/health/series',
            method: 'GET',
            data: {
                petId,
                metricKey,
                range,
                bucket
            }
        })
        return response
    }
}
