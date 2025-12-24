/**
 * Environment Variable Schema
 * 
 * Defines validation rules for all environment variables.
 * Used by both runtime (src/env/index.ts) and build-time (scripts/check-env.mjs) validation.
 */

export type EnvMode = 'development' | 'production'
export type AuthBootstrapMode = 'guest' | 'login' | 'none'

export interface EnvSchema {
    MODE: EnvMode
    VITE_API_BASE_URL: string
    VITE_API_BASE_URL_MP: string
    VITE_AUTH_BOOTSTRAP: AuthBootstrapMode
    VITE_MOCK: boolean
    VITE_DEV_BYPASS_AUTH: boolean
    VITE_ENABLE_PERF_MONITOR: boolean
    VITE_PERF_REPORT_URL: string
    VITE_ALLOW_LOCALHOST_PROD: boolean
}

export interface ValidationResult<T> {
    success: boolean
    data?: T
    errors?: string[]
}

// URL Validation Helpers
export function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url)
}

export function isRelativeApiPath(url: string): boolean {
    return url === '/api'
}

export function endsWithApi(url: string): boolean {
    return url.toLowerCase().endsWith('/api')
}

// String to Boolean Parser
export function parseBoolean(value: string | boolean | undefined, defaultValue: boolean): boolean {
    if (value === true) return true
    if (value === false) return false
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        return normalized === 'true' || normalized === '1' || normalized === 'on'
    }
    return defaultValue
}

// Main Validation Function
export function validateEnvSchema(rawEnv: Record<string, any>): ValidationResult<EnvSchema> {
    const errors: string[] = []

    // 1. MODE validation
    const mode = rawEnv.MODE as string
    if (!mode) {
        errors.push('MODE is required')
    } else if (mode !== 'development' && mode !== 'production') {
        errors.push(`MODE must be "development" or "production", got: "${mode}"`)
    }
    const isProd = mode === 'production'

    // 2. VITE_API_BASE_URL validation
    const apiBaseUrl = rawEnv.VITE_API_BASE_URL as string
    const allowLocalhostProd = parseBoolean(rawEnv.VITE_ALLOW_LOCALHOST_PROD, false)

    if (!apiBaseUrl) {
        if (isProd) {
            errors.push('VITE_API_BASE_URL is required in production mode')
        }
        // In development, it's allowed to be missing (will use fallback)
    } else {
        const normalized = apiBaseUrl.replace(/\/+$/, '') // Remove trailing slashes

        if (isProd) {
            // Production: must be absolute URL
            if (!isAbsoluteUrl(normalized)) {
                errors.push(`VITE_API_BASE_URL must be an absolute URL (https://...) in production mode, got: "${normalized}"`)
            }

            // Reject localhost in production (unless explicitly allowed)
            if (/localhost|127\.0\.0\.1/i.test(normalized) && !allowLocalhostProd) {
                errors.push(`VITE_API_BASE_URL cannot be localhost in production mode: "${normalized}". Set VITE_ALLOW_LOCALHOST_PROD=true to override.`)
            }
        }

        // Always warn if doesn't end with /api
        if (!endsWithApi(normalized)) {
            errors.push(`VITE_API_BASE_URL should end with /api, got: "${normalized}"`)
        }
    }

    // 3. VITE_API_BASE_URL_MP validation
    const apiBaseUrlMp = rawEnv.VITE_API_BASE_URL_MP as string

    if (apiBaseUrlMp) {
        const normalized = apiBaseUrlMp.replace(/\/+$/, '')

        // Mini Program URL must always be absolute
        if (!isAbsoluteUrl(normalized)) {
            errors.push(`VITE_API_BASE_URL_MP must be an absolute URL (https://...), got: "${normalized}"`)
        }

        // Should end with /api
        if (!endsWithApi(normalized)) {
            errors.push(`VITE_API_BASE_URL_MP should end with /api, got: "${normalized}"`)
        }
    }
    // Note: VITE_API_BASE_URL_MP is optional (only needed for Mini Program builds)

    // 4. VITE_AUTH_BOOTSTRAP validation
    const authBootstrap = (rawEnv.VITE_AUTH_BOOTSTRAP || 'login') as string
    const validBootstrapModes = ['guest', 'login', 'none']
    if (!validBootstrapModes.includes(authBootstrap)) {
        errors.push(`VITE_AUTH_BOOTSTRAP must be one of: ${validBootstrapModes.join(', ')}, got: "${authBootstrap}"`)
    }

    // If there are errors, return early
    if (errors.length > 0) {
        return { success: false, errors }
    }

    // Build validated schema object
    const validatedEnv: EnvSchema = {
        MODE: mode as EnvMode,
        VITE_API_BASE_URL: apiBaseUrl || '/api', // Fallback for dev
        VITE_API_BASE_URL_MP: apiBaseUrlMp || '',
        VITE_AUTH_BOOTSTRAP: authBootstrap as AuthBootstrapMode,
        VITE_MOCK: parseBoolean(rawEnv.VITE_MOCK, false),
        VITE_DEV_BYPASS_AUTH: parseBoolean(rawEnv.VITE_DEV_BYPASS_AUTH, false),
        VITE_ENABLE_PERF_MONITOR: parseBoolean(rawEnv.VITE_ENABLE_PERF_MONITOR, true),
        VITE_PERF_REPORT_URL: (rawEnv.VITE_PERF_REPORT_URL as string) || '',
        VITE_ALLOW_LOCALHOST_PROD: allowLocalhostProd,
    }

    return { success: true, data: validatedEnv }
}
