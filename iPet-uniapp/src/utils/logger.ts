/**
 * Logger utility with environment-based level gating
 * 
 * Development: All levels (debug, info, warn, error) are enabled
 * Production: Only warn and error are enabled
 * 
 * @example
 * import { logger } from '@/utils/logger'
 * 
 * logger.debug('User action', { action: 'click', target: 'button' })
 * logger.info('Login successful', { userId: 123 })
 * logger.warn('API slow response', { duration: 3000 })
 * logger.error('Request failed', error)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerOptions {
    namespace?: string
}

class Logger {
    private namespace: string

    constructor(options: LoggerOptions = {}) {
        this.namespace = options.namespace || 'app'
    }

    /**
     * Check if we're in production mode
     */
    private get isProduction(): boolean {
        return import.meta.env.PROD
    }

    /**
     * Format message with namespace
     */
    private format(level: LogLevel, message: string, ...args: any[]): [string, ...any[]] {
        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]`
        return [`${prefix} ${message}`, ...args]
    }

    /**
     * Debug level - only in development
     * Disabled in production to reduce noise
     */
    debug(message: string, ...args: any[]): void {
        if (this.isProduction) return
        console.log(...this.format('debug', message, ...args))
    }

    /**
     * Info level - only in development
     * Disabled in production to reduce noise
     */
    info(message: string, ...args: any[]): void {
        if (this.isProduction) return
        console.log(...this.format('info', message, ...args))
    }

    /**
     * Warning level - enabled in all environments
     * Important for catching potential issues in production
     */
    warn(message: string, ...args: any[]): void {
        console.warn(...this.format('warn', message, ...args))
    }

    /**
     * Error level - enabled in all environments
     * Critical for error monitoring and debugging
     * Preserves stack traces for Error objects
     */
    error(message: string, ...args: any[]): void {
        console.error(...this.format('error', message, ...args))
    }

    /**
     * Create a child logger with a specific namespace
     */
    child(namespace: string): Logger {
        return new Logger({ namespace: `${this.namespace}:${namespace}` })
    }
}

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a logger with a specific namespace
 */
export function createLogger(namespace: string): Logger {
    return new Logger({ namespace })
}
