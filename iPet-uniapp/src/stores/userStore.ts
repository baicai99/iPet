import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clearAuthToken } from '@/utils/business/authStorage'
import type { UserState, AccountInfo, UserStats } from '@shared/types/user'
import type { Pet } from '@shared/types/pet'
import type { HealthRecord } from '@shared/types/health'
import type { WalletInfo, Transaction } from '@/types/dto/wallet'
import { usePetStore } from './petStore'
import { useHealthStore } from './healthStore'
import { useImageCacheStore } from './imageCacheStore'
import { ensureStringId } from '@/utils/common/idUtils'
import { calculateDaysWithPets, calculateRecordCount, calculateWalkDistance } from '@/utils/business/userStatsHelper'
import { getUserProfile } from '@/services/userService'
import { createGuestSession, logoutUser, upgradeGuestAccount } from '@/services/authService'
import { CacheManager } from '@/utils/cache/CacheManager'
import { healthCacheService } from '@/services/healthCacheService'
import { IS_MOCK_MODE } from '@/utils/config'
import { useAuthStateMachine } from '@/auth'
import type { TokenInfo } from '@/auth'

const DEFAULT_STATS: UserStats = {
    daysWithPet: 0,
    recordCount: 0,
    walkDistance: 0
}

const defaultAccountInfo: AccountInfo = {
    id: '',
    username: '',
    displayName: '',
    uid: '',
    nickname: '',
    avatar: '',
    phone: '',
    email: '',
    updatedAt: 0
}

