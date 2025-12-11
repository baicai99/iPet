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
    }
}
