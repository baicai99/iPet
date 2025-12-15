import { useUserStore } from '@/stores/userStore'

// Whitelist of pages that do not require login
const whiteList = [
    '/pages/login/index',
    '/pages/register/index',
    '/pages/login/forgot-password',
    '/pages/settings/privacy',
    '/pages/onboarding/index'
]

const TOKEN_EXPIRY_BUFFER_MS = 30 * 1000

const normalizePath = (url = '') => {
    const path = url.split('?')[0] || ''
    return path.startsWith('/') ? path : `/${path}`
}

const isWhiteListed = (url: string): boolean => whiteList.includes(normalizePath(url))

const evaluateTokenState = (userStore: ReturnType<typeof useUserStore>) => {
    if (!userStore || !userStore.token) {
        return { valid: false, reason: 'missing-token' }
    }

    const expiresAt = userStore.tokenExpiresAt
    if (!expiresAt) {
        // 兼容：历史版本可能没有写入 expiresAt，此时不要强制登出，交给后续接口 401 决定
        return { valid: true, warning: 'missing-expiry' as const }
    }

    const now = Date.now()
    if (expiresAt - TOKEN_EXPIRY_BUFFER_MS <= now) {
        return { valid: false, reason: 'expired' }
    }

    return { valid: true }
}

const buildLoginUrl = (redirectUrl = '') => {
    if (!redirectUrl) {
        return '/pages/login/index'
    }
    return `/pages/login/index?redirect=${encodeURIComponent(redirectUrl)}`
}

const redirectToLogin = (redirectUrl = '', message = '') => {
    if (message) {
        uni.showToast({
            title: message,
            icon: 'none'
        })
    }
    uni.reLaunch({
        url: buildLoginUrl(redirectUrl)
    })
}

const handleUnauthorized = (reason = 'missing-token', url: string) => {
    const userStore = useUserStore()

    // [新增] 处理新用户引导
    if (reason === 'needs-onboarding') {
        uni.redirectTo({
            url: '/pages/onboarding/index'
        })
        return
    }

    const needsLogout = ['expired', 'missing-expiry'].includes(reason)
    if (needsLogout) {
        userStore.logout()
    }
    const message = reason === 'expired' ? '登录状态已过期，请重新登录' : ''
    redirectToLogin(url, message)
}

const hasPermission = (url: string) => {
    // Mock mode: skip all auth checks
    if (import.meta.env.VITE_USE_MOCK === 'true') {
        return { allowed: true }
    }

    // 1. 白名单直接放行
    if (isWhiteListed(url)) {
        return { allowed: true }
    }

    const userStore = useUserStore()
    const tokenState = evaluateTokenState(userStore)

    // 2. Token 无效，拦截
    if (!tokenState.valid) {
        return {
            allowed: false,
            reason: tokenState.reason,
            url
        }
    }

    // 3. [新增] 新用户强制引导逻辑
    // 如果需要引导，且目标页面不是 onboarding，则拦截
    if (userStore.needsOnboarding) {
        return {
            allowed: false,
            reason: 'needs-onboarding',
            url
        }
    }

    return { allowed: true }
}

export function initPermission() {
    const list = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

    list.forEach(item => {
        uni.addInterceptor(item, {
            invoke(e) {
                // Get the target url
                const url = e.url

                const result = hasPermission(url)

                if (result.allowed) {
                    return true
                }

                handleUnauthorized(result.reason, url)
                return false
            },
            fail(err) {
                console.error(err)
            }
        })
    })
}