export const useUserStore = defineStore('user', () => {
    // State
    const authMode = ref<'none' | 'guest' | 'user'>('none')
    const token = ref<string>('')
    const tokenExpiresAt = ref<number | null>(null)
    const accountInfo = ref<AccountInfo>({ ...defaultAccountInfo })
    const walletInfo = ref<WalletInfo | null>(null)
    const transactionHistory = ref<Transaction[]>([])

    // Getters
    const isLoggedIn = computed(() => {
        if (!token.value) {
            return false
        }
        // 兼容：历史版本可能没有写入 expiresAt；此时视为“已登录但未知过期时间”
        if (!tokenExpiresAt.value) {
            return true
        }
        return tokenExpiresAt.value > Date.now()
    })

    const userStats = computed<UserStats>(() => {
        // We need to be careful with circular dependencies or uninitialized stores here
        // but typically in a component usage it's fine.
        // If these stores haven't been created yet, this might throw if called too early,
        // but getters are lazy.
        const petStore = usePetStore()
        const healthStore = useHealthStore()

        if (!petStore || !healthStore) {
            return { ...DEFAULT_STATS }
        }

        return {
            daysWithPet: calculateDaysWithPets(petStore.pets),
            recordCount: calculateRecordCount(healthStore.healthRecords),
            walkDistance: calculateWalkDistance(healthStore.healthRecords)
        }
    })

    const needsOnboarding = computed(() => {
        // Guest mode: allow exploring without forced onboarding
        // 游客模式不强制新手引导，让用户自由探索
        if (authMode.value === 'guest') {
            return false
        }

        const petStore = usePetStore()

        // 检查核心资料是否完善 (Onboarding 页面会设置 tags 和 gender)
        const hasProfile = Array.isArray(accountInfo.value.tags) && accountInfo.value.tags.length > 0

        // 检查是否有宠物
        const hasPets = petStore.pets && petStore.pets.length > 0

        // 如果既没有完善资料，也没有宠物，就是新用户
        // ✅ 不管是 dev/prod/mock 模式，只要是新用户就需要引导
        return !hasProfile && !hasPets
    })

    // Actions
    function setToken(newToken: string, expiresAt?: number | null) {
        token.value = newToken
        if (!newToken) {
            authMode.value = 'none'
        }
        if (typeof expiresAt === 'number' || expiresAt === null) {
            tokenExpiresAt.value = expiresAt
        } else if (!newToken) {
            tokenExpiresAt.value = null
        }
    }

    function updateUserInfo(info: Partial<AccountInfo>) {
        const normalizedInfo = { ...info }
        if (normalizedInfo.id !== undefined) {
            normalizedInfo.id = ensureStringId(normalizedInfo.id)
        }
        if (typeof (normalizedInfo as any).isGuest === 'boolean' && token.value) {
            authMode.value = (normalizedInfo as any).isGuest ? 'guest' : 'user'
        }
        accountInfo.value = { ...accountInfo.value, ...normalizedInfo }
    }

    async function login(newToken: string, expiresAt: number | null, userInfo: Partial<AccountInfo>) {
        const authMachine = useAuthStateMachine()
        const isGuest = (userInfo as any)?.isGuest ?? false

        setToken(newToken, expiresAt)
        updateUserInfo(userInfo)

        if (newToken) {
            authMode.value = isGuest ? 'guest' : 'user'

            // Dispatch to state machine for logging
            const tokenInfo: TokenInfo = {
                accessToken: newToken,
                expiresAt,
                isGuest
            }
            const event = isGuest ? 'LOGIN_GUEST_SUCCESS' : 'LOGIN_USER_SUCCESS'
            const reason = isGuest ? 'guest_login_success' : 'user_login_success'
            authMachine.dispatch(event, reason, { tokenUpdate: tokenInfo })
        } else {
            authMode.value = 'none'
        }
    }

    function resetAppCaches() {
        try {
            CacheManager.clear()
        } catch (error) {
            console.warn('[userStore] Failed to clear CacheManager', error)
        }

        try {
            healthCacheService.clear()
        } catch (error) {
            console.warn('[userStore] Failed to clear health cache', error)
        }

        try {
            const imageCacheStore = useImageCacheStore()
            imageCacheStore.clear()
        } catch (error) {
            console.warn('[userStore] Failed to clear image cache', error)
        }
    }

    function resetBusinessStores() {
        const petStore = usePetStore()
        petStore.$reset()

        const healthStore = useHealthStore()
        healthStore.resetStore()
    }

    function clearLocalSession() {
        const authMachine = useAuthStateMachine()

        // Clear local session state without calling backend
        authMode.value = 'none'
        token.value = ''
        tokenExpiresAt.value = null
        accountInfo.value = { ...defaultAccountInfo }
        walletInfo.value = null
        transactionHistory.value = []
        clearAuthToken()

        // Reset state machine
        authMachine.dispatch('LOGOUT', 'user_logout')

        // Also clear other stores
        resetBusinessStores()
        resetAppCaches()
    }

    async function logout() {
        const authMachine = useAuthStateMachine()

        try {
            // Try to call backend logout, but don't block local cleanup if it fails
            await logoutUser()
        } catch (error) {
            console.warn('Backend logout failed:', error)
        } finally {
            clearLocalSession()
        }
    }

    async function loginAsGuest() {
        // Mode switch: ensure a clean slate to avoid cache contamination
        clearLocalSession()

        const result = await createGuestSession()

        await login(result.accessToken, result.expiresAt ?? null, {
            id: result.profile?.id || '',
            uid: result.profile?.id || '',
            displayName: '游客',
            updatedAt: Date.now(),
            isGuest: true
        } as any)

        const petStore = usePetStore()
        await petStore.fetchPets()
        return result
    }

    async function upgradeGuestToUser(email: string, password: string) {
        const authMachine = useAuthStateMachine()
        const result = await upgradeGuestAccount({ email, password })

        // Mode switch: clear caches/stores, but keep auth tokens we just received
        resetBusinessStores()
        resetAppCaches()

        await login(result.accessToken, result.expiresAt ?? null, {
            id: result.profile?.id || '',
            uid: result.profile?.id || '',
            displayName: email.split('@')[0],
            email,
            updatedAt: Date.now(),
            isGuest: false
        } as any)

        // Dispatch upgrade success event
        authMachine.dispatch('UPGRADE_SUCCESS', 'guest_upgrade_success', {
            tokenUpdate: {
                accessToken: result.accessToken,
                expiresAt: result.expiresAt ?? null,
                isGuest: false
            }
        })

        const petStore = usePetStore()
        await petStore.fetchPets()
        return result
    }

    async function fetchUserProfile() {
        try {
            const profile = await getUserProfile()
            updateUserInfo(profile)

            return profile
        } catch (error) {
            console.error('[userStore] Failed to fetch user profile:', error)
            throw error
        }
    }

    // Since we are using Setup Store, standard $reset is not available by default.
    // We can implement our own $reset if needed by plugins, or just rely on clearLocalSession which effectively does it.
    // However, the component calls `store.$reset()`.
    // In Setup Stores, we need to provide a custom $reset method or the plugin needs to support it.
    // userStore.ts used `petStore.$reset()` and `healthStore.$reset()`. If THEY are options stores, it works.
    // If we change THIS store to setup store, `userStore.$reset()` in my.vue (line 304) might fail if pinia-plugin-persistedstate doesn't add it,
    // or if the standard pinia reset isn't present.
    // The standard Pinia Setup Store does NOT have $reset.

    function $reset() {
        authMode.value = 'none'
        token.value = ''
        tokenExpiresAt.value = null
        accountInfo.value = { ...defaultAccountInfo }
        walletInfo.value = null
        transactionHistory.value = []
    }

    return {
        authMode,
        token,
        tokenExpiresAt,
        accountInfo,
        walletInfo,
        transactionHistory,
        isLoggedIn,
        userStats,
        needsOnboarding,
        setToken,
        login,
        loginAsGuest,
        upgradeGuestToUser,
        logout,
        clearLocalSession,
        updateUserInfo,
        fetchUserProfile,
        $reset
    }
}, {
    persist: {
        paths: ['authMode', 'token', 'tokenExpiresAt', 'accountInfo']
    } as any
})
