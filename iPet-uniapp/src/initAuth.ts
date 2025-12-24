/**
 * Auth Initialization
 * Uses AuthStateMachine for explicit state transitions with logging
 */

import { getAccessToken, getRefreshToken, getTokenExpiresAt, isTokenExpired } from '@/utils/business/authStorage'
import { useUserStore } from '@/stores/userStore'
import { usePetStore } from '@/stores/petStore'
import { usePreferenceStore } from '@/stores/preferenceStore'
import { getUserProfile } from '@/services/userService'
import { refreshAuthToken } from '@/services/authService'
import { useAppStore } from '@/stores/appStore'
import { IS_MOCK_MODE, AUTH_BOOTSTRAP_MODE, APP_CONFIG } from '@/utils/config'
import { useAuthStateMachine } from '@/auth'
import type { TokenInfo } from '@/auth'

const TOKEN_VALIDATION_BUFFER = 30 * 1000

/**
 * Check if error indicates session is invalid (401/404)
 */
const isSessionInvalidError = (error: any): boolean => {
    const status = Number(error?.statusCode ?? error?.status ?? error?.data?.statusCode)
    return status === 401 || status === 404
}

/**
 * Extract requestId from error if available
 */
const extractRequestId = (error: any): string | undefined => {
    return error?.requestId ?? error?.data?.requestId ?? error?.headers?.['x-request-id']
}

let initPromise: Promise<void> | null = null

/**
 * Hydrate token from storage into state machine
 */
const hydrateTokenFromStorage = (): TokenInfo | null => {
    const accessToken = getAccessToken()
    const expiresAt = getTokenExpiresAt()

    if (!accessToken) {
        return null
    }

    const authMachine = useAuthStateMachine()
    const userStore = useUserStore()

    // Determine if guest based on userStore (persisted)
    const isGuest = userStore.authMode === 'guest'

    const tokenInfo: TokenInfo = {
        accessToken,
        refreshToken: getRefreshToken() || undefined,
        expiresAt: expiresAt ?? null,
        isGuest
    }

    // Hydrate to state machine
    authMachine.setToken(tokenInfo)

    // Sync to userStore if needed
    if (userStore.token !== accessToken || userStore.tokenExpiresAt !== expiresAt) {
        userStore.setToken(accessToken, expiresAt ?? null)
    }

    return tokenInfo
}

/**
 * Sync user profile from backend
 * @returns true if session is valid, false if session was invalidated
 */
const syncProfile = async (): Promise<boolean> => {
    const userStore = useUserStore()
    const authMachine = useAuthStateMachine()

    try {
        const profile = await getUserProfile()
        if (profile) {
            userStore.updateUserInfo({
                ...profile,
                updatedAt: profile.updatedAt ?? Date.now()
            })
        }
        return true
    } catch (error) {
        const requestId = extractRequestId(error)

        if (isSessionInvalidError(error)) {
            // Ghost account or token invalid
            authMachine.dispatch('PROFILE_SYNC_FAIL_AUTH', 'ghost_account_detected', {
                requestId,
                details: { error: String(error) }
            })

            userStore.clearLocalSession()
            uni.reLaunch({ url: '/pages/login/index' })
            return false
        }

        // Network/server error - keep session, log warning
        console.warn('[initAuth] Failed to sync profile (network/server error)', error)
        return true
    }
}

/**
 * Perform the actual initialization
 */
