/**
 * Build Meta Runtime Reader
 * 
 * Utilities to read and display build metadata at runtime.
 * 
 * Usage:
 *   import { readBuildMeta, getBuildInfo } from '@/meta/readBuildMeta'
 *   
 *   // Fetch metadata
 *   const meta = await readBuildMeta()
 *   console.log('Build Info:', getBuildInfo(meta))
 *   
 *   // Display in debug panel
 *   const info = getBuildInfo(meta)
 * 
 * Note: This module is NOT integrated into the main application flow.
 * It's provided for debugging, admin panels, or diagnostics.
 */

/**
 * Build metadata interface (matches plugin output)
 */
export interface BuildMeta {
    /** Build mode (development/production) */
    mode: string

    /** Target platform (h5, mp-weixin, etc.) */
    platform: string

    /** API base URL used in this build */
    apiBaseUrl: string

    /** Build timestamp in ISO 8601 format */
    buildTime: string

    /** Git commit hash (or 'unknown' if not available) */
    gitCommit: string

    /** Git commit short hash */
    gitCommitShort?: string

    /** Package version */
    version: string

    /** Additional metadata (optional) */
    [key: string]: any
}

/**
 * Fetch build metadata from build-meta.json
 * 
 * @param baseUrl - Base URL for fetching (default: current origin)
 * @returns Promise resolving to BuildMeta object
 * @throws Error if fetch fails or JSON is invalid
 */
export async function readBuildMeta(baseUrl?: string): Promise<BuildMeta> {
    const url = baseUrl
        ? `${baseUrl}/build-meta.json`
        : '/build-meta.json'

    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Failed to fetch build-meta.json: ${response.status} ${response.statusText}`)
        }

        const meta = await response.json() as BuildMeta

        // Validate required fields
        const requiredFields = ['mode', 'platform', 'apiBaseUrl', 'buildTime', 'gitCommit', 'version']
        const missingFields = requiredFields.filter(field => !(field in meta))

        if (missingFields.length > 0) {
            throw new Error(`Invalid build-meta.json: missing fields: ${missingFields.join(', ')}`)
        }

        return meta
    } catch (error) {
        console.error('[Build Meta] Failed to read build metadata:', error)
        throw error
    }
}

/**
 * Get formatted build information string
 * 
 * @param meta - Build metadata object
 * @returns Multi-line formatted string
 */
export function getBuildInfo(meta: BuildMeta): string {
    const lines = [
        `Build Information`,
        `─────────────────`,
        `Mode:        ${meta.mode}`,
        `Platform:    ${meta.platform}`,
        `Version:     ${meta.version}`,
        `API URL:     ${meta.apiBaseUrl}`,
        `Build Time:  ${formatBuildTime(meta.buildTime)}`,
        `Git Commit:  ${meta.gitCommitShort || meta.gitCommit.substring(0, 7)}`,
    ]

    return lines.join('\n')
}

/**
 * Format build time for display
 */
function formatBuildTime(isoString: string): string {
    try {
        const date = new Date(isoString)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    } catch (error) {
        return isoString
    }
}

/**
 * Get build metadata as key-value pairs for display
 */
export function getBuildMetaEntries(meta: BuildMeta): Array<{ key: string; value: string }> {
    return [
        { key: 'Mode', value: meta.mode },
        { key: 'Platform', value: meta.platform },
        { key: 'Version', value: meta.version },
        { key: 'API URL', value: meta.apiBaseUrl },
        { key: 'Build Time', value: formatBuildTime(meta.buildTime) },
        { key: 'Git Commit', value: meta.gitCommitShort || meta.gitCommit.substring(0, 7) },
        { key: 'Full Commit', value: meta.gitCommit },
    ]
}

/**
 * Check if current runtime matches build metadata
 * Useful for detecting configuration drift
 * 
 * @param meta - Build metadata
 * @returns Warnings array (empty if all matches)
 */
export function validateRuntimeConfig(meta: BuildMeta): string[] {
    const warnings: string[] = []

    // Check if runtime mode matches build mode
    const runtimeMode = import.meta.env.MODE
    if (runtimeMode !== meta.mode) {
        warnings.push(`Mode mismatch: runtime=${runtimeMode}, build=${meta.mode}`)
    }

    // Check if runtime API URL matches build API URL
    const runtimeApiUrl = import.meta.env.VITE_API_BASE_URL
    if (runtimeApiUrl && runtimeApiUrl !== meta.apiBaseUrl) {
        warnings.push(`API URL mismatch: runtime=${runtimeApiUrl}, build=${meta.apiBaseUrl}`)
    }

    return warnings
}

/**
 * Log build metadata to console (formatted)
 * Useful for debugging or startup diagnostics
 */
export async function logBuildMeta(baseUrl?: string): Promise<void> {
    try {
        const meta = await readBuildMeta(baseUrl)
        console.log('\n' + getBuildInfo(meta) + '\n')

        // Check for config drift
        const warnings = validateRuntimeConfig(meta)
        if (warnings.length > 0) {
            console.warn('[Build Meta] Configuration warnings:')
            warnings.forEach(w => console.warn(`  - ${w}`))
        }
    } catch (error) {
        console.error('[Build Meta] Could not load build metadata')
    }
}
