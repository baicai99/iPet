import { RequestConfig } from '@/utils/common/request'

import { defineMock } from '../types/common'

export const syncGetMock = defineMock({
    url: '/sync',
    method: 'GET',
    handler: (config: RequestConfig) => {
        return {
            pets: [],
            healthRecords: [],
            calendarEvents: [],
            accountInfo: null
        }
    }
})

export const syncPostMock = defineMock({
    url: '/sync',
    method: 'POST',
    handler: (config: RequestConfig) => {
        return {
            success: true,
            timestamp: Date.now()
        }
    }
})
