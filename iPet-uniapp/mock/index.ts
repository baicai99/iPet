import { MockMethod } from 'vite-plugin-mock'
import {
    getMetricHistoryMock,
    getMetricSeriesMock,
    getHealthRecordsMock,
    createHealthRecordMock,
    updateHealthRecordMock,
    deleteHealthRecordMock,
    getHealthSummaryMock
} from './handlers/metricHandlers'

import { getPetsMock, createPetMock, updatePetMock, deletePetMock } from './handlers/petHandlers'
import { sendCodeMock, registerMock, loginMock, refreshTokenMock } from './handlers/authHandlers'
import { updateProfileMock, getProfileMock, getVipStatusMock, deleteAccountMock } from './handlers/userHandlers'
import { generateReportMock } from './handlers/healthReportHandlers'
import { getTrendInsightMock, getInsightMock } from './handlers/insightHandlers'
import { markReadMock, markAllReadMock, updatePreferenceMock, syncAllPreferencesMock } from './handlers/notificationHandlers'
import { syncMock } from './handlers/syncHandlers'

// Helper to adapt vite-plugin-mock request to our handler format
const adapt = (handler: any) => {
    return (opt: { body: any, query: any, headers: any, url: string }) => {
        const config = {
            url: opt.url,
            method: 'GET', // Default, though handler might not check it if we route correctly
            data: opt.body,
            header: opt.headers,
            params: opt.query // Add params to config if handlers use it
        }
        return handler(config)
    }
}

export default [
    // Health Records
    { url: '/health', method: 'get', response: adapt(getHealthRecordsMock) },
    { url: '/health', method: 'post', response: adapt(createHealthRecordMock) },
    { url: '/health/:id', method: 'patch', response: adapt(updateHealthRecordMock) },
    { url: '/health/:id', method: 'delete', response: adapt(deleteHealthRecordMock) },
    { url: '/health/summary', method: 'get', response: adapt(getHealthSummaryMock) },

    // Metrics
    { url: '/metrics/:id/history', method: 'get', response: adapt(getMetricHistoryMock) },
    { url: '/metrics/:id/series', method: 'get', response: adapt(getMetricSeriesMock) },



    // Pets
    { url: '/pets', method: 'get', response: adapt(getPetsMock) },
    { url: '/pets', method: 'post', response: adapt(createPetMock) },
    { url: '/pets/:id', method: 'patch', response: adapt(updatePetMock) },
    { url: '/pets/:id', method: 'delete', response: adapt(deletePetMock) },

    // Auth
    { url: '/verification/code', method: 'post', response: adapt(sendCodeMock) },
    { url: '/users/register', method: 'post', response: adapt(registerMock) },
    { url: '/auth/login', method: 'post', response: adapt(loginMock) },
    { url: '/auth/refresh', method: 'post', response: adapt(refreshTokenMock) },

    // User profile
    { url: '/users/me', method: 'get', response: adapt(getProfileMock) },
    { url: '/users/profile', method: 'put', response: adapt(updateProfileMock) },
    { url: '/users/vip-status', method: 'get', response: adapt(getVipStatusMock) },
    { url: '/users/account', method: 'delete', response: adapt(deleteAccountMock) },

    // Health Report
    { url: '/health/reports/generate', method: 'post', response: adapt(generateReportMock) },

    // Insights
    { url: '/insights/trend', method: 'get', response: adapt(getTrendInsightMock) },
    { url: '/insights/:id', method: 'get', response: adapt(getInsightMock) },

    // Notifications
    { url: '/notifications/:id/read', method: 'put', response: adapt(markReadMock) },
    { url: '/notifications/read-all', method: 'put', response: adapt(markAllReadMock) },
    { url: '/notifications/preferences', method: 'post', response: adapt(updatePreferenceMock) },
    { url: '/notifications/preferences/bulk', method: 'post', response: adapt(syncAllPreferencesMock) },

    // Sync
    { url: '/sync', method: 'get', response: adapt(syncMock) },
    { url: '/sync', method: 'post', response: adapt(syncMock) }
] as MockMethod[]
