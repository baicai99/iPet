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
import type { MockDefinition } from '@mock/types/common'

// Special error to signal that request.ts should fallback to real network
export class MockFallthroughError extends Error {
    constructor() {
        super('Mock handler not found - falling through to network')
        this.name = 'MockFallthroughError'
    }
}

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
    method?: string
    data?: any
    header?: Record<string, any>
    params?: Record<string, any>
}

// Handler types
type LegacyMockHandler = (config: MockRequestConfig) => any
type MockHandler = LegacyMockHandler | MockDefinition

interface MockRoute {
    pattern: RegExp
    method: string
    handler: MockHandler // Direct reference to handler or definition
    handlerName: string  // For debugging
    keys: string[] // Parameter names
    score: number  // Specificity score
}

/**
 * Parse route pattern to generate Regex, Keys, and Score
 */
const parseRoute = (pattern: string) => {
    const keys: string[] = []
    let score = 0

    // Normalize pattern
    const validPattern = pattern.startsWith('/') ? pattern : '/' + pattern

    // Split into segments for scoring
    const segments = validPattern.split('/').filter(Boolean)

    // Build Regex and Score
    // Static segment: 100 points
    // Dynamic segment: 10 points
    // Wildcard: 1 point
    segments.forEach(seg => {
        if (seg.startsWith(':')) {
            score += 10
            keys.push(seg.slice(1))
        } else if (seg === '*') {
            score += 1
        } else {
            score += 100
        }
    })

    // Regex generation
    // '/pets/:id' -> /^\/pets\/([^/]+)$/
    const regexString = '^' + validPattern
        .replace(/\//g, '\\/')
        .replace(/:([^/]+)/g, () => {
            return '([^/]+)'
        }) + '$'

    return {
        pattern: new RegExp(regexString),
        keys,
        score
    }
}

// Helper to check if an export is a MockDefinition
const isMockDefinition = (item: any): item is MockDefinition => {
    return item && typeof item === 'object' && 'url' in item && 'method' in item && 'handler' in item
}

// Auto-discovery of routes from modules
const discoverRoutes = (module: any, moduleName: string): MockRoute[] => {
    const routes: MockRoute[] = []

    Object.keys(module).forEach(key => {
        const exportItem = module[key]
        if (isMockDefinition(exportItem)) {
            const { pattern, keys, score } = parseRoute(exportItem.url)
            routes.push({
                pattern,
                method: exportItem.method.toUpperCase(),
                handler: exportItem,
                handlerName: `${moduleName}.${key}`,
                keys,
                score
            })
        }
    })

    return routes
}

// Auto-discovered routes from refactored modules
const autoRoutes: MockRoute[] = [
    ...discoverRoutes(metricHandlersModule, 'metricHandlers'),
    ...discoverRoutes(petHandlersModule, 'petHandlers'),
    ...discoverRoutes(authHandlersModule, 'authHandlers'),
    ...discoverRoutes(userHandlersModule, 'userHandlers'),
    ...discoverRoutes(healthReportHandlersModule, 'healthReportHandlers'),
    ...discoverRoutes(insightHandlersModule, 'insightHandlers'),
    ...discoverRoutes(notificationHandlersModule, 'notificationHandlers'),
    ...discoverRoutes(syncHandlersModule, 'syncHandlers')
]

// Determine all routes, sorted by specificity (highest score first)
const allRoutes: MockRoute[] = autoRoutes.sort((a, b) => b.score - a.score)

/**
 * Match URL against routes and extract params
 */
const matchRoute = (url: string, method: string) => {
    const normalizedMethod = method.toUpperCase()

    for (const route of allRoutes) {
        if (route.method !== normalizedMethod) continue

        const match = route.pattern.exec(url)
        if (match) {
            // Extract params
            const params: Record<string, string> = {}
            route.keys.forEach((key, index) => {
                params[key] = match[index + 1]
            })

            return {
                route,
                params
            }
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

    const matchResult = matchRoute(url, method)

    if (!matchResult) {
        const msg = `[MockRegistry] No mock handler for: ${method} ${url}`
        console.warn(msg)

        console.error(`[MockRegistry] No mock handler found for ${method} ${url}.`)
        console.log(`[MockRegistry] Available routes:`, allRoutes.map(r => `${r.method} ${r.pattern}`))
        throw new MockFallthroughError()
    }

    const { route, params } = matchResult
    console.log(`[MockRegistry] Handling: ${method} ${url} with ${route.handlerName}`)

    // Create mock config matching handler expectations
    const mockConfig: MockRequestConfig = {
        url,
        method: method,
        data: config.data,
        header: config.header,
        params: params // Injected path params
    }

    // Simulate async behavior like real network call
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
        let result: any
        if (isMockDefinition(route.handler)) {
            // New MockDefinition object
            result = route.handler.handler(mockConfig as any)
        } else {
            // Legacy functional handler
            result = route.handler(mockConfig)
        }

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
    return authHandlersModule.refreshTokenMock.handler(mockConfig as any)
}
