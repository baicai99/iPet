/**
 * Auth Module Public API
 */

// Types
export type {
    AuthState,
    AuthEvent,
    AuthMode,
    TransitionReason,
    TokenInfo,
    AuthContext
} from './AuthState'

// Utilities
export { stateToAuthMode } from './AuthState'

// Logger
export { AuthLogger } from './AuthLogger'
export type { AuthTransitionLog } from './AuthLogger'

// State Machine
export {
    createAuthStateMachine,
    useAuthStateMachine,
    resetAuthStateMachine
} from './AuthStateMachine'
