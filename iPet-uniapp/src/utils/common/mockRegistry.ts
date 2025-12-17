/**
 * Mock Registry - Runtime mock interceptor for UniApp
 * 
 * This module provides a runtime mock handler that intercepts requests
 * when VITE_USE_MOCK=true, completely bypassing network calls.
 */

import type { RequestConfig } from './request'

// Import all mock handlers
import {
    getMetricHistoryMock,
    getMetricSeriesMock,
    getHealthRecordsMock,
    createHealthRecordMock,
    updateHealthRecordMock,
    deleteHealthRecordMock,
    getHealthSummaryMock,
    getHealthSeriesMock  // ✅ NEW: Backend aggregation API
} from '../../../mock/handlers/metricHandlers'
import { getPetsMock, createPetMock, updatePetMock, deletePetMock } from '../../../mock/handlers/petHandlers'
import { sendCodeMock, registerMock, loginMock, refreshTokenMock, guestMock, upgradeMock } from '../../../mock/handlers/authHandlers'
import { updateProfileMock, getProfileMock, getVipStatusMock, deleteAccountMock } from '../../../mock/handlers/userHandlers'
import { generateReportMock } from '../../../mock/handlers/healthReportHandlers'
import { getTrendInsightMock, getInsightMock } from '../../../mock/handlers/insightHandlers'
import { markReadMock, markAllReadMock, updatePreferenceMock, syncAllPreferencesMock } from '../../../mock/handlers/notificationHandlers'
import { syncMock } from '../../../mock/handlers/syncHandlers'

export interface MockRequestConfig {
    url: string
    method: string
    data?: any
    header?: Record<string, any>
    params?: Record<string, any>
}

type MockHandler = (config: MockRequestConfig) => any

interface MockRoute {
    pattern: RegExp
    method: string
    handler: MockHandler
}

/**
 * Convert route pattern with path params to regex
 * e.g., '/pets/:id' -> /^\/pets\/([^/]+)$/
 */
const createRouteRegex = (pattern: string): RegExp => {
    const escaped = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars
        .replace(/\\:([^/]+)/g, '([^/]+)')        // Convert :param to capture group
    return new RegExp(`^${escaped}$`)
}

// Adapt handlers to use MockRequestConfig
const adaptHandler = (handler: any): MockHandler => {
    return (config: MockRequestConfig) => handler(config)
}

/**
 * Mock route registry
 */
