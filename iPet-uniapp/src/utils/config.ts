/**
 * APP Configuration
 * 
 * Design Principle (SSOT - Single Source of Truth):
 * - .env provides values (no validation, no fallback)
 * - config validates / normalizes / throws errors
 * - business code only uses config
 */

// ⚠️ DEV-only fallback - never auto-used in production
const DEV_FALLBACK_API = 'http://192.168.31.167:3000/api';

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

export const APP_CONFIG = {
    API_BASE_URL: resolveApiBaseUrl(),
    TIMEOUT: 10000,
    USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
    // 性能监控配置
    ENABLE_PERFORMANCE_MONITOR: import.meta.env.VITE_ENABLE_PERF_MONITOR !== 'false',
    PERFORMANCE_REPORT_URL: import.meta.env.VITE_PERF_REPORT_URL || '',
};

// Log config on startup (DEV only)
if (import.meta.env.DEV) {
    console.log('[APP_CONFIG] Loaded:', {
        API_BASE_URL: APP_CONFIG.API_BASE_URL,
        USE_MOCK: APP_CONFIG.USE_MOCK,
    });
}
