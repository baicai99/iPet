import request from '@/utils/common/request'
import type { HealthRecord } from '@/types/health'
import type { CreateHealthRecordDto, UpdateHealthRecordDto, TogglePinDto } from '@/types/dto/health'

export const healthService = {
    async getHealthRecords(petId?: string, page?: number, limit?: number, metricKey?: string): Promise<HealthRecord[]> {
        // ✅ Filter out undefined parameters to avoid sending empty strings
        // When undefined, uni-app request converts them to "" which causes backend 500
        const params: Record<string, any> = {}
        if (petId !== undefined) params.petId = petId
        if (page !== undefined) params.page = page
        if (limit !== undefined) params.limit = limit
        if (metricKey !== undefined) params.type = metricKey

        return request({
            url: '/health',
            method: 'GET',
            data: params
        })
    },

    async createHealthRecord(data: CreateHealthRecordDto): Promise<HealthRecord> {
        return request({
            url: '/health',
            method: 'POST',
            data
        })
    },

    async updateHealthRecord(id: string, data: UpdateHealthRecordDto): Promise<HealthRecord> {
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
        const payload: TogglePinDto = { petId, metricKey, isPinned }
        return request({
            url: '/health/metrics/pin',
            method: 'POST',
            data: payload
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