const mockRoutes: MockRoute[] = [
    // Health Records (main data endpoints)
    { pattern: createRouteRegex('/health'), method: 'GET', handler: adaptHandler(getHealthRecordsMock) },
    { pattern: createRouteRegex('/health'), method: 'POST', handler: adaptHandler(createHealthRecordMock) },
    { pattern: createRouteRegex('/health/:id'), method: 'PATCH', handler: adaptHandler(updateHealthRecordMock) },
    { pattern: createRouteRegex('/health/:id'), method: 'DELETE', handler: adaptHandler(deleteHealthRecordMock) },
    { pattern: createRouteRegex('/health/summary'), method: 'GET', handler: adaptHandler(getHealthSummaryMock) },
    { pattern: createRouteRegex('/health/series'), method: 'GET', handler: adaptHandler(getHealthSeriesMock) },  // ✅ NEW

    // Metrics (legacy/chart endpoints)
    { pattern: createRouteRegex('/metrics/:id/history'), method: 'GET', handler: adaptHandler(getMetricHistoryMock) },
    { pattern: createRouteRegex('/metrics/:id/series'), method: 'GET', handler: adaptHandler(getMetricSeriesMock) },

    // Pets
    { pattern: createRouteRegex('/pets'), method: 'GET', handler: adaptHandler(getPetsMock) },
    { pattern: createRouteRegex('/pets'), method: 'POST', handler: adaptHandler(createPetMock) },
    { pattern: createRouteRegex('/pets/:id'), method: 'PATCH', handler: adaptHandler(updatePetMock) },
    { pattern: createRouteRegex('/pets/:id'), method: 'DELETE', handler: adaptHandler(deletePetMock) },

    // Auth
    { pattern: createRouteRegex('/verification/code'), method: 'POST', handler: adaptHandler(sendCodeMock) },
    { pattern: createRouteRegex('/users/register'), method: 'POST', handler: adaptHandler(registerMock) },
    { pattern: createRouteRegex('/auth/login'), method: 'POST', handler: adaptHandler(loginMock) },
    { pattern: createRouteRegex('/auth/guest'), method: 'POST', handler: adaptHandler(guestMock) },
    { pattern: createRouteRegex('/auth/upgrade'), method: 'POST', handler: adaptHandler(upgradeMock) },
    { pattern: createRouteRegex('/auth/refresh'), method: 'POST', handler: adaptHandler(refreshTokenMock) },

    // User profile
    { pattern: createRouteRegex('/users/me'), method: 'GET', handler: adaptHandler(getProfileMock) },
    { pattern: createRouteRegex('/users/profile'), method: 'PUT', handler: adaptHandler(updateProfileMock) },
    { pattern: createRouteRegex('/users/vip-status'), method: 'GET', handler: adaptHandler(getVipStatusMock) },
    { pattern: createRouteRegex('/users/account'), method: 'DELETE', handler: adaptHandler(deleteAccountMock) },

    // Health Report
    { pattern: createRouteRegex('/health/reports/generate'), method: 'POST', handler: adaptHandler(generateReportMock) },

    // Insights
    { pattern: createRouteRegex('/insights/trend'), method: 'GET', handler: adaptHandler(getTrendInsightMock) },
    { pattern: createRouteRegex('/insights/:id'), method: 'GET', handler: adaptHandler(getInsightMock) },

    // Notifications
    { pattern: createRouteRegex('/notifications/:id/read'), method: 'PUT', handler: adaptHandler(markReadMock) },
    { pattern: createRouteRegex('/notifications/read-all'), method: 'PUT', handler: adaptHandler(markAllReadMock) },
    { pattern: createRouteRegex('/notifications/preferences'), method: 'POST', handler: adaptHandler(updatePreferenceMock) },
    { pattern: createRouteRegex('/notifications/preferences/bulk'), method: 'POST', handler: adaptHandler(syncAllPreferencesMock) },

    // Sync
    { pattern: createRouteRegex('/sync'), method: 'GET', handler: adaptHandler(syncMock) },
    { pattern: createRouteRegex('/sync'), method: 'POST', handler: adaptHandler(syncMock) },
]

/**
 * Find matching mock handler for given URL and method
 */
const findMockHandler = (url: string, method: string): MockHandler | null => {
    const normalizedMethod = method.toUpperCase()

    for (const route of mockRoutes) {
        if (route.pattern.test(url) && route.method === normalizedMethod) {
            return route.handler
        }
    }
    return null
}

/**
 * Handle a mock request - returns mock data or throws if no handler found
 */
export const handleMockRequest = async <T>(config: RequestConfig<T>): Promise<T> => {
    const method = (config.method || 'GET').toUpperCase()

    // Extract path from full URL if needed (remove base URL)
    let url = config.url
    if (url.startsWith('http')) {
        try {
            const urlObj = new URL(url)
            url = urlObj.pathname
        } catch {
            // If URL parsing fails, use as-is
        }
    }

    console.log(`[MockRegistry] Looking for handler: ${method} ${url}`)

    const handler = findMockHandler(url, method)

    if (!handler) {
        console.warn(`[MockRegistry] No mock handler for: ${method} ${url}`)
        console.log(`[MockRegistry] Available routes:`, mockRoutes.map(r => `${r.method} ${r.pattern}`))
        // Return empty response instead of throwing to prevent app crashes
        return {} as T
    }

    console.log(`[MockRegistry] Handling: ${method} ${url}`)

    // Create mock config matching handler expectations
    const mockConfig: MockRequestConfig = {
        url,
        method,
        data: config.data,
        header: config.header,
        params: {}
    }

    // Simulate async behavior like real network call
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
        const result = handler(mockConfig)
        return result as T
    } catch (error) {
        console.error(`[MockRegistry] Handler error for ${method} ${url}:`, error)
        throw error
    }
}

/**
 * Handle refresh token mock - special case for refreshAuthToken function
 */
export const handleMockRefreshToken = async (): Promise<{
    accessToken: string
    expiresIn: number
    refreshToken: string
}> => {
    const mockConfig: MockRequestConfig = {
        url: '/auth/refresh',
        method: 'POST',
        data: { refreshToken: 'mock-refresh-token' }
    }

    await new Promise(resolve => setTimeout(resolve, 50))

    return refreshTokenMock(mockConfig as any)
}
