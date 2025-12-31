#!/usr/bin/env node

/**
 * Environment Validation Script (Build-time)
 * 
 * Validates .env file before build to ensure all required variables are present
 * and correctly formatted. This prevents runtime errors caused by misconfiguration.
 * 
 * Usage:
 *   node scripts/check-env.mjs
 *   node scripts/check-env.mjs --mode production
 *   node scripts/check-env.mjs --mode development
 * 
 * Exit Codes:
 *   0 - Validation passed
 *   1 - Validation failed or invalid arguments
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

// ============================================================
// Validation Logic (duplicated from src/env/schema.ts)
// ============================================================

function isAbsoluteUrl(url) {
    return /^https?:\/\//i.test(url)
}

function endsWithApi(url) {
    return url.toLowerCase().endsWith('/api')
}

function parseBoolean(value, defaultValue) {
    if (value === true) return true
    if (value === false) return false
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        return normalized === 'true' || normalized === '1' || normalized === 'on'
    }
    return defaultValue
}

function validateEnvSchema(rawEnv) {
    const errors = []

    // 1. MODE validation (optional, defaults to development rules)
    const mode = rawEnv.MODE
    if (mode && mode !== 'development' && mode !== 'production') {
        errors.push(`MODE must be "development" or "production", got: "${mode}"`)
    }
    const isProd = mode === 'production'

    // 2. VITE_API_BASE_URL validation
    const apiBaseUrl = rawEnv.VITE_API_BASE_URL
    const allowLocalhostProd = parseBoolean(rawEnv.VITE_ALLOW_LOCALHOST_PROD, false)

    if (!apiBaseUrl) {
        if (isProd) {
            errors.push('VITE_API_BASE_URL is required in production mode')
        }
    } else {
        const normalized = apiBaseUrl.replace(/\/+$/, '')

        if (isProd) {
            if (!isAbsoluteUrl(normalized)) {
                errors.push(`VITE_API_BASE_URL must be an absolute URL (https://...) in production mode, got: "${normalized}"`)
            }

            if (/localhost|127\.0\.0\.1/i.test(normalized) && !allowLocalhostProd) {
                errors.push(`VITE_API_BASE_URL cannot be localhost in production mode: "${normalized}". Set VITE_ALLOW_LOCALHOST_PROD=true to override.`)
            }
        }

        if (!endsWithApi(normalized)) {
            errors.push(`VITE_API_BASE_URL should end with /api, got: "${normalized}"`)
        }
    }

    // 3. VITE_API_BASE_URL_MP validation
    const apiBaseUrlMp = rawEnv.VITE_API_BASE_URL_MP
    if (apiBaseUrlMp) {
        const normalized = apiBaseUrlMp.replace(/\/+$/, '')

        if (!isAbsoluteUrl(normalized)) {
            errors.push(`VITE_API_BASE_URL_MP must be an absolute URL (https://...), got: "${normalized}"`)
        }

        if (!endsWithApi(normalized)) {
            errors.push(`VITE_API_BASE_URL_MP should end with /api, got: "${normalized}"`)
        }
    }

    // 4. VITE_AUTH_BOOTSTRAP validation
    const authBootstrap = rawEnv.VITE_AUTH_BOOTSTRAP || 'login'
    const validBootstrapModes = ['guest', 'login', 'none']
    if (!validBootstrapModes.includes(authBootstrap)) {
        errors.push(`VITE_AUTH_BOOTSTRAP must be one of: ${validBootstrapModes.join(', ')}, got: "${authBootstrap}"`)
    }

    return { success: errors.length === 0, errors }
}

// ============================================================
// .env File Parser
// ============================================================

function parseEnvFile(filePath) {
    if (!existsSync(filePath)) {
        return null
    }

    const content = readFileSync(filePath, 'utf-8')
    const env = {}

    for (const line of content.split('\n')) {
        const trimmed = line.trim()

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue
        }

        // Parse key=value
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            let value = match[2].trim()

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
            }

            env[key] = value
        }
    }

    return env
}

// ============================================================
// Main Script
// ============================================================

function main() {
    // Parse command line arguments
    const args = process.argv.slice(2)
    let mode = null

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--mode' && i + 1 < args.length) {
            mode = args[i + 1]
            break
        }
    }

    if (mode && mode !== 'development' && mode !== 'production') {
        console.error(`❌ Invalid mode: "${mode}". Must be "development" or "production"`)
        process.exit(1)
    }

    // Load .env file
    const envFileName = '.env'
    const envFilePath = resolve(projectRoot, envFileName)

    const env = parseEnvFile(envFilePath)

    if (!env) {
        console.error(`❌ Environment file not found: ${envFileName}`)
        console.error(`   Expected path: ${envFilePath}`)
        process.exit(1)
    }

    // Add MODE to env (it's typically set by Vite, not in .env file)
    if (mode) {
        env.MODE = mode
    }

    // Validate
    const result = validateEnvSchema(env)

    if (!result.success) {
        const modeLabel = mode ?? 'default'
        console.error(`❌ Environment validation failed (mode: ${modeLabel}):`)
        for (const error of result.errors) {
            console.error(`   - ${error}`)
        }
        console.error('')
        console.error(`Please fix the errors in ${envFileName} and try again.`)
        process.exit(1)
    }

    // Success
    console.log(`✅ Environment validation passed (mode: ${env.MODE ?? 'default'})`)
    if (env.MODE) {
        console.log(`   - MODE: ${env.MODE}`)
    }
    console.log(`   - VITE_API_BASE_URL: ${env.VITE_API_BASE_URL || '(unset, will use fallback)'}`)
    if (env.VITE_API_BASE_URL_MP) {
        console.log(`   - VITE_API_BASE_URL_MP: ${env.VITE_API_BASE_URL_MP}`)
    }
    console.log(`   - VITE_AUTH_BOOTSTRAP: ${env.VITE_AUTH_BOOTSTRAP || 'login (default)'}`)
    console.log('')

    process.exit(0)
}

main()