const performInit = async (): Promise<void> => {
    const userStore = useUserStore()
    const appStore = useAppStore()
    const authMachine = useAuthStateMachine()

    // Startup diagnostics
    console.log('[initAuth] 🚀 Starting', {
        mode: IS_MOCK_MODE ? 'mock' : 'real',
        bootstrap: AUTH_BOOTSTRAP_MODE,
        apiBase: APP_CONFIG.API_BASE_URL,
        env: import.meta.env.MODE,
        currentState: authMachine.state.value
    })

    try {
        // Mock mode: bypass auth completely
        if (IS_MOCK_MODE) {
            console.log('[initAuth] Mock mode detected, bypassing auth')
            userStore.setToken('mock-access-token', Date.now() + 24 * 60 * 60 * 1000)

            authMachine.dispatch('LOGIN_USER_SUCCESS', 'init_has_token', {
                tokenUpdate: {
                    accessToken: 'mock-access-token',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                    isGuest: false
                }
            })

            const petStore = usePetStore()
            await petStore.fetchPets()

            appStore.setAppReady(true)
            appStore.setNetworkReady(true)
            return
        }

        // 1. Hydrate token from storage
        let tokenInfo = hydrateTokenFromStorage()

        // 2. Bootstrap if no token
        if (!tokenInfo && AUTH_BOOTSTRAP_MODE === 'guest') {
            authMachine.dispatch('LOGIN_START', 'init_no_token')

            console.log('[initAuth] Bootstrap=guest, attempting auto guest login')
            try {
                await userStore.loginAsGuest()
                tokenInfo = hydrateTokenFromStorage()

                if (tokenInfo) {
                    authMachine.dispatch('LOGIN_GUEST_SUCCESS', 'guest_login_success', {
                        tokenUpdate: tokenInfo
                    })
                }
            } catch (error) {
                console.warn('[initAuth] Guest login failed', error)
                authMachine.dispatch('RESET', 'guest_login_failed', {
                    details: { error: String(error) }
                })
            }
        }

        // 3. No token after bootstrap - redirect
        if (!tokenInfo) {
            appStore.setAppReady(true)

            if (AUTH_BOOTSTRAP_MODE === 'none') {
                console.log('[initAuth] Bootstrap=none, no redirect')
                return
            }

            authMachine.dispatch('SESSION_EXPIRED', 'init_no_token')
            console.log('[initAuth] No token, redirecting to login')
            uni.reLaunch({ url: '/pages/login/index' })
            return
        }

        // Transition to appropriate authenticated state
        const authEvent = tokenInfo.isGuest ? 'LOGIN_GUEST_SUCCESS' : 'LOGIN_USER_SUCCESS'
        authMachine.dispatch(authEvent, 'init_has_token', { tokenUpdate: tokenInfo })

        // 4. Check token expiry
        if (tokenInfo.expiresAt && isTokenExpired(TOKEN_VALIDATION_BUFFER)) {
            authMachine.dispatch('SESSION_EXPIRED', 'init_token_expired', {
                details: { expiresAt: tokenInfo.expiresAt }
            })

            userStore.clearLocalSession()
            uni.reLaunch({ url: '/pages/login/index' })
            appStore.setAppReady(true)
            return
        }

        // 5. Attempt token refresh
        if (getRefreshToken()) {
            authMachine.dispatch('REFRESH_START', 'refresh_triggered')

            try {
                const result = await refreshAuthToken()
                const newTokenInfo: TokenInfo = {
                    accessToken: result.accessToken,
                    expiresAt: result.expiresAt ?? null,
                    isGuest: tokenInfo.isGuest,
                    refreshToken: tokenInfo.refreshToken
                }

                userStore.setToken(result.accessToken, result.expiresAt ?? null)
                authMachine.dispatch('REFRESH_SUCCESS', 'refresh_success', {
                    tokenUpdate: newTokenInfo
                })
            } catch (error) {
                const requestId = extractRequestId(error)

                if (isSessionInvalidError(error)) {
                    authMachine.dispatch('REFRESH_FAIL_AUTH', 'refresh_fail_auth_401', {
                        requestId,
                        details: { error: String(error) }
                    })

                    userStore.clearLocalSession()
                    uni.reLaunch({ url: '/pages/login/index' })
                    appStore.setAppReady(true)
                    return
                }

                // Network error - fallback to old token (degraded mode)
                authMachine.dispatch('REFRESH_FAIL_NETWORK', 'refresh_fail_network_fallback', {
                    requestId,
                    details: { error: String(error), fallbackToken: tokenInfo.accessToken.slice(0, 20) + '...' }
                })
            }
        }

        // 6. Sync user profile
        const isSessionValid = await syncProfile()
        if (!isSessionValid) {
            appStore.setAppReady(true)
            return
        }

        // 7. Load business data
        const petStore = usePetStore()
        await petStore.fetchPets()

        const preferenceStore = usePreferenceStore()
        preferenceStore.fetchMetricConfig().catch(err =>
            console.warn('[initAuth] Failed to fetch metric config', err)
        )

    } catch (error) {
        console.error('[initAuth] Initialization error', error)
        authMachine.dispatch('RESET', 'error_reset', {
            details: { error: String(error) }
        })
    } finally {
        appStore.setAppReady(true)
        appStore.setNetworkReady(true)
    }
}

/**
 * Initialize auth (singleton promise)
 */
export const initAuth = async (): Promise<void> => {
    if (initPromise) {
        return initPromise
    }
    initPromise = performInit().finally(() => {
        initPromise = null
    })
    return initPromise
}
