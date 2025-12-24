/**
 * Vite Plugin: Build Meta Generator
 * 
 * Generates build-meta.json during the build process containing:
 * - mode: Build mode (development/production)
 * - platform: Target platform (h5, mp-weixin, etc.)
 * - apiBaseUrl: API base URL from environment variables
 * - buildTime: ISO 8601 timestamp of build
 * - gitCommit: Git commit hash (if available)
 * - version: Package version from package.json
 * 
 * Usage:
 *   import { buildMetaPlugin } from './build/vite-plugin-build-meta'
 *   
 *   export default defineConfig({
 *     plugins: [
 *       buildMetaPlugin(),
 *       // ... other plugins
 *     ]
 *   })
 * 
 * Agent Responsibility:
 * - Agent 5: Creates this plugin module
 * - Agent 3: Mounts the plugin in vite.config.js
 */

import type { Plugin } from 'vite'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export interface BuildMetaPluginOptions {
    /**
     * Output filename for the build metadata
     * @default 'build-meta.json'
     */
    outputFileName?: string

    /**
     * Additional environment variables to include in metadata
     * @default []
     */
    includeEnvVars?: string[]
}

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

    /** Package version */
    version: string

    /** Additional metadata (optional) */
    [key: string]: any
}

/**
 * Get git commit hash
 */
function getGitCommit(): string {
    try {
        const commit = execSync('git rev-parse HEAD', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
        }).trim()

        return commit || 'unknown'
    } catch (error) {
        return 'unknown'
    }
}

/**
 * Get git commit short hash (7 chars)
 */
function getGitCommitShort(): string {
    try {
        const commit = execSync('git rev-parse --short=7 HEAD', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim()

        return commit || 'unknown'
    } catch (error) {
        return 'unknown'
    }
}

/**
 * Detect platform from environment or build output directory
 */
function detectPlatform(outDir: string): string {
    // Check UNI_PLATFORM env var (set by uni-app)
    if (process.env.UNI_PLATFORM) {
        return process.env.UNI_PLATFORM
    }

    // Fallback: detect from output directory path
    const normalizedPath = outDir.toLowerCase()

    if (normalizedPath.includes('mp-weixin')) return 'mp-weixin'
    if (normalizedPath.includes('mp-alipay')) return 'mp-alipay'
    if (normalizedPath.includes('mp-baidu')) return 'mp-baidu'
    if (normalizedPath.includes('mp-toutiao')) return 'mp-toutiao'
    if (normalizedPath.includes('mp-qq')) return 'mp-qq'
    if (normalizedPath.includes('h5')) return 'h5'
    if (normalizedPath.includes('app')) return 'app'

    // Default to h5 if cannot detect
    return 'h5'
}

/**
 * Get package version from package.json
 */
function getPackageVersion(rootDir: string): string {
    try {
        const packageJsonPath = path.resolve(rootDir, 'package.json')
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        return packageJson.version || '0.0.0'
    } catch (error) {
        return '0.0.0'
    }
}

/**
 * Build Meta Plugin
 * 
 * Generates build-meta.json with build information for production traceability
 */
export function buildMetaPlugin(options: BuildMetaPluginOptions = {}): Plugin {
    const {
        outputFileName = 'build-meta.json',
        includeEnvVars = []
    } = options

    let mode: string
    let outDir: string
    let rootDir: string

    return {
        name: 'vite-plugin-build-meta',

        // Store config for later use
        configResolved(config) {
            mode = config.mode
            outDir = config.build.outDir
            rootDir = config.root
        },

        // Generate build-meta.json after build completes
        closeBundle() {
            const platform = detectPlatform(outDir)
            const gitCommit = getGitCommit()
            const gitCommitShort = getGitCommitShort()
            const version = getPackageVersion(rootDir)
            const buildTime = new Date().toISOString()

            // Get API base URL from env
            // For mini-programs, prefer VITE_API_BASE_URL_MP
            let apiBaseUrl = process.env.VITE_API_BASE_URL || ''
            if (platform.startsWith('mp-') && process.env.VITE_API_BASE_URL_MP) {
                apiBaseUrl = process.env.VITE_API_BASE_URL_MP
            }

            // Build metadata object
            const buildMeta: BuildMeta = {
                mode,
                platform,
                apiBaseUrl,
                buildTime,
                gitCommit,
                gitCommitShort,
                version,
            }

            // Include additional env vars if specified
            if (includeEnvVars.length > 0) {
                const additionalEnv: Record<string, string> = {}
                for (const envVar of includeEnvVars) {
                    additionalEnv[envVar] = process.env[envVar] || ''
                }
                buildMeta.env = additionalEnv
            }

            // Write to output directory
            const outputPath = path.resolve(outDir, outputFileName)

            // Ensure output directory exists
            const outputDir = path.dirname(outputPath)
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true })
            }

            // Write JSON file
            fs.writeFileSync(
                outputPath,
                JSON.stringify(buildMeta, null, 2),
                'utf8'
            )

            console.log(`\n[Build Meta] Generated: ${outputPath}`)
            console.log(`[Build Meta] Mode: ${mode} | Platform: ${platform} | API: ${apiBaseUrl}`)
            console.log(`[Build Meta] Commit: ${gitCommitShort} | Version: ${version}`)
        }
    }
}

/**
 * Default export for convenience
 */
export default buildMetaPlugin
