/**
 * API BaseURL Resolver (Single Point of Decision)
 * 
 * Centralizes all URL validation rules for Dev/Prod, H5/小程序.
 * Prevents logic drift and scattered validation branches.
 */

export type Platform = 'H5' | 'MP';
export type Mode = 'development' | 'production';

export interface ResolveContext {
    /** Platform: H5 or Mini Program */
    platform: Platform;

    /** Build mode: development or production */
    mode: Mode;

    /** Raw API Base URL from env (VITE_API_BASE_URL) */
    rawApiBaseUrl: string | undefined;

    /** Raw Mini Program-specific API Base URL from env (VITE_API_BASE_URL_MP) */
    rawApiBaseUrlMp?: string;

    /** Allow localhost in production builds (for local prod testing) */
    allowLocalhostProd: boolean;
}

export interface ResolveResult {
    /** Resolved API Base URL (normalized, validated) */
    apiBaseUrl: string;

    /** Non-blocking warnings (e.g., missing /api suffix) */
    warnings: string[];
}

// Dev-only fallback for H5 (relative path for Vite proxy)
const DEV_FALLBACK_API = '/api';

/**
 * Normalize URL: Remove trailing slashes
 */
function normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

/**
 * Check if URL is relative (not starting with http:// or https://)
 */
function isRelativeUrl(url: string): boolean {
    return !/^https?:\/\//i.test(url);
}

/**
 * Validate that URL ends with /api (case-insensitive check)
 * Returns warning message if invalid, null otherwise
 */
function validateApiSuffix(url: string): string | null {
    if (!url.toLowerCase().endsWith('/api')) {
        return `API base URL should end with /api: "${url}". This may cause path inconsistencies.`;
    }
    return null;
}

/**
 * Resolve API Base URL with platform-aware validation
 * 
 * Rules:
 * - H5 Dev: Allow relative paths (e.g., /api)
 * - H5 Prod: Forbid relative paths, require absolute URLs
 * - MP Dev/Prod: Forbid relative paths, require absolute URLs
 * - All Prod: Forbid localhost (unless allowLocalhostProd=true)
 * 
 * @throws Error for critical validation failures (blocking initialization)
 */
export function resolveApiBaseURL(ctx: ResolveContext): ResolveResult {
    const { platform, mode, rawApiBaseUrl, rawApiBaseUrlMp, allowLocalhostProd } = ctx;
    const isProd = mode === 'production';
    const isMP = platform === 'MP';
    const warnings: string[] = [];

    // Helper to format error messages with context
    const formatError = (message: string): string => {
        return `[APP_CONFIG] ❌ [${platform}/${mode}] ${message}`;
    };

    // Priority 1: Mini Program specific override
    if (isMP && rawApiBaseUrlMp) {
        const normalized = normalizeUrl(rawApiBaseUrlMp);

        if (isRelativeUrl(normalized)) {
            throw new Error(
                formatError(
                    `小程序禁止使用相对路径: "${normalized}". ` +
                    `请配置 VITE_API_BASE_URL_MP 为绝对路径 (如 http://localhost:3000/api 或 https://api.zhengjiyuan.top/api)。` +
                    `\n原始值: VITE_API_BASE_URL_MP="${rawApiBaseUrlMp}"`
                )
            );
        }

        const suffixWarning = validateApiSuffix(normalized);
        if (suffixWarning) {
            warnings.push(`[WARN] ${suffixWarning}`);
        }

        return { apiBaseUrl: normalized, warnings };
    }

    // Priority 2: Handle missing URL
    if (!rawApiBaseUrl) {
        if (isProd) {
            throw new Error(
                formatError(
                    'Prod 环境必须配置 VITE_API_BASE_URL。' +
                    '请检查 .env 或 CI/CD 配置。'
                )
            );
        }

        // Dev mode without URL
        if (isMP) {
            throw new Error(
                formatError(
                    '小程序环境必须配置 VITE_API_BASE_URL_MP 或 VITE_API_BASE_URL。\n' +
                    '请在 .env 中设置绝对路径 (如 http://localhost:3000/api)。'
                )
            );
        }

        // H5 Dev fallback
        warnings.push(
            `[WARN] VITE_API_BASE_URL not set, using DEV fallback: ${DEV_FALLBACK_API}`
        );
        return { apiBaseUrl: DEV_FALLBACK_API, warnings };
    }

    const normalized = normalizeUrl(rawApiBaseUrl);

    // Priority 3: Relative path validation
    if (isRelativeUrl(normalized)) {
        if (isProd) {
            throw new Error(
                formatError(
                    `禁止使用相对路径: "${normalized}". ` +
                    `请配置完整的 https:// URL。\n` +
                    `原始值: VITE_API_BASE_URL="${rawApiBaseUrl}"`
                )
            );
        }

        if (isMP) {
            throw new Error(
                formatError(
                    `小程序禁止使用相对路径: "${normalized}". ` +
                    `请配置 VITE_API_BASE_URL_MP 为绝对路径。\n` +
                    `原始值: VITE_API_BASE_URL="${rawApiBaseUrl}"`
                )
            );
        }

        // H5 Dev: relative path is allowed (for Vite proxy)
        const suffixWarning = validateApiSuffix(normalized);
        if (suffixWarning) {
            warnings.push(`[WARN] ${suffixWarning}`);
        }
        return { apiBaseUrl: normalized, warnings };
    }

    // Priority 4: Absolute URL validation
    if (isProd) {
        // Reject localhost/127.0.0.1 in production (unless explicitly allowed)
        if (/localhost|127\.0\.0\.1/i.test(normalized) && !allowLocalhostProd) {
            throw new Error(
                formatError(
                    `Prod 环境禁止使用 localhost: "${normalized}". ` +
                    `如需本地调试 Prod 构建，请设置 VITE_ALLOW_LOCALHOST_PROD=true。\n` +
                    `原始值: VITE_API_BASE_URL="${rawApiBaseUrl}"`
                )
            );
        }
    }

    const suffixWarning = validateApiSuffix(normalized);
    if (suffixWarning) {
        warnings.push(`[WARN] ${suffixWarning}`);
    }

    return { apiBaseUrl: normalized, warnings };
}
