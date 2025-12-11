import { RequestConfig } from '@/utils/common/request'

export const syncMock = (config: RequestConfig) => {
    if (config.method === 'GET') {
        return {
            pets: [],
            healthRecords: [],
            calendarEvents: [],
            accountInfo: null
        }
    }

    if (config.method === 'POST') {
        return {
            success: true,
            timestamp: Date.now()
        }
    }

    return null
}
