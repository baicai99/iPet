/**
 * Initialization Core Module
 * @description 系统初始化相关核心功能导出
 */

// Store
export {
    getInitStatus,
    setInitStatus,
    getEntryPath,
    setEntryPath,
    getAccessConfig,
    setAccessConfig,
    getSystemConfig,
    completeInitialization,
    resetSystem,
    useInitStatus,
    useEntryPath,
    useAccessConfig,
    useSystemConfig,
    useInitState,
    refreshInitState,
} from './initStore';

export type { AccessConfig, SystemInitConfig } from './initStore';

// Path Validator
export {
    isValidPathFormat,
    validateEntryPath,
    extractEntryPath,
    generateRandomPath,
    generatePathOptions,
    getFullAdminUrl,
    getLoginUrl,
    getDashboardUrl,
    pathsMatch,
    getSafePathSuggestions,
} from './pathValidator';

// Guards
export { InitGuard } from './InitGuard';
