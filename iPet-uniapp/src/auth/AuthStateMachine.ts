/**
 * Auth State Machine
 * Core state machine for authentication flow with explicit transitions
 */

import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import type {
    AuthState,
    AuthEvent,
    AuthMode,
    TransitionReason,
    TokenInfo,
    AuthContext
} from './AuthState'
import { stateToAuthMode } from './AuthState'
import { AuthLogger } from './AuthLogger'

/**
 * Valid state transitions map
 * Maps current state -> valid events -> next state
 */
const VALID_TRANSITIONS: Record<AuthState, Partial<Record<AuthEvent, AuthState>>> = {
    IDLE: {
        INIT: 'AUTHENTICATING',
        LOGIN_START: 'AUTHENTICATING',
        LOGIN_GUEST_SUCCESS: 'AUTHENTICATED_GUEST',
        LOGIN_USER_SUCCESS: 'AUTHENTICATED_USER'
    },
    AUTHENTICATING: {
        LOGIN_GUEST_SUCCESS: 'AUTHENTICATED_GUEST',
        LOGIN_USER_SUCCESS: 'AUTHENTICATED_USER',
        REFRESH_SUCCESS: 'AUTHENTICATED_GUEST', // Will be refined based on token type
        REFRESH_FAIL_AUTH: 'EXPIRED',
        REFRESH_FAIL_NETWORK: 'IDLE', // Fallback, will be refined
        SESSION_EXPIRED: 'EXPIRED',
        LOGOUT: 'IDLE',
        RESET: 'IDLE'
    },
    AUTHENTICATED_GUEST: {
        REFRESH_START: 'REFRESHING',
        LOGOUT: 'IDLE',
        UPGRADE_SUCCESS: 'AUTHENTICATED_USER',
        SESSION_EXPIRED: 'EXPIRED',
        PROFILE_SYNC_FAIL_AUTH: 'EXPIRED'
    },
    AUTHENTICATED_USER: {
        REFRESH_START: 'REFRESHING',
        LOGOUT: 'IDLE',
        SESSION_EXPIRED: 'EXPIRED',
        PROFILE_SYNC_FAIL_AUTH: 'EXPIRED'
    },
    REFRESHING: {
        REFRESH_SUCCESS: 'AUTHENTICATED_GUEST', // Will be refined based on token type
        REFRESH_FAIL_NETWORK: 'AUTHENTICATED_GUEST', // Fallback to previous authenticated state
        REFRESH_FAIL_AUTH: 'EXPIRED',
        SESSION_EXPIRED: 'EXPIRED',
        LOGOUT: 'IDLE'
    },
    EXPIRED: {
        SESSION_EXPIRED: 'IDLE', // After redirect
        LOGOUT: 'IDLE',
        LOGIN_START: 'AUTHENTICATING',
        RESET: 'IDLE'
    },
    ERROR: {
        RESET: 'IDLE',
        LOGOUT: 'IDLE',
        LOGIN_START: 'AUTHENTICATING'
    }
}

/**
 * State machine instance
 */
interface AuthStateMachineInstance {
    // State (readonly externally)
    state: Readonly<Ref<AuthState>>
    authMode: ComputedRef<AuthMode>
    token: Readonly<Ref<TokenInfo | null>>
    isDegraded: Readonly<Ref<boolean>>
    isAuthenticated: ComputedRef<boolean>
    isGuest: ComputedRef<boolean>
    isRefreshing: ComputedRef<boolean>

    // Actions
    dispatch: (event: AuthEvent, reason: TransitionReason, options?: DispatchOptions) => boolean
    setToken: (token: TokenInfo | null) => void
    reset: () => void

    // Debug
    getContext: () => AuthContext
}

interface DispatchOptions {
    requestId?: string
    details?: Record<string, unknown>
    tokenUpdate?: TokenInfo | null
    /**
     * For transitions that depend on token type (guest vs user)
     * Override the default next state
     */
    nextStateOverride?: AuthState
    /**
     * Bootstrap mode for structured logging (guest, none, etc.)
     */
    bootstrapMode?: string
}

/**
 * Create the auth state machine instance
 */
