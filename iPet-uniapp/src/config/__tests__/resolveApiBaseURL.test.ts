/**
 * Unit tests for resolveApiBaseURL
 * 
 * Verifies URL resolution logic across platforms and modes
 */

import { describe, it, expect } from 'vitest';
import { resolveApiBaseURL, type ResolveContext } from '../resolveApiBaseURL';

describe('resolveApiBaseURL', () => {
    describe('H5 Development Mode', () => {
        it('should allow relative paths', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'development',
                rawApiBaseUrl: '/api',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('/api');
            expect(result.warnings).toHaveLength(0);
        });

        it('should use fallback when URL not provided', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'development',
                rawApiBaseUrl: undefined,
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('/api');
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('DEV fallback');
        });

        it('should allow absolute URLs', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'development',
                rawApiBaseUrl: 'http://localhost:3000/api',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('http://localhost:3000/api');
        });
    });

    describe('H5 Production Mode', () => {
        it('should reject relative paths', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: '/api',
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/禁止使用相对路径/);
        });

        it('should require URL to be provided', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: undefined,
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/必须配置 VITE_API_BASE_URL/);
        });

        it('should reject localhost URLs', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: 'http://localhost:3000/api',
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/禁止使用 localhost/);
        });

        it('should allow localhost when explicitly enabled', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: 'http://localhost:3000/api',
                allowLocalhostProd: true,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('http://localhost:3000/api');
        });

        it('should accept valid absolute URLs', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: 'https://api.zhengjiyuan.top/api',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('https://api.zhengjiyuan.top/api');
        });
    });

    describe('Mini Program Development Mode', () => {
        it('should reject relative paths', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'development',
                rawApiBaseUrl: '/api',
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/小程序禁止使用相对路径/);
        });

        it('should require URL when not provided', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'development',
                rawApiBaseUrl: undefined,
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/小程序环境必须配置/);
        });

        it('should allow absolute URLs', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'development',
                rawApiBaseUrl: 'http://localhost:3000/api',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('http://localhost:3000/api');
        });

        it('should prioritize MP-specific URL', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'development',
                rawApiBaseUrl: 'http://localhost:3000/api',
                rawApiBaseUrlMp: 'https://api.zhengjiyuan.top/api',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('https://api.zhengjiyuan.top/api');
        });
    });

    describe('Mini Program Production Mode', () => {
        it('should reject relative paths', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'production',
                rawApiBaseUrl: '/api',
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/禁止使用相对路径/);
        });

        it('should accept absolute URLs', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'production',
                rawApiBaseUrl: 'https://api.zhengjiyuan.top/api',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('https://api.zhengjiyuan.top/api');
        });
    });

    describe('URL Normalization', () => {
        it('should strip trailing slashes', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: 'https://api.zhengjiyuan.top/api/',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.apiBaseUrl).toBe('https://api.zhengjiyuan.top/api');
        });

        it('should warn if URL does not end with /api', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: 'https://api.zhengjiyuan.top',
                allowLocalhostProd: false,
            };

            const result = resolveApiBaseURL(ctx);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('should end with /api');
        });
    });

    describe('Error Message Context', () => {
        it('should include platform and mode in error messages', () => {
            const ctx: ResolveContext = {
                platform: 'MP',
                mode: 'production',
                rawApiBaseUrl: '/api',
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/\[MP\/production\]/);
        });

        it('should include raw value in error messages', () => {
            const ctx: ResolveContext = {
                platform: 'H5',
                mode: 'production',
                rawApiBaseUrl: '/api',
                allowLocalhostProd: false,
            };

            expect(() => resolveApiBaseURL(ctx)).toThrow(/原始值: VITE_API_BASE_URL="\/api"/);
        });
    });
});
