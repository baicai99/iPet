/**
 * Config Module Public API
 * 
 * Single point of entry for all configuration-related functionality.
 * Provides runtime config (APP_CONFIG) and resolver types for testing/logging.
 */

// Re-export runtime configuration from utils/config.ts
export {
    APP_CONFIG,
    API_BASE_URL,
    RUN_MODE,
    USE_MOCK,
    IS_MOCK_MODE,
    IS_DEV_MODE,
    AUTH_BOOTSTRAP_MODE,
    DEV_BYPASS_AUTH,
    ENABLE_PERFORMANCE_MONITOR,
    PERFORMANCE_REPORT_URL,
} from '../utils/config';

// Re-export resolver types and function (for testing/logging/documentation)
export type { Platform, Mode, ResolveContext, ResolveResult } from './resolveApiBaseURL';
export { resolveApiBaseURL } from './resolveApiBaseURL';
