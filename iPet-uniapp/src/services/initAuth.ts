import { getAccessToken, getRefreshToken, getTokenExpiresAt, isTokenExpired } from '@/utils/business/authStorage'
import { useUserStore } from '@/stores/userStore'
import { usePetStore } from '@/stores/petStore'
import { useHealthStore } from '@/stores/healthStore'

import { usePreferenceStore } from '@/stores/preferenceStore'
import { getUserProfile } from '@/services/userService'
import { refreshAuthToken } from '@/services/authService'
import { useAppStore } from '@/stores/appStore'
import { APP_CONFIG } from '@/utils/config'

const TOKEN_VALIDATION_BUFFER = 30 * 1000

// 核心修改：定义什么是“会话已失效”
// 401: Token 签名不对或过期
// 404: Token 签名对，但用户在数据库里没了 (幽灵账号)
const isSessionInvalidError = (error: any) => {
    const status = Number(error?.statusCode ?? error?.status ?? error?.data?.statusCode)
    return status === 401 || status === 404
}

let initPromise: Promise<void> | null = null

const hydrateTokenFromStorage = (userStore: ReturnType<typeof useUserStore>) => {
    const token = getAccessToken()
    const expiresAt = getTokenExpiresAt()

    if (!token) {
        return null
    }

    if (userStore.token !== token || userStore.tokenExpiresAt !== expiresAt) {
        userStore.setToken(token, expiresAt ?? null)
    }

    return { token, expiresAt: expiresAt ?? null }
}

const syncProfile = async (userStore: ReturnType<typeof useUserStore>) => {
    try {
        const profile = await getUserProfile()
        if (profile) {
            userStore.updateUserInfo({
                ...profile,
                updatedAt: profile.updatedAt ?? Date.now()
            })
        }
        return true // 同步成功，账号正常
    } catch (error) {
        // 如果是 401 或 404，说明账号废了，必须清理
        if (isSessionInvalidError(error)) {
            console.warn('[initAuth] Session invalid (User deleted or Token expired), clearing session')
            userStore.clearLocalSession()
            uni.reLaunch({
                url: '/pages/login/index'
            })
            return false // 会话已被清理
        } else {
            // 如果是 500 或 网络错误，说明是服务器抖动，保留登录状态，让用户能看缓存数据
            console.warn('[initAuth] Failed to sync user info (Network/Server error)', error)
            return true
        }
    }
}

const performInit = async () => {
    const userStore = useUserStore()
    const appStore = useAppStore()

    try {
        // Mock mode: bypass auth and directly load data
        if (APP_CONFIG.USE_MOCK) {
            console.log('[initAuth] Mock mode detected, bypassing auth')
            userStore.setToken('mock-access-token', Date.now() + 24 * 60 * 60 * 1000)

            const petStore = usePetStore()
            await petStore.fetchPets()

            appStore.setAppReady(true)
            appStore.setNetworkReady(true)
            return
        }

        const hydrated = hydrateTokenFromStorage(userStore)

        // 1. 没有 Token，标记 App Ready，结束
        if (!hydrated) {
            appStore.setAppReady(true)
            return
        }

        // 2. Token 本地过期（超过30天没用），清理，标记 Ready，结束
        // 兼容：如果历史版本没写入 expiresAt，则先放行，交给后续接口 401/404 决定是否需要清理会话
        if (hydrated.expiresAt && isTokenExpired(TOKEN_VALIDATION_BUFFER)) {
            userStore.clearLocalSession()
            appStore.setAppReady(true)
            return
        }

        // 3. 尝试续期 (实现你的“活跃自动续期”需求)
        // 关键优化：没有 refreshToken 时，不要发 refresh 请求；否则会导致每次重启/编译都触发 401 进而清空登录态
        if (getRefreshToken()) {
            try {
                const result = await refreshAuthToken()
                userStore.setToken(result.accessToken, result.expiresAt)
            } catch (error) {
                // 续期失败如果是鉴权问题，登出；如果是网络问题，忍受（继续用旧 Token）
                if (isSessionInvalidError(error)) {
                    userStore.clearLocalSession()
                    appStore.setAppReady(true)
                    return
                }
                console.warn('[initAuth] Token refresh failed, continuing with cached token', error)
            }
        }

        // 4. 同步用户信息 (关键步骤：检测是否是幽灵账号)
        const isSessionValid = await syncProfile(userStore)

        // 如果 syncProfile 因为 404 把号退了，就别往下走了
        if (!isSessionValid) {
            appStore.setAppReady(true)
            return
        }

        // 5. 账号正常，加载业务数据
        const petStore = usePetStore()
        await petStore.fetchPets()

        // [新增] 检查是否需要引导
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]?.route || ''

        if (userStore.needsOnboarding && currentPage !== 'pages/onboarding/index') {
            uni.reLaunch({
                url: '/pages/onboarding/index'
            })
        }

        const healthStore = useHealthStore()

        const preferenceStore = usePreferenceStore()

        preferenceStore.fetchMetricConfig().catch(err => console.warn('Failed to fetch metric config', err))

    } catch (error) {
        console.error('[initAuth] Initialization error', error)
    } finally {
        // 无论成功失败，一定要让 App 变为 Ready，否则页面会卡在 Skeleton 或空白
        appStore.setAppReady(true)
        appStore.setNetworkReady(true)
    }
}

export const initAuth = async (): Promise<void> => {
    if (initPromise) {
        return initPromise
    }
    initPromise = performInit().finally(() => {
        initPromise = null
    })
    return initPromise
}