export function createAuthStateMachine(): AuthStateMachineInstance {
    // Internal state
    const state = ref<AuthState>('IDLE')
    const token = ref<TokenInfo | null>(null)
    const isDegraded = ref(false)
    const lastTransition = ref<AuthContext['lastTransition']>(null)
    // Track previous authenticated state for refresh fallback
    const previousAuthState = ref<AuthState | null>(null)

    // Computed
    const authMode = computed<AuthMode>(() => stateToAuthMode(state.value))
    const isAuthenticated = computed(() =>
        state.value === 'AUTHENTICATED_GUEST' ||
        state.value === 'AUTHENTICATED_USER' ||
        state.value === 'REFRESHING'
    )
    const isGuest = computed(() => state.value === 'AUTHENTICATED_GUEST')
    const isRefreshing = computed(() => state.value === 'REFRESHING')

    /**
     * Dispatch an event to transition state
     */
    const dispatch = (
        event: AuthEvent,
        reason: TransitionReason,
        options?: DispatchOptions
    ): boolean => {
        const currentState = state.value
        const validTransitions = VALID_TRANSITIONS[currentState]
        let nextState = validTransitions?.[event]

        // Handle overrides for contextual transitions
        if (options?.nextStateOverride) {
            nextState = options.nextStateOverride
        } else if (event === 'REFRESH_SUCCESS' || event === 'REFRESH_FAIL_NETWORK') {
            // Determine guest vs user based on token or previous state
            if (event === 'REFRESH_SUCCESS') {
                const isGuestToken = options?.tokenUpdate?.isGuest ?? token.value?.isGuest
                nextState = isGuestToken ? 'AUTHENTICATED_GUEST' : 'AUTHENTICATED_USER'
            } else if (event === 'REFRESH_FAIL_NETWORK') {
                // Fallback to previous authenticated state
                nextState = previousAuthState.value === 'AUTHENTICATED_USER'
                    ? 'AUTHENTICATED_USER'
                    : 'AUTHENTICATED_GUEST'
            }
        }

        if (!nextState) {
            console.warn(
                `[AuthStateMachine] Invalid transition: ${currentState} + ${event}`,
                { reason, options }
            )
            return false
        }

        // Track previous state before transitioning if currently authenticated
        if (currentState === 'AUTHENTICATED_GUEST' || currentState === 'AUTHENTICATED_USER') {
            previousAuthState.value = currentState
        }

        // Update token if provided
        if (options?.tokenUpdate !== undefined) {
            token.value = options.tokenUpdate
        }

        // Handle degraded mode
        if (event === 'REFRESH_FAIL_NETWORK') {
            isDegraded.value = true
            AuthLogger.logDegradedMode(reason)
        } else if (event === 'REFRESH_SUCCESS' || event === 'LOGIN_GUEST_SUCCESS' || event === 'LOGIN_USER_SUCCESS') {
            isDegraded.value = false
        }

        // Log transition
        AuthLogger.logTransition(
            currentState,
            nextState,
            event,
            reason,
            options?.requestId,
            options?.details,
            options?.bootstrapMode
        )

        // Update last transition
        lastTransition.value = {
            fromState: currentState,
            event,
            reason,
            timestamp: Date.now(),
            requestId: options?.requestId
        }

        // Transition state
        state.value = nextState

        return true
    }

    /**
     * Set token directly (for hydration from storage)
     */
    const setToken = (newToken: TokenInfo | null): void => {
        token.value = newToken
        if (newToken) {
            AuthLogger.logAction('Token hydrated', {
                isGuest: newToken.isGuest,
                expiresAt: newToken.expiresAt
            })
        }
    }

    /**
     * Reset to initial state
     */
    const reset = (): void => {
        dispatch('RESET', 'error_reset')
        token.value = null
        isDegraded.value = false
        previousAuthState.value = null
    }

    /**
     * Get full context for debugging
     */
    const getContext = (): AuthContext => ({
        state: state.value,
        token: token.value,
        lastTransition: lastTransition.value,
        degradedMode: isDegraded.value
    })

    return {
        state: readonly(state),
        authMode,
        token: readonly(token),
        isDegraded: readonly(isDegraded),
        isAuthenticated,
        isGuest,
        isRefreshing,
        dispatch,
        setToken,
        reset,
        getContext
    }
}

// Singleton instance
let instance: AuthStateMachineInstance | null = null

/**
 * Get or create the auth state machine singleton
 */
export function useAuthStateMachine(): AuthStateMachineInstance {
    if (!instance) {
        instance = createAuthStateMachine()
    }
    return instance
}

/**
 * Reset the singleton (for testing)
 */
export function resetAuthStateMachine(): void {
    if (instance) {
        instance.reset()
    }
    instance = null
}
