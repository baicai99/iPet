/**
 * Auth State Machine Unit Tests
 * Covers all key state transitions for testability hardening
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    createAuthStateMachine,
    resetAuthStateMachine,
    AuthLogger
} from '../index'
import type { TokenInfo, AuthState, AuthEvent, TransitionReason } from '../AuthState'

// Mock console methods to capture structured logs
const consoleLogs: Array<{ level: string; args: unknown[] }> = []
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
}

describe('AuthStateMachine', () => {
    beforeEach(() => {
        // Reset singleton before each test
        resetAuthStateMachine()
        // Clear log history
        AuthLogger.clearHistory()

        // Capture console output
        consoleLogs.length = 0
        console.log = vi.fn((...args) => consoleLogs.push({ level: 'log', args }))
        console.warn = vi.fn((...args) => consoleLogs.push({ level: 'warn', args }))
        console.error = vi.fn((...args) => consoleLogs.push({ level: 'error', args }))
    })

    afterEach(() => {
        // Restore console
        console.log = originalConsole.log
        console.warn = originalConsole.warn
        console.error = originalConsole.error
        resetAuthStateMachine()
    })

    describe('Initial State', () => {
        it('starts in IDLE state', () => {
            const machine = createAuthStateMachine()
            expect(machine.state.value).toBe('IDLE')
        })

        it('has null token initially', () => {
            const machine = createAuthStateMachine()
            expect(machine.token.value).toBeNull()
        })

        it('is not authenticated initially', () => {
            const machine = createAuthStateMachine()
            expect(machine.isAuthenticated.value).toBe(false)
        })

        it('is not in degraded mode initially', () => {
            const machine = createAuthStateMachine()
            expect(machine.isDegraded.value).toBe(false)
        })
    })

    describe('No Token Scenario', () => {
        it('transitions IDLE → AUTHENTICATING on LOGIN_START', () => {
            const machine = createAuthStateMachine()

            const result = machine.dispatch('LOGIN_START', 'init_no_token')

            expect(result).toBe(true)
            expect(machine.state.value).toBe('AUTHENTICATING')
        })

        it('logs transition with reason "init_no_token"', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_START', 'init_no_token')

            const logs = AuthLogger.getHistory()
            expect(logs.length).toBe(1)
            expect(logs[0].reason).toBe('init_no_token')
            expect(logs[0].fromState).toBe('IDLE')
            expect(logs[0].toState).toBe('AUTHENTICATING')
        })
    })

    describe('Token Expired Scenario', () => {
        it('transitions AUTHENTICATING → EXPIRED on SESSION_EXPIRED', () => {
            const machine = createAuthStateMachine()

            // First get to AUTHENTICATING state
            machine.dispatch('LOGIN_START', 'init_no_token')
            expect(machine.state.value).toBe('AUTHENTICATING')

            // Then expire
            const result = machine.dispatch('SESSION_EXPIRED', 'init_token_expired', {
                details: { expiresAt: Date.now() - 1000 }
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('EXPIRED')
        })

        it('logs SESSION_EXPIRED with error level', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_START', 'init_no_token')
            machine.dispatch('SESSION_EXPIRED', 'init_token_expired')

            const logs = AuthLogger.getHistory()
            expect(logs[1].event).toBe('SESSION_EXPIRED')
            expect(logs[1].reason).toBe('init_token_expired')
            expect(logs[1].toState).toBe('EXPIRED')

            // Check console.error was called (EXPIRED state triggers error level)
            const errorLog = consoleLogs.find(l => l.level === 'error')
            expect(errorLog).toBeDefined()
        })

        it('transitions from AUTHENTICATED_GUEST → EXPIRED on SESSION_EXPIRED', () => {
            const machine = createAuthStateMachine()

            // Get to authenticated guest state
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            expect(machine.state.value).toBe('AUTHENTICATED_GUEST')

            // Then expire
            machine.dispatch('SESSION_EXPIRED', 'session_expired_local')
            expect(machine.state.value).toBe('EXPIRED')
        })
    })

    describe('Refresh Success Scenario', () => {
        it('transitions REFRESHING → AUTHENTICATED_GUEST when token isGuest=true', () => {
            const machine = createAuthStateMachine()

            // Setup: IDLE → AUTHENTICATED_GUEST → REFRESHING
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            expect(machine.state.value).toBe('REFRESHING')

            // Refresh success
            const newToken = createGuestToken('new-access-token')
            const result = machine.dispatch('REFRESH_SUCCESS', 'refresh_success', {
                tokenUpdate: newToken
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('AUTHENTICATED_GUEST')
            expect(machine.token.value?.accessToken).toBe('new-access-token')
        })

        it('transitions REFRESHING → AUTHENTICATED_USER when token isGuest=false', () => {
            const machine = createAuthStateMachine()

            // Setup: IDLE → AUTHENTICATED_USER → REFRESHING
            machine.dispatch('LOGIN_USER_SUCCESS', 'user_login_success', {
                tokenUpdate: createUserToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            expect(machine.state.value).toBe('REFRESHING')

            // Refresh success
            const newToken = createUserToken('new-access-token')
            const result = machine.dispatch('REFRESH_SUCCESS', 'refresh_success', {
                tokenUpdate: newToken
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('AUTHENTICATED_USER')
            expect(machine.token.value?.accessToken).toBe('new-access-token')
        })

        it('logs refresh_success with info level', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_SUCCESS', 'refresh_success', {
                tokenUpdate: createGuestToken('new-token')
            })

            const logs = AuthLogger.getHistory()
            const refreshLog = logs.find(l => l.event === 'REFRESH_SUCCESS')
            expect(refreshLog?.reason).toBe('refresh_success')
        })

        it('clears degraded mode on refresh success', () => {
            const machine = createAuthStateMachine()

            // Setup degraded mode via network failure
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback')
            expect(machine.isDegraded.value).toBe(true)

            // New login should clear degraded
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_SUCCESS', 'refresh_success', {
                tokenUpdate: createGuestToken('new-token')
            })
            expect(machine.isDegraded.value).toBe(false)
        })
    })

    describe('Refresh 401/404 Scenario', () => {
        it('transitions REFRESHING → EXPIRED on REFRESH_FAIL_AUTH', () => {
            const machine = createAuthStateMachine()

            // Setup: get to REFRESHING state
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            expect(machine.state.value).toBe('REFRESHING')

            // Refresh fails with 401
            const result = machine.dispatch('REFRESH_FAIL_AUTH', 'refresh_fail_auth_401', {
                requestId: 'req-123-abc',
                details: { statusCode: 401 }
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('EXPIRED')
        })

        it('logs REFRESH_FAIL_AUTH with requestId', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_FAIL_AUTH', 'refresh_fail_auth_401', {
                requestId: 'req-123-abc'
            })

            const logs = AuthLogger.getHistory()
            const failLog = logs.find(l => l.event === 'REFRESH_FAIL_AUTH')
            expect(failLog?.requestId).toBe('req-123-abc')
            expect(failLog?.reason).toBe('refresh_fail_auth_401')
        })

        it('logs with error level for EXPIRED state', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_FAIL_AUTH', 'refresh_fail_auth_401')

            // Should have logged with error level
            const errorLogs = consoleLogs.filter(l => l.level === 'error')
            expect(errorLogs.length).toBeGreaterThan(0)
        })

        it('handles 404 as auth failure too', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_FAIL_AUTH', 'refresh_fail_auth_404', {
                details: { statusCode: 404 }
            })

            expect(machine.state.value).toBe('EXPIRED')

            const logs = AuthLogger.getHistory()
            const failLog = logs.find(l => l.reason === 'refresh_fail_auth_404')
            expect(failLog).toBeDefined()
        })
    })

    describe('Refresh Network Failure Fallback', () => {
        it('transitions REFRESHING → AUTHENTICATED_GUEST on network failure (guest)', () => {
            const machine = createAuthStateMachine()

            // Setup as guest
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            expect(machine.state.value).toBe('REFRESHING')

            // Network failure - should fallback to previous state
            const result = machine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback', {
                requestId: 'req-network-fail',
                details: { error: 'Network Error' }
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('AUTHENTICATED_GUEST')
        })

        it('transitions REFRESHING → AUTHENTICATED_USER on network failure (user)', () => {
            const machine = createAuthStateMachine()

            // Setup as user
            machine.dispatch('LOGIN_USER_SUCCESS', 'user_login_success', {
                tokenUpdate: createUserToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            expect(machine.state.value).toBe('REFRESHING')

            // Network failure - should fallback to previous state
            const result = machine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback')

            expect(result).toBe(true)
            expect(machine.state.value).toBe('AUTHENTICATED_USER')
        })

        it('enables degraded mode on network failure', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')

            expect(machine.isDegraded.value).toBe(false)

            machine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback')

            expect(machine.isDegraded.value).toBe(true)
        })

        it('logs with warn level for network failure', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback')

            const warnLogs = consoleLogs.filter(l => l.level === 'warn')
            expect(warnLogs.length).toBeGreaterThan(0)
        })

        it('logs degraded mode warning', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            machine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback')

            // Should have logged degraded mode warning
            const degradedLog = consoleLogs.find(l =>
                l.args.some(arg =>
                    typeof arg === 'string' && arg.includes('DEGRADED')
                )
            )
            expect(degradedLog).toBeDefined()
        })
    })

    describe('Guest Upgrade', () => {
        it('transitions AUTHENTICATED_GUEST → AUTHENTICATED_USER on UPGRADE_SUCCESS', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            expect(machine.state.value).toBe('AUTHENTICATED_GUEST')

            const result = machine.dispatch('UPGRADE_SUCCESS', 'guest_upgrade_success', {
                tokenUpdate: createUserToken()
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('AUTHENTICATED_USER')
            expect(machine.isGuest.value).toBe(false)
        })
    })

    describe('Profile Sync Auth Failure (Ghost Account)', () => {
        it('transitions AUTHENTICATED_GUEST → EXPIRED on PROFILE_SYNC_FAIL_AUTH', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })

            const result = machine.dispatch('PROFILE_SYNC_FAIL_AUTH', 'ghost_account_detected', {
                requestId: 'req-ghost',
                details: { error: '401 Unauthorized' }
            })

            expect(result).toBe(true)
            expect(machine.state.value).toBe('EXPIRED')
        })

        it('logs ghost account detection with requestId', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('PROFILE_SYNC_FAIL_AUTH', 'ghost_account_detected', {
                requestId: 'req-ghost-123'
            })

            const logs = AuthLogger.getHistory()
            const ghostLog = logs.find(l => l.reason === 'ghost_account_detected')
            expect(ghostLog?.requestId).toBe('req-ghost-123')
        })
    })

    describe('Logout', () => {
        it('transitions any authenticated state → IDLE on LOGOUT', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_USER_SUCCESS', 'user_login_success', {
                tokenUpdate: createUserToken()
            })
            expect(machine.state.value).toBe('AUTHENTICATED_USER')

            const result = machine.dispatch('LOGOUT', 'user_logout')

            expect(result).toBe(true)
            expect(machine.state.value).toBe('IDLE')
        })

        it('can logout from REFRESHING state', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                tokenUpdate: createGuestToken()
            })
            machine.dispatch('REFRESH_START', 'refresh_triggered')
            expect(machine.state.value).toBe('REFRESHING')

            machine.dispatch('LOGOUT', 'user_logout')
            expect(machine.state.value).toBe('IDLE')
        })
    })

    describe('Reset', () => {
        it('resets to IDLE and clears token', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_USER_SUCCESS', 'user_login_success', {
                tokenUpdate: createUserToken()
            })
            expect(machine.state.value).toBe('AUTHENTICATED_USER')
            expect(machine.token.value).not.toBeNull()

            // Use LOGOUT which is valid from AUTHENTICATED_USER, then reset clears token
            machine.dispatch('LOGOUT', 'user_logout')
            machine.reset()

            expect(machine.state.value).toBe('IDLE')
            expect(machine.token.value).toBeNull()
            expect(machine.isDegraded.value).toBe(false)
        })
    })

    describe('Invalid Transitions', () => {
        it('rejects invalid transition and returns false', () => {
            const machine = createAuthStateMachine()
            // IDLE cannot receive UPGRADE_SUCCESS (that's only valid from AUTHENTICATED_GUEST)
            const result = machine.dispatch('UPGRADE_SUCCESS', 'guest_upgrade_success')

            expect(result).toBe(false)
            expect(machine.state.value).toBe('IDLE') // unchanged
        })

        it('logs warning for invalid transition', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('UPGRADE_SUCCESS', 'guest_upgrade_success')

            const warnLogs = consoleLogs.filter(l => l.level === 'warn')
            const invalidLog = warnLogs.find(l =>
                l.args.some(arg =>
                    typeof arg === 'string' && arg.includes('Invalid transition')
                )
            )
            expect(invalidLog).toBeDefined()
        })
    })

    describe('Structured Log Fields', () => {
        it('includes timestamp in log entry', () => {
            const before = Date.now()
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_START', 'init_no_token')
            const after = Date.now()

            const logs = AuthLogger.getHistory()
            expect(logs[0].timestamp).toBeGreaterThanOrEqual(before)
            expect(logs[0].timestamp).toBeLessThanOrEqual(after)
        })

        it('includes all required fields: reason, fromState, toState, event', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success')

            const logs = AuthLogger.getHistory()
            const log = logs[0]

            expect(log).toHaveProperty('reason', 'guest_login_success')
            expect(log).toHaveProperty('fromState', 'IDLE')
            expect(log).toHaveProperty('toState', 'AUTHENTICATED_GUEST')
            expect(log).toHaveProperty('event', 'LOGIN_GUEST_SUCCESS')
            expect(log).toHaveProperty('timestamp')
        })

        it('includes optional requestId when provided', () => {
            const machine = createAuthStateMachine()
            machine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                requestId: 'test-req-id-12345'
            })

            const logs = AuthLogger.getHistory()
            expect(logs[0].requestId).toBe('test-req-id-12345')
        })

        it('includes optional details when provided', () => {
            const machine = createAuthStateMachine()
            // First get to AUTHENTICATING state since SESSION_EXPIRED requires valid prior state
            machine.dispatch('LOGIN_START', 'init_no_token')
            machine.dispatch('SESSION_EXPIRED', 'init_token_expired', {
                details: { expiresAt: 12345, userId: 'user-abc' }
            })

            const logs = AuthLogger.getHistory()
            const sessionExpiredLog = logs.find(l => l.event === 'SESSION_EXPIRED')
            expect(sessionExpiredLog?.details).toEqual({ expiresAt: 12345, userId: 'user-abc' })
        })
    })

    describe('Token Hydration', () => {
        it('setToken updates token without state transition', () => {
            const machine = createAuthStateMachine()
            const token = createGuestToken()

            machine.setToken(token)

            expect(machine.token.value).toEqual(token)
            expect(machine.state.value).toBe('IDLE') // state unchanged
        })

        it('logs token hydration action', () => {
            const machine = createAuthStateMachine()
            machine.setToken(createGuestToken())

            const actionLog = consoleLogs.find(l =>
                l.args.some(arg =>
                    typeof arg === 'string' && arg.includes('Token hydrated')
                )
            )
            expect(actionLog).toBeDefined()
        })
    })

    describe('Context Getter', () => {
        it('returns full context for debugging', () => {
            const machine = createAuthStateMachine()
            const token = createUserToken()
            machine.dispatch('LOGIN_USER_SUCCESS', 'user_login_success', {
                tokenUpdate: token,
                requestId: 'ctx-test'
            })

            const context = machine.getContext()

            expect(context.state).toBe('AUTHENTICATED_USER')
            expect(context.token).toEqual(token)
            expect(context.degradedMode).toBe(false)
            expect(context.lastTransition?.event).toBe('LOGIN_USER_SUCCESS')
            expect(context.lastTransition?.requestId).toBe('ctx-test')
        })
    })
})

// Helper functions
function createGuestToken(accessToken = 'guest-token-123'): TokenInfo {
    return {
        accessToken,
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        isGuest: true
    }
}

function createUserToken(accessToken = 'user-token-456'): TokenInfo {
    return {
        accessToken,
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        isGuest: false
    }
}
