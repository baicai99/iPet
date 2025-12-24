/**
 * Auth State Machine Types
 * Defines explicit states and events for authentication flow
 */

/**
 * Possible authentication states
 */
export type AuthState =
    | 'IDLE'                    // No authentication, app just started or logged out
    | 'AUTHENTICATING'          // Login/refresh in progress
    | 'AUTHENTICATED_GUEST'     // Logged in as guest
    | 'AUTHENTICATED_USER'      // Logged in as registered user
    | 'REFRESHING'              // Token refresh in progress
    | 'EXPIRED'                 // Session expired, needs re-login
    | 'ERROR'                   // Auth error occurred

/**
 * Events that trigger state transitions
 */
export type AuthEvent =
    | 'INIT'                    // App initialization
    | 'LOGIN_START'             // Login attempt started
    | 'LOGIN_GUEST_SUCCESS'     // Guest login succeeded
    | 'LOGIN_USER_SUCCESS'      // User login succeeded
    | 'REFRESH_START'           // Token refresh started
    | 'REFRESH_SUCCESS'         // Token refresh succeeded
    | 'REFRESH_FAIL_NETWORK'    // Refresh failed due to network (keep old token)
    | 'REFRESH_FAIL_AUTH'       // Refresh failed due to auth error (401/404)
    | 'SESSION_EXPIRED'         // Session detected as expired
    | 'LOGOUT'                  // User initiated logout
    | 'UPGRADE_SUCCESS'         // Guest upgraded to user
    | 'PROFILE_SYNC_FAIL_AUTH'  // Profile sync failed with auth error (ghost account)
    | 'RESET'                   // Reset to initial state

/**
 * Auth mode for backward compatibility with userStore
 */
export type AuthMode = 'none' | 'guest' | 'user'

/**
 * Map AuthState to AuthMode for backward compatibility
 */
export const stateToAuthMode = (state: AuthState): AuthMode => {
    switch (state) {
        case 'AUTHENTICATED_GUEST':
            return 'guest'
        case 'AUTHENTICATED_USER':
            return 'user'
        default:
            return 'none'
    }
}

/**
 * Transition reason categories
 */
export type TransitionReason =
    // Init reasons
    | 'init_no_token'
    | 'init_has_token'
    | 'init_token_expired'
    // Login reasons
    | 'guest_login_success'
    | 'guest_login_failed'
    | 'user_login_success'
    | 'user_login_failed'
    // Refresh reasons
    | 'refresh_triggered'
    | 'refresh_success'
    | 'refresh_fail_network_fallback'
    | 'refresh_fail_auth_401'
    | 'refresh_fail_auth_404'
    | 'refresh_no_token'
    // Session reasons
    | 'session_expired_local'
    | 'session_expired_backend'
    | 'ghost_account_detected'
    // User actions
    | 'user_logout'
    | 'guest_upgrade_success'
    | 'error_reset'
    // Generic
    | string

/**
 * Token info for state machine
 */
export interface TokenInfo {
    accessToken: string
    refreshToken?: string
    expiresAt: number | null
    isGuest: boolean
}

/**
 * State machine context
 */
export interface AuthContext {
    state: AuthState
    token: TokenInfo | null
    lastTransition: {
        fromState: AuthState
        event: AuthEvent
        reason: TransitionReason
        timestamp: number
        requestId?: string
    } | null
    degradedMode: boolean  // True if using fallback token after refresh failure
}
