/**
 * Mock Registry - Runtime mock interceptor for UniApp
 * 
 * This module provides a runtime mock handler that intercepts requests
 * when mock mode is enabled, completely bypassing network calls.
 * 
 * NOTE: Static imports are used instead of dynamic imports because WeChat mini-program
 * doesn't support dynamic imports in subpackage scenarios. The imports are conditionally
 * included only in non-production builds via Vite's tree-shaking.
 */

import type { RequestConfig } from './request'

// Static imports for mock handlers (only in non-production builds)
// These will be tree-shaken out in production builds
// Using synchronous imports because WeChat mini-program doesn't support dynamic imports
import * as metricHandlersModule from '@mock/handlers/metricHandlers'
import * as petHandlersModule from '@mock/handlers/petHandlers'
import * as authHandlersModule from '@mock/handlers/authHandlers'
import * as userHandlersModule from '@mock/handlers/userHandlers'
import * as healthReportHandlersModule from '@mock/handlers/healthReportHandlers'
import * as insightHandlersModule from '@mock/handlers/insightHandlers'
import * as notificationHandlersModule from '@mock/handlers/notificationHandlers'
import * as syncHandlersModule from '@mock/handlers/syncHandlers'

export interface MockRequestConfig {
    url: string
    method?: string  // Use string to be more flexible
    data?: any
    header?: Record<string, any>
    params?: Record<string, any>
}

type MockHandler = (config: MockRequestConfig) => any

