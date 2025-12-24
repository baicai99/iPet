/**
 * Environment Variables (Validated)
 * 
 * This module provides a validated, typed interface to environment variables.
 * All values are validated at startup - if validation fails, the app will not start.
 * 
 * Usage:
 *   import { Env } from '@/env'
 *   console.log(Env.VITE_API_BASE_URL)
 */

import { validateEnvSchema, type EnvSchema } from './schema'

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
function parseEnv(rawEnv: Record<string, any>): EnvSchema {
    const result = validateEnvSchema(rawEnv)

    if (!result.success) {
        const errorMessage = [
            '❌ Environment validation failed:',
            ...result.errors!.map(err => `   - ${err}`),
            '',
            'Please check your .env file and ensure all required variables are properly configured.',
        ].join('\n')

        throw new Error(errorMessage)
    }

    return result.data!
}

/**
 * Validated Environment Variables
 * 
 * This object is guaranteed to be valid at runtime.
 * If there are validation errors, the app will fail to start.
 */
export const Env = parseEnv(import.meta.env)

/**
 * Type export for convenience
 */
export type { EnvSchema as Env } from './schema'
