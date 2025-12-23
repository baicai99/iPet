/**
 * APP Configuration
 * 
 * Design Principle (SSOT - Single Source of Truth):
 * - .env provides values (no validation, no fallback)
 * - config validates / normalizes / throws errors
 * - business code only uses config
 *
 * Mock Mode Rule:
 * - Mock is enabled exclusively via VITE_MOCK (truthy values like true/1/on)
 * - All other environments default to Real API so mock code paths cannot run unless explicitly requested
 * - The flag is logged at startup to trace the active data source
 */

// ⚠️ DEV-only fallback - never auto-used in production
// Default to the reachable preview/production API so local dev works without special network routes.
const DEV_FALLBACK_API = 'https://api.zhengjiyuan.top/api';

const normalizeBaseUrl = (url: string): string => {
    return url.replace(/\/$/, '');
};

const resolveApiBaseUrl = (): string => {
    const raw = import.meta.env.VITE_API_BASE_URL;

    // Case 1: env not provided
    if (!raw) {
        if (import.meta.env.DEV) {
            console.warn(
                '[APP_CONFIG] ⚠️ VITE_API_BASE_URL not set, using DEV fallback:',
                DEV_FALLBACK_API
            );
            return DEV_FALLBACK_API;
        }
        throw new Error(
            '[APP_CONFIG] Missing required env: VITE_API_BASE_URL. ' +
            'Please check your .env file or CI/CD configuration.'
        );
    }

    // Case 2: env provided but invalid format
    if (!/^https?:\/\//.test(raw)) {
        throw new Error(
            `[APP_CONFIG] Invalid API base url format: "${raw}". ` +
            'Must start with http:// or https://'
        );
    }

    return normalizeBaseUrl(raw);
};

// Helper to parse boolean env values safely
const getEnvBool = (key: string): boolean => {
    const val = import.meta.env[key]
    if (val === true) return true
    if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase()
        return normalized === 'true' || normalized === '1' || normalized === 'on'
    }
    return false
}

export const RUN_MODE = import.meta.env.MODE
const MOCK_FLAG_KEY = 'VITE_MOCK'
const mockFlagRaw = import.meta.env[MOCK_FLAG_KEY]
const formatEnvValue = (value: unknown): string => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return 'unset'
    }
    return String(value)
}
const mockFlagLabel = formatEnvValue(mockFlagRaw)

export const API_BASE_URL = resolveApiBaseUrl()
export const USE_MOCK = getEnvBool(MOCK_FLAG_KEY)
export const IS_MOCK_MODE = USE_MOCK // Alias for backward compatibility
export const IS_DEV_MODE = import.meta.env.DEV
export const ENABLE_PERFORMANCE_MONITOR = import.meta.env.VITE_ENABLE_PERF_MONITOR !== 'false'
export const PERFORMANCE_REPORT_URL = import.meta.env.VITE_PERF_REPORT_URL || ''

export const APP_CONFIG = Object.freeze({
    RUN_MODE,
    API_BASE_URL,
    TIMEOUT: 10000,
    USE_MOCK,
    ENABLE_PERFORMANCE_MONITOR,
    PERFORMANCE_REPORT_URL,
})

// Log config on startup
console.log(`[APP_CONFIG] 🛠️ Mock Status: ${USE_MOCK ? 'ENABLED' : 'DISABLED'} (VITE_MOCK=${mockFlagLabel})`)
console.log(`[APP_CONFIG] 🧭 当前数据源: ${USE_MOCK ? 'Mock' : 'Real'} (VITE_MOCK=${mockFlagLabel})`)

if (import.meta.env.DEV) {
    console.log('[APP_CONFIG] Loaded:', {
        RUN_MODE,
        API_BASE_URL,
        USE_MOCK,
    });
}
