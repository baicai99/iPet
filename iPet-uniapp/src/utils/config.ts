/**
 * APP Configuration
 * 
 * Design Principle (SSOT - Single Source of Truth):
 * - .env provides values (no validation, no fallback)
 * - config validates / normalizes / throws errors
 * - business code only uses config
 *
 * Mock Mode Rule:
 * - mp-weixin: envVersion=release => off; develop/trial => on
 * - other platforms: mode=production => off; otherwise => on
 */

// ⚠️ DEV-only fallback - never auto-used in production
const DEV_FALLBACK_API = 'http://192.168.31.167:3000/api';

declare const wx: any

export type WeChatEnvVersion = 'develop' | 'trial' | 'release' | 'unknown'

const normalizeBaseUrl = (url: string): string => {
    return url.replace(/\/$/, '');
};

const resolveWeChatEnvVersion = (): WeChatEnvVersion => {
    try {
        const wxAny = typeof wx !== 'undefined' ? (wx as any) : null
        const uniAny = typeof uni !== 'undefined' ? (uni as any) : null

        const info = uniAny?.getAccountInfoSync?.() || wxAny?.getAccountInfoSync?.()
        const envVersion = info?.miniProgram?.envVersion

        if (envVersion === 'develop' || envVersion === 'trial' || envVersion === 'release') {
            return envVersion
        }
    } catch {
        // ignore
    }
    return 'unknown'
}

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

export const API_BASE_URL = resolveApiBaseUrl()
export const RUN_MODE = import.meta.env.MODE
export const USE_MOCK = RUN_MODE !== 'production'
export const WECHAT_ENV_VERSION = resolveWeChatEnvVersion()
export const USE_PREVIEW_MOCK = WECHAT_ENV_VERSION === 'develop' || WECHAT_ENV_VERSION === 'trial'
export const FORCE_ENABLE_MOCK = import.meta.env.VITE_FORCE_ENABLE_MOCK === 'true'
export const IS_MOCK_MODE = USE_MOCK || USE_PREVIEW_MOCK || FORCE_ENABLE_MOCK
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

// Log config on startup (DEV only)
if (import.meta.env.DEV) {
    console.log('[APP_CONFIG] Loaded:', {
        RUN_MODE,
        API_BASE_URL,
        USE_MOCK,
    });
}
