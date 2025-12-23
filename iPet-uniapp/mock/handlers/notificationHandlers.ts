import { RequestConfig } from '@/utils/common/request'

import { defineMock } from '../types/common'

export const markReadMock = defineMock({
    url: '/notifications/:id/read',
    method: 'PUT',
    handler: (config: RequestConfig) => {
        return { success: true }
    }
})

export const markAllReadMock = defineMock({
    url: '/notifications/read-all',
    method: 'PUT',
    handler: (config: RequestConfig) => {
        return { success: true }
    }
})

export const updatePreferenceMock = defineMock({
    url: '/notifications/preferences',
    method: 'POST',
    handler: (config: RequestConfig) => {
        return { success: true }
    }
})

export const syncAllPreferencesMock = defineMock({
    url: '/notifications/preferences/bulk',
    method: 'POST',
    handler: (config: RequestConfig) => {
        return { success: true }
    }
})
