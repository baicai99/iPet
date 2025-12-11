import request from '@/utils/common/request'

export const healthSummaryService = {
    async fetchSummary(petId: string) {
        return request({
            url: '/health/summary',
            method: 'GET',
            data: { petId }
        })
    }
}
