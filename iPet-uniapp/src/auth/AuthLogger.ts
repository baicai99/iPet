/**
 * Auth Transition Logger
 * Provides structured logging for auth state transitions
 */

import type { AuthState, AuthEvent, TransitionReason } from './AuthState'

/**
 * Log entry for auth state transitions
 */
export interface AuthTransitionLog {
    timestamp: number
    fromState: AuthState
    toState: AuthState
    event: AuthEvent
    reason: TransitionReason
    requestId?: string
    bootstrapMode?: string
    details?: Record<string, unknown>
}

/**
 * Log levels for auth events
 */
type LogLevel = 'info' | 'warn' | 'error'

/**
 * Determine log level based on transition
 */
const getLogLevel = (event: AuthEvent, toState: AuthState): LogLevel => {
    // Error states
    if (toState === 'ERROR' || toState === 'EXPIRED') {
        return 'error'
    }
    // Warning events
    if (event === 'REFRESH_FAIL_NETWORK') {
        return 'warn'
    }
    return 'info'
}

/**
 * Format log entry for console output
 */
const formatLogEntry = (log: AuthTransitionLog): string => {
    const time = new Date(log.timestamp).toISOString()
    const reqId = log.requestId ? ` [${log.requestId}]` : ''
    return `${time}${reqId} ${log.fromState} -> ${log.toState} (${log.event}: ${log.reason})`
}

/**
 * Log storage for debugging (keeps last N entries)
 */
const MAX_LOG_ENTRIES = 50
const logHistory: AuthTransitionLog[] = []

/**
 * AuthLogger singleton
 */
export const AuthLogger = {
    /**
     * Log a state transition
     */
    logTransition(
        fromState: AuthState,
        toState: AuthState,
        event: AuthEvent,
        reason: TransitionReason,
        requestId?: string,
        details?: Record<string, unknown>,
        bootstrapMode?: string
    ): void {
        const log: AuthTransitionLog = {
            timestamp: Date.now(),
            fromState,
            toState,
            event,
            reason,
            requestId,
            bootstrapMode,
            details
        }

        // Store in history
        logHistory.push(log)
        if (logHistory.length > MAX_LOG_ENTRIES) {
            logHistory.shift()
        }

        // Console output
        const level = getLogLevel(event, toState)
        const formatted = formatLogEntry(log)
        const prefix = '[AuthStateMachine]'

        switch (level) {
            case 'error':
                console.error(`${prefix} ❌ ${formatted}`, details || '')
                break
            case 'warn':
                console.warn(`${prefix} ⚠️ ${formatted}`, details || '')
                break
            default:
                console.log(`${prefix} 🔐 ${formatted}`, details || '')
        }
    },

    /**
     * Log auth action start (without state change)
     */
    logAction(action: string, details?: Record<string, unknown>): void {
        console.log(`[AuthStateMachine] 🔄 ${action}`, details || '')
    },

    /**
     * Log degraded mode warning
     */
    logDegradedMode(reason: string): void {
        console.warn(`[AuthStateMachine] ⚠️ Running in DEGRADED mode: ${reason}`)
    },

    /**
     * Get log history for debugging
     */
    getHistory(): Readonly<AuthTransitionLog[]> {
        return [...logHistory]
    },

    /**
     * Clear log history
     */
    clearHistory(): void {
        logHistory.length = 0
    },

    /**
     * Export logs as JSON string
     */
    exportLogs(): string {
        return JSON.stringify(logHistory, null, 2)
    }
}
