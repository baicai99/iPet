/**
 * APP Configuration
 * 
 * Design Principle (SSOT - Single Source of Truth):
 * - .env provides values (no validation, no fallback)
 * - config validates / normalizes / throws errors
 * - business code only uses config
 *
 * API URL Strategy (SSOT):
 * - BASE_URL must end with /api (no trailing slash)
 * - Service layer uses pure business paths (e.g., /auth/login, /users/profile)
 * - Final URL = BASE_URL + path
 *
 * Mock Mode Rule:
 * - Mock is enabled exclusively via VITE_MOCK (truthy values like true/1/on)
 * - All other environments default to Real API
 */

// ⚠️ DEV-only fallback - 使用相对路径让 Vite 代理处理
const DEV_FALLBACK_API = '/api';

/**
 * Normalize and validate API base URL
 * - Strip trailing slashes
 * - Ensure ends with /api
 * - Prod: reject localhost, require absolute URL
 */
const normalizeBaseUrl = (url: string): string => {
    // Remove trailing slashes
    return url.replace(/\/+$/, '');
};

const validateApiSuffix = (url: string): void => {
    // Check if URL ends with /api (case-insensitive check, but preserve original)
    if (!url.toLowerCase().endsWith('/api')) {
        console.warn(
            `[APP_CONFIG] ⚠️ API base URL should end with /api: "${url}". ` +
            'This may cause path inconsistencies.'
        );
    }
};

const resolveApiBaseUrl = (): string => {
    const raw = import.meta.env.VITE_API_BASE_URL;
    const rawMp = import.meta.env.VITE_API_BASE_URL_MP;
    const isProd = !import.meta.env.DEV;
    const allowLocalhostProd = import.meta.env.VITE_ALLOW_LOCALHOST_PROD === 'true';

    // Platform detection using conditional compilation (compile-time reliable)
    let isMP = false;
    // #ifdef MP
    isMP = true;
    // #endif

    // Helper to check if URL is relative
    const isRelative = (url: string) => !/^https?:\/\//i.test(url);

    // Case 0: Mini Program specific override
    if (isMP && rawMp) {
        const normalizedMp = normalizeBaseUrl(rawMp);
        if (isRelative(normalizedMp)) {
            console.error(`[APP_CONFIG] ❌ Mini Program base URL MUST be absolute: "${normalizedMp}"`);
        } else {
            validateApiSuffix(normalizedMp);
            return normalizedMp;
        }
    }

    // Case 1: env not provided
    if (!raw) {
        if (isProd) {
            throw new Error(
                '[APP_CONFIG] ❌ Prod 环境必须配置 VITE_API_BASE_URL。' +
                '请检查 .env.production 或 CI/CD 配置。'
            );
        }

        if (isMP) {
            console.error('[APP_CONFIG] ❌ Mini Program environment detected but VITE_API_BASE_URL_MP is not set.');
        }

        console.warn(
            '[APP_CONFIG] ⚠️ VITE_API_BASE_URL not set, using DEV fallback:',
            DEV_FALLBACK_API
        );
        return DEV_FALLBACK_API;
    }

    const normalized = normalizeBaseUrl(raw);

    // Case 2: Prod-specific validations
    if (isProd) {
        // Must be absolute URL
        if (isRelative(normalized)) {
            throw new Error(
                `[APP_CONFIG] ❌ Prod 环境禁止使用相对路径: "${normalized}". ` +
                '请配置完整的 https:// URL。'
            );
        }

        // Reject localhost/127.0.0.1 (unless explicitly allowed)
        if (/localhost|127\.0\.0\.1/i.test(normalized) && !allowLocalhostProd) {
            throw new Error(
                `[APP_CONFIG] ❌ Prod 环境禁止使用 localhost: "${normalized}". ` +
                '如需本地调试 Prod 构建，请设置 VITE_ALLOW_LOCALHOST_PROD=true。'
            );
        }
    }

    // Case 3: relative path (e.g., /api) - allowed in development for Vite proxy
    if (isRelative(normalized)) {
        if (isMP) {
            console.error(
                `[APP_CONFIG] ❌ Mini Program 不支持相对路径: "${normalized}". ` +
                '请配置 VITE_API_BASE_URL_MP 为绝对路径以避免 "invalid url" 错误。'
            );
        }
        validateApiSuffix(normalized);
        return normalized;
    }

    // Case 4: absolute URL - must have valid format
    validateApiSuffix(normalized);
    return normalized;
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

// Auth Bootstrap Strategy: guest | login | none
// - guest: Auto guest login when no token (useful for dev/test)
// - login: Redirect to login page when no token (production default)
// - none: Do nothing when no token (for embedded scenarios)
export const AUTH_BOOTSTRAP_MODE = (import.meta.env.VITE_AUTH_BOOTSTRAP || 'login') as 'guest' | 'login' | 'none'

// Dev Auth Bypass: Skip permission checks in dev mode
// Default: false (dev should behave like prod by default)
export const DEV_BYPASS_AUTH = getEnvBool('VITE_DEV_BYPASS_AUTH')

export const APP_CONFIG = Object.freeze({
    RUN_MODE,
    API_BASE_URL,
    TIMEOUT: 10000,
    USE_MOCK,
    ENABLE_PERFORMANCE_MONITOR,
    PERFORMANCE_REPORT_URL,
})

// Log config on startup
console.log(`[APP_CONFIG] 🛠️ Mock: ${USE_MOCK ? 'ON' : 'OFF'} | Bootstrap: ${AUTH_BOOTSTRAP_MODE} | API: ${API_BASE_URL}`)

if (import.meta.env.DEV) {
    console.log('[APP_CONFIG] Full Config:', {
        RUN_MODE,
        API_BASE_URL,
        USE_MOCK,
        AUTH_BOOTSTRAP_MODE,
        DEV_BYPASS_AUTH,
    });
}