interface MockRoute {
    pattern: RegExp
    method: string
    handlerName: string  // Changed from handler to handlerName
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

/**
 * Mock route registry
 * Stores route patterns and handler names (not handlers directly)
 */
const mockRoutes: MockRoute[] = [
    // Health Records (main data endpoints)
    { pattern: createRouteRegex('/health'), method: 'GET', handlerName: 'getHealthRecordsMock' },
    { pattern: createRouteRegex('/health'), method: 'POST', handlerName: 'createHealthRecordMock' },
    { pattern: createRouteRegex('/health/:id'), method: 'PATCH', handlerName: 'updateHealthRecordMock' },
    { pattern: createRouteRegex('/health/:id'), method: 'DELETE', handlerName: 'deleteHealthRecordMock' },
    { pattern: createRouteRegex('/health/summary'), method: 'GET', handlerName: 'getHealthSummaryMock' },
    { pattern: createRouteRegex('/health/series'), method: 'GET', handlerName: 'getHealthSeriesMock' },

    // Metrics (legacy/chart endpoints)
    { pattern: createRouteRegex('/metrics/:id/history'), method: 'GET', handlerName: 'getMetricHistoryMock' },
    { pattern: createRouteRegex('/metrics/:id/series'), method: 'GET', handlerName: 'getMetricSeriesMock' },

    // Pets
    { pattern: createRouteRegex('/pets'), method: 'GET', handlerName: 'getPetsMock' },
    { pattern: createRouteRegex('/pets'), method: 'POST', handlerName: 'createPetMock' },
    { pattern: createRouteRegex('/pets/:id'), method: 'PATCH', handlerName: 'updatePetMock' },
    { pattern: createRouteRegex('/pets/:id'), method: 'DELETE', handlerName: 'deletePetMock' },

    // Auth
    { pattern: createRouteRegex('/verification/code'), method: 'POST', handlerName: 'sendCodeMock' },
    { pattern: createRouteRegex('/users/register'), method: 'POST', handlerName: 'registerMock' },
    { pattern: createRouteRegex('/auth/login'), method: 'POST', handlerName: 'loginMock' },
    { pattern: createRouteRegex('/auth/guest'), method: 'POST', handlerName: 'guestMock' },
    { pattern: createRouteRegex('/auth/upgrade'), method: 'POST', handlerName: 'upgradeMock' },
    { pattern: createRouteRegex('/auth/refresh'), method: 'POST', handlerName: 'refreshTokenMock' },

    // User profile
    { pattern: createRouteRegex('/users/me'), method: 'GET', handlerName: 'getProfileMock' },
    { pattern: createRouteRegex('/users/profile'), method: 'PUT', handlerName: 'updateProfileMock' },
    { pattern: createRouteRegex('/users/vip-status'), method: 'GET', handlerName: 'getVipStatusMock' },
    { pattern: createRouteRegex('/users/account'), method: 'DELETE', handlerName: 'deleteAccountMock' },

    // Health Report
    { pattern: createRouteRegex('/health/reports/generate'), method: 'POST', handlerName: 'generateReportMock' },

    // Insights
    { pattern: createRouteRegex('/insights/trend'), method: 'GET', handlerName: 'getTrendInsightMock' },
    { pattern: createRouteRegex('/insights/:id'), method: 'GET', handlerName: 'getInsightMock' },

    // Notifications
    { pattern: createRouteRegex('/notifications/:id/read'), method: 'PUT', handlerName: 'markReadMock' },
    { pattern: createRouteRegex('/notifications/read-all'), method: 'PUT', handlerName: 'markAllReadMock' },
    { pattern: createRouteRegex('/notifications/preferences'), method: 'POST', handlerName: 'updatePreferenceMock' },
    { pattern: createRouteRegex('/notifications/preferences/bulk'), method: 'POST', handlerName: 'syncAllPreferencesMock' },

    // Sync
    { pattern: createRouteRegex('/sync'), method: 'GET', handlerName: 'syncMock' },
    { pattern: createRouteRegex('/sync'), method: 'POST', handlerName: 'syncMock' },
]

/**
 * Get mock handler by name
 * Uses statically imported modules for WeChat mini-program compatibility
 */
const loadMockHandler = (handlerName: string): MockHandler => {
    switch (handlerName) {
        // Metric handlers
        case 'getMetricHistoryMock':
        case 'getMetricSeriesMock':
        case 'getHealthRecordsMock':
        case 'createHealthRecordMock':
        case 'updateHealthRecordMock':
        case 'deleteHealthRecordMock':
        case 'getHealthSummaryMock':
        case 'getHealthSeriesMock':
            return metricHandlersModule[handlerName] as MockHandler

        // Pet handlers
        case 'getPetsMock':
        case 'createPetMock':
        case 'updatePetMock':
        case 'deletePetMock':
            return petHandlersModule[handlerName] as MockHandler

        // Auth handlers
        case 'sendCodeMock':
        case 'registerMock':
        case 'loginMock':
        case 'refreshTokenMock':
        case 'guestMock':
        case 'upgradeMock':
            return authHandlersModule[handlerName] as MockHandler

        // User handlers
        case 'updateProfileMock':
        case 'getProfileMock':
        case 'getVipStatusMock':
        case 'deleteAccountMock':
            return userHandlersModule[handlerName] as MockHandler

        // Health Report handlers
        case 'generateReportMock':
            return healthReportHandlersModule[handlerName] as MockHandler

        // Insight handlers
        case 'getTrendInsightMock':
        case 'getInsightMock':
            return insightHandlersModule[handlerName] as MockHandler

        // Notification handlers
        case 'markReadMock':
        case 'markAllReadMock':
        case 'updatePreferenceMock':
        case 'syncAllPreferencesMock':
            return notificationHandlersModule[handlerName] as MockHandler

        // Sync handlers
        case 'syncMock':
            return syncHandlersModule[handlerName] as MockHandler

        default:
            throw new Error(`Unknown mock handler: ${handlerName}`)
    }
}

/**
 * Find matching mock route for given URL and method
 */
const findMockRoute = (url: string, method: string): MockRoute | null => {
    const normalizedMethod = method.toUpperCase()

    for (const route of mockRoutes) {
        if (route.pattern.test(url) && route.method === normalizedMethod) {
            return route
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

    const route = findMockRoute(url, method)

    if (!route) {
        console.warn(`[MockRegistry] No mock handler for: ${method} ${url}`)
        console.log(`[MockRegistry] Available routes:`, mockRoutes.map(r => `${r.method} ${r.pattern}`))
        // Return empty response instead of throwing to prevent app crashes
        return {} as T
    }

    console.log(`[MockRegistry] Handling: ${method} ${url} with ${route.handlerName}`)

    // Create mock config matching handler expectations
    const mockConfig: MockRequestConfig = {
        url,
        method: method,
        data: config.data,
        header: config.header,
        params: {}
    }

    // Simulate async behavior like real network call
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
        // Get handler from statically imported modules
        const handler = loadMockHandler(route.handlerName)
        // Use type assertion since mock handlers accept RequestConfig but we're passing MockRequestConfig
        const result = handler(mockConfig as any)
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

    // Use statically imported auth handlers
    return authHandlersModule.refreshTokenMock(mockConfig as any)
}
