/**
 * APP Configuration
 * 
 * Design Principle (SSOT - Single Source of Truth):
 * - .env provides values (no validation, no fallback)
 * - config validates / normalizes / throws errors via resolveApiBaseURL()
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

import { resolveApiBaseURL, type Platform } from '../config/resolveApiBaseURL';

// Helper to parse boolean env values safely
const getEnvBool = (key: string): boolean => {
    const val = import.meta.env[key];
    if (val === true) return true;
    if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'on';
    }
    return false;
};

// Detect platform using conditional compilation (compile-time reliable)
let platform: Platform = 'H5';
// #ifdef MP
platform = 'MP';
// #endif

// Resolve API Base URL using centralized resolver
const { apiBaseUrl, warnings } = resolveApiBaseURL({
    platform,
    mode: import.meta.env.MODE as 'development' | 'production',
    rawApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    rawApiBaseUrlMp: import.meta.env.VITE_API_BASE_URL_MP,
    allowLocalhostProd: import.meta.env.VITE_ALLOW_LOCALHOST_PROD === 'true',
});

// Log warnings from resolver
warnings.forEach((warning) => console.warn(warning));

export const RUN_MODE = import.meta.env.MODE;
export const API_BASE_URL = apiBaseUrl;
export const USE_MOCK = getEnvBool('VITE_MOCK');
export const IS_MOCK_MODE = USE_MOCK; // Alias for backward compatibility
export const IS_DEV_MODE = import.meta.env.DEV;
export const ENABLE_PERFORMANCE_MONITOR = import.meta.env.VITE_ENABLE_PERF_MONITOR !== 'false';
export const PERFORMANCE_REPORT_URL = import.meta.env.VITE_PERF_REPORT_URL || '';

// Auth Bootstrap Strategy: guest | login | none
// - guest: Auto guest login when no token (useful for dev/test)
// - login: Redirect to login page when no token (production default)
// - none: Do nothing when no token (for embedded scenarios)
export const AUTH_BOOTSTRAP_MODE = (import.meta.env.VITE_AUTH_BOOTSTRAP || 'login') as 'guest' | 'login' | 'none';

// Dev Auth Bypass: Skip permission checks in dev mode
// Default: false (dev should behave like prod by default)
export const DEV_BYPASS_AUTH = getEnvBool('VITE_DEV_BYPASS_AUTH');

export const APP_CONFIG = Object.freeze({
    RUN_MODE,
    API_BASE_URL,
    TIMEOUT: 10000,
    USE_MOCK,
    ENABLE_PERFORMANCE_MONITOR,
    PERFORMANCE_REPORT_URL,
});

// Enhanced startup logging with platform and mode information
const modeLabel = import.meta.env.DEV ? 'Dev' : 'Prod';
console.log(
    `[APP_CONFIG] 🚀 Platform: ${platform} | Mode: ${modeLabel} | ` +
    `Mock: ${USE_MOCK ? 'ON' : 'OFF'} | Bootstrap: ${AUTH_BOOTSTRAP_MODE} | ` +
    `API: ${API_BASE_URL}`
);

if (import.meta.env.DEV) {
    console.log('[APP_CONFIG] Full Config:', {
        PLATFORM: platform,
        RUN_MODE,
        API_BASE_URL,
        USE_MOCK,
        AUTH_BOOTSTRAP_MODE,
        DEV_BYPASS_AUTH,
    });
}
